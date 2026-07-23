import { useEffect, useRef, type ReactNode } from "react";
import {
  canMountAuthenticatedRoute,
  replaceLocationWithLogin,
  resolveAuthenticatedRouteState,
  resolveAuthenticationRedirectDecision,
} from "@/v2/app/auth-navigation";

type AuthenticatedRouteGateProps = {
  loading: boolean;
  authenticated: boolean;
  children: ReactNode;
  fallback: ReactNode;
};

/**
 * Compatibility gate for legacy authenticated pages.
 *
 * The redirect is scheduled once after render instead of returning a Navigate
 * component from a page that is still resolving authentication. This avoids
 * repeated router transitions while preserving the existing login route.
 */
export function AuthenticatedRouteGate({
  loading,
  authenticated,
  children,
  fallback,
}: AuthenticatedRouteGateProps) {
  const redirectStarted = useRef(false);
  const state = resolveAuthenticatedRouteState({ loading, authenticated });

  useEffect(() => {
    const decision = resolveAuthenticationRedirectDecision({
      state,
      redirectStarted: redirectStarted.current,
    });
    redirectStarted.current = decision.redirectStarted;
    if (!decision.shouldNavigate) return;

    try {
      replaceLocationWithLogin();
    } catch {
      redirectStarted.current = false;
    }
  }, [state]);

  if (!canMountAuthenticatedRoute(state)) return <>{fallback}</>;
  return <>{children}</>;
}
