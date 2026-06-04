import { Sparkles } from "lucide-react";
import { RARITY_STYLE, type VirtualGift } from "@/lib/gifts";
import { GiftMedia } from "./GiftMedia";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { cn } from "@/lib/utils";

type Props = {
  gift: VirtualGift;
  onSelect?: (g: VirtualGift) => void;
  disabled?: boolean;
};

export function GiftCard({ gift, onSelect, disabled }: Props) {
  const r = RARITY_STYLE[gift.rarity];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect?.(gift)}
      className={cn(
        "group relative flex w-full flex-col items-center gap-2 overflow-hidden rounded-3xl p-3 text-left transition-all duration-300",
        "border bg-white/60 backdrop-blur-xl dark:bg-white/5",
        "hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]",
        r.border,
        r.glow,
        disabled && "opacity-50 cursor-not-allowed hover:translate-y-0 hover:scale-100",
      )}
    >
      {/* decorative gradient bg */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br opacity-60",
          r.gradient,
        )}
      />

      {/* rarity chip */}
      <span
        className={cn(
          "absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          r.chip,
        )}
      >
        {(gift.rarity === "legendary" || gift.rarity === "exclusive") && (
          <Sparkles className="h-3 w-3" />
        )}
        {r.label}
      </span>

      <GiftMedia
        emoji={gift.emoji}
        imageUrl={gift.image_url}
        rarity={gift.rarity}
        size="lg"
        floating
        className="mt-3"
      />

      <div className="mt-1 w-full text-center">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{gift.name}</h3>
        <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/30">
          <CoinIcon className="h-3.5 w-3.5" />
          {gift.price_coins}
        </div>
      </div>
    </button>
  );
}
