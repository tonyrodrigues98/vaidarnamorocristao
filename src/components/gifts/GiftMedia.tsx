import { RARITY_STYLE, type GiftRarity } from "@/lib/gifts";
import { cn } from "@/lib/utils";

type Props = {
  emoji?: string | null;
  imageUrl?: string | null;
  rarity: GiftRarity;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  floating?: boolean;
};

const SIZES = {
  sm: { box: "h-14 w-14 text-3xl", img: "h-10 w-10" },
  md: { box: "h-20 w-20 text-5xl", img: "h-14 w-14" },
  lg: { box: "h-28 w-28 text-6xl", img: "h-20 w-20" },
  xl: { box: "h-40 w-40 text-7xl", img: "h-28 w-28" },
};

export function GiftMedia({ emoji, imageUrl, rarity, size = "md", className, floating = false }: Props) {
  const s = SIZES[size];
  const r = RARITY_STYLE[rarity];
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-2xl bg-gradient-to-br",
        r.gradient,
        "ring-1",
        r.ring,
        s.box,
        className,
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className={cn("object-contain", s.img)} />
      ) : (
        <span
          className={cn("leading-none select-none", floating && "animate-[gift-float_3.2s_ease-in-out_infinite]")}
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))" }}
        >
          {emoji ?? "🎁"}
        </span>
      )}
      {/* Sparkle layer for high rarities */}
      {(rarity === "legendary" || rarity === "exclusive") && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <span className="absolute left-2 top-3 h-1.5 w-1.5 rounded-full bg-white/80 animate-[gift-sparkle_1.8s_ease-in-out_infinite]" />
          <span className="absolute right-3 top-6 h-1 w-1 rounded-full bg-white/70 animate-[gift-sparkle_2.4s_ease-in-out_infinite_0.4s]" />
          <span className="absolute bottom-3 left-5 h-1 w-1 rounded-full bg-white/70 animate-[gift-sparkle_2.1s_ease-in-out_infinite_0.8s]" />
        </div>
      )}
    </div>
  );
}