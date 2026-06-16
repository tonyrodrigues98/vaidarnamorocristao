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
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-3 text-left transition-all duration-300",
        "hover:-translate-y-0.5",
        r.borderClass,
        disabled && "opacity-60 hover:translate-y-0",
      )}
      style={{
        boxShadow: onCooldown
          ? "0 2px 8px -4px rgba(91,81,66,0.10)"
          : r.shadowCss,
      }}
    >
      {/* glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: r.glowCss, opacity: onCooldown ? 0.15 : 1 }}
      />
      {/* hairline gold top accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(201,162,74,0.55), transparent)",
        }}
      />

      {/* rarity ribbon */}
      <div className="relative z-10 mb-2 flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur",
            r.borderClass,
            r.textClass,
          )}
        >
          {r.shortLabel}
        </span>
        {pool.cooldown_hours > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-[#7a6f5e]">
            <Timer className="size-3" />
            {pool.cooldown_hours}h
          </span>
        )}
      </div>

      {/* icon plate */}
      <div
        className="relative z-10 mx-auto my-1 grid aspect-square w-24 place-items-center rounded-2xl ring-1 ring-[#e6cf8a]"
        style={{
          background:
            "linear-gradient(135deg, #FFFAEC 0%, #F4E2B5 55%, #E6CF8A 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -8px 18px -10px rgba(154,118,38,0.25)",
        }}
      >
        <Icon
          className={cn(
            "size-10 transition-transform duration-500 group-hover:scale-110",
            r.textClass,
          )}
          strokeWidth={1.5}
        />
      </div>

      {/* name */}
      <div className="relative z-10 mt-2 text-center">
        <div className="truncate text-[13px] font-semibold tracking-tight text-[#1a1410]">
          {pool.name}
        </div>
        {pool.description && (
          <div className="mt-0.5 line-clamp-2 text-[10px] text-[#7a6f5e]">{pool.description}</div>
        )}
      </div>

      {/* pity bar */}
      {pool.pity_threshold > 0 && (
        <div className="relative z-10 mt-2">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.12em] text-[#9a7626]">
            <span>Pity</span>
            <span>
              {pool.pity_count}/{pool.pity_threshold}
            </span>
          </div>
          <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-[#f1ead8]">
            <div
              className="h-full transition-all"
              style={{
                width: `${pityProgress * 100}%`,
                background: r.hex,
                boxShadow: `0 0 6px ${r.hex}`,
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
              ? "bg-[#f1ead8] text-[#9a8b6c]"
              : isFree
                ? "bg-[#1a1410] text-[#FAF7EF] ring-1 ring-[#1a1410]"
                : empty
                  ? "bg-[#f1ead8] text-[#9a8b6c]"
                  : "text-[#1a1410] ring-1 ring-[#e6cf8a]",
          )}
          style={
            !onCooldown && !isFree && !empty
              ? {
                  background:
                    "linear-gradient(135deg, #FFF6DF 0%, #F1DDA1 60%, #C9A24A 100%)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 12px -6px rgba(201,162,74,0.45)",
                }
              : undefined
          }
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