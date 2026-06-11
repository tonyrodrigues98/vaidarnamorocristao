import { memo } from "react";
import { Check, Crown, Eye, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoinIcon } from "@/components/icons/CoinIcon";

export type AvatarItemCardItem = {
  id: string;
  name: string;
  image_url: string;
  thumbnail_url: string | null;
  price: number;
  is_premium: boolean;
};

type Props = {
  item: AvatarItemCardItem;
  isEquipped: boolean;
  owned: boolean;
  isFavorite: boolean;
  canAfford: boolean;
  onEquip: (item: AvatarItemCardItem) => void;
  onToggleFavorite: (item: AvatarItemCardItem) => void;
  onPreview: (item: AvatarItemCardItem) => void;
  isPreviewing?: boolean;
};

function AvatarItemCardImpl({
  item,
  isEquipped,
  owned,
  isFavorite,
  canAfford,
  onEquip,
  onToggleFavorite,
  onPreview,
  isPreviewing,
}: Props) {
  return (
    <button
      type="button"
      onClick={() => onEquip(item)}
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-white p-2 text-left transition",
        isEquipped
          ? "border-primary shadow-md ring-1 ring-primary"
          : "border-border hover:border-primary/40",
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(item);
        }}
        aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}
        className="absolute right-2 top-2 z-10"
      >
        {isEquipped ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3.5 w-3.5" />
          </span>
        ) : (
          <Heart
            className={cn(
              "h-5 w-5",
              isFavorite ? "fill-primary text-primary" : "text-muted-foreground",
            )}
          />
        )}
      </button>
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#FFF7F3] to-[#FFEEE6]">
        <img
          src={item.thumbnail_url ?? item.image_url}
          alt={item.name}
          className="h-full w-full object-contain p-2"
          loading="lazy"
        />
      </div>
      <div className="mt-2 px-1">
        <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
        {item.is_premium && (
          <div className="mt-0.5 flex items-center gap-1 text-xs text-amber-600">
            <Crown className="h-3 w-3" />
            Premium
          </div>
        )}
        <div className="mt-1.5">
          {isEquipped ? (
            <div className="rounded-full bg-primary px-3 py-1 text-center text-xs font-semibold text-primary-foreground">
              Equipado
            </div>
          ) : owned ? (
            <div className="rounded-full bg-secondary px-3 py-1 text-center text-xs font-medium text-foreground">
              Equipar
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center justify-center gap-1 rounded-full border border-black bg-white px-3 py-1 text-xs font-semibold text-foreground",
                !canAfford && "opacity-60",
              )}
            >
              <CoinIcon className="h-3.5 w-3.5" />
              <span>{item.price.toLocaleString("pt-BR")}</span>
            </div>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(item);
            }}
            className={cn(
              "mt-1.5 flex w-full items-center justify-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium transition",
              isPreviewing
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <Eye className="h-3 w-3" />
            {isPreviewing ? "Pré-visualizando" : "Pré Visualizar"}
          </button>
        </div>
      </div>
    </button>
  );
}

export const AvatarItemCard = memo(AvatarItemCardImpl);
