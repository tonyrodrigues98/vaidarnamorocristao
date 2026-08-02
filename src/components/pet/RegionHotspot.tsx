import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  /** Posição em % do container — ponto central da região. */
  x: number;
  y: number;
  /** Raio do glow em % da largura do container. */
  radius?: number;
  label: string;
  tooltip?: string;
  labelPlacement?: "top" | "bottom" | "left" | "right";
  onClick: () => void;
  attention?: 0 | 1 | 2;
  children?: ReactNode;
};

/**
 * Hotspot de região do mapa. Glow radial no acidente geográfico (sem
 * caixa) + etiqueta visível. 3 níveis de atenção dão o pulso do glow.
 */
export function RegionHotspot({
  x,
  y,
  radius = 10,
  label,
  tooltip,
  labelPlacement = "bottom",
  onClick,
  attention = 1,
  children,
}: Props) {
  const size = `${radius * 2}%`;
  const labelPos = {
    top: { bottom: `calc(100% + 6px)`, left: "50%", transform: "translateX(-50%)" },
    bottom: { top: `calc(100% + 6px)`, left: "50%", transform: "translateX(-50%)" },
    left: { right: `calc(100% + 6px)`, top: "50%", transform: "translateY(-50%)" },
    right: { left: `calc(100% + 6px)`, top: "50%", transform: "translateY(-50%)" },
  }[labelPlacement];

  const pulse =
    attention === 2
      ? "region-glow 2.4s ease-in-out infinite"
      : attention === 1
        ? "region-glow 5s ease-in-out infinite"
        : "none";

  const btn = (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "group absolute z-20 -translate-x-1/2 -translate-y-1/2 outline-none",
        "transition-transform duration-300 ease-out hover:scale-110 active:scale-95",
        "focus-visible:scale-110",
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        aspectRatio: "1 / 1",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full motion-reduce:animate-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,224,140,0.8) 0%, rgba(255,200,90,0.4) 40%, rgba(255,180,60,0) 72%)",
          animation: pulse,
          opacity: attention === 0 ? 0 : attention === 2 ? 1 : 0.7,
          mixBlendMode: "screen",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-1/3 w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,240,0.9) 0%, rgba(255,235,180,0.35) 60%, transparent 100%)",
          opacity: attention === 0 ? 0.4 : 0.9,
        }}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute whitespace-nowrap rounded-full bg-neutral-900/85 px-2 py-0.5 text-[10px] font-semibold tracking-tight text-amber-50 shadow-md ring-1 ring-amber-200/30 backdrop-blur-sm transition-opacity duration-300",
          attention === 2
            ? "opacity-100"
            : "opacity-85 group-hover:opacity-100 group-focus-visible:opacity-100",
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
        className="max-w-[240px] border border-amber-200/40 bg-neutral-900/95 text-amber-50 shadow-lg backdrop-blur"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold">{label}</span>
          <span className="text-[10px] text-amber-100/85">{tooltip}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
