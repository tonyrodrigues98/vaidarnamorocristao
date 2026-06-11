import { Loader2, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarItemCard, type AvatarItemCardItem } from "./AvatarItemCard";

export type ShopTab = "loja" | "meus";

type ShopItem = AvatarItemCardItem & {
  category_id: string;
};

type Props = {
  tab: ShopTab;
  onTabChange: (tab: ShopTab) => void;
  loading: boolean;
  items: ShopItem[];
  equippedByCategory: Map<string, string>;
  inventory: Set<string>;
  favorites: Set<string>;
  coins: number;
  onEquip: (item: ShopItem) => void;
  onToggleFavorite: (item: ShopItem) => void;
};

export function AvatarShopSheet({
  tab,
  onTabChange,
  loading,
  items,
  equippedByCategory,
  inventory,
  favorites,
  coins,
  onEquip,
  onToggleFavorite,
}: Props) {
  return (
    <div className="rounded-t-3xl bg-white px-4 pt-4 pb-24 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-6">
          <TabButton active={tab === "loja"} onClick={() => onTabChange("loja")}>
            Loja
          </TabButton>
          <TabButton active={tab === "meus"} onClick={() => onTabChange("meus")}>
            Meus Itens
          </TabButton>
        </div>
        <button
          type="button"
          aria-label="Filtros"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white"
        >
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            {tab === "meus"
              ? "Você ainda não tem itens desta categoria."
              : "Nenhum item cadastrado nesta categoria ainda."}
          </p>
          <p className="text-xs text-muted-foreground">
            Adicione itens via admin para popular a loja.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <AvatarItemCard
              key={item.id}
              item={item}
              isEquipped={equippedByCategory.get(item.category_id) === item.id}
              owned={inventory.has(item.id)}
              isFavorite={favorites.has(item.id)}
              canAfford={coins >= item.price}
              onEquip={() => onEquip(item)}
              onToggleFavorite={() => onToggleFavorite(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative pb-2 text-sm font-medium",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      {children}
      {active && (
        <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-primary" />
      )}
    </button>
  );
}
