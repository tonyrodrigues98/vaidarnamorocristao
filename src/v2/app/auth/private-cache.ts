import type { QueryClient, QueryKey } from "@tanstack/react-query";

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
  return (
    cacheName.includes("-private-") ||
    cacheName.endsWith("-pet-images") ||
    cacheName.includes("-authenticated-")
  );
}

export async function clearBrowserPrivateCaches(): Promise<void> {
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.controller?.postMessage({ type: CLEAR_PRIVATE_CACHES_MESSAGE });
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
