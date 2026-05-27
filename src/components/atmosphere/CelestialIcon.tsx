import { useCurrentPeriod } from "@/hooks/useTimeOfDay";

type Props = {
  className?: string;
  size?: number;
};

/**
 * Minimal inline SVG that morphs across periods.
 * Style matches the moon/stars already present in the /inicio mock.
 */
export function CelestialIcon({ className, size = 64 }: Props) {
  const period = useCurrentPeriod();
  if (!period) return null;

  const color = "var(--atmos-celestial)";
  const dim = size;

  if (period === "morning") {
    // Low sun + soft rays
    return (
      <svg width={dim} height={dim} viewBox="0 0 80 80" className={className} aria-hidden>
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="55%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="60%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="40" cy="44" r="32" fill="url(#sunGlow)" />
        <circle cx="40" cy="44" r="14" fill={color} />
      </svg>
    );
  }

  if (period === "afternoon") {
    // High sun, clean
    return (
      <svg width={dim} height={dim} viewBox="0 0 80 80" className={className} aria-hidden>
        <defs>
          <radialGradient id="sunGlow2" cx="50%" cy="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.85" />
            <stop offset="70%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="40" cy="36" r="30" fill="url(#sunGlow2)" />
        <circle cx="40" cy="36" r="12" fill={color} />
      </svg>
    );
  }

  if (period === "evening") {
    // Full moon, warm
    return (
      <svg width={dim} height={dim} viewBox="0 0 80 80" className={className} aria-hidden>
        <defs>
          <radialGradient id="moonGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="40" cy="40" r="32" fill="url(#moonGlow)" />
        <circle cx="40" cy="40" r="16" fill={color} opacity="0.95" />
      </svg>
    );
  }

  // night / madrugada — crescent moon (matches existing /inicio visual)
  return (
    <svg width={dim} height={dim} viewBox="0 0 80 80" className={className} aria-hidden>
      <defs>
        <radialGradient id="cresGlow" cx="45%" cy="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="60%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <mask id="cresMask">
          <rect width="80" height="80" fill="white" />
          <circle cx="50" cy="34" r="19" fill="black" />
        </mask>
        <radialGradient id="cresBody" cx="40%" cy="45%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.92" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill="url(#cresGlow)" />
      <circle cx="40" cy="40" r="22" fill="url(#cresBody)" mask="url(#cresMask)" />
    </svg>
  );
}