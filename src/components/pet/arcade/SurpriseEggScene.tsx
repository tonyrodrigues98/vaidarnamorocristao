import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Coins, Egg, Loader2, PackageOpen, Sparkles, Timer, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  claimPetSurpriseEgg,
  getArcadeErrorMessage,
  getPetAlbumState,
  startPetSurpriseEgg,
  type ArcadeGameResult,
  type PetAlbumState,
} from "@/lib/petArcade";
import { ArcadePanel, type ArcadeGameProps } from "./ArcadeGameUi";

import bgImage from "@/assets/pet-arcade/egg-scene/egg-bg.jpg";
import eggImage from "@/assets/pet-arcade/egg-scene/egg-main.png";
import pedestalImage from "@/assets/pet-arcade/egg-scene/egg-pedestal.png";

type SceneState = "empty" | "incubating" | "ready" | "opening" | "revealed";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Pronto";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

/**
 * Floating ambient particles. Generated once and memoized so layout doesn't
 * jitter when the scene re-renders during state transitions.
 */
function ParticleField({ count = 18 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 6,
        duration: 6 + Math.random() * 6,
        opacity: 0.35 + Math.random() * 0.5,
      })),
    [count],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-amber-200"
          style={{
            left: `${p.left}%`,
            bottom: -10,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            boxShadow: "0 0 8px 2px rgba(251, 191, 36, 0.45)",
          }}
          animate={{
            y: [0, -260, -320],
            opacity: [0, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Volumetric god rays cascading from above. Pure CSS; sits over the bg image
 * with mix-blend-mode: screen so it brightens dark areas without flattening.
 */
function GodRays({ intensity = 1 }: { intensity?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-full"
      style={{ mixBlendMode: "screen", opacity: 0.55 * intensity }}
    >
      <div
        className="absolute left-1/2 top-0 h-[110%] w-[120%] -translate-x-1/2"
        style={{
          background:
            "conic-gradient(from 200deg at 50% 0%, transparent 0deg, rgba(253,224,71,0.0) 30deg, rgba(253,224,71,0.5) 80deg, rgba(253,224,71,0.0) 130deg, transparent 360deg)",
          filter: "blur(18px)",
        }}
      />
    </div>
  );
}

/**
 * Radial light burst used for the reveal moment.
 * Pure CSS to avoid the asset-removal-killed-the-rays problem.
 */
function LightBurst({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="burst"
          aria-hidden
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: [0, 1, 0.85], scale: [0.2, 1.4, 1.2] }}
          exit={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ mixBlendMode: "screen" }}
        >
          <div
            className="size-[420px]"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(253,224,71,0.7) 18%, rgba(251,146,60,0.35) 38%, transparent 65%)",
              filter: "blur(2px)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(255,255,255,0.9), rgba(255,255,255,0) 25%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 75%, rgba(255,255,255,0.9))",
              opacity: 0.6,
              filter: "blur(6px)",
            }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * The egg itself. Cinematic split using clip-path on two stacked layers of
 * the same PNG — one top half, one bottom half — so the asset reads as a
 * single object until it cracks open.
 */
