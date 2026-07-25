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

export function isolatePrivateQueryCache(queryClient: QueryClient): void {
  void queryClient.cancelQueries();
  queryClient.removeQueries({
    predicate: (query) => shouldRemoveQueryAtAuthBoundary(query.queryKey),
  });
  queryClient.getMutationCache().clear();
}
