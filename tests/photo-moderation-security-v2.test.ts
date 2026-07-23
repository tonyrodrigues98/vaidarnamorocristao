import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  failClosedModerationBody,
  fetchWithTimeout,
  PerSubjectFixedWindowRateLimiter,
  PHOTO_MODERATION_LIMITS,
  validatePhotoModerationInput,
} from "../src/lib/photoModerationPolicy.server";

function imageBase64(signature: number[]) {
  const bytes = new Uint8Array(96);
  bytes.set(signature);
  return Buffer.from(bytes).toString("base64");
}

describe("photo moderation input boundary", () => {
  it("accepts a supported MIME only when the magic bytes agree", () => {
    expect(
      validatePhotoModerationInput({
        imageBase64: imageBase64([0xff, 0xd8, 0xff]),
        mimeType: "image/jpeg",
        scope: "main",
      }),
    ).toMatchObject({ ok: true, mimeType: "image/jpeg", scope: "main" });

    expect(
      validatePhotoModerationInput({
        imageBase64: imageBase64([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        mimeType: "image/jpeg",
      }),
    ).toEqual({ ok: false, error: "mime_mismatch", status: 415 });
  });

  it("rejects unsupported, malformed and oversized payloads", () => {
    expect(
      validatePhotoModerationInput({
        imageBase64: imageBase64([0xff, 0xd8, 0xff]),
        mimeType: "image/svg+xml",
      }),
    ).toEqual({ ok: false, error: "invalid_mime", status: 415 });
    expect(validatePhotoModerationInput({ imageBase64: "***", mimeType: "image/jpeg" })).toEqual({
      ok: false,
      error: "invalid_input",
      status: 400,
    });
    expect(
      validatePhotoModerationInput({
        imageBase64: "A".repeat(PHOTO_MODERATION_LIMITS.maxBase64Characters + 4),
        mimeType: "image/jpeg",
      }),
    ).toEqual({ ok: false, error: "image_too_large", status: 413 });
  });
});

describe("photo moderation rate limit", () => {
  it("limits each subject independently and resets after the fixed window", () => {
    const limiter = new PerSubjectFixedWindowRateLimiter(2, 1_000);

    expect(limiter.check("user-a", 10_000)).toEqual({ allowed: true, remaining: 1 });
    expect(limiter.check("user-a", 10_100)).toEqual({ allowed: true, remaining: 0 });
    expect(limiter.check("user-a", 10_200)).toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });
    expect(limiter.check("user-b", 10_200)).toEqual({ allowed: true, remaining: 1 });
    expect(limiter.check("user-a", 11_000)).toEqual({ allowed: true, remaining: 1 });
  });
});

describe("photo moderation provider boundary", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("aborts a provider request at the configured deadline", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn(
      (_input: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );

    const pending = fetchWithTimeout("https://provider.test", {}, { fetcher, timeoutMs: 25 });
    const rejected = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(25);

    await rejected;
  });

  it("uses a fail-closed technical response contract", () => {
    expect(failClosedModerationBody("ai_unavailable")).toEqual({
      approved: false,
      needsReview: false,
      retryable: true,
      error: "ai_unavailable",
    });
  });
});

describe("photo moderation integration boundary", () => {
  it("wires validation, rate limiting and timeout without a soft approval path", () => {
    const route = readFileSync(resolve("src/routes/api/verify-photo.ts"), "utf8");
    const client = readFileSync(resolve("src/lib/verifyPhoto.ts"), "utf8");

    expect(route).toContain("validatePhotoModerationInput");
    expect(route).toContain("moderationRateLimiter.check");
    expect(route).toContain("fetchWithTimeout");
    expect(route).not.toContain("soft: true");
    expect(client).not.toContain("soft: true");
    expect(client).toContain("Technical moderation failures are fail-closed");
  });
});
