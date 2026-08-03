import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";

import { MobileAppShell } from "@/components/mobile/MobileAppShell";
import { getDestinationBehavior, getFuturePrimaryTab } from "@/config/app-destinations";
import { nativeShellFeatureEnabled, shouldRenderNativeShell } from "@/config/native-shell-feature";
import { useAuth } from "@/lib/auth";
import { RedesignAppFrame } from "@/components/redesign-total/RedesignAppFrame";
import { RedesignRuntimeBoundary } from "@/components/redesign-total/RedesignRuntimeBoundary";
import {
  shouldActivateTotalRedesign,
  totalRedesignFeatureEnabled,
} from "@/config/redesign-total-feature";

import { NativeShellFrame } from "./NativeShellFrame";
import { NativeAdaptiveNavigation } from "./NativeAdaptiveNavigation";
import { NativeBottomNavigation } from "./NativeBottomNavigation";
import { NativeShellRuntimeProvider } from "./NativeShellRuntimeContext";
import { NativeTopBar } from "./NativeTopBar";
import { useNativeViewportState } from "./useNativeViewportState";

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

  const viewportState = useNativeViewportState(useNativeShell);
  const userLabel = user?.email ?? user?.id ?? "";
  const useTotalRedesign = shouldActivateTotalRedesign(useNativeShell, totalRedesignFeatureEnabled);

  if (useNativeShell && activeTab) {
    return (
      <NativeShellRuntimeProvider active activeTab={activeTab}>
        <RedesignRuntimeBoundary nativeShellActive>
          {useTotalRedesign ? (
            <RedesignAppFrame
              activeTab={activeTab}
              pathname={location.pathname}
              search={location.searchStr}
              hash={location.hash}
              destinationId={behavior.destinationId}
              userLabel={userLabel}
              viewportState={viewportState}
            >
              {children}
            </RedesignAppFrame>
          ) : (
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
          )}
        </RedesignRuntimeBoundary>
      </NativeShellRuntimeProvider>
    );
  }

  return <MobileAppShell>{children}</MobileAppShell>;
}
