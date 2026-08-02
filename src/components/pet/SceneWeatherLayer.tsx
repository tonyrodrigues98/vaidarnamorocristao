import { useMemo } from "react";
import type { Weather } from "@/lib/expeditionStoryEngine";

type Particle = {
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
  drift: number;
};

function buildParticles(count: number, seed: number): Particle[] {
  // Simple deterministic distribution for visual consistency per mount.
  const arr: Particle[] = [];
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < count; i++) {
    arr.push({
      left: rnd() * 100,
      top: rnd() * 100,
      delay: rnd() * -12,
      duration: 6 + rnd() * 10,
      size: 0.5 + rnd() * 1.5,
      drift: (rnd() - 0.5) * 40,
    });
  }
  return arr;
}

const WEATHER_CONFIG: Record<Weather, { count: number; animation: string; className: string }> = {
  snow: {
    count: 50,
    animation: "scene-fall",
    className: "bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)]",
  },
  dust: {
    count: 40,
    animation: "scene-fall",
    className: "bg-amber-200 rounded-full shadow-[0_0_4px_rgba(255,220,150,0.7)]",
  },
  leaves: {
    count: 30,
    animation: "scene-drift",
    className: "bg-emerald-300 rounded-[40%_60%_60%_40%] shadow-[0_0_4px_rgba(120,255,160,0.5)]",
  },
  light: {
    count: 30,
    animation: "scene-rise",
    className: "bg-amber-100 rounded-full shadow-[0_0_10px_rgba(255,220,150,0.9)]",
  },
  stars: {
    count: 60,
    animation: "scene-twinkle",
    className: "bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,1)]",
  },
  mist: { count: 22, animation: "scene-drift", className: "bg-white/60 rounded-full blur-md" },
  sparks: {
    count: 40,
    animation: "scene-rise",
    className: "bg-orange-300 rounded-full shadow-[0_0_8px_rgba(255,180,80,1)]",
  },
  fireflies: {
    count: 30,
    animation: "scene-twinkle",
    className: "bg-lime-200 rounded-full shadow-[0_0_10px_rgba(190,255,120,1)]",
  },
};

export function SceneWeatherLayer({
  weather,
  densityMul = 1,
}: {
  weather: Weather;
  densityMul?: number;
}) {
  const cfg = WEATHER_CONFIG[weather];
  const count = Math.max(4, Math.round(cfg.count * densityMul));
  const particles = useMemo(
    () => buildParticles(count, weather.length * 137 + count),
    [count, weather],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className={`absolute ${cfg.className}`}
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${Math.max(3, p.size * 5)}px`,
            height: `${Math.max(3, p.size * 5)}px`,
            animation: `${cfg.animation} ${p.duration}s linear ${p.delay}s infinite`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
