/**
 * Chips horizontais de cor para layers recoloríveis (cabelo + roupa).
 * Mobile-first: rola horizontalmente sem causar overflow lateral.
 * Lê presets de `src/data/avatarColorPresets.ts` — adicionar cor =
 * 1 entrada nesse arquivo + 0 mudança aqui.
 */

import { useMemo } from "react";
import {
  getColorPresetsByCategory,
  type AvatarColorPreset,
} from "@/data/avatarColorPresets";
import type { AvatarColorPresetCategory } from "@/types/avatar";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Props = {
  category: AvatarColorPresetCategory;
  title?: string;
  value: string | null;
  onChange: (presetId: string) => void;
  /** Lista opcional para filtrar — quando o item só permite N cores. */
  presetIds?: string[];
  className?: string;
};

export function AvatarColorPicker({
  category,
  title,
  value,
  onChange,
  presetIds,
  className,
}: Props) {
  const presets = useMemo<AvatarColorPreset[]>(() => {
    const all = getColorPresetsByCategory(category);
    if (!presetIds?.length) return all;
    const set = new Set(presetIds);
    return all.filter((p) => set.has(p.id));
  }, [category, presetIds]);

  if (!presets.length) return null;

  return (
    <div className={cn("w-full", className)}>
      {title && (
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h4>
      )}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {presets.map((preset) => {
          const active = preset.id === value;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.id)}
              aria-label={preset.name}
              aria-pressed={active}
              className={cn(
                "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition",
                active ? "border-primary ring-2 ring-primary/30" : "border-white hover:scale-105",
              )}
              style={{ backgroundColor: preset.hex }}
              title={preset.name}
            >
              {active && (
                <Check
                  className="h-4 w-4"
                  style={{ color: pickContrastColor(preset.hex) }}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function pickContrastColor(hex: string): string {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.6 ? "#1A1A1A" : "#FFFFFF";
}
