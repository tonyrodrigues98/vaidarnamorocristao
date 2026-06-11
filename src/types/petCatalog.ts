export type PetCatalogEntity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PetCategory = PetCatalogEntity;

export type PetSpecies = PetCatalogEntity & { category_id: string };

export type PetVariant = PetCatalogEntity & {
  category_id: string | null;
  species_id: string | null;
};

export type PetLifeStage = PetCatalogEntity;
export type PetPersonality = PetCatalogEntity;

export type PetBenefitScope = "global" | "category" | "species" | "variant";

export type PetBenefit = PetCatalogEntity & {
  scope: PetBenefitScope;
  scope_id: string | null;
};

export type UserPetV2 = {
  id: string;
  user_id: string;
  category_id: string;
  species_id: string | null;
  variant_id: string | null;
  life_stage_id: string;
  personality_id: string;
  benefit_id: string | null;
  custom_name: string;
  is_equipped: boolean;
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
};

export type UserPetV2Full = UserPetV2 & {
  category: PetCategory | null;
  species: PetSpecies | null;
  variant: PetVariant | null;
  life_stage: PetLifeStage | null;
  personality: PetPersonality | null;
  benefit: PetBenefit | null;
};

export type PetCatalogTable =
  | "pet_categories"
  | "pet_species"
  | "pet_variants"
  | "pet_life_stages"
  | "pet_personalities"
  | "pet_benefits";
