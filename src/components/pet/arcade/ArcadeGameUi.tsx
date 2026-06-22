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
    <section className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur">
      <header className="flex items-start gap-3 border-b border-neutral-100 bg-gradient-to-r from-white to-rose-50/50 p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-neutral-950 text-white">
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-black tracking-tight">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">{description}</p>
        </div>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
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
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-neutral-500">
        <label htmlFor={`entry-${config.game_type}`}>{label}</label>
        <span>Saldo: {balance}</span>
      </div>
      <div className="relative">
        <CoinIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2" />
        <Input
          id={`entry-${config.game_type}`}
          type="number"
          inputMode="numeric"
          min={config.min_entry}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-12 rounded-2xl border-neutral-200 bg-neutral-50 pl-11 font-bold"
        />
      </div>
      <div className="mt-2 flex gap-2">
        {[config.min_entry, Math.min(50, max), Math.min(100, max)].map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={disabled || amount < config.min_entry}
            onClick={() => onChange(amount)}
            className="h-8 flex-1 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-600 disabled:opacity-40"
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
            "h-10 rounded-xl border text-xs font-bold transition",
            value === option
              ? "border-rose-500 bg-rose-500 text-white shadow-sm"
              : "border-neutral-200 bg-white text-neutral-600",
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
      className="h-12 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 font-black text-white shadow-lg shadow-rose-100 hover:from-rose-600 hover:to-orange-600"
    >
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
        "rounded-2xl border p-4",
        rewarded ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-xl",
            rewarded ? "bg-emerald-600 text-white" : "bg-amber-500 text-white",
          )}
        >
          {rewarded ? <Coins className="size-5" /> : <ShieldCheck className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-black text-neutral-950">
            {title ?? (rewarded ? "Recompensa recolhida" : "A aventura terminou")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-white px-3 py-1">
              {Number(result.reward_coins ?? 0)} moedas
            </span>
            <span className="rounded-full bg-white px-3 py-1">
              +{Number(result.xp_reward ?? 0)} XP
            </span>
            {result.multiplier !== undefined ? (
              <span className="rounded-full bg-white px-3 py-1">
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
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-bold text-white"
      >
        <RotateCcw className="size-4" /> Jogar novamente
      </button>
    </div>
  );
}
