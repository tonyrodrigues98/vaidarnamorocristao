import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
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
import bookImage from "@/assets/pet-arcade/album-scene/open-book.png";
import packImage from "@/assets/pet-arcade/album-scene/card-pack.png";

type ScenePhase = "idle" | "tearing" | "revealing";
const SLOTS_PER_SPREAD = 6;

const RARITY_STYLE: Record<
  string,
  { ring: string; bg: string; glow: string; label: string; chip: string }
> = {
  common: {
    ring: "ring-neutral-300",
    bg: "bg-white",
    glow: "shadow-[0_8px_24px_rgba(15,23,42,0.35)]",
    label: "Comum",
    chip: "bg-neutral-200 text-neutral-700",
  },
  uncommon: {
    ring: "ring-emerald-300",
    bg: "bg-emerald-50",
    glow: "shadow-[0_8px_24px_rgba(16,185,129,0.4)]",
    label: "Incomum",
    chip: "bg-emerald-200 text-emerald-800",
  },
  rare: {
    ring: "ring-sky-300",
    bg: "bg-sky-50",
    glow: "shadow-[0_10px_30px_rgba(56,189,248,0.55)]",
    label: "Rara",
    chip: "bg-sky-200 text-sky-800",
  },
  epic: {
    ring: "ring-violet-300",
    bg: "bg-violet-50",
    glow: "shadow-[0_12px_38px_rgba(139,92,246,0.6)]",
    label: "Épica",
    chip: "bg-violet-200 text-violet-800",
  },
  legendary: {
    ring: "ring-amber-300",
    bg: "bg-amber-50",
    glow: "shadow-[0_14px_44px_rgba(245,158,11,0.7)]",
    label: "Lendária",
    chip: "bg-amber-200 text-amber-900",
  },
};

type Spread = {
  key: string;
  category: string;
  stickers: PetAlbumSticker[];
  pageNum: number;
  totalPages: number;
  ownedOnCategory: number;
  totalInCategory: number;
  categoryComplete: boolean;
};

