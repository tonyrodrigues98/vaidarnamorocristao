import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";

/**
 * Discreet global banner that reacts to network state.
 *  - Offline: stays visible with an amber/coral tone until the connection
 *    is back. Never blocks taps.
 *  - Online after offline: shows a short success message for ~2.4s.
 *
 * Positioned at the top with safe-area padding. Pointer-events are off so
 * it never blocks the composer/input below it.
 */
export function NetworkStatusBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (!isOnline || !wasOffline) return;
    setShowRestored(true);
    const t = window.setTimeout(() => setShowRestored(false), 2400);
    return () => window.clearTimeout(t);
  }, [isOnline, wasOffline]);

  const visible = !isOnline || showRestored;
  if (!visible) return null;

  const offline = !isOnline;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
    >
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur app-network-banner ${
          offline
            ? "border-amber-200/70 bg-amber-50/95 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/80 dark:text-amber-100"
            : "border-emerald-200/70 bg-emerald-50/95 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/80 dark:text-emerald-100"
        }`}
      >
        {offline ? (
          <>
            <WifiOff className="h-3.5 w-3.5" />
            <span>Você está offline. Algumas ações podem aguardar conexão.</span>
          </>
        ) : (
          <>
            <Wifi className="h-3.5 w-3.5" />
            <span>Conexão restaurada.</span>
          </>
        )}
      </div>
    </div>
  );
}
