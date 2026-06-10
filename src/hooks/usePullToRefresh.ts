import { useEffect, useRef, useState } from "react";

type Options = {
  onRefresh: () => void | Promise<void>;
  disabled?: boolean;
  threshold?: number;
  max?: number;
};

/**
 * Native-feel pull-to-refresh for mobile PWAs.
 *
 * Listens for touch gestures on the document. Only activates when the page is
 * already scrolled to the top and the user drags down. State updates are
 * batched through requestAnimationFrame to keep the gesture cheap. Desktop
 * (fine pointer) and SSR are bypassed.
 */
export function usePullToRefresh({
  onRefresh,
  disabled,
  threshold = 72,
  max = 110,
}: Options) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const refs = useRef({
    active: false,
    startY: 0,
    pull: 0,
    rafQueued: false,
    refreshing: false,
  });
  refs.current.refreshing = refreshing;

  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia?.("(pointer: coarse)").matches) return;

    const flushPull = (v: number) => {
      refs.current.pull = v;
      if (refs.current.rafQueued) return;
      refs.current.rafQueued = true;
      requestAnimationFrame(() => {
        refs.current.rafQueued = false;
        setPull(refs.current.pull);
      });
    };

    const onStart = (e: TouchEvent) => {
      if (refs.current.refreshing) return;
      if (window.scrollY > 0) {
        refs.current.active = false;
        return;
      }
      refs.current.startY = e.touches[0]?.clientY ?? 0;
      refs.current.active = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!refs.current.active || refs.current.refreshing) return;
      if (window.scrollY > 0) {
        refs.current.active = false;
        flushPull(0);
        return;
      }
      const dy = (e.touches[0]?.clientY ?? 0) - refs.current.startY;
      if (dy <= 0) {
        if (refs.current.pull !== 0) flushPull(0);
        return;
      }
      // Soft resistance — never feels stiff or runs away.
      const dist = Math.min(max, dy * 0.5);
      flushPull(dist);
    };

    const finish = async () => {
      if (!refs.current.active) return;
      refs.current.active = false;
      const dist = refs.current.pull;
      if (dist >= threshold) {
        setRefreshing(true);
        const start = Date.now();
        try {
          await onRefresh();
        } catch {
          // swallow — callers manage their own error surfaces
        }
        const elapsed = Date.now() - start;
        if (elapsed < 250) {
          await new Promise((r) => setTimeout(r, 250 - elapsed));
        }
        setRefreshing(false);
      }
      flushPull(0);
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", finish, { passive: true });
    window.addEventListener("touchcancel", finish, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", finish);
      window.removeEventListener("touchcancel", finish);
    };
  }, [disabled, onRefresh, threshold, max]);

  return {
    pullDistance: pull,
    isPulling: pull > 0 && !refreshing,
    isRefreshing: refreshing,
    threshold,
  };
}