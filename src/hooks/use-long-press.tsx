import { useRef, useCallback, useState } from "react";

/**
 * Long-press for touch AND mouse, with right-click also triggering the menu.
 * Works on mobile (touch) and desktop (hold left-click ~450ms or right-click).
 */
export function useLongPress(onLongPress: () => void, delay = 450) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggered = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const [pressing, setPressing] = useState(false);

  const fire = useCallback(() => {
    triggered.current = true;
    setPressing(false);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { (navigator as Navigator).vibrate?.(30); } catch { /* noop */ }
    }
    onLongPress();
  }, [onLongPress]);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setPressing(false);
  }, []);

  const startTouch = useCallback(
    (e: React.TouchEvent) => {
      triggered.current = false;
      startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      clear();
      setPressing(true);
      timer.current = setTimeout(fire, delay);
    },
    [delay, clear, fire]
  );

  const moveTouch = useCallback(
    (e: React.TouchEvent) => {
      if (!startPos.current) return;
      const dx = e.touches[0].clientX - startPos.current.x;
      const dy = e.touches[0].clientY - startPos.current.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) clear();
    },
    [clear]
  );

  const endTouch = useCallback(() => {
    clear();
    startPos.current = null;
  }, [clear]);

  const startMouse = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // only left button
      triggered.current = false;
      startPos.current = { x: e.clientX, y: e.clientY };
      clear();
      setPressing(true);
      timer.current = setTimeout(fire, delay);
    },
    [delay, clear, fire]
  );

  const moveMouse = useCallback(
    (e: React.MouseEvent) => {
      if (!startPos.current) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) clear();
    },
    [clear]
  );

  const endMouse = useCallback(() => {
    clear();
    startPos.current = null;
  }, [clear]);

  return {
    pressing,
    handlers: {
      onTouchStart: startTouch,
      onTouchMove: moveTouch,
      onTouchEnd: endTouch,
      onTouchCancel: endTouch,
      onMouseDown: startMouse,
      onMouseMove: moveMouse,
      onMouseUp: endMouse,
      onMouseLeave: endMouse,
      onContextMenu: (e: React.MouseEvent) => {
        // Right-click → open the menu instead of native context menu
        e.preventDefault();
        clear();
        fire();
      },
    },
  };
}