import { supabase } from "@/integrations/supabase/client";
import type {
  PetBenefit,
  PetBenefitScope,
  PetCatalogEntity,
  PetCatalogTable,
  PetCategory,
  PetLifeStage,
  PetPersonality,
  PetSpecies,
  PetVariant,
  UserPetV2,
  UserPetV2Full,
} from "@/types/petCatalog";

const BUCKET = "pets";
const SIGNED_TTL = 60 * 60 * 24 * 365;

function isStoragePath(value: string | null | undefined) {
  return !!value && !/^https?:\/\//i.test(value);
}

export async function resolvePetImage(value: string | null): Promise<string | null> {
  if (!value) return null;
  if (!isStoragePath(value)) return value;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(value, SIGNED_TTL);
  return data?.signedUrl ?? null;
}

export async function uploadPetCatalogImage(file: File, prefix: string): Promise<string> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `catalog/${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || `image/${ext}`,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function hydrateImage<T extends { image_url: string | null }>(row: T): Promise<T> {
  return { ...row, image_url: await resolvePetImage(row.image_url) };
}
async function hydrateAll<T extends { image_url: string | null }>(rows: T[]): Promise<T[]> {
  return Promise.all(rows.map(hydrateImage));
}

// ---------- Generic admin CRUD ----------
export async function listAll<T extends PetCatalogEntity>(table: PetCatalogTable): Promise<T[]> {
  const { data, error } = await supabase
    .from(table as any)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return hydrateAll(((data ?? []) as unknown) as T[]);
}

export async function listActive<T extends PetCatalogEntity>(table: PetCatalogTable): Promise<T[]> {
  const { data, error } = await supabase
    .from(table as any)
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return hydrateAll(((data ?? []) as unknown) as T[]);
}

export async function createRow<T>(table: PetCatalogTable, input: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.from(table as any).insert(input as any).select("*").single();
  if (error) throw error;
  return data as T;
}

export async function updateRow<T>(table: PetCatalogTable, id: string, patch: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.from(table as any).update(patch as any).eq("id", id).select("*").single();
  if (error) throw error;
  return data as T;
}

export async function deleteRow(table: PetCatalogTable, id: string): Promise<void> {
  const { error } = await supabase.from(table as any).delete().eq("id", id);
  if (error) throw error;
}

// ---------- Filtered reads for onboarding ----------
export async function listSpeciesByCategory(categoryId: string): Promise<PetSpecies[]> {
  const { data, error } = await supabase
    .from("pet_species" as any)
    .select("*")
    .eq("active", true)
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return hydrateAll(((data ?? []) as unknown) as PetSpecies[]);
}

export async function listVariantsFor(categoryId: string, speciesId: string | null): Promise<PetVariant[]> {
  let q = supabase.from("pet_variants" as any).select("*").eq("active", true);
  if (speciesId) {
    q = q.or(`species_id.eq.${speciesId},and(species_id.is.null,category_id.eq.${categoryId})`);
  } else {
    q = q.eq("category_id", categoryId).is("species_id", null);
  }
  const { data, error } = await q.order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (error) throw error;
  return hydrateAll(((data ?? []) as unknown) as PetVariant[]);
}

export async function listBenefitsFor(opts: {
  categoryId: string;
  speciesId: string | null;
  variantId: string | null;
}): Promise<PetBenefit[]> {
  const filters: string[] = [`scope.eq.global`];
  filters.push(`and(scope.eq.category,scope_id.eq.${opts.categoryId})`);
  if (opts.speciesId) filters.push(`and(scope.eq.species,scope_id.eq.${opts.speciesId})`);
  if (opts.variantId) filters.push(`and(scope.eq.variant,scope_id.eq.${opts.variantId})`);
  const { data, error } = await supabase
    .from("pet_benefits" as any)
    .select("*")
    .eq("active", true)
    .or(filters.join(","))
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return hydrateAll(((data ?? []) as unknown) as PetBenefit[]);
}

// ---------- user_pets_v2 ----------
export async function getMyPetV2(userId: string): Promise<UserPetV2Full | null> {
  const { data, error } = await supabase
    .from("user_pets_v2" as any)
    .select(
      "*, category:pet_categories(*), species:pet_species(*), variant:pet_variants(*), life_stage:pet_life_stages(*), personality:pet_personalities(*), benefit:pet_benefits(*)",
    )
    .eq("user_id", userId)
    .order("is_equipped", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as UserPetV2Full;
  const hydrate = async <T extends { image_url: string | null } | null>(r: T): Promise<T> =>
    r ? ({ ...r, image_url: await resolvePetImage(r.image_url) } as T) : r;
  return {
    ...row,
    category: await hydrate(row.category),
    species: await hydrate(row.species),
    variant: await hydrate(row.variant),
    life_stage: await hydrate(row.life_stage),
    personality: await hydrate(row.personality),
    benefit: await hydrate(row.benefit),
  };
}

export async function createMyPetV2(input: {
  category_id: string;
  species_id: string | null;
  variant_id: string | null;
  life_stage_id: string;
  personality_id: string;
  benefit_id: string | null;
  custom_name: string;
  visibility: "public" | "private";
}): Promise<UserPetV2> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Você precisa estar logado.");
  // Apaga pets anteriores do usuário para manter um único pet no v2 (simplificação).
  await supabase.from("user_pets_v2" as any).delete().eq("user_id", uid);
  const { data, error } = await supabase
    .from("user_pets_v2" as any)
    .insert({ ...input, user_id: uid, is_equipped: true })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as UserPetV2;
}

export async function updateMyPetV2(
  id: string,
  patch: Partial<Pick<UserPetV2, "custom_name" | "visibility">>,
): Promise<void> {
  const { error } = await supabase.from("user_pets_v2" as any).update(patch).eq("id", id);
  if (error) throw error;
}

export const PET_TABLE_LABEL: Record<PetCatalogTable, string> = {
  pet_categories: "Categorias",
  pet_species: "Espécies / Tipos",
  pet_variants: "Variações / Estilos",
  pet_life_stages: "Fases",
  pet_personalities: "Personalidades",
  pet_benefits: "Benefícios",
};

export const BENEFIT_SCOPE_LABEL: Record<PetBenefitScope, string> = {
  global: "Global",
  category: "Categoria",
  species: "Espécie/Tipo",
  variant: "Variação",
};

export type {
  PetBenefit,
  PetCategory,
  PetLifeStage,
  PetPersonality,
  PetSpecies,
  PetVariant,
  UserPetV2,
  UserPetV2Full,
};
