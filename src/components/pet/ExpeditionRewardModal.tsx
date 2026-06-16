import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Gift, X, Trophy, Zap, Flame } from "lucide-react";

import { CoinIcon } from "@/components/icons/CoinIcon";
import { XpIcon } from "@/components/icons/XpIcon";
import type { ClaimResult } from "@/types/petExpedition";

type Reward = {
  key: string;
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  tint: string; // text color class
  glow: string; // radial glow color
};

const OUTCOME_META: Record<
  ClaimResult["outcome"],
  { title: string; subtitle: string; Icon: React.ComponentType<{ className?: string }>; aura: string }
> = {
  crit: {
    title: "Recompensa Divina",
    subtitle: "Um acerto crítico — o universo sorriu pra vocês",
    Icon: Flame,
    aura: "from-fuchsia-400/40 via-amber-300/30 to-transparent",
  },
  success: {
    title: "Expedição Concluída",
    subtitle: "Tudo correu como sonhado",
    Icon: Trophy,
    aura: "from-indigo-400/40 via-sky-300/30 to-transparent",
  },
  fail: {
    title: "Voltou Cansado",
    subtitle: "Nem todo caminho rende glória — mas algo se aprende",
    Icon: Zap,
    aura: "from-neutral-400/30 via-neutral-300/20 to-transparent",
  },
};

export function ExpeditionRewardModal({
  open,
  result,
  expeditionTitle,
  onClose,
}: {
  open: boolean;
  result: ClaimResult | null;
  expeditionTitle: string;
  onClose: () => void;
}) {
  const rewards = useMemo<Reward[]>(() => {
    if (!result) return [];
    const arr: Reward[] = [];
    if (result.xp > 0) {
      arr.push({
        key: "xp",
        label: "Experiência",
        value: `+${result.xp} XP`,
        Icon: XpIcon,
        tint: "text-sky-600",
        glow: "bg-sky-300/40",
      });
    }
    if (result.coins > 0) {
      arr.push({
        key: "coins",
        label: "Moedas",
        value: `+${result.coins}`,
        Icon: CoinIcon,
        tint: "text-amber-600",
        glow: "bg-amber-300/40",
      });
    }
    if (result.item) {
      arr.push({
        key: "item",
        label: "Item raro",
        value: result.item,
        Icon: Gift,
        tint: "text-fuchsia-600",
        glow: "bg-fuchsia-300/40",
      });
    }
    return arr;
  }, [result]);

  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open, result]);

  // Auto-avança um passo a cada 1.1s até revelar todos
  useEffect(() => {
    if (!open) return;
    if (step >= rewards.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 700 : 1100);
    return () => clearTimeout(t);
  }, [open, step, rewards.length]);

  if (!open || !result) return null;
  const meta = OUTCOME_META[result.outcome];
  const allRevealed = step >= rewards.length;

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/70 px-4 backdrop-blur-md"
        onClick={allRevealed ? onClose : undefined}
        role="dialog"
        aria-modal="true"
        aria-label="Recompensas da expedição"
      >
        {/* aura */}
        <motion.div
          aria-hidden
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={`pointer-events-none absolute inset-0 -z-0 bg-gradient-radial ${meta.aura}`}
          style={{
            background: `radial-gradient(circle at center, var(--tw-gradient-stops))`,
          }}
        />

        {/* partículas */}
        <Particles />

        <motion.div
          key="card"
          initial={{ y: 24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", damping: 22, stiffness: 220 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white to-neutral-50 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)]"
        >
          {/* header */}
          <div className="relative overflow-hidden border-b border-neutral-200/60 px-6 pb-5 pt-7 text-center">
            <motion.div
              aria-hidden
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 18, ease: "linear", repeat: Infinity }}
              className="pointer-events-none absolute -inset-12 opacity-40"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(168,85,247,0.15), rgba(56,189,248,0.15), rgba(251,191,36,0.15), rgba(168,85,247,0.15))",
              }}
            />
            <motion.div
              initial={{ scale: 0, rotate: -30, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
              className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-neutral-950 text-white shadow-lg"
            >
              <meta.Icon className="size-6" />
            </motion.div>
            <motion.h2
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="relative mt-3 text-lg font-semibold tracking-tight text-neutral-950"
            >
              {meta.title}
            </motion.h2>
            <motion.p
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="relative mt-1 text-[12px] leading-relaxed text-neutral-500"
            >
              {meta.subtitle}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative mt-2 truncate text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400"
            >
              {expeditionTitle}
            </motion.p>
          </div>

          {/* rewards stack */}
          <ul className="space-y-2 px-5 py-5">
            {rewards.length === 0 && (
              <li className="py-4 text-center text-sm text-neutral-500">
                Sem recompensas dessa vez. Tente novamente amanhã.
              </li>
            )}
            <AnimatePresence initial={false}>
              {rewards.slice(0, step).map((r, i) => (
                <motion.li
                  key={r.key}
                  initial={{ y: 18, opacity: 0, scale: 0.92 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 16, stiffness: 220 }}
                  className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white px-4 py-3"
                >
                  <motion.div
                    aria-hidden
                    initial={{ scale: 0, opacity: 0.8 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className={`pointer-events-none absolute left-6 top-1/2 -z-0 size-6 -translate-y-1/2 rounded-full blur-xl ${r.glow}`}
                  />
                  <div className={`relative grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-50 ring-1 ring-neutral-200 ${r.tint}`}>
                    <r.Icon className="size-5" />
                  </div>
                  <div className="relative min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                      {r.label}
                    </p>
                    <p className="truncate text-base font-semibold text-neutral-950">
                      {r.value}
                    </p>
                  </div>
                  {i === step - 1 && (
                    <motion.div
                      aria-hidden
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: [0, 0.7, 0], x: 320 }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="pointer-events-none absolute inset-y-0 w-16 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                    />
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {/* actions */}
          <div className="border-t border-neutral-200/60 bg-neutral-50/50 px-5 py-3">
            {allRevealed ? (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onClose}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Continuar
              </motion.button>
            ) : (
              <button
                onClick={() => setStep(rewards.length)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-medium text-neutral-500 transition hover:text-neutral-800"
              >
                Toque para revelar tudo
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="size-4" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function Particles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: 3 + Math.random() * 2.5,
        size: 2 + Math.random() * 3,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: "110vh", opacity: 0 }}
          animate={{ y: "-10vh", opacity: [0, 1, 1, 0] }}
          transition={{ delay: p.delay, duration: p.duration, repeat: Infinity, ease: "easeOut" }}
          className="absolute block rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.9)]"
          style={{ left: `${p.x}%`, width: p.size, height: p.size }}
        />
      ))}
    </div>
  );
}