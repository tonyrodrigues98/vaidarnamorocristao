import { useEffect, useMemo, useRef, useState } from "react";
import { Gift, Loader2, Sparkles, Package, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CoinIcon } from "@/components/icons/CoinIcon";
import grabComumImg from "@/assets/grab-comum.png";
import grabRaraImg from "@/assets/grab-rara.png";
import grabEpicaImg from "@/assets/grab-epica.png";
import grabLendariaImg from "@/assets/grab-lendaria.png";
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
import {
  playGrabFinalDing,
  playGrabTick,
  unlockGrabAudio,
} from "@/lib/grabAudio";

type GrabTier = {
  image: string;
  label: string;
  glow: string;
  dot: string;
  rank: 0 | 1 | 2 | 3;
  ringColor: string;
  haloColor: string;
};

function tierFor(name: string): GrabTier {
  const n = name.toLowerCase();
  if (n.includes("lend"))
    return {
      image: grabLendariaImg,
      label: "Lendária",
      glow: "bg-[radial-gradient(circle_at_50%_50%,rgba(217,160,48,0.40),transparent_65%)]",
      dot: "bg-amber-400",
      rank: 3,
      ringColor: "rgba(217,160,48,0.55)",
      haloColor: "rgba(255,210,120,0.55)",
    };
  if (n.includes("ép") || n.includes("ep"))
    return {
      image: grabEpicaImg,
      label: "Épica",
      glow: "bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.34),transparent_65%)]",
      dot: "bg-violet-500",
      rank: 2,
      ringColor: "rgba(139,92,246,0.50)",
      haloColor: "rgba(196,181,253,0.45)",
    };
  if (n.includes("rar"))
    return {
      image: grabRaraImg,
      label: "Rara",
      glow: "bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.26),transparent_65%)]",
      dot: "bg-sky-500",
      rank: 1,
      ringColor: "rgba(56,189,248,0.45)",
      haloColor: "rgba(186,230,253,0.40)",
    };
  return {
    image: grabComumImg,
    label: "Comum",
    glow: "bg-[radial-gradient(circle_at_50%_50%,rgba(244,114,182,0.18),transparent_65%)]",
    dot: "bg-rose-400",
    rank: 0,
    ringColor: "rgba(0,0,0,0)",
    haloColor: "rgba(0,0,0,0)",
  };
}

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
    // Unlock the shared AudioContext synchronously inside this user gesture
    // so iOS Safari permits later scheduled sounds (the modal mounts after
    // an async DB round-trip, which is outside the gesture).
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
        <style>{`
          @keyframes grab-ring-spin { to { transform: rotate(360deg); } }
          @keyframes grab-ring-spin-rev { to { transform: rotate(-360deg); } }
          @keyframes grab-halo-pulse {
            0%,100% { opacity: 0.55; transform: scale(1); }
            50%     { opacity: 1;    transform: scale(1.06); }
          }
          @keyframes grab-particle-float {
            0%,100% { transform: translateY(0) scale(1);   opacity: 0.85; }
            50%     { transform: translateY(-6px) scale(1.2); opacity: 1; }
          }
        `}</style>
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

        <div className="grid grid-cols-2 gap-3">
          {state.pools.map((pool) => {
            const freeRemaining = Math.max(0, pool.free_daily - state.free_used);
            const isFree = freeRemaining > 0;
            const busy = pendingPoolId === pool.id;
            const tier = tierFor(pool.name);
            return (
              <button
                key={pool.id}
                onClick={() => void grab(pool.id)}
                disabled={busy || pool.prize_count === 0}
                className={cn(
                  "group relative flex flex-col items-center overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-3 transition",
                  "hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.12)]",
                  "disabled:opacity-60 disabled:hover:translate-y-0",
                )}
              >
                {/* the box IS the visual */}
                <div className="relative flex aspect-[5/4] w-full items-center justify-center">
                  {/* tier glow centered on the box */}
                  <div className={cn("pointer-events-none absolute inset-0", tier.glow)} />
                  {/* Aura effects (rank-based) */}
                  {tier.rank >= 1 && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-[8%] rounded-full"
                      style={{
                        background: `radial-gradient(circle, ${tier.haloColor} 0%, transparent 62%)`,
                        filter: "blur(8px)",
                        animation: "grab-halo-pulse 3.2s ease-in-out infinite",
                      }}
                    />
                  )}
                  {tier.rank >= 1 && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-[10%] rounded-full border"
                      style={{
                        borderColor: tier.ringColor,
                        borderStyle: "dashed",
                        animation: "grab-ring-spin 14s linear infinite",
                      }}
                    />
                  )}
                  {tier.rank >= 2 && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-[2%] rounded-full border"
                      style={{
                        borderColor: tier.ringColor,
                        borderStyle: "dotted",
                        animation: "grab-ring-spin-rev 22s linear infinite",
                      }}
                    />
                  )}
                  {tier.rank >= 3 && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-[-6%] rounded-full"
                      style={{
                        background: `conic-gradient(from 0deg, transparent 0deg, ${tier.ringColor} 60deg, transparent 120deg, transparent 240deg, ${tier.ringColor} 300deg, transparent 360deg)`,
                        WebkitMask: "radial-gradient(circle, transparent 56%, #000 58%, #000 62%, transparent 64%)",
                        mask: "radial-gradient(circle, transparent 56%, #000 58%, #000 62%, transparent 64%)",
                        animation: "grab-ring-spin 9s linear infinite",
                        opacity: 0.9,
                      }}
                    />
                  )}
                  {tier.rank >= 2 && (
                    <>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          aria-hidden
                          className="pointer-events-none absolute size-1 rounded-full"
                          style={{
                            top: `${20 + (i * 47) % 60}%`,
                            left: `${10 + (i * 67) % 80}%`,
                            background: tier.ringColor,
                            boxShadow: `0 0 6px ${tier.ringColor}`,
                            animation: `grab-particle-float ${2.4 + (i % 3) * 0.4}s ease-in-out ${i * 0.25}s infinite`,
                          }}
                        />
                      ))}
                    </>
                  )}
                  <img
                    src={tier.image}
                    alt={pool.name}
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="relative z-10 size-[76%] object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,0.14)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.04]"
                  />
                </div>

                {/* meta */}
                <div className="relative mt-2 flex w-full flex-col items-center gap-1.5">
                  <div className="inline-flex items-center gap-1.5">
                    <span className={cn("size-1.5 rounded-full", tier.dot)} />
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                      {tier.label}
                    </span>
                  </div>
                  <div className="truncate text-[13px] font-semibold tracking-tight text-neutral-900">
                    {pool.name}
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      isFree
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-700",
                    )}
                  >
                    {busy ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : isFree ? (
                      <>Sortear grátis <Sparkles className="size-3" /></>
                    ) : (
                      <><CoinIcon className="size-3" />{pool.cost_coins}</>
                    )}
                  </div>
                </div>
              </button>
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

