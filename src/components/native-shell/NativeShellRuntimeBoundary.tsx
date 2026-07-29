import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";

import { MobileAppShell } from "@/components/mobile/MobileAppShell";
import { getDestinationBehavior, getFuturePrimaryTab } from "@/config/app-destinations";
import {
  isNativeEditableTarget,
  resolveNativeKeyboardVisibility,
} from "@/config/native-primary-navigation";
import { nativeShellFeatureEnabled, shouldRenderNativeShell } from "@/config/native-shell-feature";
import { useAuth } from "@/lib/auth";

import { NativeShellFrame } from "./NativeShellFrame";
import { NativeBottomNavigation } from "./NativeBottomNavigation";

export type NativeShellRuntimeBoundaryProps = {
  children: ReactNode;
};

function useNativeKeyboardVisibility(enabled: boolean) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setKeyboardOpen(false);
      return;
    }

    const viewport = window.visualViewport;
    const evaluate = (target: EventTarget | null = document.activeElement) => {
      const element = target instanceof HTMLElement ? target : null;
      setKeyboardOpen(
        resolveNativeKeyboardVisibility({
          enabled,
          viewportWidth: viewport?.width ?? window.innerWidth,
          layoutHeight: window.innerHeight,
          visualHeight: viewport?.height,
          editableFocused: isNativeEditableTarget({
            tagName: element?.tagName,
            isContentEditable: element?.isContentEditable,
          }),
        }),
      );
    };
    const onFocusIn = (event: FocusEvent) => evaluate(event.target);
    const onFocusOut = () => {
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
      animationFrame.current = requestAnimationFrame(() => evaluate());
    };
    const onViewportChange = () => evaluate();

    evaluate();
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    viewport?.addEventListener("resize", onViewportChange);
    viewport?.addEventListener("scroll", onViewportChange);
    window.addEventListener("resize", onViewportChange);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      viewport?.removeEventListener("resize", onViewportChange);
      viewport?.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    };
  }, [enabled]);

  return keyboardOpen;
}

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

  const keyboardOpen = useNativeKeyboardVisibility(useNativeShell);

  if (useNativeShell && activeTab) {
    return (
      <NativeShellFrame
        activePrimaryTab={activeTab}
        keyboardOpen={keyboardOpen}
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
    );
  }

  return <MobileAppShell>{children}</MobileAppShell>;
}
