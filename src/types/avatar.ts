/**
 * Avatar feature types.
 *
 * These types describe the future-facing architecture for the avatar
 * studio (layered 2D rendering, poses, expressions, looks, inventory).
 * Today the page still reads/writes against the live Supabase tables
 * (`avatar_categories`, `avatar_items`, `avatar_bases`,
 * `user_avatar_inventory`, `user_avatar_equipped`, `user_avatar_looks`,
 * `user_coins`, RPC `purchase_avatar_item`), so the DB-shaped types live
 * alongside the richer client-side layer model.
 *
 * When the backend is extended (poses, expressions, pets, backgrounds,
 * saved looks v2), the same names below should map 1:1 to the new tables:
 *   - avatar_profiles
 *   - avatar_items (extend with layer_key, compatible_poses, ...)
 *   - user_avatar_items (== user_avatar_inventory)
 *   - user_avatar_equipped
 *   - avatar_saved_looks (== user_avatar_looks)
 */

export type AvatarGender = "male" | "female";

export type AvatarCategoryKey =
  | "clothes"
  | "accessories"
  | "hair"
  | "shoes"
  | "special"
  | "backgrounds"
  | "pets"
  | "poses"
  | "expressions"
  | "eyes"
  | "eyebrows"
  | "mouth"
  | "beard";

/**
 * Avatar age range. Affects which base is rendered, which overlays apply,
 * and which hair/eyebrow color variants the shop highlights first.
 * - "20-35": default base, no aging treatment.
 * - "36-50": default base + subtle aging overlay; slightly desaturated hair.
 * - "50+":   dedicated base (slight posture change), grey/white hair variants.
 */
export type AvatarAgeRange = "20-35" | "36-50" | "50+";

/**
 * Where the head sits inside a given base PNG, in normalized 0-1 coords
 * relative to the rendered stage. Used by AvatarRenderer to align facial
 * item layers (eyes, eyebrows, mouth) on top of poses where the head shifts.
 * `scale` is the head's height as a fraction of the stage height, so item
 * PNGs can be sized proportionally.
 */
export type AvatarHeadAnchor = {
  x: number;
  y: number;
  scale: number;
};

/**
 * Render slot for the layered 2D renderer. Order roughly mirrors paint
 * order (lower = painted earlier / further back).
 */
export type AvatarLayerKey =
  | "background"
  | "body"
  | "skin"
  | "body_base"
  | "skin_mask"
  | "faceBase"
  | "eyes"
  | "eyebrows"
  | "mouth"
  | "blush"
  | "nose"
  | "hairBack"
  | "hairFront"
  | "top"
  | "bottom"
  | "fullOutfit"
  | "shoes"
  | "accessoryFace"
  | "accessoryNeck"
  | "accessoryHand"
  | "pet"
  | "aura"
  | "effect";

export const LAYER_Z_INDEX: Record<AvatarLayerKey, number> = {
  background: 0,
  body_base: 8,
  body: 10,
  skin_mask: 12,
  skin: 15,
  hairBack: 20,
  faceBase: 25,
  eyes: 30,
  eyebrows: 31,
  mouth: 32,
  blush: 33,
  nose: 34,
  top: 40,
  bottom: 41,
  fullOutfit: 42,
  shoes: 45,
  accessoryFace: 50,
  accessoryNeck: 51,
  accessoryHand: 52,
  hairFront: 60,
  pet: 70,
  aura: 75,
  effect: 80,
};

export type AvatarPoseKey =
  | "standing_default"
  | "t_pose"
  | "elegant"
  | "praying"
  | "waving"
  | "holding_heart";

export type AvatarExpressionKey =
  | "soft_smile"
  | "happy"
  | "shy"
  | "peaceful"
  | "praying"
  | "surprised";

/**
 * Tipo de corpo. `"standard"` é o canônico do novo pipeline; `"default"`
 * e `"curvy"` ficam por compatibilidade com bases já cadastradas.
 */
export type AvatarBodyType =
  | "standard"
  | "slim"
  | "overweight"
  | "strong"
  | "default"
  | "curvy";

/**
 * Tom de pele canônico do pipeline composicional. Adicionar uma entrada
 * aqui = adicionar tokens em `src/data/avatarColorPresets.ts` + 0 PNG.
 */
export type AvatarSkinTone =
  | "default"
  | "porcelain"
  | "light"
  | "tan"
  | "olive"
  | "brown"
  | "deep";

