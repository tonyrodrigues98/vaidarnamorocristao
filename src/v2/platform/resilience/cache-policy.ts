export const V2_CACHE_SCHEMA_VERSION = 1;
export const V2_PUBLIC_CACHE_PREFIX = `vdn-v2-v${V2_CACHE_SCHEMA_VERSION}-public`;
export const V2_PRIVATE_CACHE_PREFIX = `vdn-v2-v${V2_CACHE_SCHEMA_VERSION}-private`;
export const V2_PRIVATE_STORAGE_PREFIX = `vdn-v2-v${V2_CACHE_SCHEMA_VERSION}:private:`;

const OPAQUE_SCOPE_PATTERN = /^[a-f0-9]{32,64}$/;

export type V2CacheAudience = "public" | "private";

export interface V2CacheDescriptor {
  readonly name: string;
  readonly audience: V2CacheAudience;
  readonly version: number;
  readonly domain: string;
  readonly subjectScope?: string;
  readonly ttlMs: number;
}

function normalizeDomain(domain: string): string {
  const normalized = domain
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  if (!normalized || normalized.length > 48) {
    throw new Error("invalid_cache_domain");
  }
  return normalized;
}

export function createPublicCacheDescriptor(domain: string, ttlMs: number): V2CacheDescriptor {
  if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) throw new Error("invalid_cache_ttl");
  const safeDomain = normalizeDomain(domain);
  return Object.freeze({
    name: `${V2_PUBLIC_CACHE_PREFIX}-${safeDomain}`,
    audience: "public",
    version: V2_CACHE_SCHEMA_VERSION,
    domain: safeDomain,
    ttlMs,
  });
}

export function createPrivateCacheDescriptor(
  domain: string,
  subjectScope: string,
  ttlMs: number,
): V2CacheDescriptor {
  if (!OPAQUE_SCOPE_PATTERN.test(subjectScope)) throw new Error("invalid_private_cache_scope");
  if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) throw new Error("invalid_cache_ttl");
  const safeDomain = normalizeDomain(domain);
  return Object.freeze({
    name: `${V2_PRIVATE_CACHE_PREFIX}-${subjectScope}-${safeDomain}`,
    audience: "private",
    version: V2_CACHE_SCHEMA_VERSION,
    domain: safeDomain,
    subjectScope,
    ttlMs,
  });
}

export function isV2PrivateCacheName(cacheName: string): boolean {
  return cacheName.startsWith(`${V2_PRIVATE_CACHE_PREFIX}-`);
}

export function isLegacyPrivateCacheName(cacheName: string): boolean {
  return (
    cacheName.includes("-private-") ||
    cacheName.endsWith("-pet-images") ||
    cacheName.includes("-authenticated-")
  );
}

export function shouldClearPrivateCacheName(cacheName: string): boolean {
  return isV2PrivateCacheName(cacheName) || isLegacyPrivateCacheName(cacheName);
}

export function shouldClearPrivateStorageKey(key: string): boolean {
  return key.startsWith(V2_PRIVATE_STORAGE_PREFIX);
}

export interface V2CacheRequestAssessment {
  readonly cacheable: boolean;
  readonly reason:
    | "public-same-origin"
    | "public-storage-object"
    | "private-cache-not-configured"
    | "signed-url"
    | "cross-origin"
    | "unsafe-method"
    | "sensitive-path";
}

export function assessPublicCacheRequest(input: {
  readonly method: string;
  readonly requestUrl: string;
  readonly appOrigin: string;
  readonly sensitive: boolean;
  readonly explicitlyPublicStorage: boolean;
}): V2CacheRequestAssessment {
  if (input.method !== "GET") return { cacheable: false, reason: "unsafe-method" };
  const url = new URL(input.requestUrl, input.appOrigin);
  if (input.sensitive) return { cacheable: false, reason: "sensitive-path" };
  if (
    url.searchParams.has("token") ||
    url.searchParams.has("signature") ||
    url.searchParams.has("expires")
  ) {
    return { cacheable: false, reason: "signed-url" };
  }
  if (input.explicitlyPublicStorage) {
    return { cacheable: true, reason: "public-storage-object" };
  }
  if (url.origin !== input.appOrigin) return { cacheable: false, reason: "cross-origin" };
  return { cacheable: true, reason: "public-same-origin" };
}
