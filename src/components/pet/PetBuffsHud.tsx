import { cn } from "@/lib/utils";
import { PET_CARE_ICON } from "@/components/pet/PetNeedsHud";
import { PET_CARE_LABEL, PET_CARE_ORDER, type PetCareKind, type PetRuntimeModifiers } from "@/types/petCare";

function fmtMult(n: number): string {
  return `×${n.toFixed(2).replace(/\.?0+$/, "")}`;
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
  const rows = PET_CARE_ORDER.map((k) => ({ kind: k, mult: appliedMult(mods, k) })).filter(
    (r) => Math.abs(r.mult - 1) > 0.001,
  );
  if (rows.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      {rows.map(({ kind, mult }) => {
        const Icon = PET_CARE_ICON[kind];
        const tone = mult > 1 ? "text-emerald-600" : "text-rose-600";
        return (
          <span
            key={kind}
            className={cn("inline-flex items-center gap-1 text-[11px] font-medium tabular-nums", tone)}
            title={`${PET_CARE_LABEL[kind]} ${fmtMult(mult)}`}
          >
            <Icon className="size-3 text-neutral-500" />
            {fmtMult(mult)}
          </span>
        );
      })}
    </div>
  );
}