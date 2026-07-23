import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createPhotoRepairRateLimiters,
  hasPhotoRepairConfirmation,
  isOwnedPhotoStoragePath,
  isPhotoRepairDryRun,
  isPhotoRepairEnabled,
  parsePhotoRepairTarget,
  PHOTO_REPAIR_LIMITS,
  requestExceedsLimit,
  validatePhotoRepairOrigin,
  validateRepairJpeg,
} from "../src/lib/photoRepairSecurity.server";

const USER_ID = "123e4567-e89b-12d3-a456-426614174000";
const PHOTO_ID = "123e4567-e89b-42d3-a456-426614174001";

function repairRequest(headers: HeadersInit = {}) {
  return new Request("https://app.example/api/photo-repair", { method: "POST", headers });
}

describe("photo repair request boundary", () => {
  it("opens the server-side kill switch only for the exact value true", () => {
    expect(isPhotoRepairEnabled({ PHOTO_REPAIR_ENABLED: "true" })).toBe(true);
    expect(isPhotoRepairEnabled({ PHOTO_REPAIR_ENABLED: "TRUE" })).toBe(false);
    expect(isPhotoRepairEnabled({})).toBe(false);
  });

  it("accepts exact same-origin mutations and rejects absent or cross-origin origins", () => {
    expect(validatePhotoRepairOrigin(repairRequest({ Origin: "https://app.example" }))).toBe(true);
    expect(validatePhotoRepairOrigin(repairRequest())).toBe(false);
    expect(validatePhotoRepairOrigin(repairRequest({ Origin: "https://attacker.example" }))).toBe(
      false,
    );
  });

  it("rejects contradictory fetch metadata even with a matching Origin", () => {
    expect(
      validatePhotoRepairOrigin(
        repairRequest({
          Origin: "https://app.example",
          "Sec-Fetch-Site": "cross-site",
        }),
      ),
    ).toBe(false);
  });

  it("requires explicit, exact dry-run and execution headers", () => {
    const request = repairRequest({
      "X-Photo-Repair-Dry-Run": "true",
      "X-Photo-Repair-Confirm": "execute",
    });
    expect(isPhotoRepairDryRun(request)).toBe(true);
    expect(hasPhotoRepairConfirmation(request)).toBe(true);
    expect(hasPhotoRepairConfirmation(repairRequest())).toBe(false);
  });

  it("accepts typed UUID targets without silently defaulting scope", () => {
    expect(parsePhotoRepairTarget({ scope: "avatar", userId: USER_ID })).toEqual({
      ok: true,
      scope: "avatar",
      userId: USER_ID,
      photoId: null,
    });
    expect(
      parsePhotoRepairTarget({
        scope: "extra",
        userId: USER_ID,
        photoId: PHOTO_ID,
      }),
    ).toMatchObject({ ok: true, scope: "extra", photoId: PHOTO_ID });
  });

  it("rejects malformed IDs, unknown scopes and missing extra-photo identity", () => {
    expect(parsePhotoRepairTarget({ scope: "other", userId: USER_ID })).toMatchObject({
      ok: false,
      error: "invalid_scope",
    });
    expect(parsePhotoRepairTarget({ scope: "avatar", userId: "../other" })).toMatchObject({
      ok: false,
      error: "invalid_user_id",
    });
    expect(parsePhotoRepairTarget({ scope: "extra", userId: USER_ID })).toMatchObject({
      ok: false,
      error: "invalid_photo_id",
    });
  });

  it("rejects declared payloads above the bounded request size", () => {
    expect(
      requestExceedsLimit(
        repairRequest({ "Content-Length": String(PHOTO_REPAIR_LIMITS.maxMultipartBytes + 1) }),
        PHOTO_REPAIR_LIMITS.maxMultipartBytes,
      ),
    ).toBe(true);
    expect(requestExceedsLimit(repairRequest(), PHOTO_REPAIR_LIMITS.maxMultipartBytes)).toBe(false);
  });
});

