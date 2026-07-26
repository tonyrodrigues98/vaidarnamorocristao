import type { QueryClient, QueryKey } from "@tanstack/react-query";

type PrivateCacheCleanup = (reason: "logout" | "user-change" | "session-reset") => void;

const privateCacheCleanups = new Set<PrivateCacheCleanup>();

/**
 * The restored V1 has no React Query key that is proven independent from the
 * active user and its RLS context. Keep this allowlist explicit until a public
 * query contract is introduced.
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

export function registerPrivateCacheCleanup(cleanup: PrivateCacheCleanup): () => void {
  privateCacheCleanups.add(cleanup);
  return () => {
    privateCacheCleanups.delete(cleanup);
  };
}

export function clearRegisteredPrivateCaches(
  reason: "logout" | "user-change" | "session-reset",
): void {
  privateCacheCleanups.forEach((cleanup) => cleanup(reason));
}

export function isolatePrivateQueryCache(
  queryClient: QueryClient,
  reason: "logout" | "user-change" | "session-reset" = "session-reset",
): void {
  void queryClient.cancelQueries();
  queryClient.removeQueries({
    predicate: (query) => shouldRemoveQueryAtAuthBoundary(query.queryKey),
  });
  queryClient.getMutationCache().clear();
  clearRegisteredPrivateCaches(reason);
}
