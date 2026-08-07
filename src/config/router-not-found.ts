export type RouterMatchNotFoundState = Readonly<{
  globalNotFound?: boolean;
}>;

/**
 * TanStack marks only a genuinely unmatched URL on the root match. Route-level
 * not-found states (for example an unknown blog slug) remain owned by their
 * matching route and are deliberately not treated as a global 404 here.
 */
export function isGlobalRouterNotFound(matches: readonly RouterMatchNotFoundState[]): boolean {
  return matches.some((match) => match.globalNotFound === true);
}