describe("photo repair file and object boundary", () => {
  it("accepts a bounded JPEG only when magic bytes match", async () => {
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "repair.jpg", {
      type: "image/jpeg",
    });
    await expect(validateRepairJpeg(file)).resolves.toEqual({ ok: true });
  });

  it("rejects a spoofed JPEG MIME type", async () => {
    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "repair.jpg", {
      type: "image/jpeg",
    });
    await expect(validateRepairJpeg(file)).resolves.toMatchObject({
      ok: false,
      error: "jpeg_mismatch",
      status: 415,
    });
  });

  it("rejects unsupported MIME types and oversized files", async () => {
    const png = new File([new Uint8Array([0xff, 0xd8, 0xff])], "repair.png", {
      type: "image/png",
    });
    await expect(validateRepairJpeg(png)).resolves.toMatchObject({ error: "expected_jpeg" });

    const oversized = new File(
      [new Uint8Array(PHOTO_REPAIR_LIMITS.maxJpegBytes + 1)],
      "large.jpg",
      { type: "image/jpeg" },
    );
    await expect(validateRepairJpeg(oversized)).resolves.toMatchObject({
      error: "file_too_large",
      status: 413,
    });
  });

  it("allows cleanup only inside the target user's Storage prefix", () => {
    expect(isOwnedPhotoStoragePath(`${USER_ID}/old.jpg`, USER_ID)).toBe(true);
    expect(isOwnedPhotoStoragePath(`${PHOTO_ID}/old.jpg`, USER_ID)).toBe(false);
    expect(isOwnedPhotoStoragePath(`${USER_ID}/../other.jpg`, USER_ID)).toBe(false);
  });

  it("keeps scan and mutation limits independent and deterministic", () => {
    const limiter = createPhotoRepairRateLimiters();
    const first = limiter.check(USER_ID, "scan", 1_000);
    const second = limiter.check(USER_ID, "scan", 1_000);
    const third = limiter.check(USER_ID, "scan", 1_000);
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(limiter.check(USER_ID, "replace", 1_000).allowed).toBe(true);
  });
});

describe("photo repair integration contract", () => {
  const route = readFileSync(resolve("src/routes/api/photo-repair.ts"), "utf8");
  const admin = readFileSync(resolve("src/routes/admin/fotos.tsx"), "utf8");
  const migration = readFileSync(
    resolve("supabase/migrations/20260723000003_v2_photo_repair_audit.sql"),
    "utf8",
  );

  it("fails closed, audits mutations and returns categorical errors", () => {
    expect(route).toContain("isPhotoRepairEnabled(process.env)");
    expect(route).toContain("auditRepairEvent");
    expect(route).toContain('"confirmation_required"');
    expect(route).toContain('"internal_error"');
    expect(route).not.toMatch(/JSON\.stringify\(\{\s*error:\s*(?:error|uploadError)\.message/);
  });

  it("uploads to a unique owned path before replacing the database reference", () => {
    expect(route).toContain("repair-${crypto.randomUUID()}.jpg");
    expect(route).toContain("upsert: false");
    expect(route.indexOf(".upload(path, file")).toBeLessThan(route.indexOf(".update({"));
    expect(route).toContain("removeOldObject(oldUrl, target.userId, path)");
  });

  it("keeps the current admin client compatible with the explicit confirmation contract", () => {
    expect(admin.match(/"X-Photo-Repair-Confirm": "execute"/g)).toHaveLength(2);
    expect(admin).not.toContain("X-Photo-Repair-Dry-Run");
  });

  it("defines a private append-only audit table without altering existing photo data", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.photo_repair_audit");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("REVOKE ALL ON TABLE public.photo_repair_audit");
    expect(migration).toContain("BEFORE UPDATE OR DELETE");
    expect(migration).not.toMatch(/\b(?:DROP|TRUNCATE)\s+TABLE\b/i);
    expect(migration).not.toMatch(/UPDATE\s+(?:public\.)?(?:profiles|profile_photos)\b/i);
  });
});
