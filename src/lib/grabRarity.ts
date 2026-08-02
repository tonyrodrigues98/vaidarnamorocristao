import type { LucideIcon } from "lucide-react";
import {
  Box,
  Coins,
  Crown,
  Dices,
  Frame,
  Gem,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Utensils,
  Zap,
} from "lucide-react";
import type { GrabPoolRarity } from "@/types/petGrab";

/**
 * Tokens visuais por raridade — usados em cards, bordas, glows e cerimônia.
 * Mantém a paleta loot-box gamer com cores quentes pra lendária e frias pra rara.
 */
export type RarityTokens = {
  label: string;
  /** Texto curto pra UI compacta */
  shortLabel: string;
  /** Cor hex base, usada em sombras dinâmicas */
  hex: string;
  /** Classe utilitária Tailwind pra texto colorido */
  textClass: string;
  /** Classe de borda */
  borderClass: string;
  /** Glow radial em CSS (background) */
  glowCss: string;
  /** Shadow externo pra cards */
  shadowCss: string;
  /** Rank numérico (pra animação por intensidade) */
  rank: 0 | 1 | 2 | 3 | 4;
};

export const RARITY: Record<GrabPoolRarity, RarityTokens> = {
  starter: {
    label: "Iniciante",
    shortLabel: "Início",
    hex: "#8a7e6b",
    textClass: "text-[#5b5142]",
    borderClass: "border-[#e8dfce]",
    glowCss: "radial-gradient(120% 90% at 50% 0%, rgba(201,182,148,0.22), transparent 70%)",
    shadowCss: "0 8px 28px -14px rgba(91,81,66,0.18)",
    rank: 0,
  },
  common: {
    label: "Comum",
    shortLabel: "Comum",
    hex: "#b07b4f",
    textClass: "text-[#8a5a36]",
    borderClass: "border-[#e7d3bc]",
    glowCss: "radial-gradient(120% 90% at 50% 0%, rgba(199,141,93,0.20), transparent 70%)",
    shadowCss: "0 10px 30px -14px rgba(176,123,79,0.28)",
    rank: 1,
  },
  rare: {
    label: "Rara",
    shortLabel: "Rara",
    hex: "#1f4e8a",
    textClass: "text-[#1f4e8a]",
    borderClass: "border-[#c9d8ec]",
    glowCss: "radial-gradient(120% 90% at 50% 0%, rgba(31,78,138,0.18), transparent 70%)",
    shadowCss: "0 12px 34px -14px rgba(31,78,138,0.32)",
    rank: 2,
  },
  epic: {
    label: "Épica",
    shortLabel: "Épica",
    hex: "#0f6b4f",
    textClass: "text-[#0f6b4f]",
    borderClass: "border-[#bfe0d0]",
    glowCss: "radial-gradient(120% 90% at 50% 0%, rgba(15,107,79,0.22), transparent 70%)",
    shadowCss: "0 14px 38px -14px rgba(15,107,79,0.36)",
    rank: 3,
  },
  legendary: {
    label: "Lendária",
    shortLabel: "Lendária",
    hex: "#c9a24a",
    textClass: "text-[#9a7626]",
    borderClass: "border-[#e6cf8a]",
    glowCss:
      "radial-gradient(120% 100% at 50% 0%, rgba(232,199,122,0.55), rgba(201,162,74,0.18) 45%, transparent 75%)",
    shadowCss: "0 18px 44px -14px rgba(201,162,74,0.45)",
    rank: 4,
  },
  special: {
    label: "Especial",
    shortLabel: "Especial",
    hex: "#5b1a2e",
    textClass: "text-[#5b1a2e]",
    borderClass: "border-[#e6cf8a]",
    glowCss:
      "conic-gradient(from 210deg, rgba(232,199,122,0.45), rgba(91,26,46,0.20), rgba(232,199,122,0.45), rgba(15,107,79,0.18), rgba(232,199,122,0.45))",
    shadowCss: "0 18px 44px -14px rgba(91,26,46,0.38)",
    rank: 4,
  },
};

export function rarityTokens(r: string | null | undefined): RarityTokens {
  const key = (r ?? "common").toLowerCase() as GrabPoolRarity;
  return RARITY[key] ?? RARITY.common;
}

/** Mapeia o icon_key da DB para um componente lucide. */
export const ICON_MAP: Record<string, LucideIcon> = {
  coins: Coins,
  zap: Zap,
  utensils: Utensils,
  image: ImageIcon,
  frame: Frame,
  palette: Palette,
  box: Box,
  gem: Gem,
  crown: Crown,
  dices: Dices,
  sparkles: Sparkles,
};

export function iconForKey(key: string | null | undefined): LucideIcon {
  if (!key) return Box;
  return ICON_MAP[key] ?? Box;
}

export function formatCooldown(seconds: number): string {
  if (seconds <= 0) return "";
  const d = Math.floor(seconds / 86400);
  if (d >= 1) return `${d}d ${Math.floor((seconds % 86400) / 3600)}h`;
  const h = Math.floor(seconds / 3600);
  if (h >= 1) return `${h}h ${Math.floor((seconds % 3600) / 60)}m`;
  const m = Math.floor(seconds / 60);
  if (m >= 1) return `${m}m ${seconds % 60}s`;
  return `${seconds}s`;
}
