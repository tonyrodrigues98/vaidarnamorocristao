import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Photo URLs stored in the database use the historic public-style URL
 * (e.g. `https://<project>.supabase.co/storage/v1/object/public/profile-photos/<user_id>/avatar.jpg?t=...`).
 * The bucket is now PRIVATE, so we extract the path and produce a short-lived
 * signed URL at render time.
 *
 * Non-storage URLs (external avatars, data URIs) are returned as-is.
 */

const BUCKET = "profile-photos";
const PUBLIC_MARK = `/storage/v1/object/public/${BUCKET}/`;
const SIGN_MARK = `/storage/v1/object/sign/${BUCKET}/`;
const SIGN_TTL_SECONDS = 60 * 60; // 1h
const REFRESH_BEFORE_MS = 5 * 60 * 1000; // refresh 5 min before expiry

type CachedSigned = { url: string; expiresAt: number; promise?: Promise<string | null> };
const cache = new Map<string, CachedSigned>();

export function extractProfilePhotoPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const idxPub = url.indexOf(PUBLIC_MARK);
  if (idxPub >= 0) {
    const tail = url.slice(idxPub + PUBLIC_MARK.length);
    const path = tail.split("?")[0];
    return path || null;
  }
  const idxSign = url.indexOf(SIGN_MARK);
  if (idxSign >= 0) {
    const tail = url.slice(idxSign + SIGN_MARK.length);
    const path = tail.split("?")[0];
    return path || null;
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

function getSigned(path: string): { url: string | null; pending: Promise<string | null> | null } {
  const now = Date.now();
  const cached = cache.get(path);
  if (cached && cached.expiresAt - REFRESH_BEFORE_MS > now) {
    return { url: cached.url, pending: null };
  }
  if (cached?.promise) {
    return { url: cached.url ?? null, pending: cached.promise };
  }
  const pending = signPath(path).then((url) => {
    if (url) {
      cache.set(path, { url, expiresAt: now + SIGN_TTL_SECONDS * 1000 });
    } else {
      cache.delete(path);
    }
    return url;
  });
  cache.set(path, {
    url: cached?.url ?? "",
    expiresAt: cached?.expiresAt ?? 0,
    promise: pending,
  });
  return { url: cached?.url ?? null, pending };
}

/**
 * Resolve a stored photo_url into a usable URL.
 * - null/undefined input → null
 * - Non-storage URL (external avatar, data URI, blob:) → returned as-is
 * - profile-photos URL → short-lived signed URL (cached)
 *
 * Returns null on the first render while the sign request is in flight.
 */
export function useSignedPhotoUrl(input: string | null | undefined): string | null {
  const path = extractProfilePhotoPath(input);
  const passthrough = !input || path ? null : input;

  const initial = (() => {
    if (!path) return passthrough;
    const cached = cache.get(path);
    if (cached && cached.url && cached.expiresAt - REFRESH_BEFORE_MS > Date.now()) {
      return cached.url;
    }
    return null;
  })();

  const [resolved, setResolved] = useState<string | null>(initial);

  useEffect(() => {
    if (!path) {
      setResolved(passthrough);
      return;
    }
    const { url, pending } = getSigned(path);
    if (url) setResolved(url);
    if (!pending) return;
    let cancelled = false;
    pending.then((u) => {
      if (!cancelled && u) setResolved(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path, passthrough]);

  return resolved;
}