const ROULETTE_ITEM = 120;
const ROULETTE_VIEW = 360;
const ROULETTE_VIEW_H = 152;
const ROULETTE_INTRO_MS = 500;
const ROULETTE_SPIN_MS = 8500;
const ROULETTE_BURST_MS = 1100;
const SPARKLE_COUNT = 16;

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
  const [phase, setPhase] = useState<"intro" | "spin" | "settle" | "done">("intro");
  const [translate, setTranslate] = useState(0);
  const [blur, setBlur] = useState(true);
  const rafRef = useRef<number | null>(null);
  const tickRafRef = useRef<number | null>(null);
  // Persisted across StrictMode double-invocations / re-renders so the same
  // item center can never trigger a tick twice within one modal mount.
  const lastTickCenterRef = useRef<number>(Number.NEGATIVE_INFINITY);
  const tickStartedRef = useRef(false);
  const dingPlayedRef = useRef(false);

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

  // cubic-bezier(0.08, 0.82, 0.18, 1) — same easing the CSS transition uses
  const easeProgress = useMemo(() => {
    const cx1 = 0.08, cy1 = 0.82, cx2 = 0.18, cy2 = 1;
    const bz = (t: number, a: number, b: number) =>
      3 * t * (1 - t) * (1 - t) * a + 3 * t * t * (1 - t) * b + t * t * t;
    return (x: number) => {
      let t = x;
      for (let i = 0; i < 8; i++) {
        const xt = bz(t, cx1, cx2) - x;
        const dx =
          3 * (1 - t) * (1 - t) * cx1 +
          6 * (1 - t) * t * (cx2 - cx1) +
          3 * t * t * (1 - cx2);
        if (Math.abs(dx) < 1e-6) break;
        t -= xt / dx;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;
      }
      return bz(t, cy1, cy2);
    };
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // intro → spin
    timers.push(setTimeout(() => {
      setPhase("spin");
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => setTranslate(targetX));
      });
      // Start tick loop only once per modal mount, even under StrictMode.
      if (tickStartedRef.current) return;
      tickStartedRef.current = true;
      const spinStart = performance.now();
      // Tick when an item's CENTER (not its left edge) crosses the selector.
      // `centerIndex` = floor of how many full items have already passed center.
      const tickLoop = (now: number) => {
        const elapsed = now - spinStart;
        const t = Math.min(1, elapsed / ROULETTE_SPIN_MS);
        const eased = easeProgress(t);
        const currentX = targetX * eased;
        const centerIndex = Math.floor(
          (-currentX + ROULETTE_VIEW / 2 - ROULETTE_ITEM / 2) / ROULETTE_ITEM,
        );
        if (centerIndex > lastTickCenterRef.current) {
          // First observation just seeds the baseline — no tick yet.
          if (lastTickCenterRef.current !== Number.NEGATIVE_INFINITY) {
            // Instantaneous speed via bezier derivative, normalised to [0, 1]
            const dt = 1 / ROULETTE_SPIN_MS;
            const next = easeProgress(Math.min(1, t + dt));
            const speed = Math.min(1, (next - eased) * ROULETTE_SPIN_MS * 0.6);
            // Emit exactly one tick per integer step, even if several centers
            // were skipped in a single frame (very early, very fast section).
            const steps = Math.min(4, centerIndex - lastTickCenterRef.current);
            for (let i = 0; i < steps; i++) {
              // Alternate ticks across the stereo field; magnitude shrinks
              // as the wheel slows so the final ticks feel centered.
              const idx = lastTickCenterRef.current + 1 + i;
              const pan = ((idx % 2 === 0 ? 1 : -1) * (0.4 + speed * 0.5));
              playGrabTick(speed, pan);
            }
          }
          lastTickCenterRef.current = centerIndex;
        }
        if (t < 1) {
          tickRafRef.current = requestAnimationFrame(tickLoop);
        }
      };
      tickRafRef.current = requestAnimationFrame(tickLoop);
    }, ROULETTE_INTRO_MS));
    // unblur ~40% of the spin
    timers.push(setTimeout(() => setBlur(false), ROULETTE_INTRO_MS + ROULETTE_SPIN_MS * 0.45));
    // spin finished → settle (burst + pop)
    timers.push(setTimeout(() => {
      setPhase("settle");
      if (!dingPlayedRef.current) {
        dingPlayedRef.current = true;
        playGrabFinalDing();
      }
    }, ROULETTE_INTRO_MS + ROULETTE_SPIN_MS + 80));
    // settle done → reveal details
    timers.push(setTimeout(() => setPhase("done"),
      ROULETTE_INTRO_MS + ROULETTE_SPIN_MS + ROULETTE_BURST_MS));
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (tickRafRef.current) cancelAnimationFrame(tickRafRef.current);
      timers.forEach(clearTimeout);
    };
  }, [targetX, easeProgress]);

  const sparkles = useMemo(() => Array.from({ length: SPARKLE_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / SPARKLE_COUNT + Math.random() * 0.3;
    const dist = 90 + Math.random() * 70;
    return {
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      delay: Math.random() * 120,
      hue: ["#fbbf24", "#f97316", "#ec4899", "#a855f7", "#22d3ee"][i % 5],
      size: 6 + Math.random() * 6,
    };
  }), []);

  return (
    <Dialog open onOpenChange={(o) => !o && phase === "done" && onClose()}>
      <DialogContent className="max-w-md overflow-hidden border-neutral-800 bg-neutral-950 p-0 text-white">
        <style>{`
          @keyframes grab-spin-conic { to { transform: rotate(360deg); } }
          @keyframes grab-spark-burst {
            0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
            15%  { opacity: 1; transform: translate(calc(-50% + var(--tx) * 0.35px), calc(-50% + var(--ty) * 0.35px)) scale(1); }
            100% { opacity: 0; transform: translate(calc(-50% + var(--tx) * 1px), calc(-50% + var(--ty) * 1px)) scale(0.2) rotate(220deg); }
          }
          @keyframes grab-pop {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.18); }
            70%  { transform: scale(0.96); }
            100% { transform: scale(1.04); }
          }
          @keyframes grab-bg-pulse {
            0%,100% { opacity: 0.55; }
            50%     { opacity: 0.95; }
          }
          @keyframes grab-title-shine {
            0%   { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>

        {/* animated backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 40%, rgba(251,191,36,0.18), transparent 70%), radial-gradient(50% 50% at 80% 80%, rgba(236,72,153,0.15), transparent 70%), radial-gradient(50% 50% at 10% 90%, rgba(34,211,238,0.12), transparent 70%)",
              animation: "grab-bg-pulse 4s ease-in-out infinite",
            }}
          />
        </div>

        <div className="relative z-10 px-6 pb-6 pt-5">
          <DialogTitle className="flex items-center justify-center gap-2 text-center text-base font-semibold tracking-tight">
            <Sparkles
              className={cn(
                "size-5 text-amber-400 transition-transform",
                phase === "spin" && "animate-pulse",
                (phase === "settle" || phase === "done") && "drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]",
              )}
            />
            <span
              className={cn(
                "bg-clip-text",
                (phase === "settle" || phase === "done")
                  ? "bg-[linear-gradient(90deg,#fbbf24,#f97316,#ec4899,#fbbf24)] text-transparent"
                  : "text-neutral-100",
              )}
              style={(phase === "settle" || phase === "done")
                ? { backgroundSize: "200% 100%", animation: "grab-title-shine 2.5s linear infinite" }
                : undefined}
            >
              {phase === "intro" && "Preparando..."}
              {phase === "spin" && "Girando a roleta..."}
              {(phase === "settle" || phase === "done") && "Você ganhou!"}
            </span>
          </DialogTitle>

          {/* roulette container */}
          <div className="relative mx-auto mt-5" style={{ width: ROULETTE_VIEW, height: ROULETTE_VIEW_H }}>
            {/* conic-gradient rotating ring behind frame */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
              style={{ width: 132, height: 132 }}
            >
              <div
                className="absolute inset-0 rounded-3xl"
                style={{
                  background:
                    "conic-gradient(from 0deg, #fbbf24, #f97316, #ec4899, #a855f7, #06b6d4, #fbbf24)",
                  animation: `grab-spin-conic ${phase === "intro" ? "6s" : phase === "spin" ? "1.6s" : "3.5s"} linear infinite`,
                  filter: "blur(2px)",
                  opacity: phase === "intro" ? 0.4 : 0.9,
                  transition: "opacity 400ms",
                  WebkitMaskImage:
                    "radial-gradient(circle at center, transparent 56px, black 62px)",
                  maskImage:
                    "radial-gradient(circle at center, transparent 56px, black 62px)",
                }}
              />
            </div>

            {/* center frame on top */}
            <div
              className={cn(
                "pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-2xl",
                "ring-1 ring-white/15",
              )}
              style={{
                width: 112,
                height: 112,
                boxShadow:
                  phase === "settle" || phase === "done"
                    ? "0 0 40px 8px rgba(251,191,36,0.55), inset 0 0 0 2px rgba(251,191,36,0.9)"
                    : "inset 0 0 0 2px rgba(255,255,255,0.18)",
                transition: "box-shadow 350ms ease-out",
              }}
            />

            {/* strip viewport */}
            <div
              className="relative z-10 h-full overflow-hidden rounded-2xl bg-transparent ring-1 ring-neutral-800"
              style={{ width: ROULETTE_VIEW }}
            >
              {/* edge fades */}
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-neutral-950 via-neutral-950/80 to-transparent" />
              {/* top/bottom subtle vignette */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-neutral-950/90 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-neutral-950/90 to-transparent" />

              {/* strip */}
              <div
                className="absolute left-0 top-1/2 flex"
                style={{
                  transform: `translate3d(${translate}px, -50%, 0)`,
                  transition:
                    phase === "spin"
                      ? `transform ${ROULETTE_SPIN_MS}ms cubic-bezier(0.08, 0.82, 0.18, 1)`
                      : "none",
                  filter: blur && phase === "spin" ? "blur(2.5px)" : "blur(0)",
                  transitionProperty: "transform, filter",
                  transitionDuration: `${ROULETTE_SPIN_MS}ms, 700ms`,
                  willChange: "transform, filter",
                }}
              >
                {items.map((it, i) => {
                  const isWinner = i === winnerIndex;
                  const popping = isWinner && (phase === "settle" || phase === "done");
                  const rarity = (it as any)?.rarity as "common" | "rare" | "epic" | "legendary" | undefined;
                  const rarityStyle =
                    rarity === "legendary"
                      ? {
                          ring: popping ? "ring-4 ring-amber-300" : "ring-2 ring-amber-400/90",
                          shadow: popping
                            ? "shadow-[0_0_38px_12px_rgba(251,191,36,0.85)]"
                            : "shadow-[0_0_18px_rgba(251,191,36,0.55)]",
                        }
                      : rarity === "epic"
                      ? {
                          ring: popping ? "ring-4 ring-violet-300" : "ring-2 ring-violet-400/90",
                          shadow: popping
                            ? "shadow-[0_0_34px_10px_rgba(167,139,250,0.80)]"
                            : "shadow-[0_0_16px_rgba(167,139,250,0.50)]",
                        }
                      : rarity === "rare"
                      ? {
                          ring: popping ? "ring-4 ring-sky-300" : "ring-2 ring-sky-400/90",
                          shadow: popping
                            ? "shadow-[0_0_30px_10px_rgba(56,189,248,0.75)]"
                            : "shadow-[0_0_14px_rgba(56,189,248,0.45)]",
                        }
                      : {
                          ring: popping ? "ring-2 ring-white/70" : "ring-1 ring-white/10",
                          shadow: popping
                            ? "shadow-[0_0_24px_8px_rgba(255,255,255,0.35)]"
                            : "shadow-lg shadow-black/40",
                        };
                  return (
                    <div
                      key={i}
                      className="grid place-items-center"
                      style={{ width: ROULETTE_ITEM, height: ROULETTE_ITEM }}
                    >
                      <div
                        className={cn(
                          "relative grid size-24 place-items-center overflow-hidden rounded-2xl",
                          "bg-gradient-to-br from-neutral-800 to-neutral-900",
                          rarityStyle.ring,
                          rarityStyle.shadow,
                        )}
                        style={popping ? { animation: "grab-pop 700ms cubic-bezier(0.22,1.4,0.36,1) forwards" } : undefined}
                      >
                        {it?.image_url ? (
                          <img
                            src={it.image_url}
                            alt=""
                            className="size-full object-cover"
                            draggable={false}
                          />
                        ) : (
                          <Gift className="size-9 text-neutral-500" />
                        )}
                        {/* gloss highlight */}
                        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* sparkle burst */}
              {(phase === "settle" || phase === "done") && (
                <div className="pointer-events-none absolute left-1/2 top-1/2 z-40">
                  {sparkles.map((s, i) => (
                    <span
                      key={i}
                      className="absolute left-0 top-0 block rounded-full"
                      style={{
                        width: s.size,
                        height: s.size,
                        background: s.hue,
                        boxShadow: `0 0 12px ${s.hue}`,
                        ["--tx" as never]: String(s.tx),
                        ["--ty" as never]: String(s.ty),
                        animation: `grab-spark-burst 1100ms ease-out ${s.delay}ms forwards`,
                      } as React.CSSProperties}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* footer / reveal */}
          <div className="mt-5 min-h-[120px] text-center">
            {phase === "done" ? (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="text-lg font-semibold tracking-tight">
                  {winner.name}
                  {res.prize_amount > 1 && (
                    <span className="ml-1.5 rounded-md bg-amber-400/20 px-1.5 py-0.5 text-sm text-amber-300">
                      x{res.prize_amount}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-neutral-300 ring-1 ring-white/10">
                  <span>{GRAB_PRIZE_KIND_LABEL[res.prize_kind]}</span>
                  <span className="text-neutral-600">·</span>
                  {res.was_paid ? (
                    <span className="inline-flex items-center gap-1">
                      <CoinIcon className="size-3" />
                      {res.cost_paid}
                    </span>
                  ) : (
                    <span className="text-amber-300">grátis · {res.free_remaining} restantes</span>
                  )}
                </div>
                <Button
                  className="relative mt-5 w-full overflow-hidden bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 hover:from-amber-400 hover:to-amber-400"
                  onClick={onClose}
                >
                  <span className="relative z-10 font-semibold">Continuar</span>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)",
                      backgroundSize: "200% 100%",
                      animation: "grab-title-shine 2.4s linear infinite",
                    }}
                  />
                </Button>
              </div>
            ) : (
              <p className="pt-5 text-xs text-neutral-400">
                {phase === "intro" && "A roleta está aquecendo..."}
                {phase === "spin" && "Girando..."}
                {phase === "settle" && "Selando o resultado..."}
              </p>
            )}
          </div>
        </div>
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