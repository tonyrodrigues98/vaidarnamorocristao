import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Posição em % do container (0-100) */
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  onClick: () => void;
  /** Intensidade do glow ambiente (0 = nenhum, 1 = pulse forte de atenção). */
  attention?: 0 | 1 | 2;
  children?: ReactNode;
};

/**
 * Hotspot de região do mapa. Diferente do RoomHotspot do Quarto Vivo,
 * tem 3 níveis de glow (none / ambient / urgent) — a paisagem inteira
 * "respira" pra contar o que precisa de atenção sem texto.
 */
export function RegionHotspot({
  x,
  y,
  width,
  height,
  label,
  onClick,
  attention = 1,
  children,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "group absolute z-20 flex items-center justify-center rounded-[40%] outline-none",
        "transition-transform duration-300 ease-out hover:scale-[1.06] active:scale-95",
        "focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:ring-offset-0",
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
    >
      {attention > 0 ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[40%] motion-reduce:animate-none"
          style={{
            animation: `region-glow ${attention === 2 ? "2.4s" : "4.5s"} ease-in-out infinite`,
            opacity: attention === 2 ? 1 : 0.55,
          }}
        />
      ) : null}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[40%] opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
        style={{
          boxShadow:
            "inset 0 0 0 1.5px rgba(255,255,255,0.9), 0 8px 28px -12px rgba(120,53,15,0.5)",
        }}
      />
      {children}
    </button>
  );
}