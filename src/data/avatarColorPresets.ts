/**
 * Catálogo central de cores reutilizáveis para o avatar. Cada preset é
 * um TOKEN — adicionar uma cor nova de pele/cabelo/roupa = 1 entrada
 * aqui + zero PNG gerado. Ver `mem://features/avatar-architecture` e
 * `.lovable/plan.md` para o pipeline completo.
 *
 * As cores são as canônicas do projeto; quem precisa do recorte exato
 * por tom de pele (sombra + luz para `mask_tint`) usa também
 * `src/lib/avatarPalette.ts` (`SKIN_PALETTE`).
 */

import type {
  AvatarColorPreset,
  AvatarColorPresetCategory,
  AvatarSkinTone,
} from "@/types/avatar";
import { SKIN_PALETTE } from "@/lib/avatarPalette";

// ── Pele ────────────────────────────────────────────────────────────
// Sincronizado com SKIN_PALETTE: o id do preset === AvatarSkinTone.
export const SKIN_COLOR_PRESETS: AvatarColorPreset[] = (
  Object.keys(SKIN_PALETTE) as AvatarSkinTone[]
).map((tone) => ({
  id: `skin-${tone}`,
  name:
    {
      default: "Padrão",
      porcelain: "Porcelana",
      light: "Clara",
      tan: "Bronzeada",
      olive: "Oliva",
      brown: "Marrom",
      deep: "Profunda",
    }[tone] ?? tone,
  hex: SKIN_PALETTE[tone].base,
  shadowHex: SKIN_PALETTE[tone].shadow,
  highlightHex: SKIN_PALETTE[tone].highlight,
  category: "skin",
}));

// ── Cabelo ──────────────────────────────────────────────────────────
export const HAIR_COLOR_PRESETS: AvatarColorPreset[] = [
  { id: "hair-black", name: "Preto", hex: "#1B1B1F", shadowHex: "#000000", highlightHex: "#3A3A40", category: "hair" },
  { id: "hair-dark-brown", name: "Castanho escuro", hex: "#3B2418", shadowHex: "#1F120A", highlightHex: "#6A4632", category: "hair" },
  { id: "hair-light-brown", name: "Castanho claro", hex: "#8A5A3B", shadowHex: "#5A3923", highlightHex: "#B98762", category: "hair" },
  { id: "hair-blonde", name: "Loiro", hex: "#D9B16C", shadowHex: "#A57E3D", highlightHex: "#F1D89A", category: "hair" },
  { id: "hair-red", name: "Ruivo", hex: "#B5471F", shadowHex: "#7A2D11", highlightHex: "#E0744A", category: "hair" },
  { id: "hair-grey", name: "Grisalho", hex: "#9A9A9A", shadowHex: "#6B6B6B", highlightHex: "#D5D5D5", category: "hair" },
];

// ── Roupas básicas (recoloríveis) ───────────────────────────────────
export const CLOTHING_COLOR_PRESETS: AvatarColorPreset[] = [
  { id: "cloth-white", name: "Branco", hex: "#F7F4EF", shadowHex: "#D9D4CB", highlightHex: "#FFFFFF", category: "clothing" },
  { id: "cloth-beige", name: "Bege", hex: "#D9C2A1", shadowHex: "#A88E6A", highlightHex: "#EBD9BD", category: "clothing" },
  { id: "cloth-navy", name: "Azul marinho", hex: "#1F3A5F", shadowHex: "#0E2240", highlightHex: "#3A6093", category: "clothing" },
  { id: "cloth-olive", name: "Verde oliva", hex: "#5F6B3A", shadowHex: "#3A4321", highlightHex: "#8E9A60", category: "clothing" },
  { id: "cloth-black", name: "Preto", hex: "#1A1A1A", shadowHex: "#000000", highlightHex: "#3A3A3A", category: "clothing" },
  { id: "cloth-coral", name: "Coral", hex: "#E27D5A", shadowHex: "#A8523A", highlightHex: "#F0A287", category: "clothing" },
  { id: "cloth-blush", name: "Rosa suave", hex: "#E6B5B0", shadowHex: "#B4807B", highlightHex: "#F5D3CF", category: "clothing" },
];

// ── Olhos (preset simples, ainda não usado pelo renderer) ───────────
export const EYE_COLOR_PRESETS: AvatarColorPreset[] = [
  { id: "eye-brown", name: "Castanho", hex: "#5A3923", category: "eyes" },
  { id: "eye-green", name: "Verde", hex: "#3E6B4A", category: "eyes" },
  { id: "eye-blue", name: "Azul", hex: "#3A6A93", category: "eyes" },
  { id: "eye-honey", name: "Mel", hex: "#A47A3A", category: "eyes" },
];

export const ALL_COLOR_PRESETS: AvatarColorPreset[] = [
  ...SKIN_COLOR_PRESETS,
  ...HAIR_COLOR_PRESETS,
  ...CLOTHING_COLOR_PRESETS,
  ...EYE_COLOR_PRESETS,
];

const PRESET_BY_ID = new Map(ALL_COLOR_PRESETS.map((p) => [p.id, p]));

export function getColorPreset(id: string | null | undefined): AvatarColorPreset | null {
  if (!id) return null;
  return PRESET_BY_ID.get(id) ?? null;
}

export function getColorPresetsByCategory(
  category: AvatarColorPresetCategory,
): AvatarColorPreset[] {
  return ALL_COLOR_PRESETS.filter((p) => p.category === category);
}

/** Default por categoria (primeiro preset). */
export function defaultPresetIdForCategory(
  category: AvatarColorPresetCategory,
): string {
  return getColorPresetsByCategory(category)[0]?.id ?? "";
}
