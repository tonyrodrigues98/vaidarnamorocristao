import { useEffect, type RefObject } from "react";
import type { V2ShellOverlay } from "./types";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export type V2OverlayKeyboardAction = "close" | "focus-first" | "focus-last" | "none";

export function resolveV2OverlayState(
  current: V2ShellOverlay,
  requested: Exclude<V2ShellOverlay, null>,
): V2ShellOverlay {
  return current === requested ? null : requested;
}

export function resolveV2OverlayKeyboardAction({
  key,
  shiftKey,
  activeIndex,
  focusableCount,
}: {
  key: string;
  shiftKey: boolean;
  activeIndex: number;
  focusableCount: number;
}): V2OverlayKeyboardAction {
  if (key === "Escape") return "close";
  if (key !== "Tab" || focusableCount <= 0) return "none";
  if (shiftKey && activeIndex <= 0) return "focus-last";
  if (!shiftKey && activeIndex >= focusableCount - 1) return "focus-first";
  return "none";
}

export function useV2OverlayFocus({
  open,
  onClose,
  containerRef,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;
    const ownerDocument = container.ownerDocument;
    const previousFocus = returnFocusRef.current ?? (ownerDocument.activeElement as HTMLElement);

    const focusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => !element.hasAttribute("aria-hidden"),
      );

    const frame =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame(() => {
            const preferred = container.querySelector<HTMLElement>("[data-vdn-v2-autofocus]");
            (preferred ?? focusable()[0] ?? container).focus();
          })
        : undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      const elements = focusable();
      const action = resolveV2OverlayKeyboardAction({
        key: event.key,
        shiftKey: event.shiftKey,
        activeIndex: elements.indexOf(ownerDocument.activeElement as HTMLElement),
        focusableCount: elements.length,
      });

      if (action === "close") {
        event.preventDefault();
        onClose();
      } else if (action === "focus-first") {
        event.preventDefault();
        elements[0]?.focus();
      } else if (action === "focus-last") {
        event.preventDefault();
        elements.at(-1)?.focus();
      }
    };

    ownerDocument.addEventListener("keydown", onKeyDown);
    return () => {
      if (frame !== undefined && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(frame);
      }
      ownerDocument.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [containerRef, onClose, open, returnFocusRef]);
}