function CinematicEgg({
  state,
  reduceMotion,
  onTap,
}: {
  state: SceneState;
  reduceMotion: boolean;
  onTap?: () => void;
}) {
  const interactive = state === "ready" && Boolean(onTap);
  const idleAnim =
    reduceMotion || state === "opening"
      ? {}
      : state === "ready"
        ? { y: [0, -10, 0], rotate: [-2, 2, -2] }
        : { y: [0, -6, 0] };
  const idleTransition =
    reduceMotion || state === "opening"
      ? undefined
      : state === "ready"
        ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" as const }
        : { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <motion.button
      type="button"
      onClick={interactive ? onTap : undefined}
      disabled={!interactive}
      aria-label={interactive ? "Tocar para abrir o ovo" : "Ovo"}
      className={cn(
        "group relative size-56 bg-transparent p-0",
        interactive ? "cursor-pointer" : "cursor-default",
      )}
      animate={idleAnim}
      transition={idleTransition}
    >
      {/* Ground shadow */}
      <div
        aria-hidden
        className="absolute bottom-0 left-1/2 h-6 w-40 -translate-x-1/2 translate-y-2 rounded-[50%] bg-black/40 blur-md"
      />

      {/* Halo behind the egg */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-full"
        animate={
          reduceMotion
            ? {}
            : state === "ready"
              ? { opacity: [0.6, 1, 0.6], scale: [1, 1.15, 1] }
              : { opacity: [0.35, 0.6, 0.35] }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: state === "ready" ? 1.2 : 2.4, repeat: Infinity, ease: "easeInOut" }
        }
        style={{
          background:
            "radial-gradient(circle, rgba(253,224,71,0.65) 0%, rgba(251,146,60,0.35) 35%, transparent 70%)",
          filter: "blur(14px)",
        }}
      />

      {/* Top half */}
      <motion.img
        src={eggImage}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full select-none object-contain drop-shadow-[0_18px_28px_rgba(15,23,42,0.55)]"
        style={{ clipPath: "inset(0 0 50% 0)" }}
        animate={
          state === "opening"
            ? { y: -90, rotate: -18, opacity: [1, 1, 0] }
            : state === "revealed"
              ? { opacity: 0 }
              : { y: 0, rotate: 0, opacity: 1 }
        }
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* Bottom half */}
      <motion.img
        src={eggImage}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full select-none object-contain drop-shadow-[0_18px_28px_rgba(15,23,42,0.55)]"
        style={{ clipPath: "inset(50% 0 0 0)" }}
        animate={
          state === "opening"
            ? { y: 60, rotate: 14, opacity: [1, 1, 0] }
            : state === "revealed"
              ? { opacity: 0 }
              : { y: 0, rotate: 0, opacity: 1 }
        }
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Crack glow seam reveal */}
      <AnimatePresence>
        {state === "ready" || state === "opening" ? (
          <motion.div
            key="seam"
            aria-hidden
            initial={{ opacity: 0, scaleX: 0.2 }}
            animate={{ opacity: state === "opening" ? [0, 1, 0.9] : [0.4, 0.9, 0.4], scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: state === "opening" ? 0.6 : 1.6, repeat: state === "ready" ? Infinity : 0, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 h-2 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,236,180,1), rgba(255,255,255,1), rgba(255,236,180,1), transparent)",
              boxShadow: "0 0 30px 10px rgba(253,224,71,0.7)",
              filter: "blur(1px)",
            }}
          />
        ) : null}
      </AnimatePresence>
    </motion.button>
  );
}

