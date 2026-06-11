/**
 * Mock data for parts of the avatar feature that the DB does not yet
 * model: poses, expressions, and the layer-slot anchor map.
 *
 * Items, categories, bases, inventory, equipped state and coins all
 * still come from Supabase (see src/routes/avatar.tsx). When the DB is
 * extended with `avatar_poses` / `avatar_expressions` (or columns on
 * `avatar_items` such as `layer_key`, `compatible_poses`), swap these
 * arrays for the live query results — the shapes are intentionally
 * aligned with `src/types/avatar.ts`.
 */

import type {
  AvatarExpression,
  AvatarLayerKey,
  AvatarPose,
  AvatarSlot,
} from "@/types/avatar";

export const MOCK_POSES: AvatarPose[] = [
  { key: "standing_default", label: "Padrão", description: "Postura neutra de pé." },
  { key: "elegant", label: "Elegante", description: "Postura sutil, peso em uma perna." },
  { key: "praying", label: "Em oração", description: "Mãos unidas, olhar suave." },
  { key: "waving", label: "Acenando", description: "Um braço levantado em saudação." },
  { key: "holding_heart", label: "Coração", description: "Mãos formando um coração." },
];

export const MOCK_EXPRESSIONS: AvatarExpression[] = [
  { key: "soft_smile", label: "Sorriso suave" },
  { key: "happy", label: "Feliz" },
  { key: "shy", label: "Tímido" },
  { key: "peaceful", label: "Em paz" },
  { key: "praying", label: "Em oração" },
  { key: "surprised", label: "Surpreso" },
];

/**
 * Anchor boxes (percent strings relative to the avatar wrapper) for
 * each renderer layer. The renderer uses these to place a layer at the
 * anatomically correct spot instead of stretching item PNGs across the
 * whole avatar.
 */
export const LAYER_SLOTS: Record<AvatarLayerKey, AvatarSlot> = {
  background: { top: "0%", left: "0%", width: "100%", height: "100%" },
  body: { top: "0%", left: "0%", width: "100%", height: "100%" },
  skin: { top: "0%", left: "0%", width: "100%", height: "100%" },
  faceBase: { top: "5%", left: "30%", width: "40%", height: "22%" },
  eyes: { top: "12%", left: "33%", width: "34%", height: "8%" },
  eyebrows: { top: "9%", left: "33%", width: "34%", height: "5%" },
  mouth: { top: "20%", left: "40%", width: "20%", height: "6%" },
  hairBack: { top: "-4%", left: "18%", width: "64%", height: "34%" },
  hairFront: { top: "-2%", left: "22%", width: "56%", height: "28%" },
  top: { top: "30%", left: "15%", width: "70%", height: "32%" },
  bottom: { top: "55%", left: "20%", width: "60%", height: "30%" },
  fullOutfit: { top: "30%", left: "15%", width: "70%", height: "48%" },
  shoes: { top: "82%", left: "29%", width: "42%", height: "14%" },
  accessoryFace: { top: "10%", left: "30%", width: "40%", height: "14%" },
  accessoryNeck: { top: "26%", left: "35%", width: "30%", height: "10%" },
  accessoryHand: { top: "50%", left: "10%", width: "80%", height: "16%" },
  pet: { top: "70%", left: "60%", width: "30%", height: "28%" },
  effect: { top: "0%", left: "0%", width: "100%", height: "100%" },
};

/**
 * Maps a DB category slug to a renderer layer key. New slugs default to
 * `fullOutfit` so they still paint, but should be added here as the DB
 * grows.
 */
export const CATEGORY_SLUG_TO_LAYER: Record<string, AvatarLayerKey> = {
  roupas: "fullOutfit",
  roupa: "fullOutfit",
  clothing: "fullOutfit",
  clothes: "fullOutfit",
  calcados: "shoes",
  sapatos: "shoes",
  shoes: "shoes",
  cabelos: "hairFront",
  cabelo: "hairFront",
  hair: "hairFront",
  acessorios: "accessoryNeck",
  acessorio: "accessoryNeck",
  accessories: "accessoryNeck",
  especiais: "effect",
  especial: "effect",
  specials: "effect",
  fundos: "background",
  backgrounds: "background",
  pets: "pet",
};
