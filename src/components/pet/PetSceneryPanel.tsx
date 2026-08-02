import { useState } from "react";
import { toast } from "sonner";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Gift, Loader2, Lock, Sparkles } from "lucide-react";
import { CoinIcon } from "@/components/icons/CoinIcon";

import { equipPetBackground, unlockPetBackground } from "@/lib/petBackgrounds";
import {
  petKeys,
  petSceneryEquippedQueryOptions,
  petSceneryListQueryOptions,
  petSceneryUnlocksQueryOptions,
  petXpStateQueryOptions,
} from "@/lib/petQueries";
import {
  canClaimFreebie,
  claimFreebie,
  freebieStatusQueryOptions,
  type FreebieRarity,
} from "@/lib/freebies";
import { useAuth } from "@/lib/auth";
import { PET_RARITY_COLOR, PET_RARITY_LABEL } from "@/types/pet";
import type { PetBackground, UserPetBackground } from "@/types/petBackground";
import { cn } from "@/lib/utils";

import { PetBackgroundLayer } from "./PetBackgroundLayer";

export { PetBackgroundLayer };

export function usePetScenery(opts: { categoryId: string; speciesId: string | null }) {
  const qc = useQueryClient();
  const results = useQueries({
    queries: [
      petSceneryListQueryOptions({ categoryId: opts.categoryId, speciesId: opts.speciesId }),
      petSceneryUnlocksQueryOptions(),
      petSceneryEquippedQueryOptions(),
      petXpStateQueryOptions(),
    ],
  });
  const [listQ, unlocksQ, equippedQ, xpQ] = results;
  const list: PetBackground[] = listQ.data ?? [];
  const unlocks: UserPetBackground[] = unlocksQ.data ?? [];
  const equipped: PetBackground | null = equippedQ.data ?? null;
  const level: number = xpQ.data?.level ?? 1;
  const loading = results.some((r) => r.isLoading && !r.data);
  const firstError = results.find((r) => r.error)?.error as Error | undefined;
  if (firstError) {
    // toast só uma vez por erro; o react-query controla retries.
    queueMicrotask(() => toast.error(firstError.message));
  }
  const reload = () => {
    void qc.invalidateQueries({ queryKey: petKeys.sceneryList(opts.categoryId, opts.speciesId) });
    void qc.invalidateQueries({ queryKey: petKeys.sceneryUnlocks() });
    void qc.invalidateQueries({ queryKey: petKeys.sceneryEquipped() });
    void qc.invalidateQueries({ queryKey: petKeys.xpState() });
  };
  return { list, unlocks, equipped, loading, level, reload };
}

