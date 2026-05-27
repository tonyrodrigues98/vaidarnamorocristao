import { useEffect, useState } from "react";
import { getPeriod, getAtmosMode, type Period, type AtmosMode } from "@/lib/timeOfDay";

/**
 * Sets data-period and data-atmos on <html> globally.
 * Recalculates every 60s. SSR-safe (only runs in effect).
 */
export function useTimeOfDay() {
  const [period, setPeriod] = useState<Period>("afternoon");
  const [mode, setMode] = useState<AtmosMode>("on");

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const p = getPeriod();
      const m = getAtmosMode();
      setPeriod(p);
      setMode(m);
      root.setAttribute("data-period", p);
      root.setAttribute("data-atmos", m);
    };

    apply();
    const id = window.setInterval(apply, 60_000);

    const onModeChange = () => apply();
    window.addEventListener("atmos-mode-change", onModeChange);
    window.addEventListener("storage", onModeChange);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("atmos-mode-change", onModeChange);
      window.removeEventListener("storage", onModeChange);
    };
  }, []);

  return { period, mode };
}

/**
 * Local read of current period for components that need to render
 * period-specific visuals (e.g. celestial icon, particles).
 * Returns null on first SSR render to avoid hydration mismatch.
 */
export function useCurrentPeriod(): Period | null {
  const [period, setPeriod] = useState<Period | null>(null);
  useEffect(() => {
    setPeriod(getPeriod());
    const id = window.setInterval(() => setPeriod(getPeriod()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return period;
}