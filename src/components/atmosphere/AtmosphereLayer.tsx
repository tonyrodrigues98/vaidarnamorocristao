import { useEffect, useState } from "react";
import { getAtmosMode, prefersReducedMotion, type AtmosMode } from "@/lib/timeOfDay";
import { Particles } from "./Particles";
import { CelestialIcon } from "./CelestialIcon";

type Intensity = "low" | "medium" | "high";

type Props = {
  intensity?: Intensity;
  /** show CelestialIcon in top-right corner (only valid for high intensity) */
  showCelestial?: boolean;
  className?: string;
};

/**
 * Decorative ambient layer. Mounts inside a relative parent.
 * - low: overlay tint only
 * - medium: overlay + particles
 * - high: overlay + particles + celestial icon
 *
 * Always pointer-events: none, aria-hidden.
 */
export function AtmosphereLayer({
  intensity = "medium",
  showCelestial,
  className = "",
}: Props) {
  const [mode, setMode] = useState<AtmosMode>("on");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setMode(getAtmosMode());
    setReduced(prefersReducedMotion());
    const onChange = () => setMode(getAtmosMode());
    window.addEventListener("atmos-mode-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("atmos-mode-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  if (mode === "off") return null;

  const animationsAllowed = mode === "on" && !reduced;
  const wantsCelestial = (showCelestial ?? intensity === "high") && animationsAllowed;
  const wantsParticles =
    animationsAllowed && (intensity === "high" || intensity === "medium");

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{
        background: "var(--atmos-overlay)",
        transition: "background 60s ease",
      }}
    >
      {wantsParticles && <Particles />}
      {wantsCelestial && (
        <div className="absolute top-6 right-6 sm:top-8 sm:right-10 opacity-90">
          <CelestialIcon size={72} />
        </div>
      )}
    </div>
  );
}