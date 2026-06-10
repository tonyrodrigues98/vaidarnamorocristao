import { Loader2, RotateCw } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  pullDistance: number;
  isPulling: boolean;
  isRefreshing: boolean;
  threshold?: number;
  className?: string;
};

/**
 * Small floating chip that mirrors a native pull-to-refresh affordance.
 * Sits below the mobile app header, never covers it or the bottom nav.
 */
export function PullToRefreshIndicator({
  pullDistance,
  isPulling,
  isRefreshing,
  threshold = 72,
  className,
}: Props) {
  const visible = isRefreshing || pullDistance > 4;
  const ready = pullDistance >= threshold;
  const progress = Math.min(1, pullDistance / threshold);
  const translate = isRefreshing ? 18 : Math.min(28, pullDistance * 0.35);
  const opacity = isRefreshing ? 1 : Math.max(0, Math.min(1, progress));

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "pointer-events-none fixed inset-x-0 z-30 flex justify-center md:hidden",
        className,
      )}
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 56px)",
      }}
    >
      <div
        className="flex items-center gap-2 rounded-full border border-border/60 bg-card/95 px-3 py-1.5 text-[12px] font-medium text-foreground/80 shadow-sm backdrop-blur"
        style={{
          transform: `translateY(${translate}px)`,
          opacity,
          transition: isPulling ? "none" : "opacity 200ms ease, transform 200ms ease",
        }}
      >
        {isRefreshing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--rose)]" />
        ) : (
          <RotateCw
            className="h-3.5 w-3.5 text-[var(--rose)] transition-transform"
            style={{ transform: `rotate(${progress * 180}deg)` }}
          />
        )}
        <span>
          {isRefreshing ? "Atualizando..." : ready ? "Solte para atualizar" : "Puxe para atualizar"}
        </span>
      </div>
    </div>
  );
}