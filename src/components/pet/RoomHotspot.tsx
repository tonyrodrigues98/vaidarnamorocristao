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
        "transition-transform duration-200 hover:scale-105 active:scale-95",
        "focus-visible:ring-2 focus-visible:ring-amber-300/80 focus-visible:ring-offset-0",
        urgent && "animate-[pulse_2.4s_ease-in-out_infinite]",
        className,
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
    >
      {/* halo dourado quando urgente */}
      {urgent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            boxShadow:
              "0 0 0 2px rgba(251, 191, 36, 0.55), 0 0 24px 4px rgba(251, 191, 36, 0.45)",
          }}
        />
      ) : null}
      {/* anel discreto no hover */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200",
          "group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
        style={{
          boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.75), 0 6px 18px -6px rgba(0,0,0,0.35)",
        }}
      />
      {children}
    </button>
  );
}