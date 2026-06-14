import { useEffect, useState } from "react";
import { Loader2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CoinIcon } from "@/components/icons/CoinIcon";
import {
  PET_CARE_ACTION_LABEL,
  PET_CARE_LABEL,
  type PetCareKind,
} from "@/types/petCare";
import type { PetCareItem } from "@/types/petCare";
import {
  applyPetCare,
  getCareConfig,
  getItemUsesToday,
  listCareItemsForPet,
} from "@/lib/petCare";
import { awardXp, XP_SOURCES } from "@/lib/xp";
import { cn } from "@/lib/utils";
import { PET_CARE_ICON } from "./PetNeedsHud";

type Props = {
  open: boolean;
  kind: PetCareKind | null;
  userPetId: string;
  categoryId: string;
  speciesId: string | null;
  currentValue: number;
  onClose: () => void;
  onApplied: () => void;
};

export function PetCareActionSheet({
  open,
  kind,
  userPetId,
  categoryId,
  speciesId,
  currentValue,
  onClose,
  onApplied,
}: Props) {
  const [items, setItems] = useState<PetCareItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [regenMin, setRegenMin] = useState(6);
  const [usesToday, setUsesToday] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open || !kind) return;
    if (kind === "energy") {
      void getCareConfig().then((c) => setRegenMin(c.energy_regen_minutes_per_point));
      setItems([]);
      return;
    }
    setLoading(true);
    listCareItemsForPet({ kind, categoryId, speciesId })
      .then(async (its) => {
        setItems(its);
        const entries = await Promise.all(
          its.filter((i) => i.daily_uses > 0).map(async (i) => [i.id, await getItemUsesToday(userPetId, i.id)] as const),
        );
        setUsesToday(Object.fromEntries(entries));
      })
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, [open, kind, categoryId, speciesId, userPetId]);

  async function pick(item: PetCareItem) {
    setPending(item.id);
    try {
      const result = await applyPetCare(userPetId, item.id);
      const restore = result.restore || item.restore_amount;
      const multiTxt = result.multiplier && result.multiplier !== 1
        ? ` (×${result.multiplier.toFixed(2)})`
        : "";
      toast.success(`+${restore} ${PET_CARE_LABEL[item.kind]}${multiTxt}`, {
        description: result.notes?.length ? result.notes.slice(0, 2).join(" · ") : undefined,
      });
      // XP: care de resgate (<20%) ou care preventivo (<50%)
      if (currentValue < 20) {
        const xp = await awardXp(
          XP_SOURCES.CARE_RESCUE.source,
          XP_SOURCES.CARE_RESCUE.amount,
          XP_SOURCES.CARE_RESCUE.cap,
          { kind: item.kind, item: item.slug },
        );
        if (xp && xp.granted > 0) toast.success(`+${xp.granted} XP`, { description: "Resgate na hora certa" });
      } else if (currentValue < 50) {
        const xp = await awardXp(
          XP_SOURCES.CARE_LOW.source,
          XP_SOURCES.CARE_LOW.amount,
          XP_SOURCES.CARE_LOW.cap,
          { kind: item.kind, item: item.slug },
        );
        if (xp && xp.granted > 0) toast.success(`+${xp.granted} XP`);
      }
      if (result.random_event) {
        const re = result.random_event;
        if (re.type === "coins") {
          toast.success(`🪙 +${re.amount} moedas — ${re.label}`);
        } else if (re.type === "buff") {
          toast.success(`✨ ${re.label}`, {
            description: `Próximas ações de ${PET_CARE_LABEL[re.kind as never] ?? re.kind} +${Math.round((re.mult - 1) * 100)}% por ${re.duration_min}min`,
          });
        }
      }
      onApplied();
      onClose();
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(
        msg.includes("insufficient_coins") ? "Moedas insuficientes" :
        msg.includes("energia_insuficiente") ? "Seu pet está sem energia para essa ação" :
        msg.includes("limite_diario_atingido") ? "Limite diário atingido (reseta às 00:00)" :
        msg.includes("incompativel") ? "Esse item não é compatível com seu pet" :
        msg,
      );
    } finally {
      setPending(null);
    }
  }

  const Icon = kind ? PET_CARE_ICON[kind] : Sparkles;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Icon className="h-5 w-5" />
            {kind && (kind === "energy" ? PET_CARE_LABEL.energy : PET_CARE_ACTION_LABEL[kind])}
            <span className="ml-auto text-xs font-normal text-neutral-500">{currentValue}/100</span>
          </SheetTitle>
          <SheetDescription>
            {kind === "energy"
              ? "A energia se recupera sozinha com o tempo."
              : "Toque em uma opção para usar."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 max-h-[60vh] overflow-y-auto pb-4">
          {kind === "energy" ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium text-neutral-800">
                <Zap className="h-4 w-4 text-yellow-500" /> Regeneração automática
              </div>
              <p className="mt-1 text-xs text-neutral-600">
                +1 ponto a cada {regenMin} {regenMin === 1 ? "minuto" : "minutos"}. Volte mais
                tarde para encontrar seu pet com mais energia!
              </p>
            </div>
          ) : loading ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
            </div>
          ) : items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
              Nenhuma opção disponível para essa espécie ainda.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {items.map((it) => {
                const busy = pending === it.id;
                const used = usesToday[it.id] ?? 0;
                const remaining = it.daily_uses > 0 ? Math.max(0, it.daily_uses - used) : null;
                const exhausted = remaining !== null && remaining <= 0;
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      onClick={() => void pick(it)}
                      disabled={!!pending || exhausted}
                      className={cn(
                        "group flex h-full w-full flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-3 text-center transition",
                        "hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm",
                        busy && "opacity-60",
                        exhausted && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-neutral-50">
                        {it.image_url ? (
                          <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" />
                        ) : (
                          <Icon className="h-7 w-7 text-neutral-400" />
                        )}
                      </div>
                      <div className="min-w-0 w-full">
                        <div className="truncate text-xs font-semibold">{it.name}</div>
                        <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-neutral-500">
                          <Sparkles className="h-3 w-3" />+{it.restore_amount}
                          {it.energy_cost > 0 && kind !== "sleep" && (
                            <span className="ml-1 inline-flex items-center gap-0.5 text-yellow-600">
                              <Zap className="h-3 w-3" />-{it.energy_cost}
                            </span>
                          )}
                        </div>
                        {remaining !== null && (
                          <div className={cn("mt-0.5 text-[10px]", exhausted ? "text-red-500" : "text-neutral-400")}>
                            {exhausted ? "Esgotado hoje" : `${remaining}/${it.daily_uses} hoje`}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-700">
                        {it.cost_coins > 0 ? (
                          <>
                            <CoinIcon className="h-3 w-3" /> {it.cost_coins}
                          </>
                        ) : (
                          <span className="text-emerald-600">Grátis</span>
                        )}
                      </div>
                      {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}