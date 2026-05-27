import { cn } from "@/lib/utils";

export function CoinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="coin-body" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="coin-rim" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="coin-shine" x1="10" y1="6" x2="22" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Outer rim */}
      <circle cx="16" cy="16" r="15" stroke="url(#coin-rim)" strokeWidth="2.5" fill="url(#coin-body)" />

      {/* Inner ridge ring */}
      <circle cx="16" cy="16" r="12" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" fill="none" />

      {/* Shine highlight */}
      <path d="M8 12c2-4 6-6 10-4" stroke="url(#coin-shine)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Center star / sparkle */}
      <g fill="#fffbea">
        <path d="M16 10.5l.55 2.45L19 13.3l-2.05 1.35.8 2.35-2.75-1.6-2.75 1.6.8-2.35L11 13.3l2.45-1.35L16 10.5z" />
      </g>

      {/* Tiny dotted edge detail (top half) */}
      <g fill="#fef3c7">
        <circle cx="16" cy="3.8" r="0.8" />
        <circle cx="12.5" cy="4.6" r="0.7" />
        <circle cx="19.5" cy="4.6" r="0.7" />
        <circle cx="9.5" cy="6.6" r="0.6" />
        <circle cx="22.5" cy="6.6" r="0.6" />
      </g>
    </svg>
  );
}
