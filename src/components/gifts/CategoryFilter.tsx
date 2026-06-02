import { CATEGORY_LABELS, type GiftCategory } from "@/lib/gifts";
import { cn } from "@/lib/utils";
import { Heart, Church, HandHeart, Users, Sparkles, Crown, Gift } from "lucide-react";

type Props = {
  value: GiftCategory | "all";
  onChange: (v: GiftCategory | "all") => void;
};

const ORDER: (GiftCategory | "all")[] = ["all", "romantic", "spiritual", "caring", "friendship", "fun", "legendary"];
const ICONS = {
  all: Gift,
  romantic: Heart,
  spiritual: Church,
  caring: HandHeart,
  friendship: Users,
  fun: Sparkles,
  legendary: Crown,
};
export function CategoryFilter({ value, onChange }: Props) {
  return (
    <div className=" -mx-4 overflow-x-auto overflow-y-hidden px-4 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden  ">
      <div className="flex w-max items-center gap-3">
        {ORDER.map((cat) => {
          const active = value === cat;
          const label = cat === "all" ? "Todos" : CATEGORY_LABELS[cat].label;
          const Icon = ICONS[cat];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-all",
                "border backdrop-blur-md",
                active
                  ? "border-transparent bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 text-white shadow-lg shadow-fuchsia-500/30 scale-105"
                  : "border-border bg-white/60 dark:bg-white/5 text-foreground hover:border-purple-400/40",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
