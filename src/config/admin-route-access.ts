import type { AdminDestination } from "@/config/admin-destinations";
import { canRoleAccessAdminDestination } from "@/config/admin-destinations";
import type { AppRole } from "@/lib/roles";
import { sanitizeReturnTo } from "@/app/routing/route-access";

export type AdminRouteAccessStatus =
  | "initializing"
  | "authenticated"
  | "unauthenticated"
  | "recoverable-error";

export type AdminRouteAccessDecision = "wait" | "redirect-login" | "restricted" | "mount";

export function resolveAdminRouteAccess({
  destination,
  status,
  rolesLoaded,
  role,
}: {
  destination?: AdminDestination;
  status: AdminRouteAccessStatus;
  rolesLoaded: boolean;
  role: AppRole;
}): AdminRouteAccessDecision {
  if (status === "unauthenticated") return "redirect-login";
  if (status !== "authenticated" || !rolesLoaded) return "wait";
  if (!destination || !canRoleAccessAdminDestination(role, destination)) return "restricted";
  return "mount";
}

export function getAdminReturnTo(pathname: string, search = "", hash = ""): string {
  return sanitizeReturnTo(`${pathname}${search}${hash}`);
}
