import type { ReactNode } from "react";

import { NATIVE_SHELL_MAIN_ID } from "@/components/native-shell/NativeShellFrame";
import type { NativeViewportState } from "@/components/native-shell/useNativeViewportState";
import type { FuturePrimaryTab } from "@/config/app-destinations";

import { RedesignBottomNavigation } from "./RedesignBottomNavigation";
import { RedesignDesktopContextPanel } from "./RedesignDesktopContextPanel";
import { RedesignDesktopSidebar } from "./RedesignDesktopSidebar";
import { RedesignMobileTopBar } from "./RedesignMobileTopBar";

import "@/styles/redesign-total.frame.css";

export function RedesignAppFrame({
  children,
  activeTab,
  pathname,
  search,
  hash,
  destinationId,
  userLabel,
  viewportState,
  contextPanel,
}: {
  children: ReactNode;
  activeTab: FuturePrimaryTab;
  pathname: string;
  search?: string;
  hash?: string;
  destinationId: string;
  userLabel: string;
  viewportState: NativeViewportState;
  contextPanel?: ReactNode;
}) {
  return (
    <div
      className="rd-app-frame"
      data-vdn-native-shell
      data-vdn-redesign-total
      data-active-primary-tab={activeTab}
      data-keyboard-open={String(viewportState.keyboardOpen)}
      data-orientation={viewportState.orientation}
    >
      <RedesignDesktopSidebar
        activeTab={activeTab}
        pathname={pathname}
        search={search}
        hash={hash}
        userLabel={userLabel}
      />
      <div className="rd-app-frame__column">
        <RedesignMobileTopBar
          activeTab={activeTab}
          destinationId={destinationId}
          userLabel={userLabel}
        />
        <div id={NATIVE_SHELL_MAIN_ID} className="rd-app-frame__main" tabIndex={-1}>
          {children}
        </div>
      </div>
      <RedesignDesktopContextPanel>{contextPanel}</RedesignDesktopContextPanel>
      <RedesignBottomNavigation
        activeTab={activeTab}
        pathname={pathname}
        search={search}
        hash={hash}
      />
    </div>
  );
}
