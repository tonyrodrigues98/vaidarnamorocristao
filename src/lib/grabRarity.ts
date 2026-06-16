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
    hex: "#a3a3a3",
    textClass: "text-neutral-300",
    borderClass: "border-neutral-700",
    glowCss: "radial-gradient(circle at 50% 50%, rgba(163,163,163,0.18), transparent 65%)",
    shadowCss: "0 0 18px rgba(163,163,163,0.18)",
    rank: 0,
  },
  common: {
    label: "Comum",
    shortLabel: "Comum",
    hex: "#f472b6",
    textClass: "text-rose-300",
    borderClass: "border-rose-500/40",
    glowCss: "radial-gradient(circle at 50% 50%, rgba(244,114,182,0.20), transparent 65%)",
    shadowCss: "0 0 22px rgba(244,114,182,0.25)",
    rank: 1,
  },
  rare: {
    label: "Rara",
    shortLabel: "Rara",
    hex: "#38bdf8",
    textClass: "text-sky-300",
    borderClass: "border-sky-500/50",
    glowCss: "radial-gradient(circle at 50% 50%, rgba(56,189,248,0.28), transparent 65%)",
    shadowCss: "0 0 26px rgba(56,189,248,0.35)",
    rank: 2,
  },
  epic: {
    label: "Épica",
    shortLabel: "Épica",
    hex: "#a855f7",
    textClass: "text-violet-300",
    borderClass: "border-violet-500/60",
    glowCss: "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.34), transparent 65%)",
    shadowCss: "0 0 32px rgba(168,85,247,0.45)",
    rank: 3,
  },
  legendary: {
    label: "Lendária",
    shortLabel: "Lendária",
    hex: "#fbbf24",
    textClass: "text-amber-300",
    borderClass: "border-amber-400/70",
    glowCss: "radial-gradient(circle at 50% 50%, rgba(251,191,36,0.42), transparent 65%)",
    shadowCss: "0 0 40px rgba(251,191,36,0.55)",
    rank: 4,
  },
  special: {
    label: "Especial",
    shortLabel: "Especial",
    hex: "#22d3ee",
    textClass: "text-cyan-300",
    borderClass: "border-cyan-400/60",
    glowCss:
      "conic-gradient(from 0deg, rgba(251,191,36,0.35), rgba(244,114,182,0.35), rgba(168,85,247,0.35), rgba(34,211,238,0.35), rgba(251,191,36,0.35))",
    shadowCss: "0 0 36px rgba(34,211,238,0.45)",
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