import { useRef, useCallback, useState } from "react";

export function useLongPress(onLongPress: () => void, delay = 450) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggered = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const [pressing, setPressing] = useState(false);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setPressing(false);
  }, []);

  const start = useCallback(
    (e: React.TouchEvent | React.PointerEvent) => {
      // Only trigger long-press for touch input
      const isTouch =
        ("touches" in e) ||
        ((e as React.PointerEvent).pointerType === "touch");
      if (!isTouch) return;
      triggered.current = false;
      const point =
        "touches" in e
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
          : { x: (e as React.PointerEvent).clientX, y: (e as React.PointerEvent).clientY };
      startPos.current = point;
      clear();
      setPressing(true);
      timer.current = setTimeout(() => {
        triggered.current = true;
        setPressing(false);
        // Haptic feedback on supported devices
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try { navigator.vibrate?.(30); } catch { /* noop */ }
        }
        onLongPress();
      }, delay);
    },
    [onLongPress, delay, clear]
  );

  const move = useCallback(
    (e: React.TouchEvent | React.PointerEvent) => {
      if (!startPos.current) return;
      const point =
        "touches" in e
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
          : { x: (e as React.PointerEvent).clientX, y: (e as React.PointerEvent).clientY };
      const dx = point.x - startPos.current.x;
      const dy = point.y - startPos.current.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) clear();
    },
    [clear]
  );

  const end = useCallback(() => {
    clear();
    startPos.current = null;
  }, [clear]);

  return {
    pressing,
    handlers: {
      onTouchStart: start,
      onTouchMove: move,
      onTouchEnd: end,
      onTouchCancel: end,
      onContextMenu: (e: React.MouseEvent) => {
        if (triggered.current) e.preventDefault();
      },
    },
  };
}