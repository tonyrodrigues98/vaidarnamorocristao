import { PerSubjectFixedWindowRateLimiter } from "@/lib/photoModerationPolicy.server";

export const PHOTO_REPAIR_LIMITS = Object.freeze({
  maxJsonBytes: 16_384,
  maxMultipartBytes: 8_500_000,
  maxJpegBytes: 8_000_000,
  scanRequests: 2,
  scanWindowMs: 5 * 60_000,
  mutationRequests: 8,
  mutationWindowMs: 60_000,
});

export type PhotoRepairOperation = "scan" | "replace" | "clear";
export type PhotoRepairScope = "avatar" | "extra";

export type PhotoRepairTarget =
  | {
      ok: true;
      scope: PhotoRepairScope;
      userId: string;
      photoId: string | null;
    }
  | {
      ok: false;
      error: "invalid_scope" | "invalid_user_id" | "invalid_photo_id";
    };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPhotoRepairEnabled(environment: Record<string, string | undefined>) {
  return environment.PHOTO_REPAIR_ENABLED === "true";
}

export function validatePhotoRepairOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    if (new URL(origin).origin !== new URL(request.url).origin) return false;
  } catch {
    return false;
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || fetchSite === "same-origin";
}

export function isPhotoRepairDryRun(request: Request) {
  return request.headers.get("x-photo-repair-dry-run") === "true";
}

export function hasPhotoRepairConfirmation(request: Request) {
  return request.headers.get("x-photo-repair-confirm") === "execute";
}

export function parsePhotoRepairTarget(input: {
  scope: unknown;
  userId: unknown;
  photoId?: unknown;
}): PhotoRepairTarget {
  if (input.scope !== "avatar" && input.scope !== "extra") {
    return { ok: false, error: "invalid_scope" };
  }

  const userId = typeof input.userId === "string" ? input.userId.trim() : "";
  if (!UUID_PATTERN.test(userId)) {
    return { ok: false, error: "invalid_user_id" };
  }

  const rawPhotoId =
    typeof input.photoId === "string" && input.photoId.trim() ? input.photoId.trim() : null;
  if (input.scope === "extra" && (!rawPhotoId || !UUID_PATTERN.test(rawPhotoId))) {
    return { ok: false, error: "invalid_photo_id" };
  }
  if (rawPhotoId && !UUID_PATTERN.test(rawPhotoId)) {
    return { ok: false, error: "invalid_photo_id" };
  }

  return {
    ok: true,
    scope: input.scope,
    userId,
    photoId: rawPhotoId,
  };
}

export function requestExceedsLimit(request: Request, maxBytes: number) {
  const rawLength = request.headers.get("content-length");
  if (!rawLength) return false;
  const contentLength = Number(rawLength);
  return !Number.isFinite(contentLength) || contentLength < 0 || contentLength > maxBytes;
}

export async function validateRepairJpeg(file: File) {
  if (!["image/jpeg", "image/jpg"].includes((file.type || "").toLowerCase())) {
    return { ok: false as const, error: "expected_jpeg" as const, status: 415 as const };
  }
  if (file.size <= 0 || file.size > PHOTO_REPAIR_LIMITS.maxJpegBytes) {
    return { ok: false as const, error: "file_too_large" as const, status: 413 as const };
  }

  const bytes = new Uint8Array(await file.slice(0, 3).arrayBuffer());
  if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    return { ok: false as const, error: "jpeg_mismatch" as const, status: 415 as const };
  }

  return { ok: true as const };
}

export function isOwnedPhotoStoragePath(path: string | null, userId: string) {
  if (!path || !UUID_PATTERN.test(userId)) return false;
  const normalized = path.replace(/^\/+/, "");
  return normalized.startsWith(`${userId}/`) && !normalized.split("/").includes("..");
}

export function createPhotoRepairRateLimiters() {
  const scans = new PerSubjectFixedWindowRateLimiter(
    PHOTO_REPAIR_LIMITS.scanRequests,
    PHOTO_REPAIR_LIMITS.scanWindowMs,
  );
  const mutations = new PerSubjectFixedWindowRateLimiter(
    PHOTO_REPAIR_LIMITS.mutationRequests,
    PHOTO_REPAIR_LIMITS.mutationWindowMs,
  );

  return {
    check(subject: string, operation: PhotoRepairOperation, now = Date.now()) {
      return operation === "scan" ? scans.check(subject, now) : mutations.check(subject, now);
    },
  };
}
