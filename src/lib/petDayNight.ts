import { useEffect, useState } from "react";

const TZ = "America/Sao_Paulo";

// Day = 06:00–17:59, Night = 18:00–05:59 in São Paulo time, with a 30-min
// crossfade window centered on 06:00 and 18:00 (i.e. 05:45→06:15 and 17:45→18:15).
const FADE_MIN = 30;

function getSPHourMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + (h === 24 ? 0 : m);
}

export type DayNightState = { dayOpacity: number; phase: "day" | "night" };

export function getPetDayNightState(now: Date = new Date()): DayNightState {
  const minutes = getSPHourMinutes(now);
  const sunrise = 6 * 60; // 06:00
  const sunset = 18 * 60; // 18:00
  const half = FADE_MIN / 2;

  // Sunrise window: opacity 0 -> 1
  if (minutes >= sunrise - half && minutes <= sunrise + half) {
    const t = (minutes - (sunrise - half)) / FADE_MIN;
    return { dayOpacity: clamp(t), phase: t >= 0.5 ? "day" : "night" };
  }
  // Sunset window: opacity 1 -> 0
  if (minutes >= sunset - half && minutes <= sunset + half) {
    const t = (minutes - (sunset - half)) / FADE_MIN;
    return { dayOpacity: clamp(1 - t), phase: t >= 0.5 ? "night" : "day" };
  }
  if (minutes > sunrise + half && minutes < sunset - half) {
    return { dayOpacity: 1, phase: "day" };
  }
  return { dayOpacity: 0, phase: "night" };
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function usePetDayNight(): DayNightState {
  const [state, setState] = useState<DayNightState>(() => getPetDayNightState());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function tick() {
      const next = getPetDayNightState();
      setState(next);
      // Re-render faster inside transition windows (opacity strictly between 0 and 1).
      const inFade = next.dayOpacity > 0 && next.dayOpacity < 1;
      timer = setTimeout(tick, inFade ? 15_000 : 60_000);
    }
    tick();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);
  return state;
}
