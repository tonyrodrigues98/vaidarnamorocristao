import { useEffect, useMemo, useRef, useState } from "react";
import * as LucideIcons from "lucide-react";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEVEL_REWARDS, MAX_LEVEL, type LevelReward } from "@/lib/levelRewards";
import type { PetRarity } from "@/types/pet";

const RARITY_STYLES: Record<
  PetRarity,
  { chip: string; ring: string; glow: string; dot: string; label: string }
> = {
  common: {
    chip: "bg-slate-100 text-slate-700",
    ring: "ring-slate-300",
    glow: "shadow-[0_0_0_4px_rgba(148,163,184,0.15)]",
    dot: "bg-slate-400",
    label: "Comum",
  },
  rare: {
    chip: "bg-sky-100 text-sky-700",
    ring: "ring-sky-400",
    glow: "shadow-[0_0_18px_rgba(56,189,248,0.45)]",
    dot: "bg-sky-500",
    label: "Raro",
  },
  epic: {
    chip: "bg-violet-100 text-violet-700",
    ring: "ring-violet-400",
    glow: "shadow-[0_0_20px_rgba(167,139,250,0.55)]",
    dot: "bg-violet-500",
    label: "Épico",
  },
  legendary: {
    chip: "bg-amber-100 text-amber-800",
    ring: "ring-amber-400",
    glow: "shadow-[0_0_22px_rgba(251,191,36,0.6)]",
    dot: "bg-amber-500",
    label: "Lendário",
  },
};

/**
 * Trilha horizontal de níveis (1 → 50) com marcadores de recompensa.
 * Nível atual destacado, recompensas raras/épicas/lendárias com glow tonalizado.
 */
export function LevelRewardsRail({
  level,
  className,
}: {
  level: number;
  className?: string;
}) {
  const rewardsByLevel = useMemo(() => {
    const map = new Map<number, LevelReward>();
    for (const r of LEVEL_REWARDS) map.set(r.level, r);
    return map;
  }, []);

  const [selected, setSelected] = useState<number>(() => {
    const next = LEVEL_REWARDS.find((r) => r.level >= level);
    return next?.level ?? LEVEL_REWARDS[LEVEL_REWARDS.length - 1].level;
  });

  const railRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [level]);

  const reward = rewardsByLevel.get(selected);
  const pct = Math.min(100, Math.max(0, ((level - 1) / (MAX_LEVEL - 1)) * 100));

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-white via-neutral-50 to-white p-4 sm:p-5",
        className,
      )}
      aria-label="Trilha de recompensas por nível"
    >
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
            Trilha de níveis
          </div>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-neutral-900">
            Recompensas até o nível {MAX_LEVEL}
          </h2>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Atual</div>
          <div className="text-lg font-semibold tabular-nums text-neutral-900">Nv. {level}</div>
        </div>
      </header>

      <div
        ref={railRef}
        className="-mx-1 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="relative mx-1 min-w-max px-2 pt-2">
          {/* Linha base */}
          <div className="absolute left-2 right-2 top-[26px] h-[3px] rounded-full bg-neutral-200" />
          {/* Linha de progresso */}
          <div
            className="absolute left-2 top-[26px] h-[3px] rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500 transition-[width] duration-700"
            style={{ width: `calc(${pct}% * (100% - 16px) / 100%)` }}
          />

          <div className="relative flex items-start gap-2.5">
            {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((lv) => {
              const r = rewardsByLevel.get(lv);
              const unlocked = level >= lv;
              const isCurrent = lv === level;
              const isSelected = lv === selected;
              const rarity = r?.rarity ?? "common";
              const styles = r ? RARITY_STYLES[rarity] : null;
              const Icon = r
                ? ((LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[r.icon] ??
                  LucideIcons.Gift)
                : null;

              if (!r) {
                return (
                  <div key={lv} className="flex w-7 flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        "size-2.5 rounded-full transition",
                        unlocked ? "bg-indigo-500" : "bg-neutral-300",
                      )}
                    />
                    <span className="text-[9px] font-medium tabular-nums text-neutral-400">
                      {lv}
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={lv}
                  ref={isCurrent ? currentRef : undefined}
                  type="button"
                  onClick={() => setSelected(lv)}
                  className="group flex w-14 flex-col items-center gap-1.5 outline-none"
                  aria-label={`Nível ${lv}: ${r.title}`}
                >
                  <div
                    className={cn(
                      "relative grid size-11 place-items-center rounded-2xl ring-2 transition-all",
                      unlocked
                        ? `bg-white ${styles!.ring} ${styles!.glow}`
                        : "bg-neutral-50 ring-neutral-200",
                      isSelected && "scale-110",
                      isCurrent && "ring-offset-2 ring-offset-white",
                    )}
                  >
                    {unlocked ? (
                      Icon ? (
                        <Icon
                          className={cn(
                            "size-5",
                            rarity === "legendary" && "text-amber-600",
                            rarity === "epic" && "text-violet-600",
                            rarity === "rare" && "text-sky-600",
                            rarity === "common" && "text-neutral-700",
                          )}
                        />
                      ) : (
                        <Check className="size-4 text-neutral-700" />
                      )
                    ) : (
                      <Lock className="size-4 text-neutral-400" />
                    )}
                    {isCurrent && (
                      <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-indigo-600 text-[8px] font-bold text-white ring-2 ring-white">
                        ★
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold tabular-nums",
                      unlocked ? "text-neutral-700" : "text-neutral-400",
                    )}
                  >
                    {lv}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detalhe do nível selecionado */}
      {reward && (
        <div
          className={cn(
            "mt-2 flex items-start gap-3 rounded-2xl border bg-white/70 p-3 backdrop-blur transition",
            level >= reward.level ? "border-neutral-200" : "border-dashed border-neutral-300",
          )}
        >
          <div
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-xl ring-2",
              RARITY_STYLES[reward.rarity ?? "common"].ring,
            )}
          >
            {(() => {
              const Icon =
                (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[reward.icon] ??
                LucideIcons.Gift;
              return <Icon className="size-5 text-neutral-800" />;
            })()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Nível {reward.level}
              </span>
              {reward.rarity && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                    RARITY_STYLES[reward.rarity].chip,
                  )}
                >
                  {RARITY_STYLES[reward.rarity].label}
                </span>
              )}
              {level >= reward.level ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
                  <Check className="size-2.5" /> Desbloqueado
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
                  <Lock className="size-2.5" /> Faltam {reward.level - level} nv.
                </span>
              )}
            </div>
            <h3 className="mt-0.5 text-sm font-semibold text-neutral-900">{reward.title}</h3>
            <p className="mt-0.5 text-xs leading-snug text-neutral-500">{reward.description}</p>
          </div>
        </div>
      )}
    </section>
  );
}