export function PetSceneryPanel({
  categoryId,
  speciesId,
  list,
  unlocks,
  equipped,
  level,
  loading,
  onChanged,
}: {
  categoryId: string;
  speciesId: string | null;
  list: PetBackground[];
  unlocks: UserPetBackground[];
  equipped: PetBackground | null;
  level: number;
  loading: boolean;
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const ownedIds = new Set(unlocks.map((u) => u.background_id));
  const { user } = useAuth();
  const qc = useQueryClient();
  const freebieStatusQuery = useQuery(freebieStatusQueryOptions(user?.id));
  const freebieStatuses = freebieStatusQuery.data;

  async function handleClick(bg: PetBackground) {
    if (!ownedIds.has(bg.id) && level < (bg.min_level ?? 1)) {
      toast.error(`Disponível a partir do nível ${bg.min_level}. Você está no nível ${level}.`);
      return;
    }
    // Brinde grátis por raridade desbloqueada
    const canFreebie =
      !ownedIds.has(bg.id) && canClaimFreebie(freebieStatuses, "pet_background", bg.rarity);
    if (canFreebie) {
      toast(`Resgatar "${bg.name}" grátis?`, {
        description: `Você pode escolher 1 cenário ${bg.rarity} de graça nesse tier.`,
        action: {
          label: "Resgatar",
          onClick: () => void claimAndEquip(bg),
        },
      });
      return;
    }
    // Confirmação para itens pagos (sem window.confirm — usa toast com ação).
    if (!ownedIds.has(bg.id) && bg.is_exclusive && bg.price_coins > 0) {
      toast(`Desbloquear "${bg.name}"?`, {
        description: `Custa ${bg.price_coins} moedas — depois o cenário fica seu.`,
        action: {
          label: "Desbloquear",
          onClick: () => void applyUnlockAndEquip(bg),
        },
      });
      return;
    }
    await applyUnlockAndEquip(bg);
  }

  async function claimAndEquip(bg: PetBackground) {
    setBusyId(bg.id);
    try {
      await claimFreebie("pet_background", bg.rarity as FreebieRarity, bg.id);
      await equipPetBackground(bg.id);
      if (user?.id) qc.invalidateQueries({ queryKey: ["freebie-status", user.id] });
      toast.success("Cenário resgatado e aplicado");
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function applyUnlockAndEquip(bg: PetBackground) {
    setBusyId(bg.id);
    try {
      if (!ownedIds.has(bg.id)) await unlockPetBackground(bg.id);
      await equipPetBackground(bg.id);
      toast.success("Cenário aplicado");
      onChanged();
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("insufficient_coins")) {
        toast.error("Saldo de moedas insuficiente");
      } else if (msg.includes("level_too_low")) {
        const m = msg.match(/level_too_low:(\d+)/);
        toast.error(m ? `Disponível a partir do nível ${m[1]}.` : "Nível insuficiente.");
      } else {
        toast.error(msg);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove() {
    setBusyId("__none__");
    try {
      await equipPetBackground(null);
      toast.success("Cenário removido");
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02),0_24px_60px_-30px_rgba(0,0,0,0.08)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
            <Sparkles className="h-3 w-3" /> Cenário
          </div>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">
            Onde seu pet vive
          </h3>
          <p className="mt-0.5 text-xs text-neutral-500">
            Dia e noite mudam sozinhos conforme o horário de São Paulo.
          </p>
        </div>
        {equipped && (
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={busyId === "__none__"}
            className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            {busyId === "__none__" ? "Removendo…" : "Remover"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 px-4 py-6 text-center text-xs text-neutral-500">
          Ainda não há cenários compatíveis com este pet. Volte em breve.
        </p>
      ) : (
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
          {list.map((bg) => {
            const owned = ownedIds.has(bg.id);
            const isEquipped = equipped?.id === bg.id;
            const busy = busyId === bg.id;
            const locked = !owned && level < (bg.min_level ?? 1);
            const isFreebie =
              !owned && !locked && canClaimFreebie(freebieStatuses, "pet_background", bg.rarity);
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => void handleClick(bg)}
                disabled={busy || locked}
                aria-disabled={locked}
                className={cn(
                  "group relative flex w-40 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-white text-left transition-all",
                  isEquipped
                    ? "border-neutral-900 ring-2 ring-neutral-900/10"
                    : "border-neutral-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_12px_30px_-18px_rgba(0,0,0,0.25)]",
                  locked && "opacity-60",
                )}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-neutral-100 to-neutral-50">
                  {bg.image_url_day ? (
                    <img
                      src={bg.image_url_day}
                      alt={bg.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      style={locked ? { filter: "grayscale(0.6)" } : undefined}
                    />
                  ) : null}
                  {isEquipped && (
                    <div className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-neutral-900 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                  {locked && (
                    <div className="absolute inset-0 grid place-items-center bg-black/30">
                      <div className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-neutral-800 ring-1 ring-neutral-200">
                        <Lock className="h-3 w-3" /> Nível {bg.min_level}
                      </div>
                    </div>
                  )}
                  {!locked &&
                    !owned &&
                    bg.is_exclusive &&
                    (isFreebie ? (
                      <div className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        <Gift className="h-3 w-3" /> Brinde
                      </div>
                    ) : (
                      <div className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        <CoinIcon className="h-3 w-3" /> {bg.price_coins}
                      </div>
                    ))}
                  {!locked && !owned && !bg.is_exclusive && !isFreebie && (
                    <div className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-neutral-700 ring-1 ring-neutral-200">
                      <Lock className="h-3 w-3" /> Grátis
                    </div>
                  )}
                  {!locked && !owned && !bg.is_exclusive && isFreebie && (
                    <div className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                      <Gift className="h-3 w-3" /> Brinde
                    </div>
                  )}
                  {busy && (
                    <div className="absolute inset-0 grid place-items-center bg-white/60">
                      <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 p-2.5">
                  <span className="line-clamp-1 text-sm font-semibold text-neutral-900">
                    {bg.name}
                  </span>
                  <span
                    className={cn(
                      "inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-medium",
                      PET_RARITY_COLOR[bg.rarity],
                    )}
                  >
                    {PET_RARITY_LABEL[bg.rarity]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
