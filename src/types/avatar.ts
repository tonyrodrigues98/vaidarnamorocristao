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
  | "expressions";

/**
 * Render slot for the layered 2D renderer. Order roughly mirrors paint
 * order (lower = painted earlier / further back).
 */
export type AvatarLayerKey =
  | "background"
  | "body"
  | "skin"
  | "faceBase"
  | "eyes"
  | "eyebrows"
  | "mouth"
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
  | "effect";

export const LAYER_Z_INDEX: Record<AvatarLayerKey, number> = {
  background: 0,
  body: 10,
  skin: 15,
  hairBack: 20,
  faceBase: 25,
  eyes: 30,
  eyebrows: 31,
  mouth: 32,
  top: 40,
  bottom: 41,
  fullOutfit: 42,
  shoes: 45,
  accessoryFace: 50,
  accessoryNeck: 51,
  accessoryHand: 52,
  hairFront: 60,
  pet: 70,
  effect: 80,
};

export type AvatarPoseKey =
  | "standing_default"
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

export type AvatarBodyType = "default" | "slim" | "curvy";

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
  layerKey: AvatarLayerKey;
  zIndex: number;
  compatiblePoses: AvatarPoseKey[];
  compatibleBodyTypes: AvatarBodyType[];
  isPremium: boolean;
  isOwned: boolean;
  isEquipped: boolean;
  isActive: boolean;
};

/** Per-user equipped state (slot → item id). */
export type AvatarEquippedState = Partial<Record<AvatarLayerKey, string>>;

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
