import { useEffect, useState } from "react";
import { listPublicGiftHighlights, RARITY_STYLE, type PublicGiftHighlight } from "@/lib/gifts";
import { GiftMedia } from "./GiftMedia";
import { Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  limit?: number;
  showSendCta?: boolean;
  onSendClick?: () => void;
};

export function GiftHighlights({ userId, limit = 6 }: Props) {
  const [items, setItems] = useState<PublicGiftHighlight[] | null>(null);

  useEffect(() => {
    let alive = true;
    listPublicGiftHighlights(userId, limit)
      .then((d) => alive && setItems(d))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [userId, limit]);

  if (!items || items.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/20 p-5 shadow-elegant"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,95,162,0.10) 0%, rgba(168,85,247,0.10) 50%, rgba(109,91,255,0.10) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-40 blur-3xl"
        style={{ background: "#FF7BC3" }}
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
        style={{ background: "#A855F7" }}
      />
      <div className="relative mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg shadow-pink-500/30">
          <Gift className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="flex items-center gap-1 text-base font-bold">
            Destaques recebidos
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          </h3>
          <p className="text-xs text-muted-foreground">Presentes mais especiais</p>
        </div>
      </div>

      <div className="relative flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((g) => {
          const r = RARITY_STYLE[g.gift_rarity];
          return (
            <div
              key={g.id}
              className={cn(
                "group flex w-[110px] shrink-0 flex-col items-center gap-2 rounded-2xl border bg-white/70 p-3 backdrop-blur-md transition hover:-translate-y-0.5 dark:bg-slate-900/60",
                r.border,
                r.glow,
              )}
            >
              <GiftMedia
                emoji={g.gift_emoji}
                imageUrl={g.gift_image_url}
                rarity={g.gift_rarity}
                size="md"
                floating
              />
              <p className="line-clamp-1 w-full text-center text-xs font-semibold">{g.gift_name}</p>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", r.chip)}>
                {r.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}