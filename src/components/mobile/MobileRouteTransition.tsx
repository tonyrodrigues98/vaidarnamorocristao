import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { isChatRoute } from "@/lib/layoutVisibility";

type MobileRouteTransitionProps = {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
};

/**
 * Lightweight per-route fade/slide wrapper for the mobile app shell.
 *
 * Uses a CSS animation keyed by pathname so each navigation gently fades in
 * without a white flash. Chat routes are intentionally bypassed to avoid
 * remounting composers, scroll containers and realtime subscriptions.
 * Honors `prefers-reduced-motion` via the global rule in styles.css.
 */
export function MobileRouteTransition({
  children,
  disabled,
  className,
}: MobileRouteTransitionProps) {
  const pathname = useLocation({ select: (s) => s.pathname });

  if (disabled || isChatRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div key={pathname} className={cn("app-route-enter", className)}>
      {children}
    </div>
  );
}