import { ShoppingBag, Sparkles } from "lucide-react";

import { AvatarAppearanceControls } from "@/components/avatar/AvatarAppearanceControls";
import { AvatarItemCard } from "@/components/avatar/AvatarItemCard";
import {
  avatarFilters,
  type AvatarAppearance,
  type AvatarFilterId,
  type AvatarItem,
} from "@/data/avatarMockData";

type AvatarShopSheetProps = {
  tab: "shop" | "inventory";
  onTabChange: (tab: "shop" | "inventory") => void;
  activeFilter: AvatarFilterId;
  appearance: AvatarAppearance;
  onFilterChange: (filter: AvatarFilterId) => void;
  onAppearanceChange: (appearance: AvatarAppearance) => void;
  items: AvatarItem[];
  selectedItemId: string | null;
  favorites: Set<string>;
  onSelectItem: (item: AvatarItem) => void;
  onToggleFavorite: (itemId: string) => void;
};

export function AvatarShopSheet({
  tab,
  onTabChange,
  activeFilter,
  appearance,
  onFilterChange,
  onAppearanceChange,
  items,
  selectedItemId,
  favorites,
  onSelectItem,
  onToggleFavorite,
}: AvatarShopSheetProps) {
  return (
    <section className="relative z-20 mx-auto -mt-2 max-w-md rounded-t-[34px] border border-white bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-3 shadow-[0_-24px_70px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-stone-200" />

      <AvatarAppearanceControls appearance={appearance} onChange={onAppearanceChange} />

      <div className="mb-4 grid grid-cols-2 rounded-full bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => onTabChange("shop")}
          className={`flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-black transition ${
            tab === "shop"
              ? "bg-white text-[#ff5c70] shadow-sm"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Loja de Looks
        </button>
        <button
          type="button"
          onClick={() => onTabChange("inventory")}
          className={`flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-black transition ${
            tab === "inventory"
              ? "bg-white text-[#ff5c70] shadow-sm"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Meus Itens
        </button>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {avatarFilters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFilterChange(filter.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-extrabold transition active:scale-95 ${
              activeFilter === filter.id
                ? "border-[#ff5c70] bg-[#ff5c70] text-white shadow-[0_12px_30px_rgba(255,92,112,0.24)]"
                : "border-stone-200 bg-white text-stone-600"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.length > 0 ? (
          items.map((item) => (
            <AvatarItemCard
              key={item.id}
              item={item}
              selected={selectedItemId === item.id}
              favorite={favorites.has(item.id)}
              onSelect={onSelectItem}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        ) : (
          <div className="w-full rounded-[28px] border border-dashed border-rose-200 bg-rose-50/60 p-6 text-center">
            <p className="text-sm font-bold text-stone-800">Nenhum item nessa seleção.</p>
            <p className="mt-1 text-xs text-stone-500">
              Troque o filtro ou a categoria para ver mais looks.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
