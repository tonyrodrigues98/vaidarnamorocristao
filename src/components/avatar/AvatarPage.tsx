import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, ShieldCheck } from "lucide-react";

import { AvatarCategoryTabs } from "@/components/avatar/AvatarCategoryTabs";
import { AvatarHeader } from "@/components/avatar/AvatarHeader";
import { AvatarShopSheet } from "@/components/avatar/AvatarShopSheet";
import { AvatarStage } from "@/components/avatar/AvatarStage";
import {
  avatarBottomNavItems,
  avatarItems,
  type AvatarCategoryId,
  type AvatarFilterId,
  type AvatarGender,
  type AvatarItem,
} from "@/data/avatarMockData";

type AvatarPageProps = {
  coins: number;
  canAccess: boolean;
};

function AvatarAccessBlocked() {
  return (
    <div className="min-h-screen bg-[#fff8f5] px-4 py-[calc(env(safe-area-inset-top)+32px)]">
      <div className="mx-auto flex min-h-[72vh] max-w-md items-center justify-center">
        <div className="rounded-[32px] border border-rose-100 bg-white p-6 text-center shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-[#ff5c70]">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-stone-950">
            Acesso restrito
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            A primeira versão do editor de avatar está liberada apenas para super_admin.
          </p>
          <Link
            to="/inicio"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-[#ff5c70] px-5 text-sm font-black text-white shadow-[0_16px_36px_rgba(255,92,112,0.22)]"
          >
            Voltar ao app
          </Link>
        </div>
      </div>
    </div>
  );
}

function AvatarBottomNavigation() {
  return (
    <nav
      aria-label="Navegação do avatar"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-3 pb-[calc(env(safe-area-inset-bottom)+10px)]"
    >
      <div className="grid grid-cols-5 rounded-[28px] border border-white/80 bg-white/[0.92] p-2 shadow-[0_18px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
        {avatarBottomNavItems.map((item) => {
          const isActive = item.label === "Perfil";
          const Icon =
            isActive && "activeIcon" in item && item.activeIcon ? item.activeIcon : item.Icon;

          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-extrabold transition active:scale-95 ${
                isActive ? "bg-rose-50 text-[#ff5c70]" : "text-stone-500"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export function AvatarPage({ coins, canAccess }: AvatarPageProps) {
  const defaultItem =
    avatarItems.find((item) => item.equipped && item.gender === "feminino") ?? null;
  const [gender, setGender] = useState<AvatarGender>("feminino");
  const [activeCategory, setActiveCategory] = useState<AvatarCategoryId>("roupas");
  const [activeFilter, setActiveFilter] = useState<AvatarFilterId>("destaques");
  const [tab, setTab] = useState<"shop" | "inventory">("shop");
  const [selectedItem, setSelectedItem] = useState<AvatarItem | null>(defaultItem);
  const [favorites, setFavorites] = useState(
    () => new Set(avatarItems.filter((item) => item.favorite).map((item) => item.id)),
  );
  const [showDetails, setShowDetails] = useState(false);

  const visibleItems = useMemo(() => {
    return avatarItems.filter((item) => {
      if (item.gender !== gender) return false;
      if (item.category !== activeCategory) return false;
      if (!item.filters.includes(activeFilter)) return false;
      if (tab === "inventory" && !item.owned) return false;
      return true;
    });
  }, [activeCategory, activeFilter, gender, tab]);

  if (!canAccess) {
    return <AvatarAccessBlocked />;
  }

  const toggleFavorite = (itemId: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleRandomize = () => {
    const pool = avatarItems.filter((item) => item.gender === gender);
    const next = pool[Math.floor(Math.random() * pool.length)];
    if (next) setSelectedItem(next);
  };

  const handleReset = () => {
    const next = avatarItems.find((item) => item.equipped && item.gender === gender) ?? null;
    setSelectedItem(next);
  };

  const handleGenderChange = (nextGender: AvatarGender) => {
    setGender(nextGender);
    const nextItem =
      avatarItems.find((item) => item.equipped && item.gender === nextGender) ?? null;
    setSelectedItem(nextItem);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fff8f5] text-stone-950">
      <AvatarHeader coins={coins} />
      <AvatarCategoryTabs activeCategory={activeCategory} onChange={setActiveCategory} />

      <main className="relative">
        <div className="mx-auto max-w-md px-4 pt-4">
          <div className="grid grid-cols-2 rounded-full border border-white bg-white/70 p-1 shadow-sm backdrop-blur">
            {(["feminino", "masculino"] satisfies AvatarGender[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleGenderChange(option)}
                className={`h-11 rounded-full text-sm font-black capitalize transition active:scale-[0.98] ${
                  gender === option
                    ? "bg-[#ff5c70] text-white shadow-[0_12px_26px_rgba(255,92,112,0.22)]"
                    : "text-stone-500"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <AvatarStage
          gender={gender}
          equippedItem={selectedItem}
          isFavorite={Boolean(selectedItem && favorites.has(selectedItem.id))}
          onRandomize={handleRandomize}
          onReset={handleReset}
          onToggleFavorite={() => selectedItem && toggleFavorite(selectedItem.id)}
          onOpenDetails={() => setShowDetails((value) => !value)}
        />

        {showDetails && (
          <div className="mx-auto -mt-2 max-w-md px-4 pb-4">
            <div className="rounded-[26px] border border-white bg-white/80 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-[#ff5c70]">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-stone-950">
                    {selectedItem?.name ?? "Look base"}
                  </p>
                  <p className="text-xs text-stone-500">
                    Mock visual. Compra, inventário e salvamento real entram em uma próxima etapa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <AvatarShopSheet
          tab={tab}
          onTabChange={setTab}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          items={visibleItems}
          selectedItemId={selectedItem?.id ?? null}
          favorites={favorites}
          onSelectItem={setSelectedItem}
          onToggleFavorite={toggleFavorite}
        />
      </main>

      <AvatarBottomNavigation />
    </div>
  );
}
