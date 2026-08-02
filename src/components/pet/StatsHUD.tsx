import { useState } from "react";
import { Apple, Battery, Smile, Heart, Coffee, Bath } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PetCareKind } from "@/types/petCare";
import { PET_CARE_LABEL } from "@/types/petCare";

const ICON: Record<PetCareKind, typeof Apple> = {
  feed: Apple,
  sleep: Battery,
  hygiene: Bath,
  play: Smile,
  affection: Heart,
  energy: Coffee,
};

function dotColor(value: number): string {
  if (value >= 70) return "bg-emerald-400";
  if (value >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

/**
 * HUD minimalista no topo da cena: pontinhos coloridos por stat.
 * Tap expande pra cartões flutuantes com nome + valor.
 */
export function StatsHUD({
  values,
  className,
}: {
  values: Partial<Record<PetCareKind, number>>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // Mostra só os 4 cuidados principais — os "buffs" não entram aqui.
  const kinds: PetCareKind[] = ["feed", "sleep", "hygiene", "play"];

  return (
    <div className={cn("pointer-events-auto", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1.5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.18)] backdrop-blur-md ring-1 ring-black/5 transition hover:bg-white"
        aria-label={open ? "Ocultar status" : "Ver status do pet"}
      >
        {kinds.map((k) => {
          const v = Math.max(0, Math.min(100, Math.round(values[k] ?? 0)));
          return (
            <span
              key={k}
              className={cn("size-2.5 rounded-full ring-1 ring-black/5", dotColor(v))}
              aria-hidden
            />
          );
        })}
      </button>

      {open ? (
        <div className="absolute left-0 right-0 mt-2 flex flex-wrap justify-center gap-1.5 px-2">
          {kinds.map((k) => {
            const v = Math.max(0, Math.min(100, Math.round(values[k] ?? 0)));
            const Icon = ICON[k] ?? Apple;
            return (
              <div
                key={k}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-neutral-800 shadow-sm ring-1 ring-black/5 backdrop-blur"
              >
                <Icon
                  className={cn(
                    "size-3",
                    v < 40 ? "text-rose-500" : v < 70 ? "text-amber-600" : "text-emerald-600",
                  )}
                />
                <span className="text-neutral-500">{PET_CARE_LABEL[k]}</span>
                <span className="tabular-nums">{v}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
