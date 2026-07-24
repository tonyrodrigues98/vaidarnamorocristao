import type { QueryClient, QueryKey } from "@tanstack/react-query";
import {
  shouldClearPrivateCacheName,
  shouldClearPrivateStorageKey,
} from "@/v2/platform/resilience/cache-policy";

/**
 * The audited application has no React Query key that is proven independent
 * from the active user and its RLS context. Keep this allowlist explicit until
 * a public query contract is introduced.
 */
export const PUBLIC_QUERY_KEY_PREFIXES: readonly QueryKey[] = [];

export function isProvenPublicQueryKey(queryKey: QueryKey): boolean {
  return PUBLIC_QUERY_KEY_PREFIXES.some((prefix) =>
    prefix.every((value, index) => Object.is(queryKey[index], value)),
  );
}

export function shouldRemoveQueryAtAuthBoundary(queryKey: QueryKey): boolean {
  return !isProvenPublicQueryKey(queryKey);
}

export const CLEAR_PRIVATE_CACHES_MESSAGE = "VDN_CLEAR_PRIVATE_CACHES";

export function isPrivateBrowserCacheName(cacheName: string): boolean {
  return shouldClearPrivateCacheName(cacheName);
}

function clearPrivateStorage(storage: Storage | undefined): void {
  if (!storage) return;
  try {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
      (key): key is string => !!key,
    );
    for (const key of keys) {
      if (shouldClearPrivateStorageKey(key)) storage.removeItem(key);
    }
  } catch {
    // Storage may be unavailable in private/partitioned contexts. Cache API cleanup still runs.
  }
}

export async function clearBrowserPrivateCaches(): Promise<void> {
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.controller?.postMessage({ type: CLEAR_PRIVATE_CACHES_MESSAGE });
  }
  if (typeof window !== "undefined") {
    try {
      clearPrivateStorage(window.localStorage);
    } catch {
      // Access to the storage getter itself may be denied.
    }
    try {
      clearPrivateStorage(window.sessionStorage);
    } catch {
      // Access to the storage getter itself may be denied.
    }
  }
  if (typeof caches === "undefined") return;
  const keys = await caches.keys();
  await Promise.all(
    keys.filter(isPrivateBrowserCacheName).map((cacheName) => caches.delete(cacheName)),
  );
}

export function isolatePrivateQueryCache(queryClient: QueryClient): void {
  void queryClient.cancelQueries();
  queryClient.removeQueries({
    predicate: (query) => shouldRemoveQueryAtAuthBoundary(query.queryKey),
  });
  queryClient.getMutationCache().clear();
  void clearBrowserPrivateCaches();
}
