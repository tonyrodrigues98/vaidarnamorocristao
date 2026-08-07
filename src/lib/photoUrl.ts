import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { clearPrivateSignedUrlCache, getCachedPrivateSignedUrl } from "@/lib/privateSignedUrlCache";

const BUCKET = "profile-photos";
const PUBLIC_PROFILE_MARKER = `/storage/v1/object/public/${BUCKET}/`;
// Legacy rows can contain a signed/authenticated URL from when this bucket
// was private. Profile pictures are public product media, so normalize those
// representations to the stable public object URL too.
const LEGACY_PROFILE_MARKERS = [
  `/storage/v1/object/sign/${BUCKET}/`,
  `/storage/v1/object/authenticated/${BUCKET}/`,
];
const SIGN_TTL_SECONDS = 60 * 60;
const RETRY_DELAY_MS = 1200;

type SignedResult = {
  url: string | null;
  fallbackUrl: string | null;
  loading: boolean;
  error: boolean;
  refresh: () => void;
};

export type ProfilePhotoMediaKind = "public" | "private" | "passthrough" | "empty";

export type ProfilePhotoMediaSource = {
  kind: ProfilePhotoMediaKind;
  path: string | null;
  url: string | null;
};

function stripQueryAndHash(value: string) {
  return value.split("#")[0].split("?")[0];
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function looksLikeRawProfilePath(value: string) {
  if (!value || value.startsWith("/") || value.startsWith("data:") || value.startsWith("blob:")) {
    return false;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false;
  return value.includes("/");
}

function extractPathAfterMarker(value: string, marker: string): string | null {
  const index = value.indexOf(marker);
  if (index < 0) return null;
  const tail = value.slice(index + marker.length);
  return safeDecode(stripQueryAndHash(tail)).replace(/^\/+/, "") || null;
}

export function getPublicProfilePhotoUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export function classifyProfilePhotoSource(
  url: string | null | undefined,
): ProfilePhotoMediaSource {
  const clean = url?.trim();
  if (!clean) return { kind: "empty", path: null, url: null };

  const publicPath = extractPathAfterMarker(clean, PUBLIC_PROFILE_MARKER);
  if (publicPath) {
    return { kind: "public", path: publicPath, url: getPublicProfilePhotoUrl(publicPath) };
  }

  for (const marker of LEGACY_PROFILE_MARKERS) {
    const legacyPath = extractPathAfterMarker(clean, marker);
    if (legacyPath) {
      return { kind: "public", path: legacyPath, url: getPublicProfilePhotoUrl(legacyPath) };
    }
  }

  if (clean.startsWith(`${BUCKET}/`)) {
    const path = safeDecode(stripQueryAndHash(clean.slice(BUCKET.length + 1))).replace(/^\/+/, "");
    return path
      ? { kind: "public", path, url: getPublicProfilePhotoUrl(path) }
      : { kind: "empty", path: null, url: null };
  }

  if (clean.startsWith(`/${BUCKET}/`)) {
    const path = safeDecode(stripQueryAndHash(clean.slice(BUCKET.length + 2))).replace(/^\/+/, "");
    return path
      ? { kind: "public", path, url: getPublicProfilePhotoUrl(path) }
      : { kind: "empty", path: null, url: null };
  }

  if (looksLikeRawProfilePath(clean)) {
    const path = safeDecode(stripQueryAndHash(clean)).replace(/^\/+/, "");
    return path
      ? { kind: "public", path, url: getPublicProfilePhotoUrl(path) }
      : { kind: "empty", path: null, url: null };
  }

  return { kind: "passthrough", path: null, url: clean };
}

export function extractProfilePhotoPath(url: string | null | undefined): string | null {
  return classifyProfilePhotoSource(url).path;
}

async function signPath(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGN_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

function getSignedProfilePhoto(
  path: string,
  userId: string | null | undefined,
  force = false,
): { url: string | null; pending: Promise<string | null> | null } {
  return getCachedPrivateSignedUrl({
    bucket: BUCKET,
    path,
    userId,
    ttlSeconds: SIGN_TTL_SECONDS,
    forceRefresh: force,
    signer: (_bucket, signedPath) => signPath(signedPath),
  });
}

export function clearSignedProfilePhotoCache() {
  clearPrivateSignedUrlCache();
}

export function refreshSignedProfilePhoto(
  input: string | null | undefined,
  userId?: string | null,
) {
  const source = classifyProfilePhotoSource(input);
  if (source.kind !== "private" || !source.path) {
    return Promise.resolve(source.url ?? input ?? null);
  }
  const result = getSignedProfilePhoto(source.path, userId, true);
  return result.pending ?? Promise.resolve(result.url);
}

export function useSignedPhotoUrlResult(
  input: string | null | undefined,
  userId?: string | null,
): SignedResult {
  const trimmedInput = input?.trim() || null;
  const source = useMemo(() => classifyProfilePhotoSource(trimmedInput), [trimmedInput]);
  const publicFallback =
    source.kind === "private" && trimmedInput && /^https?:\/\//i.test(trimmedInput)
      ? trimmedInput
      : null;
  const [refreshToken, setRefreshToken] = useState(0);

  const [url, setUrl] = useState<string | null>(
    source.kind === "public" || source.kind === "passthrough" ? source.url : null,
  );
  const [loading, setLoading] = useState(Boolean(source.kind === "private" && source.path));
  const [error, setError] = useState(false);

  const refresh = useCallback(() => {
    if (source.kind !== "private") return;
    setRefreshToken((value) => value + 1);
  }, [source.kind]);

  useEffect(() => {
    if (source.kind !== "private" || !source.path) {
      setUrl(source.url);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    const force = refreshToken > 0;
    const { url: cachedUrl, pending } = getSignedProfilePhoto(source.path, userId, force);

    setUrl(cachedUrl || publicFallback);
    setLoading(Boolean(pending && !cachedUrl));
    setError(false);

    if (pending) {
      pending.then((nextUrl) => {
        if (cancelled) return;
        if (nextUrl) {
          setUrl(nextUrl);
          setError(false);
        } else {
          setUrl(publicFallback);
          setError(true);
          setTimeout(() => {
            if (!cancelled) setRefreshToken((value) => value + 1);
          }, RETRY_DELAY_MS);
        }
        setLoading(false);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [source.kind, source.path, source.url, publicFallback, refreshToken, userId]);

  return { url, fallbackUrl: publicFallback, loading, error, refresh };
}

export function useSignedPhotoUrl(
  input: string | null | undefined,
  userId?: string | null,
): string | null {
  return useSignedPhotoUrlResult(input, userId).url;
}
