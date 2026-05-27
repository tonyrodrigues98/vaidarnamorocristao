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
    morning: 3,
    evening: 4,
    night: 5,
  };
  const n = density ?? defaults[period] ?? 4;
  const isStar = period === "night";

  // Deterministic pseudo-random positions (no JS randomness per render)
  const positions = [
    { top: "12%", left: "82%", size: 4, delay: "0s",   dur: "9s"  },
    { top: "68%", left: "18%", size: 3, delay: "2.4s", dur: "11s" },
    { top: "32%", left: "8%",  size: 5, delay: "1.1s", dur: "10s" },
    { top: "78%", left: "72%", size: 3, delay: "3.6s", dur: "12s" },
    { top: "22%", left: "62%", size: 4, delay: "0.8s", dur: "9.5s" },
    { top: "50%", left: "90%", size: 3, delay: "4.2s", dur: "10.5s" },
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