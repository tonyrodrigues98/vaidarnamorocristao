import { WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  message?: string;
  className?: string;
};

/**
 * Discreet inline notice for pages that are showing cached/previously loaded
 * data while the device is offline. Render conditionally — only when offline
 * AND there is cached data on screen. For empty offline states use
 * `OfflineState` instead.
 */
export function StaleDataNotice({
  message = "Você está offline. Mostrando informações carregadas anteriormente.",
  className,
}: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-900 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/60 dark:text-amber-100",
        className,
      )}
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="leading-snug">{message}</span>
    </div>
  );
}