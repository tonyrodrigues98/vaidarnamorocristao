import type { PetRarity } from "./pet";

export type PetBackground = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url_day: string | null;
  image_url_night: string | null;
  rarity: PetRarity;
  is_exclusive: boolean;
  price_coins: number;
  active: boolean;
  sort_order: number;
  min_level: number;
  created_at: string;
  updated_at: string;
};

export type PetBackgroundCompat = {
  id: string;
  background_id: string;
  category_id: string;
  species_id: string | null;
  created_at: string;
};

export type PetBackgroundWithCompat = PetBackground & {
  compat: PetBackgroundCompat[];
};

export type UserPetBackground = {
  id: string;
  user_id: string;
  background_id: string;
  acquired_at: string;
  is_equipped: boolean;
};