/**
 * Estratégia de cor por layer/item. O `AvatarRenderer` lê este campo e
 * decide como pintar:
 *  - `fixed_asset`: usa `imageUrl` tal qual (assets premium, estampas, etc.)
 *  - `tintable`:    aplica filtro CSS leve usando o preset (recolor barato
 *                   para roupas básicas e cabelos simples).
 *  - `mask_tint`:   usa `baseUrl` (cinza/luminância) + `maskUrl` (recorte)
 *                   + cor do preset via SVG filter / composite. Caminho
 *                   ideal para pele e roupas lisas.
 *  - `canvas_tint`: reservado para composição via <canvas> (gradientes,
 *                   sombras procedurais). Renderer trata como fallback
 *                   `fixed_asset` enquanto não estiver implementado.
 */
export type AvatarColorMode =
  | "fixed_asset"
  | "tintable"
  | "mask_tint"
  | "canvas_tint";

export type AvatarColorPresetCategory = "skin" | "hair" | "clothing" | "eyes";

/** Token de cor reusável. Adicionar cor = 1 entrada, 0 PNG. */
export type AvatarColorPreset = {
  id: string;
  name: string;
  hex: string;
  secondaryHex?: string;
  shadowHex?: string;
  highlightHex?: string;
  category: AvatarColorPresetCategory;
};

/**
 * Asset de uma camada (base/cabelo/roupa) já no formato do novo pipeline.
 * Quando `colorMode === "mask_tint"`, `baseUrl` + `maskUrl` viram a fonte
 * de verdade; `imageUrl` continua sendo o PNG legado (ou thumb).
 *
 * `needsRealTransparency: true` sinaliza assets antigos com fundo
 * quadriculado embutido — o renderer não tenta recortar; a UI pode
 * mostrar um aviso só para super-admins.
 */
export type AvatarAssetVariant = {
  id: string;
  imageUrl: string;
  maskUrl?: string;
  baseUrl?: string;
  gender: AvatarGender | "unisex";
  bodyType: AvatarBodyType;
  pose: AvatarPoseKey;
  layerKey: AvatarLayerKey;
  colorMode: AvatarColorMode;
  defaultColorPresetId?: string;
  compatibleSkinTones?: AvatarSkinTone[];
  compatibleColorPresets?: string[];
  needsRealTransparency?: boolean;
};

/** Anchor box (percent strings) for placing a layer inside the stage. */
export type AvatarSlot = {
  top: string;
  left: string;
  width: string;
  height: string;
};

/** Generic layer the renderer can paint, independent of source (DB or mock). */
export type AvatarRendererLayer = {
  id: string;
  layerKey: AvatarLayerKey;
  imageUrl: string;
  zIndex: number;
  slot: AvatarSlot;
  visible?: boolean;
  alt?: string;
  /** Default `fixed_asset` para retro-compat com itens já cadastrados. */
  colorMode?: AvatarColorMode;
  /** Necessário para `mask_tint`. */
  baseUrl?: string;
  maskUrl?: string;
  /** Cor aplicada quando `colorMode !== "fixed_asset"`. */
  colorPreset?: AvatarColorPreset;
  /** Permite ao renderer pular assets com falso transparente. */
  needsRealTransparency?: boolean;
};

/** Client-side enriched item (DB row + future-facing metadata). */
export type AvatarItem = {
  id: string;
  name: string;
  category: AvatarCategoryKey | string;
  subcategory?: string;
  genderTarget: AvatarGender | "unisex";
  rarity: string;
  priceCoins: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  /** Opcional — necessário só quando `colorMode === "mask_tint"`. */
  baseUrl?: string;
  maskUrl?: string;
  layerKey: AvatarLayerKey;
  zIndex: number;
  compatiblePoses: AvatarPoseKey[];
  compatibleBodyTypes: AvatarBodyType[];
  /** Estratégia de cor; defaults `fixed_asset` se ausente. */
  colorMode?: AvatarColorMode;
  /** IDs em `AvatarColorPreset` permitidos para esse item. */
  availableColorPresetIds?: string[];
  /** `true` se o usuário pode escolher cor. */
  isTintable?: boolean;
  isPremium: boolean;
  isOwned: boolean;
  isEquipped: boolean;
  isActive: boolean;
};

/** Per-user equipped state (slot → item id). */
export type AvatarLayerSelection = Partial<Record<AvatarLayerKey, string>>;

/**
 * Estado COMPLETO do avatar de um usuário. Inclui escolhas de COR
 * (`colorSelections`) — chave é `layerKey`, valor é o id do preset.
 * Persistência real virá numa migration futura; hoje é local-only.
 */
export type AvatarEquippedState = {
  gender: AvatarGender;
  bodyType: AvatarBodyType;
  skinTone: AvatarSkinTone;
  pose: AvatarPoseKey;
  expression: AvatarExpressionKey;
  layers: AvatarLayerSelection;
  colorSelections: Partial<Record<AvatarLayerKey, string>>;
};

export type AvatarPose = {
  key: AvatarPoseKey;
  label: string;
  description?: string;
};

export type AvatarExpression = {
  key: AvatarExpressionKey;
  label: string;
  description?: string;
};
