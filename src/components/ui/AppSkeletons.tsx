import { cn } from "@/lib/utils";

/**
 * Premium skeleton primitives + page-level compositions.
 *
 * Goal: avoid white flashes on first paint, give the app a native feel.
 * Rules:
 *  - leve, sem libs externas;
 *  - respeita prefers-reduced-motion (via .app-skeleton no styles.css);
 *  - tamanhos próximos aos componentes reais (evita layout shift);
 *  - usa cn() para permitir override por className.
 *
 * Use os componentes de página apenas no PRIMEIRO carregamento;
 * nunca durante refetch quando já há dados na tela.
 */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("app-skeleton app-skeleton-shimmer rounded-xl", className)} {...props} />
  );
}

export function SkeletonCircle({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn("app-skeleton app-skeleton-shimmer rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonLine({
  width = "100%",
  className,
}: {
  width?: string | number;
  className?: string;
}) {
  return (
    <div
      className={cn("app-skeleton app-skeleton-shimmer h-3 rounded-full", className)}
      style={{ width }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Page compositions                                                          */
/* -------------------------------------------------------------------------- */

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-4 py-4">
      <Skeleton className="h-32 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

export function ConversationListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-11 w-full" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="app-skeleton-card flex items-center gap-3 rounded-2xl border border-border/40 bg-card/70 p-3.5"
          >
            <SkeletonCircle size={44} />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine width="45%" />
              <SkeletonLine width="80%" className="h-2.5" />
            </div>
            <SkeletonLine width={42} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatSkeleton({ bubbles = 8 }: { bubbles?: number }) {
  // pseudo-random but deterministic widths
  const widths = [62, 48, 75, 40, 68, 55, 80, 45, 70, 50, 60, 72];
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 space-y-3 overflow-hidden px-4 py-4">
        {Array.from({ length: bubbles }).map((_, i) => {
          const mine = i % 2 === 1;
          const w = widths[i % widths.length];
          return (
            <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className="app-skeleton app-skeleton-shimmer h-10 rounded-2xl"
                style={{ width: `${w}%`, maxWidth: 320 }}
              />
            </div>
          );
        })}
      </div>
      <div className="border-t border-border/50 p-3">
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </div>
  );
}

export function PretendentesSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="app-skeleton-card overflow-hidden rounded-3xl border border-border/60 bg-card/70"
          >
            <div className="app-skeleton app-skeleton-shimmer aspect-[4/5] w-full" />
            <div className="space-y-2 p-4">
              <SkeletonLine width="60%" className="h-3.5" />
              <SkeletonLine width="40%" className="h-2.5" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 w-full rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-[4/5] w-full rounded-[2rem]" />
      <div className="space-y-3">
        <SkeletonLine width="60%" className="h-5" />
        <SkeletonLine width="40%" />
        <SkeletonLine width="35%" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function ShopSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div className="space-y-5">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="app-skeleton-card space-y-3 rounded-2xl border border-border/50 bg-card/60 p-3"
          >
            <Skeleton className="aspect-square w-full rounded-xl" />
            <SkeletonLine width="80%" className="h-2.5" />
            <SkeletonLine width="50%" className="h-2.5" />
            <Skeleton className="h-8 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedContentSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="app-skeleton-card space-y-3 rounded-2xl border border-border/50 bg-card/70 p-4"
        >
          <div className="flex items-center gap-3">
            <SkeletonCircle size={36} />
            <div className="flex-1 space-y-2">
              <SkeletonLine width="35%" className="h-2.5" />
              <SkeletonLine width="20%" className="h-2" />
            </div>
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
          <SkeletonLine width="95%" />
          <SkeletonLine width="80%" />
        </div>
      ))}
    </div>
  );
}

export function NotificationSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="app-skeleton-card flex items-center gap-3 rounded-2xl border border-border/40 bg-card/70 p-3.5"
        >
          <SkeletonCircle size={36} />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine width="70%" />
            <SkeletonLine width="40%" className="h-2.5" />
          </div>
          <SkeletonLine width={36} className="h-2" />
        </li>
      ))}
    </ul>
  );
}
