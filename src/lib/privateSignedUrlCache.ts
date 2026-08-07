import { registerPrivateCacheCleanup } from "@/lib/privateSessionCache";

export type PrivateSignedUrlSigner = (
  bucket: string,
  path: string,
  ttlSeconds: number,
) => Promise<string | null>;

const REFRESH_BEFORE_MS = 5 * 60 * 1000;

type CacheEntry = {
  url: string;
  expiresAt: number;
  promise?: Promise<string | null>;
};

const signedUrlCache = new Map<string, CacheEntry>();

function cacheKey(userId: string, bucket: string, path: string): string {
  return `${userId}:${bucket}:${path}`;
}

export function clearPrivateSignedUrlCache(): void {
  signedUrlCache.clear();
}

registerPrivateCacheCleanup(() => {
  clearPrivateSignedUrlCache();
});

export function getCachedPrivateSignedUrl({
  bucket,
  path,
  userId,
  ttlSeconds,
  signer,
  now = Date.now(),
  forceRefresh = false,
}: {
  bucket: string;
  path: string;
  userId: string | null | undefined;
  ttlSeconds: number;
  signer: PrivateSignedUrlSigner;
  now?: number;
  forceRefresh?: boolean;
}): { url: string | null; pending: Promise<string | null> | null } {
  if (!userId) return { url: null, pending: null };

  const key = cacheKey(userId, bucket, path);
  const cached = signedUrlCache.get(key);

  if (!forceRefresh && cached?.url && cached.expiresAt - REFRESH_BEFORE_MS > now) {
    return { url: cached.url, pending: null };
  }

  if (!forceRefresh && cached?.promise) {
    return { url: cached.url || null, pending: cached.promise };
  }

  const pending = signer(bucket, path, ttlSeconds).then((url) => {
    if (url) {
      signedUrlCache.set(key, { url, expiresAt: Date.now() + ttlSeconds * 1000 });
      return url;
    }

    if (cached?.url) {
      signedUrlCache.set(key, { url: cached.url, expiresAt: cached.expiresAt });
    } else {
      signedUrlCache.delete(key);
    }

    return null;
  });

  signedUrlCache.set(key, {
    url: cached?.url ?? "",
    expiresAt: cached?.expiresAt ?? 0,
    promise: pending,
  });

  return { url: cached?.url || null, pending };
}
