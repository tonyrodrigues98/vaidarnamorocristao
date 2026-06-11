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
  body_base: { top: "0%", left: "0%", width: "100%", height: "100%" },
  body: { top: "0%", left: "0%", width: "100%", height: "100%" },
  skin_mask: { top: "0%", left: "0%", width: "100%", height: "100%" },
  skin: { top: "0%", left: "0%", width: "100%", height: "100%" },
  faceBase: { top: "5%", left: "30%", width: "40%", height: "22%" },
  eyes: { top: "12%", left: "33%", width: "34%", height: "8%" },
  eyebrows: { top: "9%", left: "33%", width: "34%", height: "5%" },
  mouth: { top: "20%", left: "40%", width: "20%", height: "6%" },
  blush: { top: "17%", left: "32%", width: "36%", height: "6%" },
  nose: { top: "16%", left: "44%", width: "12%", height: "8%" },
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
  aura: { top: "0%", left: "0%", width: "100%", height: "100%" },
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

/**
 * Catálogo MOCK de variantes/itens já no formato composicional novo
 * (`AvatarAssetVariant`-ish). Existe apenas como REFERÊNCIA para wiring
 * do renderer e UX — não substitui o catálogo real lido do Supabase em
 * `src/routes/avatar.tsx`. Quando o backend migrar para `colorMode`,
 * basta espelhar essas chaves nas colunas novas.
 *
 * Cada entrada documenta um caso CANÔNICO da arquitetura híbrida:
 *  1. base corporal recolorível por skinTone (mask_tint)
 *  2. cabelo recolorível simples (tintable)
 *  3. camiseta básica recolorível (mask_tint)
 *  4. roupa premium fixed_asset
 *  5. acessório fixed_asset
 *  6. fundo fixed_asset
 */
export const MOCK_AVATAR_VARIANTS = [
  {
    id: "mock-body-standard-male-standing",
    layerKey: "body_base" as const,
    gender: "male" as const,
    bodyType: "standard" as const,
    pose: "standing_default" as const,
    colorMode: "mask_tint" as const,
    note: "Base corporal NEUTRA (luminance) — recebe skinTone via mask_tint",
  },
  {
    id: "mock-hair-short-tintable",
    layerKey: "hairFront" as const,
    gender: "unisex" as const,
    bodyType: "standard" as const,
    pose: "standing_default" as const,
    colorMode: "tintable" as const,
    availableColorPresetIds: [
      "hair-black",
      "hair-dark-brown",
      "hair-light-brown",
      "hair-blonde",
      "hair-red",
      "hair-grey",
    ],
    note: "Mesmo PNG, 6 cores possíveis em runtime",
  },
  {
    id: "mock-tshirt-basic",
    layerKey: "top" as const,
    gender: "unisex" as const,
    bodyType: "standard" as const,
    pose: "standing_default" as const,
    colorMode: "mask_tint" as const,
    availableColorPresetIds: [
      "cloth-white",
      "cloth-beige",
      "cloth-navy",
      "cloth-olive",
      "cloth-black",
      "cloth-coral",
      "cloth-blush",
    ],
    note: "Camiseta lisa: 1 baseUrl + 1 maskUrl + 7 cores token",
  },
  {
    id: "mock-dress-premium",
    layerKey: "fullOutfit" as const,
    gender: "female" as const,
    bodyType: "standard" as const,
    pose: "elegant" as const,
    colorMode: "fixed_asset" as const,
    note: "Vestido com estampa/textura — mantém PNG próprio",
  },
  {
    id: "mock-necklace-gold",
    layerKey: "accessoryNeck" as const,
    gender: "unisex" as const,
    bodyType: "standard" as const,
    pose: "standing_default" as const,
    colorMode: "fixed_asset" as const,
    note: "Material metálico — fixed_asset",
  },
  {
    id: "mock-bg-room",
    layerKey: "background" as const,
    gender: "unisex" as const,
    bodyType: "standard" as const,
    pose: "standing_default" as const,
    colorMode: "fixed_asset" as const,
    note: "Fundo do quarto — fixed_asset",
  },
];
