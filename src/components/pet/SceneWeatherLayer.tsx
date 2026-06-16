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

const WEATHER_CONFIG: Record<
  Weather,
  { count: number; animation: string; className: string }
> = {
  snow: { count: 28, animation: "scene-fall", className: "bg-white/85 rounded-full shadow-[0_0_6px_rgba(255,255,255,0.6)]" },
  dust: { count: 22, animation: "scene-fall", className: "bg-amber-200/70 rounded-full" },
  leaves: { count: 18, animation: "scene-drift", className: "bg-emerald-300/70 rounded-[40%_60%_60%_40%]" },
  light: { count: 16, animation: "scene-rise", className: "bg-amber-100/80 rounded-full shadow-[0_0_8px_rgba(255,220,150,0.7)]" },
  stars: { count: 30, animation: "scene-twinkle", className: "bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.9)]" },
  mist: { count: 14, animation: "scene-drift", className: "bg-white/30 rounded-full blur-md" },
  sparks: { count: 24, animation: "scene-rise", className: "bg-orange-300/90 rounded-full shadow-[0_0_6px_rgba(255,180,80,0.9)]" },
  fireflies: { count: 18, animation: "scene-twinkle", className: "bg-lime-200/90 rounded-full shadow-[0_0_8px_rgba(190,255,120,0.9)]" },
};

export function SceneWeatherLayer({ weather }: { weather: Weather }) {
  const cfg = WEATHER_CONFIG[weather];
  const particles = useMemo(() => buildParticles(cfg.count, weather.length * 137), [cfg.count, weather]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className={`absolute ${cfg.className}`}
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size * 4}px`,
            height: `${p.size * 4}px`,
            animation: `${cfg.animation} ${p.duration}s linear ${p.delay}s infinite`,
            // CSS var consumed by keyframes
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}