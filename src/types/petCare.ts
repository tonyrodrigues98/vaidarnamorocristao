export type PetCareKindWithItems = "feed" | "play" | "hygiene" | "sleep" | "affection";
export type PetCareKind = PetCareKindWithItems | "energy";

export type PetCareItem = {
  id: string;
  kind: PetCareKindWithItems;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  cost_coins: number;
  restore_amount: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PetCareItemCompat = {
  id: string;
  item_id: string;
  category_id: string;
  species_id: string | null;
};

export type PetCareItemWithCompat = PetCareItem & {
  compat: { category_id: string; species_id: string | null }[];
};

export type PetCareState = {
  id: string;
  user_pet_id: string;
  kind: PetCareKind;
  value_at_anchor: number;
  anchor_at: string;
  updated_at: string;
};

export type PetCareConfig = {
  id: number;
  decay_per_hour: number;
  energy_regen_minutes_per_point: number;
};

export const PET_CARE_ORDER: PetCareKind[] = [
  "feed",
  "energy",
  "play",
  "hygiene",
  "sleep",
  "affection",
];

export const PET_CARE_LABEL: Record<PetCareKind, string> = {
  feed: "Fome",
  energy: "Energia",
  play: "Humor",
  hygiene: "Higiene",
  sleep: "Sono",
  affection: "Carência",
};

export const PET_CARE_ACTION_LABEL: Record<PetCareKindWithItems, string> = {
  feed: "Alimentar",
  play: "Brincar",
  hygiene: "Banho",
  sleep: "Ninar",
  affection: "Carinho",
};