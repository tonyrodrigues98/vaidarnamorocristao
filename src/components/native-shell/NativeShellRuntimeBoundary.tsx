import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";

import { MobileAppShell } from "@/components/mobile/MobileAppShell";
import { getDestinationBehavior } from "@/config/app-destinations";
import { nativeShellFeatureEnabled, shouldRenderNativeShell } from "@/config/native-shell-feature";
import { useAuth } from "@/lib/auth";

import { NativeShellFrame } from "./NativeShellFrame";

export type NativeShellRuntimeBoundaryProps = {
  children: ReactNode;
};

export function NativeShellRuntimeBoundary({ children }: NativeShellRuntimeBoundaryProps) {
  const location = useLocation();
  const { user, loading } = useAuth();
  const behavior = getDestinationBehavior(location.pathname);
  const useNativeShell = shouldRenderNativeShell({
    featureEnabled: nativeShellFeatureEnabled,
    behavior,
    loading,
    authenticated: Boolean(user),
  });

  if (useNativeShell) {
    return <NativeShellFrame>{children}</NativeShellFrame>;
  }

  return <MobileAppShell>{children}</MobileAppShell>;
}
