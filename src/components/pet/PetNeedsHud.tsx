import { Droplet, Heart, Moon, Smile, Utensils, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PET_CARE_LABEL, PET_CARE_ORDER, type PetCareKind } from "@/types/petCare";
import { cn } from "@/lib/utils";

export const PET_CARE_ICON: Record<PetCareKind, LucideIcon> = {
  feed: Utensils,
  energy: Zap,
  play: Smile,
  hygiene: Droplet,
  sleep: Moon,
  affection: Heart,
};

const COLOR: Record<PetCareKind, string> = {
  feed: "bg-orange-500",
  energy: "bg-yellow-400",
  play: "bg-pink-500",
  hygiene: "bg-sky-500",
  sleep: "bg-indigo-500",
  affection: "bg-rose-500",
};

export function PetNeedsHud({
  values,
  onPick,
}: {
  values: Record<PetCareKind, number>;
  onPick?: (k: PetCareKind) => void;
}) {
  return (
    <div className="grid w-full grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
      {PET_CARE_ORDER.map((k) => {
        const Icon = PET_CARE_ICON[k];
        const v = Math.round(values[k] ?? 0);
        const low = v < 30;
        return (
          <button
            key={k}
            type="button"
            onClick={onPick ? () => onPick(k) : undefined}
            className={cn(
              "group flex min-w-0 flex-col gap-1 rounded-2xl border border-neutral-200 bg-white/90 px-2 py-1.5 text-left backdrop-blur transition sm:px-3 sm:py-2",
              onPick && "hover:border-neutral-300",
            )}
            aria-label={`${PET_CARE_LABEL[k]} ${v}%`}
          >
            <div className="flex min-w-0 items-center justify-between gap-1">
              <Icon className={cn("h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4", low ? "text-red-500" : "text-neutral-600")} />
              <span className={cn("text-[10px] font-semibold tabular-nums sm:text-xs", low ? "text-red-600" : "text-neutral-700")}>
                {v}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 sm:h-2">
              <div
                className={cn("h-full rounded-full transition-[width] duration-500", COLOR[k])}
                style={{ width: `${v}%` }}
              />
            </div>
            <span className="truncate text-[9px] font-medium uppercase tracking-wide text-neutral-400 sm:text-[10px]">
              {PET_CARE_LABEL[k]}
            </span>
          </button>
        );
      })}
    </div>
  );
}