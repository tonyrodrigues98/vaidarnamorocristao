import { Palette, Ruler, Scale } from "lucide-react";

import {
  avatarHairColors,
  avatarSkinTones,
  type AvatarAppearance,
  type AvatarHairColorId,
  type AvatarSkinToneId,
} from "@/data/avatarMockData";

type AvatarAppearanceControlsProps = {
  appearance: AvatarAppearance;
  onChange: (appearance: AvatarAppearance) => void;
};

function updateAppearance<T extends keyof AvatarAppearance>(
  current: AvatarAppearance,
  key: T,
  value: AvatarAppearance[T],
) {
  return { ...current, [key]: value };
}

export function AvatarAppearanceControls({ appearance, onChange }: AvatarAppearanceControlsProps) {
  return (
    <section className="mb-4 rounded-[28px] border border-rose-100 bg-gradient-to-br from-white via-[#fff8f5] to-white p-3 shadow-[0_14px_38px_rgba(120,53,15,0.08)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-rose-50 text-[#ff5c70]">
            <Palette className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-black text-stone-950">Aparência</p>
            <p className="text-[11px] font-semibold text-stone-500">Base visual do avatar</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-stone-400">
            Pele
          </p>
          <div className="flex gap-2">
            {avatarSkinTones.map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() =>
                  onChange(updateAppearance(appearance, "skinTone", tone.id as AvatarSkinToneId))
                }
                aria-label={`Tom de pele ${tone.label}`}
                className={`h-8 w-8 rounded-full border-2 shadow-sm transition active:scale-95 ${
                  appearance.skinTone === tone.id
                    ? "border-[#ff5c70] ring-4 ring-rose-100"
                    : "border-white"
                }`}
                style={{ backgroundColor: tone.color }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-stone-400">
            Cabelo
          </p>
          <div className="flex gap-2">
            {avatarHairColors.map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() =>
                  onChange(updateAppearance(appearance, "hairColor", tone.id as AvatarHairColorId))
                }
                aria-label={`Cor de cabelo ${tone.label}`}
                className={`h-8 w-8 rounded-full border-2 shadow-sm transition active:scale-95 ${
                  appearance.hairColor === tone.id
                    ? "border-[#ff5c70] ring-4 ring-rose-100"
                    : "border-white"
                }`}
                style={{ backgroundColor: tone.color }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1.5">
          <span className="flex items-center justify-between text-xs font-black text-stone-700">
            <span className="inline-flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5 text-[#ff5c70]" />
              Altura
            </span>
            <span>{appearance.height}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={appearance.height}
            onChange={(event) =>
              onChange(updateAppearance(appearance, "height", Number(event.target.value)))
            }
            className="h-2 w-full accent-[#ff5c70]"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="flex items-center justify-between text-xs font-black text-stone-700">
            <span className="inline-flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-[#ff5c70]" />
              Peso
            </span>
            <span>{appearance.weight}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={appearance.weight}
            onChange={(event) =>
              onChange(updateAppearance(appearance, "weight", Number(event.target.value)))
            }
            className="h-2 w-full accent-[#ff5c70]"
          />
        </label>
      </div>
    </section>
  );
}
