import { QueryClient } from "@tanstack/react-query";

/**
 * Centralized QueryClient factory.
 *
 * Defaults tuned for an app-like, dating-app feel:
 * - staleTime 30s: lists feel "fresh" without re-fetching on every focus.
 * - gcTime 5min: switching tabs/routes still uses cached data.
 * - refetchOnWindowFocus: false — realtime channels handle live updates;
 *   focus-refetch on iOS PWAs causes a visible flash when the tab resumes.
 * - retry once on failure — Supabase errors are usually authoritative.
 */
export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
