import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  className?: string;
};

/**
 * Reusable empty-state for pages that cannot load data without internet.
 * Use only when there is NO cached data to show — otherwise keep the
 * cached UI visible and let `NetworkStatusBanner` communicate the state.
 */
export function OfflineState({
  title = "Sem conexão no momento",
  description = "Você ainda pode visualizar o que já foi carregado. Assim que a internet voltar, atualizaremos tudo.",
  actionLabel,
  onAction,
  compact,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col items-center justify-center rounded-3xl border border-border/50 bg-card/70 text-center shadow-sm",
        compact ? "max-w-sm gap-2 p-6" : "max-w-md gap-3 p-10",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
        <WifiOff className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAction}
          className="mt-2 rounded-full"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
