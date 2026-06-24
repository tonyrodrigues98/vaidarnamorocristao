import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Check,
  Gift,
  Loader2,
  PackageOpen,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PetImg } from "@/components/pet/PetImg";
import { cn } from "@/lib/utils";
import {
  claimPetAlbumCategory,
  getArcadeErrorMessage,
  getPetAlbumState,
  openPetAlbumPack,
  type PetAlbumState,
  type PetAlbumSticker,
} from "@/lib/petArcade";
import { ArcadePanel, type ArcadeGameProps } from "./ArcadeGameUi";
import { createArcadeClientSeed } from "./arcadeUiUtils";

import bgImage from "@/assets/pet-arcade/album-scene/album-bg.jpg";
import albumImage from "@/assets/pet-arcade/album-scene/album-main.png";
import lecternImage from "@/assets/pet-arcade/album-scene/album-lectern.png";

type ScenePhase = "idle" | "opening" | "revealing";

const RARITY_STYLE: Record<string, { ring: string; bg: string; glow: string; label: string }> = {
  common: {
    ring: "ring-neutral-300",
    bg: "bg-white",
    glow: "shadow-[0_8px_24px_rgba(15,23,42,0.35)]",
    label: "Comum",
  },
  uncommon: {
    ring: "ring-emerald-300",
    bg: "bg-emerald-50",
    glow: "shadow-[0_8px_24px_rgba(16,185,129,0.4)]",
    label: "Incomum",
  },
  rare: {
    ring: "ring-sky-300",
    bg: "bg-sky-50",
    glow: "shadow-[0_10px_30px_rgba(56,189,248,0.55)]",
    label: "Rara",
  },
  epic: {
    ring: "ring-violet-300",
    bg: "bg-violet-50",
    glow: "shadow-[0_12px_38px_rgba(139,92,246,0.6)]",
    label: "Épica",
  },
  legendary: {
    ring: "ring-amber-300",
    bg: "bg-amber-50",
    glow: "shadow-[0_14px_44px_rgba(245,158,11,0.7)]",
    label: "Lendária",
  },
};

/** Floating ember particles cascading upward through the archive air. */
function ParticleField({ count = 22 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 8,
        duration: 7 + Math.random() * 7,
        opacity: 0.3 + Math.random() * 0.55,
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
            boxShadow: "0 0 8px 2px rgba(251, 191, 36, 0.5)",
          }}
          animate={{ y: [0, -300, -360], opacity: [0, p.opacity, 0] }}
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

/** Warm volumetric god rays raking down from above the lectern. */
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
            "conic-gradient(from 200deg at 50% 0%, transparent 0deg, rgba(253,224,71,0.0) 30deg, rgba(253,224,71,0.45) 80deg, rgba(253,224,71,0.0) 130deg, transparent 360deg)",
          filter: "blur(20px)",
        }}
      />
    </div>
  );
}

/** Radial reveal burst when the album opens. */
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
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ mixBlendMode: "screen" }}
        >
          <div
            className="size-[460px]"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(253,224,71,0.7) 18%, rgba(244,114,182,0.32) 42%, transparent 68%)",
              filter: "blur(2px)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(255,255,255,0.9), rgba(255,255,255,0) 25%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 75%, rgba(255,255,255,0.9))",
              opacity: 0.55,
              filter: "blur(6px)",
            }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Closed/opening tome with halo and breathing motion. */
