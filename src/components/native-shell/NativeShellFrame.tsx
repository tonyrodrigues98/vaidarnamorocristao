import type { CSSProperties, ReactNode } from "react";

import type { FuturePrimaryTab } from "@/config/app-destinations";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

import type { NativeViewportState } from "./useNativeViewportState";

import "@/styles/native-shell.tokens.css";
import "@/styles/native-shell.frame.css";

export const NATIVE_SHELL_MAIN_ID = "vdn-native-shell-main";

export type NativeShellFrameProps = {
  children: ReactNode;
  topBar?: ReactNode;
  primaryNavigation?: ReactNode;
  contextPanel?: ReactNode;
  bottomNavigation?: ReactNode;
  overlayHost?: ReactNode;
  activePrimaryTab?: FuturePrimaryTab;
  viewportState?: NativeViewportState;
  className?: string;
};

type NativeViewportStyle = CSSProperties & {
  "--vdn-native-viewport-width"?: string;
  "--vdn-native-layout-height"?: string;
  "--vdn-native-visual-height"?: string;
  "--vdn-native-keyboard-height"?: string;
};

export function NativeShellFrame({
  children,
  topBar,
  primaryNavigation,
  contextPanel,
  bottomNavigation,
  overlayHost,
  activePrimaryTab,
  viewportState,
  className,
}: NativeShellFrameProps) {
  const { preference, resolvedTheme } = useTheme();
  const viewportStyle: NativeViewportStyle | undefined = viewportState
    ? {
        "--vdn-native-viewport-width": `${viewportState.width}px`,
        "--vdn-native-layout-height": `${viewportState.layoutHeight}px`,
        "--vdn-native-visual-height":
          viewportState.visualHeight > 0 ? `${viewportState.visualHeight}px` : undefined,
        "--vdn-native-keyboard-height": `${viewportState.keyboardHeight}px`,
      }
    : undefined;

  return (
    <div
      className={cn("vdn-native-shell-frame", className)}
      style={viewportStyle}
      data-vdn-native-shell
      data-theme={resolvedTheme}
      data-theme-preference={preference}
      data-reference-status="partially-frozen"
      data-native-shell-version="scaffold-1"
      data-active-primary-tab={activePrimaryTab}
      data-keyboard-open={String(viewportState?.keyboardOpen ?? false)}
      data-orientation={viewportState?.orientation ?? "portrait"}
      data-viewport-compact={String(viewportState?.compact ?? true)}
    >
      {primaryNavigation !== undefined && (
        <nav
          className="vdn-native-shell-frame__primary-navigation"
          aria-label="Navegação principal"
        >
          {primaryNavigation}
        </nav>
      )}
      <div className="vdn-native-shell-frame__content-column">
        {topBar !== undefined && (
          <header className="vdn-native-shell-frame__top-bar">{topBar}</header>
        )}
        <div
          id={NATIVE_SHELL_MAIN_ID}
          className="vdn-native-shell-frame__main"
          data-native-shell-content
          tabIndex={-1}
        >
          {children}
        </div>
      </div>
      {contextPanel !== undefined && (
        <aside className="vdn-native-shell-frame__context-panel" aria-label="Contexto">
          {contextPanel}
        </aside>
      )}
      {bottomNavigation !== undefined && (
        <nav className="vdn-native-shell-frame__bottom-navigation" aria-label="Navegação inferior">
          {bottomNavigation}
        </nav>
      )}
      {overlayHost !== undefined && (
        <div className="vdn-native-shell-frame__overlay-host">{overlayHost}</div>
      )}
    </div>
  );
}
