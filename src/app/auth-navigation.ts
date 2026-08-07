export type AuthenticatedRouteState = "loading" | "authenticated" | "redirect-to-login";
export type AuthenticationRedirectDecision = Readonly<{
  redirectStarted: boolean;
  shouldNavigate: boolean;
}>;

export function resolveAuthenticatedRouteState({
  loading,
  authenticated,
}: {
  loading: boolean;
  authenticated: boolean;
}): AuthenticatedRouteState {
  if (loading) return "loading";
  return authenticated ? "authenticated" : "redirect-to-login";
}

/**
 * Single-flight redirect state used by authenticated compatibility routes.
 *
 * Returning to loading/authenticated rearms the tracker, which lets a later
 * logout or session expiry redirect once without allowing render/effect loops.
 */
export function resolveAuthenticationRedirectDecision({
  state,
  redirectStarted,
}: {
  state: AuthenticatedRouteState;
  redirectStarted: boolean;
}): AuthenticationRedirectDecision {
  if (state !== "redirect-to-login") {
    return { redirectStarted: false, shouldNavigate: false };
  }

  if (redirectStarted) {
    return { redirectStarted: true, shouldNavigate: false };
  }

  return { redirectStarted: true, shouldNavigate: true };
}

export function canMountAuthenticatedRoute(state: AuthenticatedRouteState): boolean {
  return state === "authenticated";
}

export type LoginLocation = Pick<Location, "replace">;

export function replaceLocationWithLogin(location: LoginLocation = window.location): void {
  location.replace("/auth/login");
}
