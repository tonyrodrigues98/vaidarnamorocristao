import { supabase } from "@/integrations/supabase/client";
import type {
  PetBenefit,
  PetBenefitScope,
  PetCatalogEntity,
  PetCatalogTable,
  PetCategory,
  PetLifeStage,
  PetLifeStageKind,
  PetPersonality,
  PetPerkEffect,
  PetPerkEffectCategory,
  PetSpecies,
  PetVariant,
  UserPetV2,
  UserPetV2Full,
} from "@/types/petCatalog";

const BUCKET = "pets";
const SIGNED_TTL = 60 * 60 * 24 * 365;

const STORAGE_MARKERS = [
  `/storage/v1/object/public/${BUCKET}/`,
  `/storage/v1/object/sign/${BUCKET}/`,
  `/storage/v1/object/authenticated/${BUCKET}/`,
];

/** Extract the bucket-relative storage path from any stored value (path, public URL, signed URL). */
function extractStoragePath(value: string | null | undefined): string | null {
  if (!value) return null;
  for (const m of STORAGE_MARKERS) {
    const i = value.indexOf(m);
    if (i >= 0) return value.slice(i + m.length).split("?")[0];
  }
  if (/^https?:\/\//i.test(value)) return null;
  return value.split("?")[0];
}

// In-memory cache: avoid re-signing the same path on every render.
const signedCache = new Map<string, { url: string; expiresAt: number }>();
const SIGN_TTL_MS = (SIGNED_TTL - 60 * 60) * 1000; // refresh 1h before expiry

export async function resolvePetImage(value: string | null): Promise<string | null> {
  if (!value) return null;
  const path = extractStoragePath(value);
  if (!path) return value; // external https URL we don't own — return as-is
  const now = Date.now();
  const hit = signedCache.get(path);
  if (hit && hit.expiresAt > now) return hit.url;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
  const url = data?.signedUrl ?? null;
  if (url) signedCache.set(path, { url, expiresAt: now + SIGN_TTL_MS });
  return url;
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
  const r = row as T & {
    image_url_baby?: string | null;
    image_url_adult?: string | null;
  };
  const [main, baby, adult] = await Promise.all([
    resolvePetImage(r.image_url),
    r.image_url_baby !== undefined ? resolvePetImage(r.image_url_baby) : Promise.resolve(undefined),
    r.image_url_adult !== undefined ? resolvePetImage(r.image_url_adult) : Promise.resolve(undefined),
  ]);
  const out: typeof r = { ...r, image_url: main };
  if (r.image_url_baby !== undefined) out.image_url_baby = baby ?? null;
  if (r.image_url_adult !== undefined) out.image_url_adult = adult ?? null;
  return out as T;
}
async function hydrateAll<T extends { image_url: string | null }>(rows: T[]): Promise<T[]> {
  return Promise.all(rows.map(hydrateImage));
}

/**
 * Picks the best image URL for a species/variant given the chosen life-stage
 * kind. Falls back to the opposite stage, then to the legacy `image_url`.
 */
export function resolvePetDisplayImage(
  entity:
    | (Partial<PetSpecies> & { image_url?: string | null })
    | (Partial<PetVariant> & { image_url?: string | null })
    | null
    | undefined,
  stageKind: PetLifeStageKind | undefined,
): string | null {
  if (!entity) return null;
  const baby = (entity as { image_url_baby?: string | null }).image_url_baby ?? null;
  const adult = (entity as { image_url_adult?: string | null }).image_url_adult ?? null;
  if (stageKind === "baby") return baby ?? adult ?? entity.image_url ?? null;
  if (stageKind === "adult") return adult ?? baby ?? entity.image_url ?? null;
  return adult ?? baby ?? entity.image_url ?? null;
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
  const hydrate = async <T extends { image_url: string | null } | null>(r: T): Promise<T> => {
    if (!r) return r;
    const rr = r as T & {
      image_url_baby?: string | null;
      image_url_adult?: string | null;
    };
    const [main, baby, adult] = await Promise.all([
      resolvePetImage(rr.image_url),
      rr.image_url_baby !== undefined ? resolvePetImage(rr.image_url_baby) : Promise.resolve(undefined),
      rr.image_url_adult !== undefined ? resolvePetImage(rr.image_url_adult) : Promise.resolve(undefined),
    ]);
    const out: typeof rr = { ...rr, image_url: main };
    if (rr.image_url_baby !== undefined) out.image_url_baby = baby ?? null;
    if (rr.image_url_adult !== undefined) out.image_url_adult = adult ?? null;
    return out as T;
  };
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
  PetPerkEffect,
  PetSpecies,
  PetVariant,
  UserPetV2,
  UserPetV2Full,
};

// ---------- Perk Effects ----------
export async function listPerkEffects(onlyActive = false): Promise<PetPerkEffect[]> {
  let q = supabase.from("pet_perk_effects" as any).select("*").order("sort_order").order("label");
  if (onlyActive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as PetPerkEffect[];
}

export async function upsertPerkEffect(input: Partial<PetPerkEffect> & { key: string; label: string }): Promise<PetPerkEffect> {
  const { data, error } = await supabase
    .from("pet_perk_effects" as any)
    .upsert(input as any, { onConflict: "key" })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as PetPerkEffect;
}

export async function deletePerkEffect(key: string): Promise<void> {
  const { error } = await supabase.from("pet_perk_effects" as any).delete().eq("key", key);
  if (error) throw error;
}

export const PERK_CATEGORY_LABEL: Record<PetPerkEffectCategory, string> = {
  coins: "Moedas",
  missions: "Missões",
  anonymous: "Recado anônimo",
  gifts: "Presentes",
  cosmetic: "Cosmético",
  pet_collect: "Coletáveis",
  avatar_fx: "Efeito no avatar",
  pet_meta: "Pet (metadados)",
};

// ---------- Target pickers (for unlock_* effects) ----------
export async function listDecorations(kind: "frame" | "aura"): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("avatar_decorations" as any)
    .select("id, name, type, active")
    .eq("type", kind)
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return ((data ?? []) as any[]).map((d) => ({ id: d.id, name: d.name }));
}

export async function listBackgrounds(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("profile_backgrounds" as any)
    .select("id, name, is_active")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return ((data ?? []) as any[]).map((d) => ({ id: d.id, name: d.name }));
}

export async function listBadgesCatalog(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("badges" as any)
    .select("id, name, code")
    .order("name");
  if (error) throw error;
  return ((data ?? []) as any[]).map((d) => ({ id: d.id, name: d.name ?? d.code }));
}

// ---------- User-facing perks ----------
export async function getMyActivePerks() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user?.id) return [];
  const { data, error } = await supabase.rpc("get_active_pet_perks" as any, { _user_id: u.user.id });
  if (error) throw error;
  return (data ?? []) as Array<{
    benefit_id: string;
    effect_key: string;
    effect_param: number | null;
    effect_target_id: string | null;
    label: string;
  }>;
}

export async function collectPetReward() {
  const { data, error } = await supabase.rpc("collect_pet_reward" as any);
  if (error) throw error;
  return data as { awarded: number; balance: number; source: string }[];
}
