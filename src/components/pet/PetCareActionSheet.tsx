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
  listCareItemsForPet,
} from "@/lib/petCare";
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

  useEffect(() => {
    if (!open || !kind) return;
    if (kind === "energy") {
      void getCareConfig().then((c) => setRegenMin(c.energy_regen_minutes_per_point));
      setItems([]);
      return;
    }
    setLoading(true);
    listCareItemsForPet({ kind, categoryId, speciesId })
      .then(setItems)
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, [open, kind, categoryId, speciesId]);

  async function pick(item: PetCareItem) {
    setPending(item.id);
    try {
      await applyPetCare(userPetId, item.id);
      toast.success(`+${item.restore_amount} ${PET_CARE_LABEL[item.kind]}`);
      onApplied();
      onClose();
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(
        msg.includes("insufficient_coins") ? "Moedas insuficientes" :
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
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      onClick={() => void pick(it)}
                      disabled={!!pending}
                      className={cn(
                        "group flex h-full w-full flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-3 text-center transition",
                        "hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm",
                        busy && "opacity-60",
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
                        </div>
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