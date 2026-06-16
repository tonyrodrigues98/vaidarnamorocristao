import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Package, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CoinIcon } from "@/components/icons/CoinIcon";
import {
  getGrabState,
  listMyGrabInventory,
  listPoolPrizeMetas,
  performGrab,
  performGrabMulti,
  resolvePrize,
  type PrizeMeta,
} from "@/lib/petGrab";
import {
  GRAB_PRIZE_KIND_LABEL,
  type GrabInventoryItem,
  type GrabResult,
  type GrabState,
  type GrabStatePool,
} from "@/types/petGrab";
import { unlockGrabAudio } from "@/lib/grabAudio";
import { GrabRouletteModal, InventoryDialog } from "@/components/pet/PetGrabCard";
import { GrabPoolCard } from "@/components/pet/grab/GrabPoolCard";
import { CAIXAS_BANNER, caixaArtFor } from "@/lib/caixaArt";

export const Route = createFileRoute("/caixas")({
  head: () => ({
    meta: [
      { title: "Caixas — Meu Pet" },
      {
        name: "description",
        content:
          "Abra caixas temáticas: moedas, XP, cenários, decorações e itens lendários para o seu pet.",
      },
    ],
  }),
  component: CaixasPage,
});

type FamilyKey = "all" | "starter" | "recurso" | "visual" | "raridade" | "special";

const FAMILY_OF: Record<string, FamilyKey> = {
  // Por recurso
  cofre_moedas: "recurso",
  capsula_xp: "recurso",
  bau_cuidado: "recurso",
  // Visual
  caixa_cenarios: "visual",
  caixa_decoracoes: "visual",
  caixa_gradientes: "visual",
  // Raridade
  caixa_comum: "raridade",
  caixa_rara: "raridade",
  caixa_epica: "raridade",
  caixa_lendaria: "raridade",
  // Especial
  roleta_sorte: "special",
};

function familyOf(p: GrabStatePool): FamilyKey {
  if (p.rarity === "starter") return "starter";
  return FAMILY_OF[p.slug] ?? "raridade";
}

const FAMILY_LABELS: Record<FamilyKey, string> = {
  all: "Todas",
  starter: "Iniciante",
  recurso: "Por recurso",
  visual: "Visuais",
  raridade: "Por raridade",
  special: "Especial",
};

