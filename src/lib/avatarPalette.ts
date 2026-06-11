/**
 * Runtime tokens for the new composicional pipeline (ver .lovable/plan.md).
 *
 * Em vez de gerar uma base PNG por (gênero × corpo × pose × pele × idade),
 * temos UMA base neutra em luminância + máscara de pele e aplicamos cor +
 * sombreamento + marcas de idade em runtime via filtro SVG (ver
 * `SkinTintFilter`). Estes tokens são o único lugar para acrescentar tons
 * de pele ou faixas etárias novas — nenhum PNG novo precisa ser gerado.
 */

import type { AvatarAgeRange } from "@/types/avatar";

export type SkinToneKey =
  | "default"
  | "porcelain"
  | "light"
  | "tan"
  | "olive"
  | "brown"
  | "deep";

export type SkinTonePalette = {
  /** Cor base aplicada ao branco puro da luminância (multiply). */
  base: string;
  /** Sombra usada para luminância < 0.5. */
  shadow: string;
  /** Brilho usado para luminância > 0.85. */
  highlight: string;
};

export const SKIN_PALETTE: Record<SkinToneKey, SkinTonePalette> = {
  default: { base: "#F2CDA0", shadow: "#B07A4F", highlight: "#FBE6CB" },
  porcelain: { base: "#F9E2D0", shadow: "#C99B7A", highlight: "#FFF1E2" },
  light: { base: "#EFC9A4", shadow: "#A87651", highlight: "#FBE3C7" },
  tan: { base: "#C99368", shadow: "#7F5532", highlight: "#E7BC95" },
  olive: { base: "#B68A5A", shadow: "#6F4A28", highlight: "#D7B187" },
  brown: { base: "#8A5A3B", shadow: "#4F311E", highlight: "#B98562" },
  deep: { base: "#4E2E1E", shadow: "#2A1810", highlight: "#7C4E33" },
};

export const SKIN_TONE_LABEL: Record<SkinToneKey, string> = {
  default: "Padrão",
  porcelain: "Porcelana",
  light: "Clara",
  tan: "Bronzeada",
  olive: "Oliva",
  brown: "Marrom",
  deep: "Profunda",
};

/**
 * Overlay de idade aplicado SOBRE a pele já tonalizada (multiply).
 * `strength` = opacidade no PNG do overlay (rugas/manchas).
 * `hairDesaturation` puxa o cabelo p/ grisalho via filtro CSS.
 */
export type AgePalette = {
  overlayStrength: number; // 0..1
  hairDesaturation: number; // 0..1
  hairLightness: number; // -1..1, positivo = mais branco
};

export const AGE_PALETTE: Record<AvatarAgeRange, AgePalette> = {
  "20-35": { overlayStrength: 0, hairDesaturation: 0, hairLightness: 0 },
  "36-50": { overlayStrength: 0.35, hairDesaturation: 0.25, hairLightness: 0.1 },
  "50+": { overlayStrength: 0.7, hairDesaturation: 0.85, hairLightness: 0.45 },
};
