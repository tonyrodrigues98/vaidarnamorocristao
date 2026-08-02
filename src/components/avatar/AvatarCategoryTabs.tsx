import {
  Dumbbell,
  Footprints,
  PersonStanding,
  Palette,
  Scissors,
  Shirt,
  Star,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AvatarCategoryTab = {
  id: string;
  name: string;
  icon: string;
};

const ICON_MAP: Record<string, LucideIcon> = {
  shirt: Shirt,
  watch: Watch,
  scissors: Scissors,
  footprints: Footprints,
  star: Star,
  dumbbell: Dumbbell,
  pose: PersonStanding,
  palette: Palette,
};

type Props = {
  categories: AvatarCategoryTab[];
  activeId: string | null;
  onChange: (id: string) => void;
};

export function AvatarCategoryTabs({ categories, activeId, onChange }: Props) {
  return (
    <div className="border-b border-border/30 bg-white">
      <div className="flex gap-1 overflow-x-auto px-2">
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.icon] ?? Shirt;
          const isActive = activeId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(cat.id)}
              className="relative flex shrink-0 flex-col items-center gap-1 px-3 py-3 transition"
            >
              <div className="flex items-center gap-1.5">
                <Icon
                  className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {cat.name}
                </span>
              </div>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
