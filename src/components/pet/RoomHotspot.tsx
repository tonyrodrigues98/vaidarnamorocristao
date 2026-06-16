import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  /** Posição em % do container (0-100) — ponto central do item clicável. */
  x: number;
  y: number;
  /** Raio do glow em % da largura do container (ex: 8 = 8% de largura). */
  radius?: number;
  label: string;
  /** Texto curto explicando o que esta ação faz (ex: "Cuidado · dar banho"). */
  tooltip?: string;
  /** Posição da etiqueta em relação ao item. */
  labelPlacement?: "top" | "bottom" | "left" | "right";
  onClick: () => void;
  /** Pulsa em dourado quando precisa de atenção (stat baixa) */
  urgent?: boolean;
  children?: ReactNode;
  className?: string;
};

/**
 * Hotspot diegético do Quarto: glow radial no item (não um quadrado),
 * etiqueta visível ao lado pro usuário saber o que cada item faz, e
 * tooltip mais detalhado no hover/focus.
 */
export function RoomHotspot({
  x,
  y,
  radius = 7,
  label,
  tooltip,
  labelPlacement = "bottom",
  onClick,
  urgent,
  children,
  className,
}: Props) {
  const size = `${radius * 2}%`;
  // Posicionamento da etiqueta em relação ao centro do glow.
  const labelPos = {
    top:    { bottom: `calc(100% + 6px)`, left: "50%", transform: "translateX(-50%)" },
    bottom: { top:    `calc(100% + 6px)`, left: "50%", transform: "translateX(-50%)" },
    left:   { right:  `calc(100% + 6px)`, top:  "50%", transform: "translateY(-50%)" },
    right:  { left:   `calc(100% + 6px)`, top:  "50%", transform: "translateY(-50%)" },
  }[labelPlacement];

  const btn = (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "group absolute z-20 -translate-x-1/2 -translate-y-1/2 outline-none",
        "transition-transform duration-300 ease-out hover:scale-110 active:scale-95",
        "focus-visible:scale-110",
        className,
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        aspectRatio: "1 / 1",
      }}
    >
      {/* Glow radial — segue o item, sem caixa */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full",
          urgent ? "motion-reduce:animate-none" : "",
        )}
        style={{
          background:
            "radial-gradient(circle, rgba(255,224,140,0.85) 0%, rgba(255,200,90,0.45) 35%, rgba(255,180,60,0) 72%)",
          animation: urgent ? "hotspot-glow 1.8s ease-in-out infinite" : "hotspot-glow 4s ease-in-out infinite",
          filter: urgent ? "saturate(1.2)" : undefined,
          mixBlendMode: "screen",
        }}
      />
      {/* Núcleo mais intenso no centro pra dar sensação de "aceso" */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-1/3 w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,240,0.95) 0%, rgba(255,235,180,0.4) 60%, transparent 100%)",
          opacity: urgent ? 1 : 0.7,
        }}
      />
      {/* Etiqueta sempre visível — diz o nome da ação */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute whitespace-nowrap rounded-full bg-neutral-900/85 px-2 py-0.5 text-[10px] font-semibold tracking-tight text-amber-50 shadow-md ring-1 ring-amber-200/30 backdrop-blur-sm",
          "transition-opacity duration-300",
          urgent ? "opacity-100" : "opacity-85 group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
        style={labelPos}
      >
        {label}
      </span>
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