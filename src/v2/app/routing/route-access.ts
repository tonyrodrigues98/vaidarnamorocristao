import type { AuthSessionStatus } from "@/v2/app/auth/session-state";
import { sanitizeInternalDestination } from "@/v2/platform/navigation/internal-destination";

export type RouteAccessKind =
  | "public"
  | "visitor-only"
  | "authenticated"
  | "authenticated-onboarding"
  | "administrative"
  | "server-endpoint";

const PUBLIC_ROUTES = new Set([
  "/",
  "/como-funciona",
  "/depoimentos",
  "/instalar",
  "/manual",
  "/sobre",
  "/termos",
]);

const VISITOR_ONLY_ROUTES = new Set(["/auth/forgot-password", "/auth/login", "/auth/signup"]);

const AUTH_RETURN_ROUTES = new Set([
  "/auth/forgot-password",
  "/auth/login",
  "/auth/reset-password",
  "/auth/signup",
  "/logout",
]);

export function classifyRoute(pathname: string): RouteAccessKind {
  const normalized = normalizePathname(pathname);
  if (normalized.startsWith("/api/")) return "server-endpoint";
  if (normalized === "/blog" || normalized.startsWith("/blog/")) return "public";
  if (PUBLIC_ROUTES.has(normalized)) return "public";
  if (VISITOR_ONLY_ROUTES.has(normalized)) return "visitor-only";
  if (normalized === "/auth/reset-password") return "public";
  if (normalized === "/onboarding" || normalized.startsWith("/onboarding/")) {
    return "authenticated-onboarding";
  }
  if (normalized === "/admin" || normalized.startsWith("/admin/")) {
    return "administrative";
  }
  return "authenticated";
}

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function sanitizeReturnTo(value: unknown, fallback = "/inicio"): string {
  const destination = sanitizeInternalDestination(value, {
    origin: "https://return.local",
    fallback,
    allowAbsoluteSameOrigin: false,
  });
  if (!destination) return fallback;
  const pathname = normalizePathname(new URL(destination, "https://return.local").pathname);
  if (
    AUTH_RETURN_ROUTES.has(pathname) ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/")
  ) {
    return fallback;
  }
  return destination;
}

export function readReturnTo(search: string, fallback = "/inicio"): string {
  try {
    return sanitizeReturnTo(new URLSearchParams(search).get("returnTo"), fallback);
  } catch {
    return fallback;
  }
}

export function buildLoginDestination(requestedPath: string, fallback = "/inicio"): string {
  const returnTo = sanitizeReturnTo(requestedPath, fallback);
  return `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export type RouteBoundaryDecision =
  | Readonly<{ action: "mount" }>
  | Readonly<{ action: "wait" }>
  | Readonly<{ action: "redirect-login" }>
  | Readonly<{ action: "redirect-return" }>;

export function resolveRouteBoundaryDecision({
  kind,
  status,
  authorizationReady = true,
}: {
  kind: RouteAccessKind;
  status: AuthSessionStatus;
  authorizationReady?: boolean;
}): RouteBoundaryDecision {
  if (kind === "public" || kind === "server-endpoint") return { action: "mount" };

  if (kind === "visitor-only") {
    return status === "authenticated" ? { action: "redirect-return" } : { action: "mount" };
  }

  if (status === "authenticated") {
    return authorizationReady ? { action: "mount" } : { action: "wait" };
  }
  if (status === "unauthenticated") return { action: "redirect-login" };
  return { action: "wait" };
}

export function shouldMountPrivateProviders(status: AuthSessionStatus, hasUser: boolean): boolean {
  return status === "authenticated" && hasUser;
}

export type RouteRedirectDecision = Readonly<{
  startedTarget: string | null;
  shouldNavigate: boolean;
}>;

export function resolveRouteRedirectDecision({
  target,
  startedTarget,
}: {
  target: string | null;
  startedTarget: string | null;
}): RouteRedirectDecision {
  if (!target) return { startedTarget: null, shouldNavigate: false };
  if (target === startedTarget) return { startedTarget, shouldNavigate: false };
  return { startedTarget: target, shouldNavigate: true };
}