export function SurpriseEggGame({
  config,
  balance,
  onBalanceChange,
  onFinished,
}: ArcadeGameProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [state, setState] = useState<PetAlbumState | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ArcadeGameResult | null>(null);
  const [now, setNow] = useState(Date.now());
  const [overridePhase, setOverridePhase] = useState<"opening" | "revealed" | null>(null);
  const phaseTimer = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      setState(await getPetAlbumState());
    } catch {
      setState(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(
    () => () => {
      if (phaseTimer.current) window.clearTimeout(phaseTimer.current);
    },
    [],
  );

  const egg = state?.egg;
  const remaining = egg ? Math.max(0, new Date(egg.open_after).getTime() - now) : 0;
  const instantEnabled = Boolean(config.difficulty_config.instant_open_enabled);
  const instantCost = Number(config.difficulty_config.instant_open_cost ?? 0);

  // Derive the visual phase from state every render. Only "opening" and
  // "revealed" are local UI overrides we drive imperatively.
  const phase: SceneState = overridePhase
    ? overridePhase
    : !egg
      ? "empty"
      : remaining === 0
        ? "ready"
        : "incubating";

  async function buy() {
    setBusy(true);
    try {
      const next = await startPetSurpriseEgg(config.min_entry);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      await load();
      onFinished();
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function open(instant = false) {
    if (!egg || busy) return;
    setBusy(true);
    setOverridePhase("opening");
    try {
      const next = await claimPetSurpriseEgg(egg.id, instant);
      // Hold the opening animation briefly so the burst reads.
      await new Promise<void>((resolve) => {
        phaseTimer.current = window.setTimeout(() => resolve(), 850);
      });
      setResult(next);
      setOverridePhase("revealed");
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      await load();
      onFinished();
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
      setOverridePhase(null);
    } finally {
      setBusy(false);
    }
  }

  function resetReveal() {
    setResult(null);
    setOverridePhase(null);
  }

  const burstActive = phase === "opening" || phase === "revealed";
  const rewardCoins = Number(result?.reward_coins ?? 0);
  const rewardXp = Number(result?.xp_reward ?? 0);

  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<Egg className="size-5" />}
    >
      <div className="space-y-4">
        {/* CINEMATIC STAGE */}
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 shadow-[0_28px_70px_rgba(15,23,42,0.45)]">
          <div className="relative aspect-[4/5] w-full">
            {/* Layer 0: background scene */}
            <img
              src={bgImage}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
              draggable={false}
            />
            {/* Layer 1: depth vignette */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(15,12,40,0.55) 75%, rgba(8,5,24,0.85) 100%)",
              }}
            />
            {/* Layer 2: god rays */}
            <GodRays intensity={phase === "ready" || phase === "opening" ? 1.4 : 1} />
            {/* Layer 3: ambient particles */}
            <ParticleField count={20} />

            {/* Status badge */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2">
              <PhaseBadge phase={phase} remaining={remaining} hasEgg={Boolean(egg)} />
            </div>

            {/* Pedestal + egg */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
              <div className="relative flex flex-col items-center">
                {/* Pedestal first so the egg overlaps in front of it */}
                <img
                  src={pedestalImage}
                  alt=""
                  draggable={false}
                  className="pointer-events-none relative z-10 w-72 max-w-[80%] select-none object-contain drop-shadow-[0_28px_24px_rgba(0,0,0,0.55)]"
                />
                {/* Egg sits in front of the pedestal, anchored over its top */}
                <div className="pointer-events-none absolute inset-x-0 bottom-16 z-20 flex justify-center">
                  <div className="pointer-events-auto relative">
                    <LightBurst active={burstActive} />
                    {phase !== "revealed" || !result ? (
                      <CinematicEgg
                        state={phase}
                        reduceMotion={reduceMotion}
                        onTap={() => void open(false)}
                      />
                    ) : null}
                    <AnimatePresence>
                      {phase === "revealed" && result ? (
                        <RewardOrb
                          key="reward"
                          reduceMotion={reduceMotion}
                          coins={rewardCoins}
                          xp={rewardXp}
                        />
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <AnimatePresence mode="wait">
          {phase === "revealed" && result ? (
            <motion.div
              key="reveal"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-[26px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 shadow-[0_18px_40px_rgba(251,146,60,0.18)]"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-300">
                  <Sparkles className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-black text-neutral-950">Recompensa revelada!</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
                      <Coins className="size-3.5 text-amber-600" /> {rewardCoins} moedas
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
                      <Sparkles className="size-3.5 text-violet-600" /> +{rewardXp} XP
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={resetReveal}
                className="mt-4 h-12 w-full rounded-2xl bg-neutral-950 text-sm font-bold text-white hover:bg-neutral-800"
              >
                Coletar e continuar
              </Button>
            </motion.div>
          ) : phase === "ready" ? (
            <motion.div key="ready" className="grid gap-2">
              <CinematicButton
                onClick={() => void open(false)}
                disabled={busy}
                tone="open"
                icon={busy ? <Loader2 className="size-5 animate-spin" /> : <PackageOpen className="size-5" />}
              >
                Abrir ovo
              </CinematicButton>
            </motion.div>
          ) : phase === "incubating" ? (
            <motion.div key="incubating" className="grid gap-2">
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50/70 px-4 py-3 text-sm font-bold text-violet-900">
                <Timer className="size-4" />
                Pronto em {formatRemaining(remaining)}
              </div>
              {instantEnabled ? (
                <Button
                  variant="outline"
                  onClick={() => void open(true)}
                  disabled={busy || balance < instantCost}
                  className="h-11 rounded-2xl border-amber-200 bg-amber-50 font-bold text-amber-900 hover:bg-amber-100"
                >
                  <Zap className="size-4" />
                  Abrir agora · {instantCost} moedas
                </Button>
              ) : null}
            </motion.div>
          ) : phase === "opening" ? (
            <motion.div
              key="opening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-100/60 px-4 py-3 text-sm font-bold text-amber-900"
            >
              <Sparkles className="size-4 animate-pulse" />
              Abrindo…
            </motion.div>
          ) : (
            <motion.div key="empty" className="grid gap-2">
              <CinematicButton
                onClick={() => void buy()}
                disabled={busy || balance < config.min_entry}
                tone="buy"
                icon={busy ? <Loader2 className="size-5 animate-spin" /> : <Egg className="size-5" />}
              >
                Comprar ovo · {config.min_entry} moedas
              </CinematicButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ArcadePanel>
  );
}

function PhaseBadge({
  phase,
  remaining,
  hasEgg,
}: {
  phase: SceneState;
  remaining: number;
  hasEgg: boolean;
}) {
  if (phase === "revealed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-amber-950 shadow-lg backdrop-blur">
        <Sparkles className="size-3.5" /> Revelado
      </span>
    );
  }
  if (phase === "opening") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-neutral-900 shadow-lg backdrop-blur">
        <Sparkles className="size-3.5 animate-pulse text-amber-500" /> Abrindo
      </span>
    );
  }
  if (!hasEgg) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur">
        <Egg className="size-3.5" /> Altar vazio
      </span>
    );
  }
  if (phase === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-950 shadow-lg backdrop-blur">
        <Sparkles className="size-3.5" /> Pronto para abrir
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur">
      <Timer className="size-3.5" /> {formatRemaining(remaining)}
    </span>
  );
}

function RewardOrb({
  reduceMotion,
  coins,
  xp,
}: {
  reduceMotion: boolean;
  coins: number;
  xp: number;
}) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0, scale: 0.6 }}
      animate={{
        y: reduceMotion ? -20 : [-10, -30, -20],
        opacity: 1,
        scale: 1,
      }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
    >
      <div
        className="grid size-32 place-items-center rounded-full text-white shadow-[0_20px_60px_rgba(251,191,36,0.65)]"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(253,224,71,0.85) 35%, rgba(245,158,11,0.95) 80%)",
        }}
      >
        <div className="text-center">
          <Coins className="mx-auto size-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" />
          <div className="text-base font-black leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            +{coins}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-wider opacity-90">+{xp} XP</div>
        </div>
      </div>
    </motion.div>
  );
}

function CinematicButton({
  children,
  onClick,
  disabled,
  tone,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone: "open" | "buy";
  icon: React.ReactNode;
}) {
  const palette =
    tone === "open"
      ? "from-amber-500 via-orange-500 to-rose-500 shadow-[0_18px_38px_rgba(249,115,22,0.45)]"
      : "from-violet-600 via-fuchsia-600 to-rose-500 shadow-[0_18px_38px_rgba(139,92,246,0.45)]";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative h-14 w-full overflow-hidden rounded-2xl bg-gradient-to-r font-black text-white",
        "disabled:opacity-60",
        palette,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 -left-10 w-16 -skew-x-12 bg-white/30 blur-md"
        style={{ animation: disabled ? undefined : "egg-shimmer 2.4s ease-in-out infinite" }}
      />
      <span className="relative z-10 inline-flex items-center justify-center gap-2 text-sm">
        {icon}
        {children}
      </span>
      <style>{`@keyframes egg-shimmer { 0% { transform: translateX(-20%) skewX(-12deg); } 60%, 100% { transform: translateX(420%) skewX(-12deg); } }`}</style>
    </motion.button>
  );
}