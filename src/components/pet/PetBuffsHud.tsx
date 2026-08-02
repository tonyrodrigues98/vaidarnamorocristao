import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PET_CARE_ICON } from "@/components/pet/PetNeedsHud";
import {
  PET_CARE_LABEL,
  PET_CARE_ORDER,
  type PetCareKind,
  type PetRuntimeModifiers,
} from "@/types/petCare";

function fmtMult(n: number): string {
  return `×${n.toFixed(2).replace(/\.?0+$/, "")}`;
}

function fmtRemaining(ms: number): string {
  if (ms <= 0) return "expirado";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}min` : `${h}h`;
}

/** Próximo expirar entre buffs que afetam o kind (ignora rules, que não têm expiração). */
function nextExpiry(
  mods: PetRuntimeModifiers | null | undefined,
  kind: PetCareKind,
  now: number,
): number | null {
  if (!mods) return null;
  let soonest: number | null = null;
  for (const b of mods.buffs) {
    if (b.kind !== kind && b.kind !== "all") continue;
    if (Number(b.restore_mult ?? 1) === 1 && Number(b.decay_mult ?? 1) === 1) continue;
    const t = new Date(b.expires_at).getTime();
    if (t <= now) continue;
    if (soonest === null || t < soonest) soonest = t;
  }
  return soonest;
}

/**
 * Agrega o multiplicador REAL aplicado por kind, combinando rules + buffs
 * + entradas com kind "all" — espelha `aggregateMult` em `petCare.ts`.
 * Usa o restore_mult (ganho); se não houver desvio, mostra inverso do decay.
 */
function appliedMult(mods: PetRuntimeModifiers | null | undefined, kind: PetCareKind): number {
  if (!mods) return 1;
  let restore = 1;
  let decay = 1;
  for (const r of mods.rules) {
    if (r.kind === kind || r.kind === "all") {
      restore *= Number(r.restore_mult ?? 1);
      decay *= Number(r.decay_mult ?? 1);
    }
  }
  for (const b of mods.buffs) {
    if (b.kind === kind || b.kind === "all") {
      restore *= Number(b.restore_mult ?? 1);
      decay *= Number(b.decay_mult ?? 1);
    }
  }
  // Prioriza desvio em restore; se neutro, expressa decay como ×(1/decay) para representar ganho de durabilidade.
  if (restore !== 1) return restore;
  if (decay !== 1) return 1 / decay;
  return 1;
}

export function PetBuffsHud({
  mods,
  className,
}: {
  mods: PetRuntimeModifiers | null | undefined;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(t);
  }, []);

  const rows = PET_CARE_ORDER.map((k) => ({ kind: k, mult: appliedMult(mods, k) })).filter(
    (r) => Math.abs(r.mult - 1) > 0.001,
  );
  if (rows.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      {rows.map(({ kind, mult }) => {
        const Icon = PET_CARE_ICON[kind];
        const tone = mult > 1 ? "text-emerald-600" : "text-rose-600";
        const expiry = nextExpiry(mods, kind, now);
        return (
          <Popover key={kind}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-medium tabular-nums outline-none transition hover:opacity-80",
                  tone,
                )}
                aria-label={`${PET_CARE_LABEL[kind]} ${fmtMult(mult)}`}
              >
                <Icon className="size-3 text-neutral-500" />
                {fmtMult(mult)}
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-auto px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <Icon className="size-3.5 text-neutral-500" />
                <span className="font-medium text-neutral-800">{PET_CARE_LABEL[kind]}</span>
                <span className={cn("tabular-nums", tone)}>{fmtMult(mult)}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500">
                <Clock className="size-3" />
                {expiry === null ? "permanente" : `restam ${fmtRemaining(expiry - now)}`}
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
