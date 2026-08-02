import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

const BUCKET = "pet-expeditions";
const MARKERS = [
  `/storage/v1/object/public/${BUCKET}/`,
  `/storage/v1/object/sign/${BUCKET}/`,
  `/storage/v1/object/authenticated/${BUCKET}/`,
];
const TTL = 60 * 60;

type Entry = { url: string; expiresAt: number; promise?: Promise<string | null> };
const cache = new Map<string, Entry>();

function extractPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  for (const m of MARKERS) {
    const i = raw.indexOf(m);
    if (i >= 0) return decodeURIComponent(raw.slice(i + m.length).split("?")[0]);
  }
  if (/^(https?:|data:|blob:|\/)/i.test(raw)) return null;
  return decodeURIComponent(raw.split("?")[0]);
}

async function sign(path: string): Promise<string | null> {
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && hit.expiresAt > now + 60_000) return hit.url;
  if (hit?.promise) return hit.promise;
  const promise = (async () => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, TTL);
    if (error || !data?.signedUrl) {
      cache.delete(path);
      return null;
    }
    cache.set(path, { url: data.signedUrl, expiresAt: now + TTL * 1000 });
    return data.signedUrl;
  })();
  cache.set(path, { url: hit?.url ?? "", expiresAt: hit?.expiresAt ?? 0, promise });
  return promise;
}

/** Resolves a pet-expeditions bucket path (or full URL) to a usable signed URL. */
export function useSignedExpeditionUrl(raw: string | null | undefined): string | null {
  const path = extractPath(raw);
  const [url, setUrl] = useState<string | null>(() => {
    if (!path) return raw ?? null;
    const hit = cache.get(path);
    return hit && hit.expiresAt > Date.now() + 60_000 ? hit.url : null;
  });
  useEffect(() => {
    if (!path) {
      setUrl(raw ?? null);
      return;
    }
    let alive = true;
    sign(path).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [path, raw]);
  return url;
}

/** Uploads a file into the pet-expeditions bucket and returns the stored path. */
export async function uploadExpeditionImage(file: File, slugHint: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safe = (slugHint || "expedicao").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const path = `${safe}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (error) throw error;
  return path;
}
