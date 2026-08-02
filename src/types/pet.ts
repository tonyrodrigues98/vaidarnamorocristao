export type PetRarity = "common" | "rare" | "epic" | "legendary";

export type PetDisplaySize = "mini" | "profile" | "showcase";

export type Pet = {
  id: string;
  name: string;
  slug: string;
  species: string;
  description: string | null;
  rarity: PetRarity;
  price_coins: number;
  image_url: string | null;
  preview_url: string | null;
  is_active: boolean;
  sort_order: number;
  is_exclusive: boolean;
  // Reservados (não usados na Fase 1)
  pose: string | null;
  animation_url: string | null;
  shadow_url: string | null;
  sound_url: string | null;
  event_tag: string | null;
  limited_until: string | null;
  created_at: string;
  updated_at: string;
};

export type UserPet = {
  id: string;
  user_id: string;
  pet_id: string;
  custom_name: string | null;
  acquired_at: string;
  is_equipped: boolean;
};

export type UserPetWithPet = UserPet & { pet: Pet };

export const PET_RARITY_LABEL: Record<PetRarity, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

export const PET_RARITY_COLOR: Record<PetRarity, string> = {
  common: "bg-slate-100 text-slate-700",
  rare: "bg-sky-100 text-sky-700",
  epic: "bg-violet-100 text-violet-700",
  legendary: "bg-amber-100 text-amber-800",
};

export const PET_RARITY_META: Record<
  PetRarity,
  { label: string; borderClass: string; ringClass: string }
> = {
  common: {
    label: "Comum",
    borderClass: "border-slate-300/70 dark:border-slate-700/60",
    ringClass: "ring-2 ring-slate-300/70",
  },
  rare: {
    label: "Raro",
    borderClass: "border-sky-300/70 dark:border-sky-700/60",
    ringClass: "ring-2 ring-sky-300/80",
  },
  epic: {
    label: "Épico",
    borderClass: "border-violet-300/70 dark:border-violet-700/60",
    ringClass: "ring-2 ring-violet-400/80",
  },
  legendary: {
    label: "Lendário",
    borderClass: "border-amber-300/80 dark:border-amber-600/60",
    ringClass: "ring-2 ring-amber-400/90",
  },
};
