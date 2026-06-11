import { memo } from "react";
import { Check, Coins, Heart } from "lucide-react";

import type { AvatarItem } from "@/data/avatarMockData";

type AvatarItemCardProps = {
  item: AvatarItem;
  selected: boolean;
  favorite: boolean;
  onSelect: (item: AvatarItem) => void;
  onToggleFavorite: (itemId: string) => void;
};

function getMockPreviewSrc(item: AvatarItem) {
  const accent =
    item.rarity === "especial" ? "#f59e0b" : item.rarity === "premium" ? "#ff5c70" : "#94a3b8";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="420" height="520" viewBox="0 0 420 520">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#fff7ed"/>
          <stop offset="0.5" stop-color="#fff1f2"/>
          <stop offset="1" stop-color="#f8fafc"/>
        </linearGradient>
        <radialGradient id="halo" cx="50%" cy="38%" r="48%">
          <stop offset="0" stop-color="${accent}" stop-opacity="0.26"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="420" height="520" rx="44" fill="url(#bg)"/>
      <circle cx="210" cy="190" r="148" fill="url(#halo)"/>
      <ellipse cx="210" cy="438" rx="128" ry="28" fill="#0f172a" opacity="0.10"/>
      <path d="M174 156c0-34 72-34 72 0v20c0 26-72 26-72 0z" fill="#f8c7a5"/>
      <path d="M150 238c14-54 104-54 120 0l30 120c6 24-10 46-36 46H156c-26 0-42-22-36-46z" fill="${accent}" opacity="0.86"/>
      <path d="M148 236c-16 12-34 40-42 76" stroke="#f8c7a5" stroke-width="22" stroke-linecap="round"/>
      <path d="M272 236c16 12 34 40 42 76" stroke="#f8c7a5" stroke-width="22" stroke-linecap="round"/>
      <path d="M180 400l-16 76" stroke="#334155" stroke-width="24" stroke-linecap="round"/>
      <path d="M240 400l16 76" stroke="#334155" stroke-width="24" stroke-linecap="round"/>
      <text x="210" y="84" text-anchor="middle" fill="#0f172a" font-family="Poppins, Arial" font-size="24" font-weight="800">${item.category}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function AvatarItemCardBase({
  item,
  selected,
  favorite,
  onSelect,
  onToggleFavorite,
}: AvatarItemCardProps) {
  return (
    <article
      className={`group relative w-[154px] shrink-0 overflow-hidden rounded-[28px] border bg-white shadow-[0_18px_46px_rgba(15,23,42,0.08)] transition duration-300 active:scale-[0.98] ${
        selected ? "border-[#ff5c70] ring-4 ring-rose-100" : "border-white"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="block w-full text-left"
        aria-pressed={selected}
      >
        <div className="relative aspect-[0.82] overflow-hidden rounded-[24px] bg-rose-50">
          <img
            src={getMockPreviewSrc(item)}
            alt={`Preview do item ${item.name}`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
          {selected && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#ff5c70]">
              <Check className="h-3 w-3" />
              Equipado
            </span>
          )}
        </div>

        <div className="space-y-1 px-3 py-3">
          <p className="line-clamp-1 text-sm font-black text-stone-950">{item.name}</p>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
            <Coins className="h-3.5 w-3.5" />
            <span>{item.price}</span>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onToggleFavorite(item.id)}
        aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        className={`absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border border-white/80 shadow-sm backdrop-blur transition active:scale-95 ${
          favorite ? "bg-[#ff5c70] text-white" : "bg-white/80 text-stone-600"
        }`}
      >
        <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
      </button>
    </article>
  );
}

export const AvatarItemCard = memo(AvatarItemCardBase);
