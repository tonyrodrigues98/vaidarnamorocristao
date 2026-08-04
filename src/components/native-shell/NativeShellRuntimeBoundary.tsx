import { lazy, Suspense, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";

import { MobileAppShell } from "@/components/mobile/MobileAppShell";
import { getDestinationBehavior, getFuturePrimaryTab } from "@/config/app-destinations";
import { nativeShellFeatureEnabled, shouldRenderNativeShell } from "@/config/native-shell-feature";
import {
  prototype01FeatureEnabled,
  shouldRenderPrototype01Shell,
} from "@/config/prototype-01-feature";
import { useAuth } from "@/lib/auth";
import { Prototype01RuntimeProvider } from "@/prototype-01/Prototype01RuntimeProvider";

import { NativeShellFrame } from "./NativeShellFrame";
import { NativeAdaptiveNavigation } from "./NativeAdaptiveNavigation";
import { NativeBottomNavigation } from "./NativeBottomNavigation";
import { NativeShellRuntimeProvider } from "./NativeShellRuntimeContext";
import { NativeTopBar } from "./NativeTopBar";
import { useNativeViewportState } from "./useNativeViewportState";

const Prototype01ShellFrame = lazy(() =>
  import("@/prototype-01/shell/Prototype01ShellFrame").then((module) => ({
    default: module.Prototype01ShellFrame,
  })),
);

export type NativeShellRuntimeBoundaryProps = {
  children: ReactNode;
};

export function NativeShellRuntimeBoundary({ children }: NativeShellRuntimeBoundaryProps) {
  const location = useLocation();
  const { user, loading } = useAuth();
  const behavior = getDestinationBehavior(location.pathname);
  const activeTab = getFuturePrimaryTab(location.pathname);
  const useNativeShell = shouldRenderNativeShell({
    featureEnabled: nativeShellFeatureEnabled,
    behavior,
    loading,
    authenticated: Boolean(user),
  });
  const usePrototype01Shell = shouldRenderPrototype01Shell({
    featureEnabled: prototype01FeatureEnabled,
    behavior,
    loading,
    authenticated: Boolean(user),
  });

  const viewportState = useNativeViewportState(useNativeShell || usePrototype01Shell);
  const userLabel = user?.email ?? user?.id ?? "";

  if (usePrototype01Shell && activeTab) {
    return (
      <NativeShellRuntimeProvider active activeTab={activeTab}>
        <Prototype01RuntimeProvider>
          <Suspense fallback={null}>
            <Prototype01ShellFrame
              activeTab={activeTab}
              destinationId={behavior.destinationId}
              pathname={location.pathname}
              search={location.searchStr}
              hash={location.hash}
              userLabel={userLabel}
              viewportState={viewportState}
            >
              {children}
            </Prototype01ShellFrame>
          </Suspense>
        </Prototype01RuntimeProvider>
      </NativeShellRuntimeProvider>
    );
  }

  if (useNativeShell && activeTab) {
    return (
      <NativeShellRuntimeProvider active activeTab={activeTab}>
        <NativeShellFrame
          activePrimaryTab={activeTab}
          viewportState={viewportState}
          primaryNavigation={
            <NativeAdaptiveNavigation
              activeTab={activeTab}
              pathname={location.pathname}
              search={location.searchStr}
              hash={location.hash}
            />
          }
          topBar={
            <NativeTopBar
              activeTab={activeTab}
              destinationId={behavior.destinationId}
              userLabel={userLabel}
            />
          }
          bottomNavigation={
            <NativeBottomNavigation
              activeTab={activeTab}
              pathname={location.pathname}
              search={location.searchStr}
              hash={location.hash}
            />
          }
        >
          {children}
        </NativeShellFrame>
      </NativeShellRuntimeProvider>
    );
  }

  return <MobileAppShell>{children}</MobileAppShell>;
}
