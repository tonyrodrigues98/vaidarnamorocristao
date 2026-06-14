import { supabase } from "@/integrations/supabase/client";
import { resolvePetImage, uploadPetCatalogImage } from "@/lib/petCatalog";
import type {
  PetCareConfig,
  PetCareItem,
  PetCareItemCompat,
  PetCareItemWithCompat,
  PetCareKind,
  PetCareKindWithItems,
  PetCareState,
} from "@/types/petCare";

/* -------------------- config -------------------- */

let cfgCache: PetCareConfig | null = null;
export async function getCareConfig(): Promise<PetCareConfig> {
  if (cfgCache) return cfgCache;
  const { data, error } = await supabase
    .from("pet_care_config" as any)
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  cfgCache = (data as any) ?? {
    id: 1,
    decay_per_hour: 2,
    energy_regen_minutes_per_point: 6,
  };
  return cfgCache!;
}

export async function updateCareConfig(patch: Partial<PetCareConfig>): Promise<void> {
  const { error } = await supabase
    .from("pet_care_config" as any)
    .update(patch as any)
    .eq("id", 1);
  if (error) throw error;
  cfgCache = null;
}

/* -------------------- items (admin) -------------------- */

async function hydrateItem(row: PetCareItem): Promise<PetCareItem> {
  return { ...row, image_url: await resolvePetImage(row.image_url) };
}

export async function listCareItemsAdmin(): Promise<PetCareItemWithCompat[]> {
  const { data, error } = await supabase
    .from("pet_care_items" as any)
    .select("*")
    .order("kind")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  const items = (await Promise.all(((data ?? []) as any[]).map(hydrateItem))) as PetCareItem[];
  const ids = items.map((i) => i.id);
  let compat: PetCareItemCompat[] = [];
  if (ids.length) {
    const { data: c, error: ce } = await supabase
      .from("pet_care_item_compat" as any)
      .select("*")
      .in("item_id", ids);
    if (ce) throw ce;
    compat = (c ?? []) as any;
  }
  return items.map((i) => ({
    ...i,
    compat: compat
      .filter((c) => c.item_id === i.id)
      .map((c) => ({ category_id: c.category_id, species_id: c.species_id })),
  }));
}

export type CareItemWritable = {
  kind: PetCareKindWithItems;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  cost_coins: number;
  restore_amount: number;
  active: boolean;
  sort_order: number;
};

export async function uploadCareItemImage(file: File): Promise<string> {
  return uploadPetCatalogImage(file, "care");
}

export async function createCareItem(input: CareItemWritable): Promise<PetCareItem> {
  const { data, error } = await supabase
    .from("pet_care_items" as any)
    .insert(input as any)
    .select("*")
    .single();
  if (error) throw error;
  return hydrateItem(data as any);
}

export async function updateCareItem(id: string, patch: Partial<CareItemWritable>): Promise<PetCareItem> {
  const { data, error } = await supabase
    .from("pet_care_items" as any)
    .update(patch as any)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return hydrateItem(data as any);
}

export async function deleteCareItem(id: string): Promise<void> {
  const { error } = await supabase.from("pet_care_items" as any).delete().eq("id", id);
  if (error) throw error;
}

export async function setCareItemCompat(
  itemId: string,
  rules: { category_id: string; species_id: string | null }[],
): Promise<void> {
  const { error: dErr } = await supabase
    .from("pet_care_item_compat" as any)
    .delete()
    .eq("item_id", itemId);
  if (dErr) throw dErr;
  if (!rules.length) return;
  const rows = rules.map((r) => ({ item_id: itemId, ...r }));
  const { error: iErr } = await supabase.from("pet_care_item_compat" as any).insert(rows as any);
  if (iErr) throw iErr;
}

/* -------------------- items (user) -------------------- */

/** Items active and compatible with the given pet (category + optional species). */
export async function listCareItemsForPet(opts: {
  kind: PetCareKindWithItems;
  categoryId: string;
  speciesId: string | null;
}): Promise<PetCareItem[]> {
  const { data: c, error: ce } = await supabase
    .from("pet_care_item_compat" as any)
    .select("item_id, category_id, species_id");
  if (ce) throw ce;
  const compat = (c ?? []) as PetCareItemCompat[];
  const allowed = new Set<string>();
  for (const r of compat) {
    if (r.category_id !== opts.categoryId) continue;
    if (r.species_id === null) allowed.add(r.item_id);
    else if (opts.speciesId && r.species_id === opts.speciesId) allowed.add(r.item_id);
  }
  if (!allowed.size) return [];
  const { data, error } = await supabase
    .from("pet_care_items" as any)
    .select("*")
    .in("id", Array.from(allowed))
    .eq("kind", opts.kind)
    .eq("active", true)
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return Promise.all(((data ?? []) as any[]).map(hydrateItem));
}

/* -------------------- state -------------------- */

export async function listCareState(userPetId: string): Promise<PetCareState[]> {
  const { data, error } = await supabase
    .from("pet_care_state" as any)
    .select("*")
    .eq("user_pet_id", userPetId);
  if (error) throw error;
  return (data ?? []) as any;
}

/** Compute current value of a bar from its anchor + elapsed time. */
export function deriveCurrentValue(
  state: PetCareState | undefined,
  cfg: PetCareConfig,
  kind: PetCareKind,
  now: Date = new Date(),
): number {
  if (!state) return kind === "energy" ? 100 : 80;
  const elapsedMin = Math.max(0, (now.getTime() - new Date(state.anchor_at).getTime()) / 60_000);
  if (kind === "energy") {
    // regenera: +1 a cada N minutos
    const gain = Math.floor(elapsedMin / Math.max(1, cfg.energy_regen_minutes_per_point));
    return Math.max(0, Math.min(100, state.value_at_anchor + gain));
  }
  const decay = (cfg.decay_per_hour * elapsedMin) / 60;
  return Math.max(0, Math.min(100, Math.floor(state.value_at_anchor - decay)));
}

/** Manually drain energy (called locally when user performs an action). */
export async function consumeEnergyLocally(
  userPetId: string,
  amount: number,
  cfg: PetCareConfig,
): Promise<void> {
  const { data } = await supabase
    .from("pet_care_state" as any)
    .select("*")
    .eq("user_pet_id", userPetId)
    .eq("kind", "energy")
    .maybeSingle();
  const current = deriveCurrentValue((data as any) ?? undefined, cfg, "energy");
  const next = Math.max(0, current - amount);
  await supabase
    .from("pet_care_state" as any)
    .upsert(
      {
        user_pet_id: userPetId,
        kind: "energy",
        value_at_anchor: next,
        anchor_at: new Date().toISOString(),
      } as any,
      { onConflict: "user_pet_id,kind" },
    );
}

/* -------------------- apply action -------------------- */

export async function applyPetCare(userPetId: string, itemId: string): Promise<number> {
  const { data, error } = await supabase.rpc("apply_pet_care" as any, {
    _user_pet_id: userPetId,
    _item_id: itemId,
  });
  if (error) throw error;
  return data as number;
}