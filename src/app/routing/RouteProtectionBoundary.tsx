import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import {
  buildLoginDestination,
  classifyRoute,
  readReturnTo,
  resolveRouteBoundaryDecision,
  resolveRouteRedirectDecision,
} from "@/app/routing/route-access";

export interface RouteProtectionBoundaryProps {
  readonly children: ReactNode;
  readonly waitingFallback?: ReactNode;
  readonly recoverableErrorFallback?: ReactNode;
}

export function RouteProtectionBoundary({
  children,
  waitingFallback,
  recoverableErrorFallback,
}: RouteProtectionBoundaryProps) {
  const { status, rolesLoaded } = useAuth();
  const location = useLocation();
  const redirectTarget = useRef<string | null>(null);
  const kind = classifyRoute(location.pathname);
  const decision = resolveRouteBoundaryDecision({
    kind,
    status,
    authorizationReady: rolesLoaded,
  });
  const browserSearch = typeof window === "undefined" ? "" : window.location.search;
  const browserHash = typeof window === "undefined" ? "" : window.location.hash;

  let target: string | null = null;
  if (decision.action === "redirect-login") {
    const requested = `${location.pathname}${browserSearch}${browserHash}`;
    target = buildLoginDestination(requested);
  } else if (decision.action === "redirect-return") {
    target = readReturnTo(browserSearch);
  }

  useEffect(() => {
    const redirect = resolveRouteRedirectDecision({
      target,
      startedTarget: redirectTarget.current,
    });
    redirectTarget.current = redirect.startedTarget;
    if (redirect.shouldNavigate && target && typeof window !== "undefined") {
      window.location.replace(target);
    }
  }, [target]);

  if (decision.action === "wait") {
    return <>{status === "recoverable-error" ? recoverableErrorFallback : waitingFallback}</>;
  }
  if (decision.action !== "mount") return null;
  return <>{children}</>;
}
