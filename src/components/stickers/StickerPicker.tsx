import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { fetchCategories, fetchStickers, type Sticker, type StickerCategory } from "@/lib/stickers";
import { Loader2, Smile } from "lucide-react";

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
    return () => { cancel = true; };
  }, [open]);

  const filtered = useMemo(
    () => (activeCat === "all" ? stickers : stickers.filter((s) => s.category_id === activeCat)),
    [activeCat, stickers]
  );

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border/60 px-3 py-2">
        <CatChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>Todos</CatChip>
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
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {filtered.map((s) => (
              <motion.button
                key={s.id}
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => { onPick(s); onClose(); }}
                className="group relative aspect-square overflow-hidden rounded-xl bg-muted/30 p-1.5 transition hover:bg-accent/40"
                aria-label={s.name}
              >
                <img
                  src={s.public_url}
                  alt={s.name}
                  loading="lazy"
                  draggable={false}
                  className="h-full w-full object-contain"
                />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="h-[70vh]">
          <DrawerHeader className="pb-1">
            <DrawerTitle className="text-base">Stickers</DrawerTitle>
          </DrawerHeader>
          <div className="min-h-0 flex-1">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
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

function CatChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
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