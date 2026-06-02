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
import { Gift, Sparkles, Receipt } from "lucide-react";

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
            background: "linear-gradient(135deg, #FF5FA2 0%, #FF7BC3 35%, #A855F7 70%, #6D5BFF 100%)",
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
          {Array.from({ length: 18 }).map((_, i) => (
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="96"
                height="96"
                viewBox="0 0 96 96"
                fill="none"
                stroke="#FFFFFF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-heart-handshake-icon lucide-heart-handshake"
              >
                <path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762" />
              </svg>
            </span>
            <span style={{ animation: "gift-float 3.4s ease-in-out infinite 0.3s" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="96"
                height="96"
                viewBox="0 0 96 96"
                fill="none"
                stroke="#FFFFFF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-sparkles-icon lucide-sparkles"
              >
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                <path d="M20 2v4" />
                <path d="M22 4h-4" />
                <circle cx="4" cy="20" r="2" />
              </svg>
            </span>
            <span style={{ animation: "gift-float 2.8s ease-in-out infinite 0.6s" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="96"
                height="96"
                viewBox="0 0 96 96"
                fill="none"
                stroke="#FFFFFF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-gift-icon lucide-gift"
              >
                <path d="M12 7v14" />
                <path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
                <path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" />
                <rect x="3" y="7" width="18" height="4" rx="1" />
              </svg>
            </span>
          </div>
          <div
            className="text-6xl drop-shadow-2xl sm:hidden"
            style={{ animation: "gift-float 3s ease-in-out infinite" }}
          >
            <span style={{ animation: "gift-float 2.8s ease-in-out infinite 0.6s" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="96"
                height="96"
                viewBox="0 0 96 96"
                fill="none"
                stroke="#FFFFFF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-gift-icon lucide-gift"
              >
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        {/* Balance card */}
        <div className="-mt-8 mb-6 rounded-3xl border border-white/30 bg-white/70 p-4 shadow-xl backdrop-blur-2xl dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-400/30">
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
