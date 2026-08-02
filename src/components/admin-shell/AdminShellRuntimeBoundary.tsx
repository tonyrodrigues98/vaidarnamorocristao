import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AdminShellFrame } from "@/components/admin-shell/AdminShellFrame";
import { AdminShellRuntimeProvider } from "@/components/admin-shell/AdminShellRuntimeContext";
import {
  canRoleAccessAdminDestination,
  getAdminDestination,
  getAdminNavigationForRole,
  isAdminShellRole,
} from "@/config/admin-destinations";
import { nativeShellFeatureEnabled } from "@/config/native-shell-feature";
import { useAuth } from "@/lib/auth";
import "@/styles/admin-shell.css";

export function AdminShellRuntimeBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, role, loading, rolesLoaded } = useAuth();
  const destination = getAdminDestination(location.pathname);
  const active = Boolean(
    nativeShellFeatureEnabled &&
    user &&
    !loading &&
    rolesLoaded &&
    destination &&
    isAdminShellRole(role) &&
    canRoleAccessAdminDestination(role, destination),
  );

  if (!active || !destination) return <>{children}</>;

  return (
    <AdminShellRuntimeProvider
      value={{ active: true, destinationId: destination.id, pathname: location.pathname, role }}
    >
      <AdminShellFrame
        destination={destination}
        destinations={getAdminNavigationForRole(role)}
        role={role}
      >
        {children}
      </AdminShellFrame>
    </AdminShellRuntimeProvider>
  );
}
