import { useEffect, useMemo, useRef, useState } from "react";
import { Gift, Loader2, Sparkles, Package, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CoinIcon } from "@/components/icons/CoinIcon";
import {
  getGrabState, listMyGrabInventory, listPoolPrizeMetas, performGrab, resolvePrize,
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
  const [roulette, setRoulette] = useState<{
    res: GrabResult;
    winner: PrizeMeta;
    prizes: PrizeMeta[];
  } | null>(null);
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
      const [prizes, res] = await Promise.all([
        listPoolPrizeMetas(poolId),
        performGrab(poolId),
      ]);
      const winnerMeta = await resolvePrize(res.prize_kind, res.prize_ref_id);
      const winner: PrizeMeta = winnerMeta ?? {
        name: GRAB_PRIZE_KIND_LABEL[res.prize_kind],
        image_url: null,
      };
      setRoulette({ res, winner, prizes });
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

      {roulette && (
        <GrabRouletteModal
          res={roulette.res}
          winner={roulette.winner}
          prizes={roulette.prizes}
          onClose={() => setRoulette(null)}
        />
      )}

      {showInv && (
        <InventoryDialog inventory={inv} onClose={() => setShowInv(false)} />
      )}
    </>
  );
}

const ROULETTE_ITEM = 112;
const ROULETTE_VIEW = 320;
const ROULETTE_SPIN_MS = 6500;

function GrabRouletteModal({
  res,
  winner,
  prizes,
  onClose,
}: {
  res: GrabResult;
  winner: PrizeMeta;
  prizes: PrizeMeta[];
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"spin" | "done">("spin");
  const [translate, setTranslate] = useState(0);
  const rafRef = useRef<number | null>(null);

  const { items, winnerIndex } = useMemo(() => {
    const base = prizes.length > 0 ? prizes : [winner];
    const list: PrizeMeta[] = [];
    const TOTAL = 48;
    for (let i = 0; i < TOTAL; i++) {
      list.push(base[Math.floor(Math.random() * base.length)] ?? winner);
    }
    const idx = TOTAL - 4;
    list[idx] = winner;
    return { items: list, winnerIndex: idx };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const targetX = -(winnerIndex * ROULETTE_ITEM + ROULETTE_ITEM / 2 - ROULETTE_VIEW / 2);

  useEffect(() => {
    // start at 0, then on next frame apply target to trigger CSS transition
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => setTranslate(targetX));
    });
    const t = setTimeout(() => setPhase("done"), ROULETTE_SPIN_MS + 150);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(t);
    };
  }, [targetX]);

  return (
    <Dialog open onOpenChange={(o) => !o && phase === "done" && onClose()}>
      <DialogContent className="max-w-sm border-neutral-800 bg-neutral-950 text-white">
        <DialogTitle className="flex items-center justify-center gap-2 text-white">
          <Sparkles className="size-5 text-amber-400" />
          {phase === "done" ? "Você ganhou!" : "Sorteando..."}
        </DialogTitle>

        <div
          className="relative mx-auto mt-2 overflow-hidden rounded-xl bg-neutral-900 ring-1 ring-neutral-800"
          style={{ width: ROULETTE_VIEW, height: 128 }}
        >
          {/* center frame */}
          <div
            className={cn(
              "pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-2xl",
              "ring-2 ring-amber-400",
              phase === "done" && "ring-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.55)]",
            )}
            style={{ width: 96, height: 96 }}
          />
          {/* edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-neutral-950 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-neutral-950 to-transparent" />
          {/* strip */}
          <div
            className="absolute left-0 top-1/2 flex"
            style={{
              transform: `translate3d(${translate}px, -50%, 0)`,
              transition:
                phase === "spin"
                  ? `transform ${ROULETTE_SPIN_MS}ms cubic-bezier(0.12, 0.85, 0.18, 1)`
                  : "none",
              willChange: "transform",
            }}
          >
            {items.map((it, i) => (
              <div
                key={i}
                className="grid place-items-center"
                style={{ width: ROULETTE_ITEM, height: ROULETTE_ITEM }}
              >
                <div className="grid size-20 place-items-center overflow-hidden rounded-xl bg-neutral-800 ring-1 ring-neutral-700">
                  {it?.image_url ? (
                    <img
                      src={it.image_url}
                      alt=""
                      className="size-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <Gift className="size-8 text-neutral-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {phase === "done" ? (
          <div className="mt-3 text-center">
            <div className="text-base font-semibold">
              {winner.name}
              {res.prize_amount > 1 && ` x${res.prize_amount}`}
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              {GRAB_PRIZE_KIND_LABEL[res.prize_kind]}
              {res.was_paid
                ? ` · ${res.cost_paid} moedas`
                : ` · grátis (${res.free_remaining} restantes hoje)`}
            </div>
            <Button
              className="mt-4 w-full bg-amber-500 text-neutral-950 hover:bg-amber-400"
              onClick={onClose}
            >
              Continuar
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-center text-xs text-neutral-400">
            Girando a roleta...
          </p>
        )}
      </DialogContent>
    </Dialog>
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