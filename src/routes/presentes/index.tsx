import { createFileRoute, Link, Navigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/lib/auth";
import { listGifts, type VirtualGift, type GiftCategory } from "@/lib/gifts";
import { GiftCard } from "@/components/gifts/GiftCard";
import { CategoryFilter } from "@/components/gifts/CategoryFilter";
import { SendGiftModal } from "@/components/gifts/SendGiftModal";
import { GiftSendAnimation } from "@/components/gifts/GiftSendAnimation";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { Button } from "@/components/ui/button";
import { getMyCoins } from "@/lib/coins";
import { Gift, HeartHandshake, Sparkles, Receipt } from "lucide-react";

const searchSchema = z.object({
  to: z.string().uuid().optional(),
});

export const Route = createFileRoute("/presentes/")({
  component: PresentesPage,
  validateSearch: searchSchema,
});

function PresentesPage() {
  const { user, loading } = useAuth();
  const search = useSearch({ from: "/presentes/" });
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
  const [cat, setCat] = useState<GiftCategory | "all">("all");
  const [balance, setBalance] = useState(0);
  const [selected, setSelected] = useState<VirtualGift | null>(null);
  const [animation, setAnimation] = useState<VirtualGift | null>(null);

  useEffect(() => {
    listGifts()
      .then(setGifts)
      .catch(() => setGifts([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    getMyCoins()
      .then((c) => setBalance(c.balance))
      .catch(() => {});
  }, [user]);

  const filtered = useMemo(() => (cat === "all" ? gifts : gifts.filter((g) => g.category === cat)), [gifts, cat]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Premium gradient banner */}
      <section className="relative h-[220px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #F7D7E6, #F4DFF8, #EDE9FE)",
          }}
        />
        {/* blur orbs */}
        <div
          className="pointer-events-none absolute -left-10 top-6 h-44 w-44 rounded-full opacity-50 blur-3xl"
          style={{ background: "#FFD7E8", animation: "gift-header-orb 6s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute right-0 top-20 h-52 w-52 rounded-full opacity-50 blur-3xl"
          style={{ background: "#C4B5FD", animation: "gift-header-orb 7s ease-in-out infinite reverse" }}
        />
        {/* sparkle dots */}
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white/80"
              style={{
                left: `${(i * 53) % 100}%`,
                top: `${(i * 37) % 100}%`,
                animation: `gift-sparkle ${1.5 + (i % 4) * 0.4}s ease-in-out infinite`,
                animationDelay: `${(i % 5) * 0.2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto flex h-full max-w-5xl items-center justify-between px-4">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Novidade
            </div>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold drop-shadow-md sm:text-4xl">
              <Gift className="h-8 w-8" /> Presentes Virtuais
            </h1>
            <p className="mt-1 max-w-xs text-sm text-white/90 sm:text-base">
              Surpreenda alguém especial com um presente.
            </p>
          </div>
          <div className="hidden text-7xl drop-shadow-2xl sm:flex sm:gap-2">
            <span style={{ animation: "gift-float 3s ease-in-out infinite" }}>
              <HeartHandshake className="h-24 w-24 text-white" strokeWidth={1} />
            </span>
            <span style={{ animation: "gift-float 3.4s ease-in-out infinite 0.3s" }}>
              <Sparkles className="h-24 w-24 text-white" strokeWidth={1} />
            </span>
            <span style={{ animation: "gift-float 2.8s ease-in-out infinite 0.6s" }}>
              <Gift className="h-24 w-24 text-white" strokeWidth={1} />
            </span>
          </div>
          <div
            className="text-6xl drop-shadow-2xl sm:hidden"
            style={{ animation: "gift-float 3s ease-in-out infinite" }}
          >
            <span style={{ animation: "gift-float 2.8s ease-in-out infinite 0.6s" }}>
              <Gift className="h-24 w-24 text-white" strokeWidth={1} />
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        {/* Balance card */}
        <div className="-mt-8 mb-6 rounded-3xl border border-white/30 bg-white/70 p-4 shadow-xl backdrop-blur-2xl dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br bg-bg-white
border shadow-lg shadow-amber-400/30">
                <CoinIcon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo atual</p>
                <p className="text-2xl font-bold leading-tight">
                  {balance} <span className="text-sm font-medium text-muted-foreground">moedas</span>
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/perfil" search={{ tab: "saldo" } as never}>
                <Receipt className="mr-1 h-4 w-4" /> Extrato
              </Link>
            </Button>
          </div>
        </div>

        {/* Category filter */}
        <CategoryFilter value={cat} onChange={setCat} />

        {/* Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((g) => (
            <GiftCard key={g.id} gift={g} onSelect={setSelected} disabled={!search.to} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-12 text-center text-sm text-muted-foreground">Nenhum presente nesta categoria ainda.</p>
        )}

        {!search.to && (
          <div className="mt-8 rounded-2xl border border-dashed border-purple-400/40 bg-purple-500/5 p-4 text-center text-sm text-muted-foreground">
            💡 Para enviar um presente, abra o perfil de um pretendente e clique em <strong>Enviar Presente</strong>.
          </div>
        )}
      </main>

      <SendGiftModal
        open={!!selected && !!search.to}
        onOpenChange={(v) => !v && setSelected(null)}
        gift={selected}
        receiverId={search.to ?? null}
        balance={balance}
        onSent={() => {
          if (selected) {
            setAnimation(selected);
            setBalance((b) => Math.max(0, b - selected.price_coins));
            setSelected(null);
          }
        }}
      />

      <GiftSendAnimation
        show={!!animation}
        giftName={animation?.name}
        emoji={animation?.emoji}
        imageUrl={animation?.image_url}
        rarity={animation?.rarity}
        onDone={() => setAnimation(null)}
      />
    </div>
  );
}
