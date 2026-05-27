export type Period = "morning" | "afternoon" | "evening" | "night";

export function getPeriod(date: Date = new Date()): Period {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 24) return "evening";
  return "night"; // 0–4 madrugada
}

export type AtmosMode = "on" | "colors-only" | "off";

export function getAtmosMode(): AtmosMode {
  if (typeof window === "undefined") return "on";
  const v = window.localStorage.getItem("atmos-mode");
  if (v === "on" || v === "colors-only" || v === "off") return v;
  return "on";
}

export function setAtmosMode(mode: AtmosMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("atmos-mode", mode);
  window.dispatchEvent(new CustomEvent("atmos-mode-change", { detail: mode }));
}

export function getPeriodOverride(): Period | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem("atmos-period-override");
  if (v === "morning" || v === "afternoon" || v === "evening" || v === "night") return v;
  return null;
}

export function setPeriodOverride(period: Period | null) {
  if (typeof window === "undefined") return;
  if (period === null) {
    window.localStorage.removeItem("atmos-period-override");
  } else {
    window.localStorage.setItem("atmos-period-override", period);
  }
  window.dispatchEvent(new CustomEvent("atmos-period-change", { detail: period }));
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}