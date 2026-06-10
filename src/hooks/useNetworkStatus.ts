import { useEffect, useState } from "react";

export type NetworkStatus = {
  isOnline: boolean;
  wasOffline: boolean;
  wentOnlineAt: number | null;
  wentOfflineAt: number | null;
};

function readOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

/**
 * Tracks `navigator.onLine` with proper event cleanup.
 * `wasOffline` flips true the first time we detect an offline event, so
 * consumers can show a "connection restored" message only when relevant.
 */
export function useNetworkStatus(): NetworkStatus {
  const [state, setState] = useState<NetworkStatus>(() => ({
    isOnline: readOnline(),
    wasOffline: false,
    wentOnlineAt: null,
    wentOfflineAt: null,
  }));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () =>
      setState((s) => ({
        ...s,
        isOnline: true,
        wentOnlineAt: Date.now(),
      }));
    const onOffline = () =>
      setState((s) => ({
        ...s,
        isOnline: false,
        wasOffline: true,
        wentOfflineAt: Date.now(),
      }));
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    // sync once on mount in case the value changed during SSR/hydration
    setState((s) => (s.isOnline === readOnline() ? s : { ...s, isOnline: readOnline() }));
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return state;
}