function CaixasPage() {
  const { user, loading } = useAuth();
  const [state, setState] = useState<GrabState | null>(null);
  const [inv, setInv] = useState<GrabInventoryItem[]>([]);
  const [pendingPoolId, setPendingPoolId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FamilyKey>("all");
  const [showInv, setShowInv] = useState(false);
  const [roulette, setRoulette] = useState<{
    res: GrabResult;
    winner: PrizeMeta;
    prizes: PrizeMeta[];
    poolId: string;
    poolCost: number;
  } | null>(null);
  const [multiResults, setMultiResults] = useState<{
    poolName: string;
    results: Array<{ res: GrabResult; prize: PrizeMeta }>;
  } | null>(null);

  async function reload() {
    try {
      const [s, i] = await Promise.all([getGrabState(), listMyGrabInventory()]);
      setState(s);
      setInv(i);
    } catch (e) {
      console.warn(e);
    }
  }

  useEffect(() => {
    if (user) void reload();
  }, [user]);

  async function open(poolId: string) {
    unlockGrabAudio();
    setPendingPoolId(poolId);
    try {
      const [prizes, res] = await Promise.all([listPoolPrizeMetas(poolId), performGrab(poolId)]);
      const winnerMeta = await resolvePrize(res.prize_kind, res.prize_ref_id);
      const winner: PrizeMeta = {
        ...(winnerMeta ?? { name: GRAB_PRIZE_KIND_LABEL[res.prize_kind], image_url: null }),
        kind: res.prize_kind,
        amount: res.prize_amount,
      };
      const pool = state?.pools.find((p) => p.id === poolId);
      setRoulette({ res, winner, prizes, poolId, poolCost: pool?.cost_coins ?? 0 });
      await reload();
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(
        msg.includes("insufficient_coins")
          ? "Moedas insuficientes"
          : msg.includes("pool_on_cooldown")
            ? "Esta caixa ainda está em cooldown"
            : msg.includes("pool_empty")
              ? "Caixa sem prêmios configurados"
              : msg.includes("pool_not_found")
                ? "Caixa indisponível"
                : msg,
      );
    } finally {
      setPendingPoolId(null);
    }
  }

  async function openMulti(poolId: string, count: 5 | 10) {
    unlockGrabAudio();
    setPendingPoolId(poolId);
    try {
      const multi = await performGrabMulti(poolId, count);
      const results = await Promise.all(
        multi.results.map(async (res) => {
          const meta = await resolvePrize(res.prize_kind, res.prize_ref_id);
          return {
            res,
            prize: {
              ...(meta ?? { name: GRAB_PRIZE_KIND_LABEL[res.prize_kind], image_url: null }),
              kind: res.prize_kind,
              amount: res.prize_amount,
            } as PrizeMeta,
          };
        }),
      );
      const pool = state?.pools.find((p) => p.id === poolId);
      setMultiResults({ poolName: pool?.name ?? "Caixa", results });
      await reload();
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(
        msg.includes("insufficient_coins")
          ? "Moedas insuficientes"
          : msg.includes("pool_on_cooldown")
            ? "Esta caixa ainda está em cooldown"
            : msg.includes("pool_empty")
              ? "Caixa sem prêmios configurados"
              : msg.includes("pool_not_found")
                ? "Caixa indisponível"
                : msg,
      );
    } finally {
      setPendingPoolId(null);
    }
  }

  const groups = useMemo(() => {
    if (!state) return null;
    const pools = state.pools;
    const featured = pools.find((p) => p.featured_until && new Date(p.featured_until) > new Date());
    const filtered = filter === "all" ? pools : pools.filter((p) => familyOf(p) === filter);
    return { featured, filtered };
  }, [state, filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7EF]">
        <div className="grid h-[60vh] place-items-center">
          <Loader2 className="size-6 animate-spin text-[#9a7626]" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth/login" />;

  const totalInv = inv.reduce((s, x) => s + x.quantity, 0);
  const totalFreeRemaining = state
    ? state.pools.reduce((sum, pool) => sum + Math.max(0, pool.free_daily - pool.free_used), 0)
    : 0;

  return (
    <div className="min-h-screen bg-[#FAF7EF] text-[#1a1410]">
      <Header />

      {/* Cinematic hero banner */}
      <section className="relative overflow-hidden border-b border-[#ece3d0]">
        <img
          src={CAIXAS_BANNER}
          alt="Caixas da Sorte — abra, colecione, conquiste"
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
          decoding="async"
        />
        {/* readability gradient */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,6,4,0.10) 0%, rgba(10,6,4,0.35) 60%, rgba(250,247,239,0.92) 100%)",
          }}
        />
        {/* hairline gold separator */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(201,162,74,0.85), transparent)",
          }}
        />
        <div className="relative mx-auto flex min-h-[280px] max-w-3xl flex-col justify-between px-4 py-5 sm:min-h-[340px]">
          <Link
            to="/meu-pet"
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs text-[#f5e7c4] ring-1 ring-[#c9a24a]/40 backdrop-blur hover:bg-black/55"
          >
            <ArrowLeft className="size-3.5" /> Voltar para o pet
          </Link>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0" />
            <button
              type="button"
              onClick={() => setShowInv(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-[#1a1410] ring-1 ring-[#e6cf8a] backdrop-blur transition hover:ring-[#c9a24a]"
            >
              <Package className="size-3.5" />
              Estoque
              {totalInv > 0 && (
                <span
                  className="rounded-full px-1.5 text-[10px] font-bold text-[#1a1410]"
                  style={{
                    background: "linear-gradient(135deg, #F1DDA1 0%, #C9A24A 100%)",
                  }}
                >
                  {totalInv}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Quotas + featured (sits on ivory, below the banner) */}
      <section className="mx-auto max-w-3xl px-4 pt-4">
        {state && (
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[#3a3328] ring-1 ring-[#ece3d0]">
              <Sparkles className="size-3 text-[#c9a24a]" />
              {totalFreeRemaining} grátis nas caixas hoje
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[#3a3328] ring-1 ring-[#ece3d0]">
              <CoinIcon className="size-3" />
              {state.recent.length > 0
                ? `${state.recent.length} aberturas recentes`
                : "Nenhuma abertura ainda"}
            </span>
          </div>
        )}
        {groups?.featured && (
          <FeaturedBanner
            pool={groups.featured}
            onOpen={() => void open(groups.featured!.id)}
            busy={pendingPoolId === groups.featured.id}
          />
        )}
      </section>

      {/* Filters */}
      <div className="sticky top-0 z-20 mt-4 border-b border-[#ece3d0] bg-[#FAF7EF]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3">
          {(Object.keys(FAMILY_LABELS) as FamilyKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition",
                filter === k
                  ? "bg-[#1a1410] text-[#FAF7EF] ring-[#1a1410]"
                  : "bg-white text-[#5b5142] ring-[#ece3d0] hover:ring-[#e6cf8a]",
              )}
            >
              {FAMILY_LABELS[k]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-3xl px-4 py-5 pb-24">
        {!state ? (
          <div className="grid h-[40vh] place-items-center">
            <Loader2 className="size-5 animate-spin text-[#9a7626]" />
          </div>
        ) : groups && groups.filtered.length === 0 ? (
          <div className="grid h-[30vh] place-items-center text-sm text-[#7a6f5e]">
            Nenhuma caixa neste filtro.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {groups?.filtered.map((pool) => (
              <GrabPoolCard
                key={pool.id}
                pool={pool}
                freeRemaining={Math.max(0, pool.free_daily - pool.free_used)}
                coinBalance={state.coin_balance ?? 0}
                busy={pendingPoolId === pool.id}
                onOpen={() => void open(pool.id)}
                onOpenMulti={(count) => void openMulti(pool.id, count)}
              />
            ))}
          </div>
        )}

        {/* Recent log */}
        {state && state.recent.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7626]">
              Suas últimas aberturas
            </h2>
            <ul className="space-y-1.5">
              {state.recent.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs ring-1 ring-[#ece3d0]"
                >
                  <span className="text-[#1a1410]">
                    {GRAB_PRIZE_KIND_LABEL[r.prize_kind]}
                    {r.prize_amount > 1 && (
                      <span className="ml-1 font-semibold text-[#9a7626]">x{r.prize_amount}</span>
                    )}
                  </span>
                  <span className="text-[#7a6f5e]">
                    {new Date(r.rolled_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {roulette && (
        <GrabRouletteModal
          res={roulette.res}
          winner={roulette.winner}
          prizes={roulette.prizes}
          canOpenAgain={
            roulette.res.free_remaining > 0 || roulette.res.new_balance >= roulette.poolCost
          }
          onOpenAgain={() => {
            const pid = roulette.poolId;
            setRoulette(null);
            void open(pid);
          }}
          onClose={() => {
            setRoulette(null);
            void reload();
          }}
        />
      )}
      {showInv && <InventoryDialog inventory={inv} onClose={() => setShowInv(false)} />}
      {multiResults && (
        <MultiResultsDialog
          poolName={multiResults.poolName}
          results={multiResults.results}
          onClose={() => {
            setMultiResults(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}

function MultiResultsDialog({
  poolName,
  results,
  onClose,
}: {
  poolName: string;
  results: Array<{ res: GrabResult; prize: PrizeMeta }>;
  onClose: () => void;
}) {
  const totalPaid = results.reduce((sum, item) => sum + item.res.cost_paid, 0);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#FAF7EF] p-4 text-[#1a1410] shadow-2xl ring-1 ring-[#e6cf8a]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a7626]">
              Abertura múltipla
            </div>
            <h2 className="truncate text-base font-semibold">{poolName}</h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-semibold ring-1 ring-[#ece3d0]">
            <CoinIcon className="size-3" /> {totalPaid}
          </span>
        </div>
        <div className="grid max-h-[55vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
          {results.map(({ res, prize }, index) => (
            <div
              key={`${res.prize_kind}-${res.prize_ref_id ?? index}-${index}`}
              className="rounded-xl bg-white p-2 ring-1 ring-[#ece3d0]"
            >
              <div className="grid aspect-square place-items-center overflow-hidden rounded-lg bg-[#f1ead8]">
                {res.prize_kind === "name_gradient" && prize.gradient_css ? (
                  <div className="size-full" style={{ background: prize.gradient_css }} />
                ) : prize.image_url ? (
                  <img src={prize.image_url} alt="" className="size-full object-cover" />
                ) : res.prize_kind === "coins" ? (
                  <CoinIcon className="size-8" />
                ) : (
                  <Package className="size-8 text-[#9a7626]" />
                )}
              </div>
              <div className="mt-1.5 truncate text-xs font-semibold">{prize.name}</div>
              <div className="text-[10px] text-[#7a6f5e]">
                {GRAB_PRIZE_KIND_LABEL[res.prize_kind]}
                {res.prize_amount > 1 ? ` x${res.prize_amount}` : ""}
              </div>
            </div>
          ))}
        </div>
        <Button
          className="mt-4 w-full bg-[#1a1410] text-[#FAF7EF] hover:bg-[#2a2018]"
          onClick={onClose}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}

function FeaturedBanner({
  pool,
  onOpen,
  busy,
}: {
  pool: GrabStatePool;
  onOpen: () => void;
  busy: boolean;
}) {
  return (
    <div
      className="relative mt-5 overflow-hidden rounded-2xl border border-[#e6cf8a] bg-white p-4"
      style={{
        boxShadow: "0 18px 44px -18px rgba(201,162,74,0.45), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 100% at 0% 0%, rgba(232,199,122,0.30), transparent 60%), radial-gradient(70% 90% at 100% 100%, rgba(91,26,46,0.10), transparent 60%)",
        }}
      />
      <div className="relative flex items-center gap-3">
        <img
          src={caixaArtFor(pool.slug, pool.rarity)}
          alt=""
          width={120}
          height={120}
          loading="lazy"
          className="size-16 shrink-0 object-contain"
          style={{ filter: "drop-shadow(0 8px 12px rgba(91,26,46,0.25))" }}
        />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a7626]">
            Em destaque
          </div>
          <div className="truncate text-sm font-semibold text-[#1a1410]">{pool.name}</div>
          {pool.description && (
            <div className="line-clamp-1 text-[11px] text-[#7a6f5e]">{pool.description}</div>
          )}
        </div>
        <Button
          size="sm"
          onClick={onOpen}
          disabled={busy || pool.cooldown_seconds > 0}
          className="bg-[#1a1410] text-[#FAF7EF] hover:bg-[#2a2018]"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Abrir"}
        </Button>
      </div>
    </div>
  );
}
