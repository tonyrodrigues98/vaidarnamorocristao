import { useEffect, useState } from "react";
import { Loader2, Lock, Sparkles, Timer } from "lucide-react";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { cn } from "@/lib/utils";
import { formatCooldown, iconForKey, rarityTokens } from "@/lib/grabRarity";
import type { GrabStatePool } from "@/types/petGrab";

type Props = {
  pool: GrabStatePool;
  freeRemaining: number;
  busy: boolean;
  onOpen: () => void;
};

export function GrabPoolCard({ pool, freeRemaining, busy, onOpen }: Props) {
  const r = rarityTokens(pool.rarity);
  const Icon = iconForKey(pool.icon_key);
  const [cd, setCd] = useState<number>(pool.cooldown_seconds);

  // Live countdown
  useEffect(() => {
    setCd(pool.cooldown_seconds);
    if (pool.cooldown_seconds <= 0) return;
    const t = setInterval(() => setCd((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [pool.cooldown_seconds, pool.id]);

  const onCooldown = cd > 0;
  const isFree = freeRemaining > 0 && !onCooldown;
  const disabled = busy || pool.prize_count === 0 || onCooldown;
  const empty = pool.prize_count === 0;

  const pityProgress =
    pool.pity_threshold > 0
      ? Math.min(1, pool.pity_count / pool.pity_threshold)
      : 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-neutral-950 p-3 text-left transition",
        "hover:-translate-y-0.5",
        r.borderClass,
        disabled && "opacity-60 hover:translate-y-0",
      )}
      style={{
        boxShadow: onCooldown ? "none" : r.shadowCss,
      }}
    >
      {/* glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: r.glowCss, opacity: onCooldown ? 0.2 : 0.9 }}
      />

      {/* rarity ribbon */}
      <div className="relative z-10 mb-2 flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border bg-black/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur",
            r.borderClass,
            r.textClass,
          )}
        >
          {r.shortLabel}
        </span>
        {pool.cooldown_hours > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400">
            <Timer className="size-3" />
            {pool.cooldown_hours}h
          </span>
        )}
      </div>

      {/* icon plate */}
      <div className="relative z-10 mx-auto my-1 grid aspect-square w-24 place-items-center rounded-2xl bg-gradient-to-br from-neutral-900 to-black ring-1 ring-white/10">
        <Icon
          className={cn("size-10 transition-transform duration-500 group-hover:scale-110", r.textClass)}
          strokeWidth={1.5}
        />
      </div>

      {/* name */}
      <div className="relative z-10 mt-2 text-center">
        <div className="truncate text-[13px] font-semibold tracking-tight text-white">
          {pool.name}
        </div>
        {pool.description && (
          <div className="mt-0.5 line-clamp-2 text-[10px] text-neutral-400">{pool.description}</div>
        )}
      </div>

      {/* pity bar */}
      {pool.pity_threshold > 0 && (
        <div className="relative z-10 mt-2">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            <span>Pity</span>
            <span>
              {pool.pity_count}/{pool.pity_threshold}
            </span>
          </div>
          <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full transition-all"
              style={{
                width: `${pityProgress * 100}%`,
                background: r.hex,
                boxShadow: `0 0 8px ${r.hex}`,
              }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="relative z-10 mt-3">
        <div
          className={cn(
            "inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold",
            onCooldown
              ? "bg-neutral-800 text-neutral-400"
              : isFree
                ? "bg-white text-black"
                : empty
                  ? "bg-neutral-800 text-neutral-500"
                  : "bg-black text-white ring-1 ring-white/10",
          )}
        >
          {busy ? (
            <Loader2 className="size-3 animate-spin" />
          ) : onCooldown ? (
            <>
              <Lock className="size-3" />
              {formatCooldown(cd)}
            </>
          ) : empty ? (
            "Em breve"
          ) : isFree ? (
            <>
              Grátis
              <Sparkles className="size-3" />
            </>
          ) : (
            <>
              <CoinIcon className="size-3" />
              {pool.cost_coins}
            </>
          )}
        </div>
      </div>
    </button>
  );
}