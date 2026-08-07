export type GrabPrizeKind =
  | "care_item"
  | "pet_background"
  | "decoration"
  | "name_gradient"
  | "coins"
  | "xp";

export const GRAB_PRIZE_KIND_LABEL: Record<GrabPrizeKind, string> = {
  care_item: "Item de cuidado",
  pet_background: "Cenário do pet",
  decoration: "Decoração",
  name_gradient: "Gradiente de nome",
  coins: "Moedas",
  xp: "XP",
};

export type GrabPool = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  active: boolean;
  sort_order: number;
  cost_coins: number | null;
  free_daily_uses: number | null;
  weight: number;
  created_at?: string;
  updated_at?: string;
};

export type GrabPoolPrize = {
  id: string;
  pool_id: string;
  prize_kind: GrabPrizeKind;
  prize_ref_id: string | null;
  prize_amount: number;
  weight: number;
  active: boolean;
  sort_order: number;
};

export type GrabConfig = {
  id: number;
  default_free_daily: number;
  default_paid_cost_coins: number;
};

export type GrabStatePool = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  cost_coins: number;
  free_daily: number;
  free_used: number;
  paid_used: number;
  prize_count: number;
  rarity: GrabPoolRarity;
  cooldown_hours: number;
  cooldown_seconds: number;
  icon_key: string | null;
  featured_until: string | null;
  pity_threshold: number;
  pity_count: number;
  pity_tier?: "rare" | "epic" | "legendary";
  pity_eligible?: boolean;
};

export type GrabPoolRarity = "starter" | "common" | "rare" | "epic" | "legendary" | "special";

export type GrabRecentRoll = {
  prize_kind: GrabPrizeKind;
  prize_ref_id: string | null;
  prize_amount: number;
  was_paid: boolean;
  rolled_at: string;
};

export type GrabState = {
  pools: GrabStatePool[];
  free_used: number;
  paid_used: number;
  coin_balance?: number;
  default_free_daily: number;
  default_paid_cost: number;
  recent: GrabRecentRoll[];
};

export type GrabResult = {
  prize_kind: GrabPrizeKind;
  prize_ref_id: string | null;
  prize_amount: number;
  was_paid: boolean;
  new_balance: number;
  free_remaining: number;
  cost_paid: number;
};

export type GrabMultiResult = {
  count: number;
  results: GrabResult[];
};

export type GrabInventoryItem = {
  id: string;
  prize_kind: GrabPrizeKind;
  prize_ref_id: string;
  quantity: number;
};
