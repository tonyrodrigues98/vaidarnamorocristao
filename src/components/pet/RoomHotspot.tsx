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
  /** Pulsa em dourado quando precisa de atenção (stat baixa) */
  urgent?: boolean;
  /** Conteúdo opcional sobreposto (badge, contador) */
  children?: ReactNode;
  className?: string;
};

/**
 * Botão invisível posicionado por % sobre a cena do Quarto Vivo.
 * Em hover/focus desenha um anel suave. Em "urgent", pulsa um glow dourado
 * — o jogador lê a urgência pela cena, não por barras.
 */
export function RoomHotspot({
  x,
  y,
  width,
  height,
  label,
  onClick,
  urgent,
  children,
  className,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "group absolute z-20 flex items-center justify-center rounded-2xl outline-none",
        "transition-transform duration-300 ease-out hover:scale-[1.04] active:scale-95",
        "focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:ring-offset-0",
        className,
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
    >
      {/* halo dourado sutil pulsando quando urgente */}
      {urgent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl motion-reduce:animate-none"
          style={{
            animation: "hotspot-glow 3s ease-in-out infinite",
          }}
        />
      ) : null}
      {/* anel discreto no hover/focus */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
        style={{
          boxShadow:
            "inset 0 0 0 1.5px rgba(255,255,255,0.85), 0 6px 22px -10px rgba(120,53,15,0.45)",
        }}
      />
      {children}
    </button>
  );
}