function CinematicAlbum({
  phase,
  reduceMotion,
}: {
  phase: ScenePhase;
  reduceMotion: boolean;
}) {
  const idleAnim =
    reduceMotion || phase !== "idle" ? {} : { y: [0, -6, 0], rotate: [-1.5, 1.5, -1.5] };
  const idleTransition =
    reduceMotion || phase !== "idle"
      ? undefined
      : { duration: 3.6, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <motion.div
      className="relative size-56"
      animate={idleAnim}
      transition={idleTransition}
    >
      {/* Ground shadow */}
      <div
        aria-hidden
        className="absolute bottom-0 left-1/2 h-6 w-44 -translate-x-1/2 translate-y-2 rounded-[50%] bg-black/50 blur-md"
      />
      {/* Halo behind the book */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-full"
        animate={
          reduceMotion
            ? {}
            : phase === "opening"
              ? { opacity: [0.6, 1, 0.6], scale: [1, 1.25, 1] }
              : { opacity: [0.35, 0.6, 0.35] }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: phase === "opening" ? 1 : 2.6, repeat: Infinity, ease: "easeInOut" }
        }
        style={{
          background:
            "radial-gradient(circle, rgba(253,224,71,0.65) 0%, rgba(244,114,182,0.3) 35%, transparent 70%)",
          filter: "blur(16px)",
        }}
      />
      <motion.img
        src={albumImage}
        alt=""
        draggable={false}
        loading="lazy"
        className="pointer-events-none size-full select-none object-contain drop-shadow-[0_22px_30px_rgba(15,23,42,0.6)]"
        animate={
          phase === "opening"
            ? { scale: [1, 1.08, 0.95], rotate: [-2, 4, -3] }
            : { scale: 1, rotate: 0 }
        }
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* Seam glow on opening */}
      <AnimatePresence>
        {phase === "opening" ? (
          <motion.div
            key="seam"
            aria-hidden
            initial={{ opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: [0, 1, 0.9], scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 h-44 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "linear-gradient(180deg, transparent, rgba(255,236,180,1), rgba(255,255,255,1), rgba(255,236,180,1), transparent)",
              boxShadow: "0 0 28px 10px rgba(253,224,71,0.7)",
              filter: "blur(1.2px)",
            }}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

/** Fanned arc of revealed stickers floating above the album. */
function StickerFan({
  stickers,
  reduceMotion,
}: {
  stickers: PetAlbumSticker[];
  reduceMotion: boolean;
}) {
  const count = stickers.length;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-30 flex justify-center">
      <div className="relative h-[260px] w-full max-w-[360px]">
        {stickers.map((s, i) => {
          const center = (count - 1) / 2;
          const offset = i - center;
          const rotate = offset * 9;
          const x = offset * 46;
          const y = Math.abs(offset) * 8;
          const rarity = RARITY_STYLE[s.rarity] ?? RARITY_STYLE.common;
          return (
            <motion.div
              key={`${s.id}-${i}`}
              initial={{ opacity: 0, scale: 0.4, y: 80, rotate: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                y,
                x,
                rotate: reduceMotion ? 0 : rotate,
              }}
              transition={{
                duration: 0.6,
                delay: i * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn(
                "absolute left-1/2 top-0 -translate-x-1/2 w-28 rounded-2xl ring-2 p-2",
                rarity.bg,
                rarity.ring,
                rarity.glow,
              )}
              style={{ transformOrigin: "bottom center" }}
            >
              <PetImg
                src={s.image_path}
                alt={s.name}
                className="aspect-square w-full rounded-xl object-contain"
              />
              <p className="mt-1.5 truncate text-[10px] font-black text-neutral-900">{s.name}</p>
              <p className="flex items-center justify-between text-[8px] uppercase text-neutral-500">
                <span>{rarity.label}</span>
                {s.is_new ? (
                  <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[7px] font-black text-amber-950">
                    NOVA
                  </span>
                ) : null}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseBadge({ phase, completion }: { phase: ScenePhase; completion: string }) {
  if (phase === "opening") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-neutral-900 shadow-lg backdrop-blur">
        <Sparkles className="size-3.5 animate-pulse text-amber-500" /> Abrindo pacote
      </span>
    );
  }
  if (phase === "revealing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-amber-950 shadow-lg backdrop-blur">
        <Sparkles className="size-3.5" /> Pacote revelado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur">
      <BookOpen className="size-3.5" /> Página {completion}
    </span>
  );
}

function CinematicButton({
  children,
  onClick,
  disabled,
  tone = "primary",
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "claim";
  icon: React.ReactNode;
}) {
  const palette =
    tone === "claim"
      ? "from-emerald-500 via-teal-500 to-cyan-500 shadow-[0_18px_38px_rgba(16,185,129,0.45)]"
      : "from-amber-500 via-orange-500 to-rose-500 shadow-[0_18px_38px_rgba(249,115,22,0.45)]";
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
        style={{ animation: disabled ? undefined : "album-shimmer 2.4s ease-in-out infinite" }}
      />
      <span className="relative z-10 inline-flex items-center justify-center gap-2 text-sm">
        {icon}
        {children}
      </span>
      <style>{`@keyframes album-shimmer { 0% { transform: translateX(-20%) skewX(-12deg); } 60%, 100% { transform: translateX(420%) skewX(-12deg); } }`}</style>
    </motion.button>
  );
}

export function PetAlbumGame({ config, balance, onBalanceChange, onFinished }: ArcadeGameProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [state, setState] = useState<PetAlbumState | null>(null);
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState<PetAlbumSticker[]>([]);
  const [phase, setPhase] = useState<ScenePhase>("idle");
  const phaseTimer = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await getPetAlbumState();
      setState(next);
      setCategory((current) => current || next.stickers[0]?.category || "");
    } catch {
      // silent — keep last state
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(
    () => () => {
      if (phaseTimer.current) window.clearTimeout(phaseTimer.current);
    },
    [],
  );

  const categories = useMemo(
    () => [...new Set((state?.stickers ?? []).map((s) => s.category))],
    [state],
  );
  const page = (state?.stickers ?? []).filter((s) => s.category === category);
  const complete = page.length > 0 && page.every((s) => s.quantity > 0);
  const claimed = state?.claimed.includes(`category:${category}`);
  const prices = (config.difficulty_config.pack_prices ?? {}) as Record<string, number>;
  const ownedOnPage = page.filter((s) => s.quantity > 0).length;
  const completion = page.length > 0 ? `${ownedOnPage}/${page.length}` : "—";

  async function buy(size: 3 | 5 | 10) {
    if (busy) return;
    setBusy(true);
    setOpened([]);
    setPhase("opening");
    try {
      const next = await openPetAlbumPack(size, createArcadeClientSeed());
      // Hold opening animation briefly so the burst reads
      await new Promise<void>((resolve) => {
        phaseTimer.current = window.setTimeout(() => resolve(), 900);
      });
      const cards = (next.result?.stickers as PetAlbumSticker[] | undefined) ?? [];
      setOpened(cards);
      setPhase("revealing");
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      await load();
      onFinished();
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
      setPhase("idle");
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    if (busy) return;
    setBusy(true);
    try {
      const next = await claimPetAlbumCategory(category);
      onBalanceChange(next.new_balance);
      await load();
      onFinished();
      toast.success(`Página completa: +${next.coins} moedas e +${next.xp} XP`);
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function resetReveal() {
    setOpened([]);
    setPhase("idle");
  }

  const burstActive = phase === "opening" || phase === "revealing";

  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<BookOpen className="size-5" />}
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
                  "radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(20,8,32,0.55) 75%, rgba(10,4,18,0.88) 100%)",
              }}
            />
            {/* Layer 2: god rays */}
            <GodRays intensity={phase === "idle" ? 1 : 1.4} />
            {/* Layer 3: ambient particles */}
            <ParticleField count={22} />

            {/* Status badge */}
            <div className="absolute left-1/2 top-4 z-40 -translate-x-1/2">
              <PhaseBadge phase={phase} completion={completion} />
            </div>

            {/* Lectern + album */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
              <div className="relative flex flex-col items-center">
                <img
                  src={lecternImage}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  className="pointer-events-none relative z-10 w-72 max-w-[80%] select-none object-contain drop-shadow-[0_28px_24px_rgba(0,0,0,0.55)]"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center">
                  <div className="pointer-events-auto relative">
                    <LightBurst active={burstActive} />
                    <CinematicAlbum phase={phase} reduceMotion={reduceMotion} />
                  </div>
                </div>
              </div>
            </div>

            {/* Reveal fan sits above everything */}
            <AnimatePresence>
              {phase === "revealing" && opened.length ? (
                <StickerFan stickers={opened} reduceMotion={reduceMotion} />
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* CONTROLS — reveal vs idle */}
        <AnimatePresence mode="wait">
          {phase === "revealing" ? (
            <motion.div
              key="reveal-controls"
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-[26px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-4 shadow-[0_18px_40px_rgba(251,146,60,0.18)]"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-300">
                  <Sparkles className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-neutral-950">
                    {opened.length} figurinhas reveladas
                  </p>
                  <p className="text-xs text-neutral-600">
                    {opened.filter((s) => s.is_new).length} novas para sua coleção
                  </p>
                </div>
              </div>
              <Button
                onClick={resetReveal}
                className="mt-4 h-12 w-full rounded-2xl bg-neutral-950 text-sm font-bold text-white hover:bg-neutral-800"
              >
                Guardar no álbum
              </Button>
            </motion.div>
          ) : phase === "opening" ? (
            <motion.div
              key="opening-status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-100/60 px-4 py-3 text-sm font-bold text-amber-900"
            >
              <Sparkles className="size-4 animate-pulse" />
              Selando o pacote...
            </motion.div>
          ) : (
            <motion.div
              key="idle-controls"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-3"
            >
              <div className="grid grid-cols-3 gap-2">
                {([3, 5, 10] as const).map((size) => {
                  const price = Number(prices[String(size)] ?? config.min_entry);
                  const can = balance >= price;
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={busy || !can}
                      onClick={() => void buy(size)}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl border-2 p-3 text-left transition",
                        can
                          ? "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 hover:border-amber-400 hover:shadow-lg"
                          : "border-neutral-200 bg-neutral-50 opacity-60",
                      )}
                    >
                      <PackageOpen className="size-4 text-amber-700" />
                      <p className="mt-1 text-xs font-black text-neutral-900">Pacote {size}</p>
                      <p className="text-[10px] text-neutral-600">{price} moedas</p>
                    </button>
                  );
                })}
              </div>
              {complete && !claimed ? (
                <CinematicButton
                  onClick={() => void claim()}
                  disabled={busy}
                  tone="claim"
                  icon={busy ? <Loader2 className="size-5 animate-spin" /> : <Gift className="size-5" />}
                >
                  Resgatar página completa
                </CinematicButton>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CATEGORY TABS */}
        {categories.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-4 text-xs font-bold transition",
                  c === category
                    ? "bg-neutral-900 text-white shadow-md"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        ) : null}

        {/* PAGE GRID */}
        {page.length > 0 ? (
          <div className="rounded-[26px] border border-amber-100 bg-gradient-to-br from-amber-50/60 via-white to-rose-50/60 p-3 shadow-inner">
            <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-neutral-600">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="size-3.5" />
                {category}
              </span>
              <span>
                {ownedOnPage}/{page.length}
                {claimed ? (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                    <Check className="size-3" /> Resgatado
                  </span>
                ) : null}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {page.map((s) => {
                const rarity = RARITY_STYLE[s.rarity] ?? RARITY_STYLE.common;
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "relative aspect-[0.78] overflow-hidden rounded-2xl border p-1",
                      s.quantity > 0
                        ? `${rarity.bg} ${rarity.ring} ring-2 border-transparent`
                        : "border-neutral-200 bg-neutral-100",
                    )}
                  >
                    <PetImg
                      src={s.image_path}
                      alt={s.name}
                      className={cn(
                        "size-full object-contain",
                        s.quantity === 0 && "opacity-25 blur-[2px] grayscale",
                      )}
                    />
                    {s.quantity > 0 ? (
                      <span className="absolute right-1 top-1 rounded-full bg-white px-1.5 text-[9px] font-black shadow-sm">
                        x{s.quantity}
                      </span>
                    ) : (
                      <span className="absolute inset-x-1 bottom-1 rounded-md bg-black/60 py-0.5 text-center text-[8px] font-bold uppercase text-white">
                        ?
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </ArcadePanel>
  );
}