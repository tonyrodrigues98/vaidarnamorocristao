import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTo?: string;
  secondaryActionLabel?: string;
  secondaryActionTo?: string;
  compact?: boolean;
  className?: string;
};

/**
 * Reusable, premium empty state used across pages.
 * Visual: off-white card, rose/coral icon chip, accessible buttons.
 * Keep the surface free of fake data — only real, optional actions.
 */
export function AppEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionTo,
  secondaryActionLabel,
  secondaryActionTo,
  compact,
  className,
}: Props) {
  const hasPrimary = !!actionLabel && (!!onAction || !!actionTo);
  const hasSecondary = !!secondaryActionLabel && !!secondaryActionTo;

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col items-center justify-center rounded-3xl border border-border/50 bg-card/75 text-center shadow-sm backdrop-blur",
        compact ? "max-w-sm gap-2 p-6" : "max-w-md gap-3 p-8 sm:p-10",
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--rose)]/15 to-[var(--coral)]/15 text-[var(--rose)] dark:from-[var(--rose)]/20 dark:to-[var(--coral)]/20"
        >
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground sm:text-lg">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {(hasPrimary || hasSecondary) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {hasPrimary &&
            (actionTo ? (
              <Button
                asChild
                size="sm"
                className="app-pressable rounded-full"
              >
                <Link to={actionTo}>{actionLabel}</Link>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={onAction}
                className="app-pressable rounded-full"
              >
                {actionLabel}
              </Button>
            ))}
          {hasSecondary && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="app-pressable rounded-full"
            >
              <Link to={secondaryActionTo!}>{secondaryActionLabel}</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}