import type { ReactNode } from "react";
import { Coins, Loader2, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";

import { CoinIcon } from "@/components/icons/CoinIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ActiveArcadeRound, ArcadeGameConfig, ArcadeGameResult } from "@/lib/petArcade";

export type ArcadeGameProps = {
  config: ArcadeGameConfig;
  balance: number;
  petImage?: string | null;
  careScore?: number;
  activeRound?: ActiveArcadeRound;
  onBalanceChange: (balance: number) => void;
  onFinished: () => void;
};

export function ArcadeStage({
  children,
  className,
  glowClassName,
}: {
  children: ReactNode;
  className?: string;
  glowClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[30px] border border-white/65 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-white shadow-[0_26px_75px_rgba(15,23,42,0.18)]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute -left-16 -top-14 size-40 rounded-full bg-white/10 blur-3xl",
          glowClassName,
        )}
      />
      <span
        aria-hidden
        className="absolute -bottom-20 right-[-10%] size-48 rounded-full bg-white/10 blur-3xl"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,0.05),_transparent_35%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function ArcadeMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "success" | "warning" | "dark";
}) {
  const tones = {
    default: "border-white/70 bg-white/14 text-white/90",
    success: "border-emerald-200/70 bg-emerald-50/16 text-white",
    warning: "border-amber-200/70 bg-amber-50/16 text-white",
    dark: "border-neutral-900/10 bg-neutral-950 text-white",
  } as const;
  return (
    <div className={cn("rounded-2xl border px-3 py-2 backdrop-blur-sm", tones[tone])}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70">{label}</p>
      <div className="mt-1 text-lg font-black tracking-tight">{value}</div>
    </div>
  );
}

export function ArcadePanel({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.9))] shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.18),_transparent_60%)]"
      />
      <header className="relative flex items-start gap-3 border-b border-neutral-100/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,244,246,0.92),rgba(240,249,255,0.88))] p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-[18px] bg-neutral-950 text-white shadow-lg shadow-neutral-950/15">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-500">
            Pet Arcade
          </p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-neutral-950">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">{description}</p>
        </div>
      </header>
      <div className="relative p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function EntryControl({
  value,
  onChange,
  config,
  balance,
  disabled,
  label = "Moedas de entrada",
}: {
  value: number;
  onChange: (value: number) => void;
  config: ArcadeGameConfig;
  balance: number;
  disabled?: boolean;
  label?: string;
}) {
  const max = Math.min(config.max_entry, balance);
  return (
    <div className="rounded-[26px] border border-neutral-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,250,251,0.96))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-neutral-500">
        <label htmlFor={`entry-${config.game_type}`}>{label}</label>
        <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
          Saldo: {balance}
        </span>
      </div>
      <div className="relative">
        <CoinIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 drop-shadow-sm" />
        <Input
          id={`entry-${config.game_type}`}
          type="number"
          inputMode="numeric"
          min={config.min_entry}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-12 rounded-2xl border-neutral-200 bg-white pl-11 font-bold shadow-[inset_0_1px_3px_rgba(15,23,42,0.04)]"
        />
      </div>
      <div className="mt-2 flex gap-2">
        {[config.min_entry, Math.min(50, max), Math.min(100, max)].map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={disabled || amount < config.min_entry}
            onClick={() => onChange(amount)}
            className="h-8 flex-1 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-600 shadow-sm disabled:opacity-40"
          >
            {amount}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DifficultyButtons({
  value,
  onChange,
  disabled,
  options = ["leve", "aventureiro", "radical"],
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  options?: string[];
}) {
  const labels: Record<string, string> = {
    leve: "Leve",
    aventureiro: "Aventureiro",
    radical: "Radical",
    padrao: "Padrão",
  };
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option)}
          className={cn(
            "h-10 rounded-2xl border text-xs font-bold transition",
            value === option
              ? "border-rose-500 bg-[linear-gradient(135deg,#fb7185,#f97316)] text-white shadow-lg shadow-rose-200"
              : "border-neutral-200 bg-white text-neutral-600 shadow-sm",
          )}
        >
          {labels[option] ?? option}
        </button>
      ))}
    </div>
  );
}

export function StartButton({
  busy,
  disabled,
  children,
  onClick,
}: {
  busy: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="relative h-12 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 font-black text-white shadow-[0_18px_35px_rgba(251,113,133,0.35)] hover:from-rose-600 hover:via-orange-600 hover:to-amber-600"
    >
      <span aria-hidden className="absolute inset-y-0 right-0 w-20 bg-white/20 blur-2xl" />
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      {children}
    </Button>
  );
}

export function ResultCard({
  result,
  onAgain,
  title,
}: {
  result: ArcadeGameResult;
  onAgain: () => void;
  title?: string;
}) {
  const rewarded = Number(result.reward_coins ?? 0) > 0;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[28px] border p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]",
        rewarded
          ? "border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.98),rgba(240,253,250,0.98))]"
          : "border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,247,237,0.98))]",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-2xl shadow-lg",
            rewarded
              ? "bg-emerald-600 text-white shadow-emerald-200"
              : "bg-amber-500 text-white shadow-amber-200",
          )}
        >
          {rewarded ? <Coins className="size-5" /> : <ShieldCheck className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-black text-neutral-950">
            {title ?? (rewarded ? "Recompensa recolhida" : "A aventura terminou")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              {Number(result.reward_coins ?? 0)} moedas
            </span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              +{Number(result.xp_reward ?? 0)} XP
            </span>
            {result.multiplier !== undefined ? (
              <span className="rounded-full bg-white px-3 py-1 shadow-sm">
                {Number(result.multiplier).toFixed(2)}x
              </span>
            ) : null}
          </div>
          {result.reward_limited ? (
            <p className="mt-2 text-xs leading-relaxed text-amber-800">
              A recompensa foi limitada pelo teto diário configurado no Pet Arcade.
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onAgain}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-sm font-bold text-white shadow-[0_16px_30px_rgba(15,23,42,0.14)]"
      >
        <RotateCcw className="size-4" /> Jogar novamente
      </button>
    </div>
  );
}
