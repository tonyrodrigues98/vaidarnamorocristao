import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

const BUCKET = "profile-photos";
const PROFILE_MARKERS = [
  `/storage/v1/object/public/${BUCKET}/`,
  `/storage/v1/object/sign/${BUCKET}/`,
  `/storage/v1/object/authenticated/${BUCKET}/`,
];
const SIGN_TTL_SECONDS = 60 * 60;
const REFRESH_BEFORE_MS = 5 * 60 * 1000;
const RETRY_DELAY_MS = 1200;
const EMPTY_SIGNED_EXPIRES_AT = 0;

type CachedSigned = {
  url: string;
  expiresAt: number;
  promise?: Promise<string | null>;
};

type SignedResult = {
  url: string | null;
  fallbackUrl: string | null;
  loading: boolean;
  error: boolean;
  refresh: () => void;
};

const cache = new Map<string, CachedSigned>();

const STORAGE_KEY = "vdn:signed-photos:v1";
const STORAGE_SAFETY_MS = 60 * 1000;

function hydrateFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, { url: string; expiresAt: number }>;
    const now = Date.now();
    for (const [path, entry] of Object.entries(parsed)) {
      if (entry?.url && entry.expiresAt - STORAGE_SAFETY_MS > now) {
        cache.set(path, { url: entry.url, expiresAt: entry.expiresAt });
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persistToStorage() {
  if (typeof window === "undefined") return;
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      const out: Record<string, { url: string; expiresAt: number }> = {};
      const now = Date.now();
      cache.forEach((entry, path) => {
        if (entry.url && entry.expiresAt - STORAGE_SAFETY_MS > now) {
          out[path] = { url: entry.url, expiresAt: entry.expiresAt };
        }
      });
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch {
      /* quota or disabled — best effort only */
    }
  }, 400);
}

hydrateFromStorage();

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
  if (!value || value.startsWith("/") || value.startsWith("data:") || value.startsWith("blob:"))
    return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false;
  return value.includes("/");
}

export function extractProfilePhotoPath(url: string | null | undefined): string | null {
  const clean = url?.trim();
  if (!clean) return null;

  for (const marker of PROFILE_MARKERS) {
    const idx = clean.indexOf(marker);
    if (idx >= 0) {
      const tail = clean.slice(idx + marker.length);
      const path = safeDecode(stripQueryAndHash(tail)).replace(/^\/+/, "");
      return path || null;
    }
  }

  if (clean.startsWith(`${BUCKET}/`)) {
    return (
      safeDecode(stripQueryAndHash(clean.slice(BUCKET.length + 1))).replace(/^\/+/, "") || null
    );
  }

  if (clean.startsWith(`/${BUCKET}/`)) {
    return (
      safeDecode(stripQueryAndHash(clean.slice(BUCKET.length + 2))).replace(/^\/+/, "") || null
    );
  }

  if (looksLikeRawProfilePath(clean)) {
    return safeDecode(stripQueryAndHash(clean)).replace(/^\/+/, "") || null;
  }

  return null;
}

async function signPath(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGN_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

function getSigned(
  path: string,
  force = false,
): { url: string | null; pending: Promise<string | null> | null } {
  const now = Date.now();
  const cached = cache.get(path);

  if (!force && cached?.url && cached.expiresAt - REFRESH_BEFORE_MS > now) {
    return { url: cached.url, pending: null };
  }

  if (!force && cached?.promise) {
    return { url: cached.url || null, pending: cached.promise };
  }

  const pending = signPath(path).then((url) => {
    if (url) {
      cache.set(path, { url, expiresAt: Date.now() + SIGN_TTL_SECONDS * 1000 });
      persistToStorage();
    } else if (cached?.url) {
      cache.set(path, { url: cached.url, expiresAt: cached.expiresAt });
    } else {
      cache.set(path, { url: "", expiresAt: EMPTY_SIGNED_EXPIRES_AT });
    }
    return url;
  });

  cache.set(path, {
    url: cached?.url ?? "",
    expiresAt: cached?.expiresAt ?? 0,
    promise: pending,
  });

  return { url: cached?.url || null, pending };
}

export function refreshSignedProfilePhoto(input: string | null | undefined) {
  const path = extractProfilePhotoPath(input);
  if (!path) return Promise.resolve(input ?? null);
  const result = getSigned(path, true);
  return result.pending ?? Promise.resolve(result.url);
}

export function useSignedPhotoUrlResult(input: string | null | undefined): SignedResult {
  const trimmedInput = input?.trim() || null;
  const path = useMemo(() => extractProfilePhotoPath(trimmedInput), [trimmedInput]);
  const publicFallback =
    trimmedInput && /^https?:\/\//i.test(trimmedInput) ? trimmedInput : null;
  const passthrough = !trimmedInput || path ? null : trimmedInput;
  const [refreshToken, setRefreshToken] = useState(0);

  const initial = useMemo(() => {
    if (!path) return passthrough;
    const cached = cache.get(path);
    if (cached?.url && cached.expiresAt - REFRESH_BEFORE_MS > Date.now()) return cached.url;
    return null;
  }, [path, passthrough, publicFallback]);

  const [url, setUrl] = useState<string | null>(initial);
  const [loading, setLoading] = useState(Boolean(path && !initial));
  const [error, setError] = useState(false);

  const refresh = useCallback(() => {
    if (!path) return;
    setRefreshToken((value) => value + 1);
  }, [path]);

  useEffect(() => {
    if (!path) {
      setUrl(passthrough);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    const force = refreshToken > 0;
    const { url: cachedUrl, pending } = getSigned(path, force);

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

    const current = cache.get(path);
    const refreshIn = current?.expiresAt
      ? Math.max(30_000, current.expiresAt - REFRESH_BEFORE_MS - Date.now())
      : null;
    const timer = refreshIn
      ? window.setTimeout(() => {
          if (!cancelled) setRefreshToken((value) => value + 1);
        }, refreshIn)
      : null;

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [path, passthrough, publicFallback, refreshToken]);

  return { url, fallbackUrl: publicFallback, loading, error, refresh };
}

export function useSignedPhotoUrl(input: string | null | undefined): string | null {
  return useSignedPhotoUrlResult(input).url;
}
