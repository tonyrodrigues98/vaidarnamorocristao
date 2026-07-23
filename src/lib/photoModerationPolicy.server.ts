export const PHOTO_MODERATION_LIMITS = Object.freeze({
  aiTimeoutMs: 15_000,
  maxBase64Characters: 8_000_000,
  maxRequestBytes: 8_100_000,
  rateLimitMaxRequests: 6,
  rateLimitWindowMs: 60_000,
});

export const PHOTO_MODERATION_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

export type PhotoModerationMimeType = (typeof PHOTO_MODERATION_MIME_TYPES)[number];

export type PhotoModerationInput =
  | {
      ok: true;
      imageBase64: string;
      mimeType: PhotoModerationMimeType;
      scope: "main" | "extra";
      photoUrl: string | null;
    }
  | {
      ok: false;
      error: "invalid_input" | "invalid_mime" | "mime_mismatch" | "image_too_large";
      status: 400 | 413 | 415;
    };

type RateLimitState = {
  count: number;
  expiresAt: number;
};

export type RateLimitDecision =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

const allowedMimeTypes = new Set<string>(PHOTO_MODERATION_MIME_TYPES);
const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

function hasPrefix(bytes: Uint8Array, expected: number[]) {
  return expected.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function matchesDeclaredMime(bytes: Uint8Array, mimeType: PhotoModerationMimeType) {
  if (mimeType === "image/jpeg") return hasPrefix(bytes, [0xff, 0xd8, 0xff]);
  if (mimeType === "image/png") {
    return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (mimeType === "image/gif") {
    const signature = ascii(bytes, 0, 6);
    return signature === "GIF87a" || signature === "GIF89a";
  }
  if (mimeType === "image/webp") {
    return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP";
  }

  if (ascii(bytes, 4, 4) !== "ftyp") return false;
  const brand = ascii(bytes, 8, 4);
  const heicBrands = new Set(["heic", "heix", "hevc", "hevx"]);
  const heifBrands = new Set(["mif1", "msf1", ...heicBrands]);
  return mimeType === "image/heic" ? heicBrands.has(brand) : heifBrands.has(brand);
}

function decodeHeader(imageBase64: string) {
  try {
    const decoded = atob(imageBase64.slice(0, 64));
    return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

export function validatePhotoModerationInput(body: unknown): PhotoModerationInput {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid_input", status: 400 };
  }

  const input = body as Record<string, unknown>;
  const imageBase64 = typeof input.imageBase64 === "string" ? input.imageBase64 : "";
  if (
    imageBase64.length < 100 ||
    imageBase64.length % 4 !== 0 ||
    !base64Pattern.test(imageBase64)
  ) {
    return { ok: false, error: "invalid_input", status: 400 };
  }
  if (imageBase64.length > PHOTO_MODERATION_LIMITS.maxBase64Characters) {
    return { ok: false, error: "image_too_large", status: 413 };
  }

  const rawMime = typeof input.mimeType === "string" ? input.mimeType.toLowerCase() : "";
  if (!allowedMimeTypes.has(rawMime)) {
    return { ok: false, error: "invalid_mime", status: 415 };
  }

  const mimeType = rawMime as PhotoModerationMimeType;
  const header = decodeHeader(imageBase64);
  if (!header || !matchesDeclaredMime(header, mimeType)) {
    return { ok: false, error: "mime_mismatch", status: 415 };
  }

  return {
    ok: true,
    imageBase64,
    mimeType,
    scope: input.scope === "extra" ? "extra" : "main",
    photoUrl: typeof input.photoUrl === "string" ? input.photoUrl : null,
  };
}

export class PerSubjectFixedWindowRateLimiter {
  private readonly states = new Map<string, RateLimitState>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
  ) {}

  check(subject: string, now = Date.now()): RateLimitDecision {
    const existing = this.states.get(subject);
    if (!existing || existing.expiresAt <= now) {
      this.states.set(subject, { count: 1, expiresAt: now + this.windowMs });
      this.prune(now);
      return { allowed: true, remaining: Math.max(0, this.maxRequests - 1) };
    }

    if (existing.count >= this.maxRequests) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((existing.expiresAt - now) / 1_000)),
      };
    }

    existing.count += 1;
    return { allowed: true, remaining: Math.max(0, this.maxRequests - existing.count) };
  }

  private prune(now: number) {
    if (this.states.size < 1_000) return;
    for (const [subject, state] of this.states) {
      if (state.expiresAt <= now) this.states.delete(subject);
    }
  }
}

export async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  options: {
    fetcher?: typeof fetch;
    timeoutMs?: number;
  } = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort("photo_moderation_timeout"),
    options.timeoutMs ?? PHOTO_MODERATION_LIMITS.aiTimeoutMs,
  );

  try {
    return await (options.fetcher ?? fetch)(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function failClosedModerationBody(error: string) {
  return {
    approved: false,
    needsReview: false,
    retryable: true,
    error,
  };
}
