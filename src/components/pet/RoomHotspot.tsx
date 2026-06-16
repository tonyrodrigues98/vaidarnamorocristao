import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  /** Posição em % do container (0-100) */
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  /** Texto curto explicando o que esta ação faz (ex: "Cuidado · dar banho"). */
  tooltip?: string;
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
  tooltip,
  onClick,
  urgent,
  children,
  className,
}: Props) {
  const btn = (
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
  if (!tooltip) return btn;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{btn}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[220px] border border-amber-200/40 bg-neutral-900/95 text-amber-50 shadow-lg backdrop-blur"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold">{label}</span>
          <span className="text-[10px] text-amber-100/85">{tooltip}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}