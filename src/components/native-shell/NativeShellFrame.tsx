import type { ReactNode } from "react";

import type { FuturePrimaryTab } from "@/config/app-destinations";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

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
  keyboardOpen?: boolean;
  className?: string;
};

export function NativeShellFrame({
  children,
  topBar,
  primaryNavigation,
  contextPanel,
  bottomNavigation,
  overlayHost,
  activePrimaryTab,
  keyboardOpen = false,
  className,
}: NativeShellFrameProps) {
  const { preference, resolvedTheme } = useTheme();

  return (
    <div
      className={cn("vdn-native-shell-frame", className)}
      data-vdn-native-shell
      data-theme={resolvedTheme}
      data-theme-preference={preference}
      data-reference-status="partially-frozen"
      data-native-shell-version="scaffold-1"
      data-active-primary-tab={activePrimaryTab}
      data-keyboard-open={String(keyboardOpen)}
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
