import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Box, Loader2, Package, Sparkles } from "lucide-react";
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
import { GrabRouletteModal } from "@/components/pet/PetGrabCard";
import { GrabPoolCard } from "@/components/pet/grab/GrabPoolCard";

export const Route = createFileRoute("/caixas")({
  head: () => ({
    meta: [
      { title: "Caixas — Meu Pet" },
      {
        name: "description",
        content: "Abra caixas temáticas: moedas, XP, cenários, decorações e itens lendários para o seu pet.",
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
  const [roulette, setRoulette] = useState<{
    res: GrabResult;
    winner: PrizeMeta;
    prizes: PrizeMeta[];
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

  return (
    <div className="min-h-screen bg-[#FAF7EF] text-[#1a1410]">
      <Header />

      {/* Hero banner */}
      <section className="relative overflow-hidden border-b border-[#ece3d0]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 60% at 20% 0%, rgba(232,199,122,0.35), transparent 65%), radial-gradient(60% 50% at 100% 30%, rgba(91,26,46,0.10), transparent 70%), radial-gradient(80% 80% at 50% 120%, rgba(15,107,79,0.08), transparent 70%)",
          }}
        />
        {/* hairline gold separator */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(201,162,74,0.6), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-8">
          <Link
            to="/meu-pet"
            className="inline-flex items-center gap-1.5 text-xs text-[#7a6f5e] hover:text-[#1a1410]"
          >
            <ArrowLeft className="size-3.5" /> Voltar para o pet
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="grid size-12 place-items-center rounded-2xl ring-1 ring-[#e6cf8a]"
              style={{
                background:
                  "linear-gradient(135deg, #FFF6DF 0%, #F1DDA1 60%, #C9A24A 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 6px 18px -10px rgba(201,162,74,0.55)",
              }}
            >
              <Box className="size-6 text-[#5b1a2e]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-[#1a1410]">
                Caixas da Sorte
              </h1>
              <p className="text-xs text-[#7a6f5e]">
                Abra caixas temáticas e suba sua coleção. Cada caixa, uma chance.
              </p>
            </div>
            <Link
              to="/meu-pet"
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#1a1410] ring-1 ring-[#ece3d0] hover:ring-[#e6cf8a]"
            >
              <Package className="size-3.5" />
              Estoque
              {totalInv > 0 && (
                <span
                  className="rounded-full px-1.5 text-[10px] font-bold text-[#1a1410]"
                  style={{
                    background:
                      "linear-gradient(135deg, #F1DDA1 0%, #C9A24A 100%)",
                  }}
                >
                  {totalInv}
                </span>
              )}
            </Link>
          </div>

          {/* Daily quota */}
          {state && (
            <div className="mt-5 flex flex-wrap gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[#3a3328] ring-1 ring-[#ece3d0]">
                <Sparkles className="size-3 text-[#c9a24a]" />
                {Math.max(0, state.default_free_daily - state.free_used)} grátis hoje
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[#3a3328] ring-1 ring-[#ece3d0]">
                <CoinIcon className="size-3" />
                {state.recent.length > 0 ? `${state.recent.length} aberturas recentes` : "Nenhuma abertura ainda"}
              </span>
            </div>
          )}

          {/* Featured pool */}
          {groups?.featured && (
            <FeaturedBanner pool={groups.featured} onOpen={() => void open(groups.featured!.id)} busy={pendingPoolId === groups.featured.id} />
          )}
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-0 z-20 border-b border-[#ece3d0] bg-[#FAF7EF]/85 backdrop-blur">
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
                freeRemaining={Math.max(0, pool.free_daily - state.free_used)}
                busy={pendingPoolId === pool.id}
                onOpen={() => void open(pool.id)}
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
          onClose={() => {
            setRoulette(null);
            void reload();
          }}
        />
      )}
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
        boxShadow:
          "0 18px 44px -18px rgba(201,162,74,0.45), inset 0 1px 0 rgba(255,255,255,0.9)",
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
        <div
          className="grid size-14 place-items-center rounded-xl ring-1 ring-[#e6cf8a]"
          style={{
            background:
              "linear-gradient(135deg, #FFF6DF 0%, #F1DDA1 60%, #C9A24A 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
          }}
        >
          <Sparkles className="size-7 text-[#5b1a2e]" />
        </div>
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