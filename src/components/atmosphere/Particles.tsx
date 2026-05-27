import { useCurrentPeriod } from "@/hooks/useTimeOfDay";

type Props = {
  /** number of particles to render (afternoon usually 0) */
  density?: number;
};

/**
 * Sparse ambient particles. CSS-driven (transform + opacity only).
 * Skipped entirely on afternoon (visual silence).
 */
export function Particles({ density }: Props = {}) {
  const period = useCurrentPeriod();
  if (!period) return null;
  if (period === "afternoon") return null;

  const defaults: Record<string, number> = {
    morning: 8,
    afternoon: 0,
    evening: 10,
    night: 14,
  };
  const n = density ?? defaults[period] ?? 8;
  const isStar = period === "night";

  // Deterministic pseudo-random positions (no JS randomness per render)
  const positions = [
    { top: "10%", left: "78%", size: 3, delay: "0s",   dur: "4s"  },
    { top: "18%", left: "88%", size: 2, delay: "1.2s", dur: "5s"  },
    { top: "28%", left: "70%", size: 4, delay: "0.4s", dur: "4.5s" },
    { top: "8%",  left: "60%", size: 2, delay: "2.0s", dur: "5.5s" },
    { top: "22%", left: "48%", size: 3, delay: "0.8s", dur: "4.2s" },
    { top: "38%", left: "82%", size: 2, delay: "3.0s", dur: "4.8s" },
    { top: "48%", left: "92%", size: 3, delay: "1.6s", dur: "5.2s" },
    { top: "62%", left: "85%", size: 2, delay: "2.4s", dur: "4.6s" },
    { top: "72%", left: "65%", size: 3, delay: "0.6s", dur: "5.1s" },
    { top: "84%", left: "80%", size: 2, delay: "3.6s", dur: "4.3s" },
    { top: "55%", left: "55%", size: 2, delay: "1.8s", dur: "5.6s" },
    { top: "40%", left: "30%", size: 2, delay: "2.8s", dur: "4.9s" },
    { top: "68%", left: "20%", size: 3, delay: "0.2s", dur: "5.3s" },
    { top: "30%", left: "15%", size: 2, delay: "3.2s", dur: "4.7s" },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {positions.slice(0, n).map((p, i) => (
        <span
          key={i}
          className={`atmos-particle ${isStar ? "atmos-star" : ""}`}
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: p.delay,
            animationDuration: p.dur,
          }}
        />
      ))}
    </div>
  );
}