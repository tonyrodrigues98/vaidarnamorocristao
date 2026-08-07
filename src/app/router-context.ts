import type { QueryClient } from "@tanstack/react-query";

/**
 * Shared router context kept outside the generated route graph.
 *
 * Route modules may depend on this type without importing the router factory,
 * preventing the application shell from creating a circular dependency with
 * routeTree.gen.ts.
 */
export type AppRouterContext = {
  queryClient: QueryClient;
};
