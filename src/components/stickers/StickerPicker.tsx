import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchCategories, fetchStickers, type Sticker, type StickerCategory } from "@/lib/stickers";
import { Loader2, Smile } from "lucide-react";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { COIN_STICKER_COST } from "@/lib/coins";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (s: Sticker) => void;
  anchorRef?: React.RefObject<HTMLElement>;
};

export function StickerPicker({ open, onClose, onPick }: Props) {
  const isMobile = useIsMobile();
  const [cats, setCats] = useState<StickerCategory[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancel = false;
    setLoading(true);
    Promise.all([fetchCategories(), fetchStickers({ activeOnly: true })])
      .then(([c, s]) => {
        if (cancel) return;
        setCats(c);
        setStickers(s);
      })
      .catch(() => {})
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [open]);

  const filtered = useMemo(
    () => (activeCat === "all" ? stickers : stickers.filter((s) => s.category_id === activeCat)),
    [activeCat, stickers],
  );

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border/60 px-3 py-2">
        <CatChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>
          Todos
        </CatChip>
        {cats.map((c) => (
          <CatChip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
            {c.name}
          </CatChip>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Smile className="h-6 w-6" />
            Nenhum sticker disponível ainda.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-x-3 gap-y-7 px-1 pb-3 pt-2">
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onPick(s);
                  onClose();
                }}
                className="group relative aspect-square rounded-xl bg-muted/30 p-3 transition-transform duration-150 hover:scale-105 hover:bg-accent/40 active:scale-95"
                aria-label={s.name}
              >
                <img
                  src={s.public_url}
                  alt={s.name}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="h-full w-full object-contain"
                />
                <span className="pointer-events-none absolute -bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200 shadow-md backdrop-blur-sm">
                  <CoinIcon className="h-3 w-3" />
                  {COIN_STICKER_COST}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="sp-m-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/40"
            />
            <motion.div
              key="sp-m-panel"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-50 h-[70vh] overflow-hidden rounded-t-2xl border-t border-border bg-background shadow-2xl"
            >
              <div className="flex h-full flex-col">
                <div className="flex shrink-0 flex-col items-center pt-2 pb-1">
                  <div className="h-1.5 w-10 rounded-full bg-muted" />
                  <h2 className="mt-2 text-base font-semibold">Stickers</h2>
                </div>
                <div className="min-h-0 flex-1">{content}</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sp-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />
          <motion.div
            key="sp-panel"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-full left-0 z-50 mb-2 w-[360px] max-w-[92vw] overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur-xl"
            style={{ height: 380 }}
          >
            {content}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CatChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/40 text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
