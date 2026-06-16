import { useEffect, useMemo, useState } from "react";
import { Gift, Loader2, Sparkles, Package, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CoinIcon } from "@/components/icons/CoinIcon";
import {
  getGrabState, listMyGrabInventory, performGrab, resolvePrize,
  type PrizeMeta,
} from "@/lib/petGrab";
import {
  GRAB_PRIZE_KIND_LABEL,
  type GrabInventoryItem,
  type GrabResult,
  type GrabState,
} from "@/types/petGrab";
import { cn } from "@/lib/utils";

type Props = {
  refreshKey?: number;
  onChanged?: () => void;
};

export function PetGrabCard({ refreshKey, onChanged }: Props) {
  const [state, setState] = useState<GrabState | null>(null);
  const [inv, setInv] = useState<GrabInventoryItem[]>([]);
  const [pendingPoolId, setPendingPoolId] = useState<string | null>(null);
  const [result, setResult] = useState<{ res: GrabResult; meta: PrizeMeta | null } | null>(null);
  const [showInv, setShowInv] = useState(false);

  async function reload() {
    try {
      const [s, i] = await Promise.all([getGrabState(), listMyGrabInventory()]);
      setState(s); setInv(i);
    } catch (e) { /* silently */ console.warn(e); }
  }
  useEffect(() => { void reload(); }, [refreshKey]);

  async function grab(poolId: string) {
    setPendingPoolId(poolId);
    try {
      const res = await performGrab(poolId);
      const meta = await resolvePrize(res.prize_kind, res.prize_ref_id);
      setResult({ res, meta });
      await reload();
      onChanged?.();
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(
        msg.includes("insufficient_coins") ? "Moedas insuficientes" :
        msg.includes("pool_empty") ? "Pool sem prêmios configurados" :
        msg.includes("pool_not_found") ? "Pool indisponível" :
        msg,
      );
    } finally {
      setPendingPoolId(null);
    }
  }

  if (!state) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="grid place-items-center py-6">
          <Loader2 className="size-4 animate-spin text-neutral-400" />
        </div>
      </section>
    );
  }

  if (state.pools.length === 0) return null;

  return (
    <>
      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
            <Gift className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Grab — Sorteio diário</h2>
            <p className="text-[11px] text-neutral-500">Itens, cenários e bônus aleatórios.</p>
          </div>
          <Button size="sm" variant="ghost" className="ml-auto"
            onClick={() => setShowInv(true)}>
            <Package className="size-4 mr-1" />Estoque
            {inv.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700">
                {inv.reduce((s, x) => s + x.quantity, 0)}
              </span>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          {state.pools.map((pool) => {
            const freeRemaining = Math.max(0, pool.free_daily - state.free_used);
            const isFree = freeRemaining > 0;
            const busy = pendingPoolId === pool.id;
            return (
              <div key={pool.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{pool.name}</div>
                  <div className="text-[11px] text-neutral-500">
                    {isFree
                      ? `${freeRemaining} grátis hoje`
                      : <span className="inline-flex items-center gap-1">
                          <CoinIcon className="size-3" /> {pool.cost_coins} por sorteio
                        </span>}
                  </div>
                </div>
                <Button onClick={() => void grab(pool.id)} disabled={busy || pool.prize_count === 0}
                  className={cn(isFree && "bg-amber-500 hover:bg-amber-600 text-white")}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> :
                    isFree ? <>Sortear <Sparkles className="size-4 ml-1" /></> :
                      <span className="inline-flex items-center gap-1"><CoinIcon className="size-3" />{pool.cost_coins}</span>}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {result && (
        <Dialog open onOpenChange={(o) => !o && setResult(null)}>
          <DialogContent className="max-w-sm text-center">
            <DialogTitle className="flex items-center justify-center gap-2">
              <Sparkles className="size-5 text-amber-500" /> Você ganhou!
            </DialogTitle>
            <div className="my-4 grid place-items-center">
              {result.meta?.image_url ? (
                <img src={result.meta.image_url} alt={result.meta.name}
                  className="size-32 rounded-2xl object-cover ring-2 ring-amber-200" />
              ) : (
                <div className="grid size-28 place-items-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 ring-2 ring-amber-200">
                  <Gift className="size-12 text-amber-600" />
                </div>
              )}
            </div>
            <div className="text-sm font-semibold">
              {result.meta?.name ?? GRAB_PRIZE_KIND_LABEL[result.res.prize_kind]}
              {result.res.prize_amount > 1 && ` x${result.res.prize_amount}`}
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              {GRAB_PRIZE_KIND_LABEL[result.res.prize_kind]}
              {result.res.was_paid
                ? ` · ${result.res.cost_paid} moedas`
                : ` · grátis (${result.res.free_remaining} restantes hoje)`}
            </div>
            <Button className="mt-4 w-full" onClick={() => setResult(null)}>Continuar</Button>
          </DialogContent>
        </Dialog>
      )}

      {showInv && (
        <InventoryDialog inventory={inv} onClose={() => setShowInv(false)} />
      )}
    </>
  );
}

function InventoryDialog({ inventory, onClose }: { inventory: GrabInventoryItem[]; onClose: () => void }) {
  const [resolved, setResolved] = useState<Record<string, PrizeMeta | null>>({});
  useEffect(() => {
    let cancelled = false;
    void Promise.all(inventory.map(async (it) => {
      const meta = await resolvePrize(it.prize_kind, it.prize_ref_id);
      return [it.id, meta] as const;
    })).then((entries) => {
      if (!cancelled) setResolved(Object.fromEntries(entries));
    });
    return () => { cancelled = true; };
  }, [inventory]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2">
          <Package className="size-5" /> Meu estoque
        </DialogTitle>
        {inventory.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">Estoque vazio. Faça um sorteio!</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {inventory.map((it) => {
              const meta = resolved[it.id];
              return (
                <li key={it.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-2">
                  <div className="grid size-12 place-items-center overflow-hidden rounded-lg bg-neutral-50">
                    {meta?.image_url ? (
                      <img src={meta.image_url} alt={meta.name} className="size-full object-cover" />
                    ) : (
                      <Gift className="size-5 text-neutral-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {meta?.name ?? GRAB_PRIZE_KIND_LABEL[it.prize_kind]}
                    </div>
                    <div className="text-[11px] text-neutral-500">{GRAB_PRIZE_KIND_LABEL[it.prize_kind]}</div>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    x{it.quantity}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <Button variant="ghost" className="mt-2 w-full" onClick={onClose}>
          <X className="size-4 mr-1" />Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
}