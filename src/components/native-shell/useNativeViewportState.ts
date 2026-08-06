import { useEffect, useState } from "react";

import {
  isNativeEditableTarget,
  resolveNativeKeyboardVisibility,
} from "@/config/native-primary-navigation";

export type NativeViewportState = {
  width: number;
  layoutHeight: number;
  visualHeight: number;
  keyboardHeight: number;
  keyboardOpen: boolean;
  orientation: "portrait" | "landscape";
  compact: boolean;
};

const compactBreakpoint = 768;

export type NativeViewportMeasurement = {
  enabled: boolean;
  width: number;
  layoutHeight: number;
  visualHeight?: number;
  editableFocused: boolean;
};

export const nativeViewportSsrFallback: NativeViewportState = {
  width: 0,
  layoutHeight: 0,
  visualHeight: 0,
  keyboardHeight: 0,
  keyboardOpen: false,
  orientation: "portrait",
  compact: true,
};

function finiteNonNegative(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, value ?? 0) : 0;
}

export function createNativeViewportState({
  enabled,
  width: rawWidth,
  layoutHeight: rawLayoutHeight,
  visualHeight: rawVisualHeight,
  editableFocused,
}: NativeViewportMeasurement): NativeViewportState {
  if (!enabled) return nativeViewportSsrFallback;

  const width = finiteNonNegative(rawWidth);
  const layoutHeight = finiteNonNegative(rawLayoutHeight);
  const visualHeight = finiteNonNegative(rawVisualHeight ?? layoutHeight);
  const keyboardHeight = Math.max(0, layoutHeight - visualHeight);
  const compact = width < compactBreakpoint;

  return {
    width,
    layoutHeight,
    visualHeight,
    keyboardHeight,
    keyboardOpen: resolveNativeKeyboardVisibility({
      enabled,
      viewportWidth: width,
      layoutHeight,
      visualHeight,
      editableFocused,
    }),
    orientation: width > layoutHeight ? "landscape" : "portrait",
    compact,
  };
}

function readNativeViewportState(
  enabled: boolean,
  target: EventTarget | null = typeof document === "undefined" ? null : document.activeElement,
): NativeViewportState {
  if (!enabled || typeof window === "undefined") return nativeViewportSsrFallback;

  const viewport = window.visualViewport;
  const element = target instanceof HTMLElement ? target : null;
  return createNativeViewportState({
    enabled,
    width: viewport?.width ?? window.innerWidth,
    layoutHeight: window.innerHeight,
    visualHeight: viewport?.height,
    editableFocused: isNativeEditableTarget({
      tagName: element?.tagName,
      isContentEditable: element?.isContentEditable,
    }),
  });
}

export function useNativeViewportState(enabled: boolean): NativeViewportState {
  const [state, setState] = useState<NativeViewportState>(() => readNativeViewportState(enabled));

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setState(nativeViewportSsrFallback);
      return;
    }

    const viewport = window.visualViewport;
    let animationFrame: number | null = null;
    const evaluate = (target: EventTarget | null = document.activeElement) => {
      setState(readNativeViewportState(true, target));
    };
    const onFocusIn = (event: FocusEvent) => evaluate(event.target);
    const onFocusOut = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        evaluate();
      });
    };
    const onViewportChange = () => evaluate();

    evaluate();
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    viewport?.addEventListener("resize", onViewportChange);
    viewport?.addEventListener("scroll", onViewportChange);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("orientationchange", onViewportChange);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      viewport?.removeEventListener("resize", onViewportChange);
      viewport?.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("orientationchange", onViewportChange);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [enabled]);

  return state;
}