/** Floating ember particles. */
function ParticleField({ count = 18 }: { count?: number }) {
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
          animate={{ y: [0, -260, -340], opacity: [0, p.opacity, 0] }}
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

/** Single slot on the right page (collected or silhouette). */
function StickerSlot({
  sticker,
  justRevealed,
}: {
  sticker?: PetAlbumSticker;
  justRevealed?: boolean;
}) {
  if (!sticker) {
    return (
      <div className="grid aspect-[3/4] place-items-center rounded-md border border-amber-900/15 bg-amber-50/40 text-amber-900/30">
        <Sparkles className="size-4" />
      </div>
    );
  }
  const owned = sticker.quantity > 0;
  const rarity = RARITY_STYLE[sticker.rarity] ?? RARITY_STYLE.common;
  return (
    <motion.div
      initial={justRevealed ? { scale: 0.6, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative grid aspect-[3/4] place-items-center overflow-hidden rounded-md border p-0.5",
        owned
          ? `${rarity.bg} ${rarity.ring} ring-1 border-transparent ${justRevealed ? rarity.glow : ""}`
          : "border-amber-900/20 bg-amber-50/60",
      )}
    >
      <PetImg
        src={sticker.image_path}
        alt={sticker.name}
        className={cn("size-full object-contain", !owned && "opacity-20 blur-[1.5px] grayscale")}
      />
      <span
        className={cn(
          "absolute inset-x-0 bottom-0 truncate px-1 text-center text-[8px] font-bold",
          owned ? "bg-black/70 text-amber-100" : "bg-amber-900/30 text-amber-50",
        )}
      >
        {owned ? sticker.name : "???"}
      </span>
      {owned && sticker.quantity > 1 ? (
        <span className="absolute right-0.5 top-0.5 rounded-full bg-white px-1 text-[8px] font-black shadow">
          x{sticker.quantity}
        </span>
      ) : null}
    </motion.div>
  );
}

/** A single book spread (page contents). Designed to be flipped. */
function BookSpread({
  spread,
  newlyRevealedIds,
  onClaim,
  claimed,
  busy,
}: {
  spread: Spread | null;
  newlyRevealedIds: Set<string>;
  onClaim: () => void;
  claimed: boolean;
  busy: boolean;
}) {
  if (!spread) {
    return (
      <div className="grid h-full place-items-center text-amber-900/50">
        <p className="text-xs font-bold uppercase tracking-wide">Álbum vazio</p>
      </div>
    );
  }
  const slots = Array.from({ length: SLOTS_PER_SPREAD }, (_, i) => spread.stickers[i]);
  return (
    <div className="grid h-full w-full grid-cols-2 gap-1">
      {/* LEFT PAGE — title + meta */}
      <div className="flex h-full flex-col justify-between px-3 py-4 text-amber-950">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-700/80">
            Espécie
          </p>
          <h3
            className="mt-1 break-words font-serif text-lg font-black leading-tight"
            style={{ fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' }}
          >
            {spread.category}
          </h3>
          <div className="mt-2 h-px w-full bg-amber-800/30" />
          <p className="mt-2 text-[10px] italic text-amber-800/80">
            "Cada figura é um capítulo desta jornada."
          </p>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-amber-900">
            <span>Coletadas</span>
            <span>
              {spread.ownedOnCategory}/{spread.totalInCategory}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-amber-900/15">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
              style={{
                width: `${
                  spread.totalInCategory
                    ? (spread.ownedOnCategory / spread.totalInCategory) * 100
                    : 0
                }%`,
              }}
            />
          </div>
          {spread.categoryComplete ? (
            claimed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                <Check className="size-3" /> Resgatada
              </span>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={onClaim}
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-2 py-1 text-[9px] font-black text-white shadow disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-3 animate-spin" /> : <Gift className="size-3" />}
                Resgatar
              </button>
            )
          ) : (
            <p className="text-[9px] text-amber-800/70">Complete para ganhar moedas e XP.</p>
          )}
        </div>
      </div>

      {/* RIGHT PAGE — sticker slots */}
      <div className="flex h-full flex-col px-3 py-4">
        <div className="grid grid-cols-3 gap-1.5">
          {slots.map((s, i) => (
            <StickerSlot
              key={s?.id ?? `empty-${i}`}
              sticker={s}
              justRevealed={s ? newlyRevealedIds.has(s.id) : false}
            />
          ))}
        </div>
        <div className="mt-auto flex items-center justify-end pt-2 text-[9px] font-bold text-amber-800/70">
          pg. {spread.pageNum}/{spread.totalPages}
        </div>
      </div>
    </div>
  );
}

/** Pack tearing open + cards bursting out overlay. */
function PackTearOverlay({
  phase,
  opened,
  reduceMotion,
  onClose,
}: {
  phase: ScenePhase;
  opened: PetAlbumSticker[];
  reduceMotion: boolean;
  onClose: () => void;
}) {
  if (phase === "idle") return null;
  const tearing = phase === "tearing";
  const revealing = phase === "revealing";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/80 backdrop-blur-sm"
    >
      {/* Burst light */}
      <AnimatePresence>
        {revealing ? (
          <motion.div
            key="burst"
            aria-hidden
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 1, 0.85], scale: [0.2, 1.6, 1.3] }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute size-[420px]"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(253,224,71,0.7) 22%, rgba(244,114,182,0.32) 48%, transparent 72%)",
              mixBlendMode: "screen",
              filter: "blur(2px)",
            }}
          />
        ) : null}
      </AnimatePresence>

      <ParticleField count={30} />

      {/* PACK — tearing */}
      <AnimatePresence>
        {tearing ? (
          <motion.div
            key="pack"
            className="relative h-[70%] w-auto"
            initial={{ scale: 0.4, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ aspectRatio: "768/1152" }}
          >
            {/* Shake briefly */}
            <motion.div
              className="relative h-full w-full"
              animate={
                reduceMotion ? {} : { rotate: [0, -2, 2, -2, 2, 0], x: [0, -3, 3, -3, 3, 0] }
              }
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              {/* Left half */}
              <motion.div
                className="absolute inset-0"
                style={{
                  clipPath:
                    "polygon(0% 0%, 52% 0%, 48% 12%, 54% 24%, 46% 36%, 53% 48%, 47% 60%, 54% 72%, 46% 84%, 52% 100%, 0% 100%)",
                  transformOrigin: "left center",
                }}
                initial={{ x: 0, rotate: 0 }}
                animate={{ x: [0, 0, -120], rotate: [0, 0, -18], opacity: [1, 1, 0] }}
                transition={{ duration: 1.3, times: [0, 0.55, 1], ease: "easeIn" }}
              >
                <img
                  src={packImage}
                  alt=""
                  draggable={false}
                  className="h-full w-full select-none object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
                />
              </motion.div>
              {/* Right half */}
              <motion.div
                className="absolute inset-0"
                style={{
                  clipPath:
                    "polygon(52% 0%, 100% 0%, 100% 100%, 52% 100%, 46% 84%, 54% 72%, 47% 60%, 53% 48%, 46% 36%, 54% 24%, 48% 12%)",
                  transformOrigin: "right center",
                }}
                initial={{ x: 0, rotate: 0 }}
                animate={{ x: [0, 0, 120], rotate: [0, 0, 18], opacity: [1, 1, 0] }}
                transition={{ duration: 1.3, times: [0, 0.55, 1], ease: "easeIn" }}
              >
                <img
                  src={packImage}
                  alt=""
                  draggable={false}
                  className="h-full w-full select-none object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
                />
              </motion.div>
              {/* Glowing tear seam */}
              <motion.div
                aria-hidden
                className="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2"
                initial={{ opacity: 0, scaleY: 0.2 }}
                animate={{ opacity: [0, 1, 1, 0], scaleY: [0.2, 1, 1, 1.2] }}
                transition={{ duration: 1.3, times: [0, 0.45, 0.7, 1] }}
                style={{
                  background:
                    "linear-gradient(180deg, transparent, rgba(255,236,180,1), rgba(255,255,255,1), rgba(255,236,180,1), transparent)",
                  boxShadow: "0 0 28px 10px rgba(253,224,71,0.8)",
                  filter: "blur(1px)",
                  mixBlendMode: "screen",
                }}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* CARDS BURST */}
      <AnimatePresence>
        {revealing ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-[78%] w-full max-w-[440px]">
              {opened.map((s, i) => {
                const count = opened.length;
                const center = (count - 1) / 2;
                const offset = i - center;
                const rotate = offset * 8;
                const x = offset * 38;
                const y = Math.abs(offset) * 6;
                const rarity = RARITY_STYLE[s.rarity] ?? RARITY_STYLE.common;
                return (
                  <motion.div
                    key={`${s.id}-${i}`}
                    initial={{ opacity: 0, scale: 0.3, y: 0, x: 0, rotate: 0 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y,
                      x,
                      rotate: reduceMotion ? 0 : rotate,
                    }}
                    transition={{
                      duration: 0.65,
                      delay: i * 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={cn(
                      "pointer-events-auto absolute left-1/2 top-1/2 w-28 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-2 ring-2",
                      rarity.bg,
                      rarity.ring,
                      rarity.glow,
                    )}
                    style={{ transformOrigin: "center" }}
                  >
                    <PetImg
                      src={s.image_path}
                      alt={s.name}
                      className="aspect-square w-full rounded-xl object-contain"
                    />
                    <p className="mt-1.5 truncate text-[10px] font-black text-neutral-900">
                      {s.name}
                    </p>
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
        ) : null}
      </AnimatePresence>

      {/* CLOSE BUTTON */}
      {revealing ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + opened.length * 0.1 }}
          className="absolute inset-x-4 bottom-4 z-10 flex justify-center"
        >
          <Button
            onClick={onClose}
            className="h-12 w-full max-w-xs rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-sm font-black text-white shadow-xl"
          >
            <Sparkles className="mr-1.5 size-4" /> Guardar no álbum
          </Button>
        </motion.div>
      ) : null}
    </motion.div>
  );
}

export function PetAlbumGame({ config, balance, onBalanceChange, onFinished }: ArcadeGameProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [state, setState] = useState<PetAlbumState | null>(null);
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState<PetAlbumSticker[]>([]);
  const [phase, setPhase] = useState<ScenePhase>("idle");
  const phaseTimer = useRef<number | null>(null);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [flipDir, setFlipDir] = useState<1 | -1>(1);

  const load = useCallback(async () => {
    try {
      const next = await getPetAlbumState();
      setState(next);
    } catch {
      // silent
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

  const spreads: Spread[] = useMemo(() => {
    const all = state?.stickers ?? [];
    const categories = [...new Set(all.map((s) => s.category))];
    const out: Spread[] = [];
    for (const cat of categories) {
      const items = all.filter((s) => s.category === cat);
      const ownedOnCategory = items.filter((s) => s.quantity > 0).length;
      const totalPages = Math.max(1, Math.ceil(items.length / SLOTS_PER_SPREAD));
      for (let p = 0; p < totalPages; p++) {
        out.push({
          key: `${cat}-${p}`,
          category: cat,
          stickers: items.slice(p * SLOTS_PER_SPREAD, (p + 1) * SLOTS_PER_SPREAD),
          pageNum: p + 1,
          totalPages,
          ownedOnCategory,
          totalInCategory: items.length,
          categoryComplete: items.length > 0 && ownedOnCategory === items.length,
        });
      }
    }
    return out;
  }, [state]);

  const currentSpread = spreads[Math.min(spreadIndex, Math.max(0, spreads.length - 1))] ?? null;
  const claimed = currentSpread
    ? (state?.claimed.includes(`category:${currentSpread.category}`) ?? false)
    : false;
  const prices = (config.difficulty_config.pack_prices ?? {}) as Record<string, number>;

  const newlyRevealedIds = useMemo(() => new Set(opened.map((s) => s.id)), [opened]);

  function flipTo(next: number) {
    if (next < 0 || next >= spreads.length) return;
    setFlipDir(next > spreadIndex ? 1 : -1);
    setSpreadIndex(next);
  }

  async function buy(size: 3 | 5 | 10) {
    if (busy) return;
    setBusy(true);
    setOpened([]);
    setPhase("tearing");
    try {
      const next = await openPetAlbumPack(size, createArcadeClientSeed());
      // Hold tearing animation
      await new Promise<void>((resolve) => {
        phaseTimer.current = window.setTimeout(() => resolve(), 1300);
      });
      const cards = (next.result?.stickers as PetAlbumSticker[] | undefined) ?? [];
      setOpened(cards);
      setPhase("revealing");
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      await load();
      onFinished();
      // Jump to the spread of the first revealed sticker
      const firstCat = cards[0]?.category;
      if (firstCat) {
        const idx = spreads.findIndex((s) => s.category === firstCat);
        if (idx >= 0) setSpreadIndex(idx);
      }
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
      setPhase("idle");
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    if (busy || !currentSpread) return;
    setBusy(true);
    try {
      const next = await claimPetAlbumCategory(currentSpread.category);
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

  function closeReveal() {
    setOpened([]);
    setPhase("idle");
  }

  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<BookOpen className="size-5" />}
    >
      <div className="space-y-4">
        {/* CINEMATIC STAGE */}
        <div
          className="relative overflow-hidden rounded-[28px] border border-white/10 shadow-[0_24px_60px_rgba(15,23,42,0.45)]"
          style={{ perspective: 1400 }}
        >
          {/* Background scene */}
          <img
            src={bgImage}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
            draggable={false}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 35%, transparent 25%, rgba(20,8,32,0.55) 75%, rgba(10,4,18,0.9) 100%)",
            }}
          />
          <ParticleField count={16} />

          {/* Header strip */}
          <div className="relative z-10 flex items-center justify-between gap-2 px-3 pt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur">
              <BookOpen className="size-3" /> Álbum
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-900 shadow-lg backdrop-blur">
              {spreads.length} {spreads.length === 1 ? "página" : "páginas"}
            </span>
          </div>

          {/* BOOK + pages */}
          <div className="relative z-10 mx-auto w-full max-w-[480px] px-2 pb-3 pt-2">
            <div className="relative aspect-[1536/1152] w-full">
              <img
                src={bookImage}
                alt="Álbum aberto"
                draggable={false}
                loading="lazy"
                className="pointer-events-none absolute inset-0 size-full select-none object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]"
              />
              {/* Pages content layered over the book art */}
              <div
                className="absolute"
                style={{
                  left: "6.5%",
                  right: "6.5%",
                  top: "8%",
                  bottom: "8%",
                  transformStyle: "preserve-3d",
                }}
              >
                <AnimatePresence mode="wait" custom={flipDir}>
                  <motion.div
                    key={currentSpread?.key ?? "empty"}
                    custom={flipDir}
                    initial={{
                      rotateY: flipDir > 0 ? 80 : -80,
                      opacity: 0,
                    }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{
                      rotateY: flipDir > 0 ? -80 : 80,
                      opacity: 0,
                    }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                    style={{
                      transformOrigin: flipDir > 0 ? "left center" : "right center",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <BookSpread
                      spread={currentSpread}
                      newlyRevealedIds={newlyRevealedIds}
                      onClaim={() => void claim()}
                      claimed={claimed}
                      busy={busy}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Page-turn arrows */}
              <button
                type="button"
                aria-label="Página anterior"
                onClick={() => flipTo(spreadIndex - 1)}
                disabled={spreadIndex <= 0}
                className="absolute left-0 top-1/2 z-20 grid size-9 -translate-x-1 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur transition disabled:opacity-30"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Próxima página"
                onClick={() => flipTo(spreadIndex + 1)}
                disabled={spreadIndex >= spreads.length - 1}
                className="absolute right-0 top-1/2 z-20 grid size-9 -translate-y-1/2 translate-x-1 place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur transition disabled:opacity-30"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>

            {/* Dot indicators */}
            {spreads.length > 1 ? (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
                {spreads.map((s, i) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => flipTo(i)}
                    aria-label={`Ir para ${s.category} página ${s.pageNum}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === spreadIndex
                        ? "w-5 bg-amber-300"
                        : "w-1.5 bg-white/40 hover:bg-white/70",
                    )}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {/* PACK TEAR OVERLAY (full stage) */}
          <AnimatePresence>
            {phase !== "idle" ? (
              <PackTearOverlay
                phase={phase}
                opened={opened}
                reduceMotion={reduceMotion}
                onClose={closeReveal}
              />
            ) : null}
          </AnimatePresence>
        </div>

        {/* PACK BUY CONTROLS */}
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
      </div>
    </ArcadePanel>
  );
}
