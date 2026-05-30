import { CATEGORY_LABELS, type GiftCategory } from "@/lib/gifts";
import { cn } from "@/lib/utils";

type Props = {
  value: GiftCategory | "all";
  onChange: (v: GiftCategory | "all") => void;
};

const ORDER: (GiftCategory | "all")[] = ["all", "romantic", "spiritual", "caring", "friendship", "fun", "legendary"];

export function CategoryFilter({ value, onChange }: Props) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex w-max gap-2">
        {ORDER.map((cat) => {
          const active = value === cat;
          const label = cat === "all" ? "Todos" : CATEGORY_LABELS[cat].label;
          const emoji = cat === "all" ? "✨" : CATEGORY_LABELS[cat].emoji;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all",
                "border backdrop-blur-md",
                active
                  ? "border-transparent bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 text-white shadow-lg shadow-fuchsia-500/30 scale-105"
                  : "border-border bg-white/60 dark:bg-white/5 text-foreground hover:border-purple-400/40",
              )}
            >
              <span>{emoji}</span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}