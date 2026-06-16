import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MobileAppHeaderProps = {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  className?: string;
};

/**
 * Contextual mobile top bar for app-style screens. Replaces the global
 * marketing header on functional pages so they feel like a native app.
 * Renders only on mobile; on desktop the global Header continues to handle
 * navigation.
 */
export function MobileAppHeader({
  title,
  subtitle,
  rightAction,
  showBack,
  onBack,
  className,
}: MobileAppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex w-full shrink-0 items-center gap-3 border-b border-border/60 bg-background px-4 pt-[env(safe-area-inset-top)] pb-3 md:hidden",
        className,
      )}
    >
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="tap -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition hover:bg-muted active:bg-muted/80"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[17px] font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-[12px] leading-snug text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {rightAction && <div className="flex shrink-0 items-center gap-1.5">{rightAction}</div>}
    </header>
  );
}