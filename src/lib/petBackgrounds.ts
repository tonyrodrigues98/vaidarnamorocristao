import { supabase } from "@/integrations/supabase/client";
import { resolvePetImage } from "@/lib/petCatalog";
import type {
  PetBackground,
  PetBackgroundCompat,
  PetBackgroundWithCompat,
  UserPetBackground,
} from "@/types/petBackground";

const BUCKET = "pets";

async function hydrate(row: PetBackground): Promise<PetBackground> {
  const [day, night] = await Promise.all([
    resolvePetImage(row.image_url_day),
    resolvePetImage(row.image_url_night),
  ]);
  return { ...row, image_url_day: day, image_url_night: night };
}

async function hydrateAll(rows: PetBackground[]): Promise<PetBackground[]> {
  return Promise.all(rows.map(hydrate));
}

export async function uploadBackgroundImage(file: File, kind: "day" | "night"): Promise<string> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `backgrounds/${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || `image/${ext}`,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

// ---------- Admin ----------

export async function listAdminBackgrounds(): Promise<PetBackgroundWithCompat[]> {
  const { data, error } = await supabase
    .from("pet_backgrounds" as any)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  const rows = await hydrateAll(((data ?? []) as unknown) as PetBackground[]);
  const ids = rows.map((r) => r.id);
  let compat: PetBackgroundCompat[] = [];
  if (ids.length) {
    const { data: cdata, error: cerr } = await supabase
      .from("pet_background_compat" as any)
      .select("*")
      .in("background_id", ids);
    if (cerr) throw cerr;
    compat = (cdata ?? []) as unknown as PetBackgroundCompat[];
  }
  return rows.map((r) => ({ ...r, compat: compat.filter((c) => c.background_id === r.id) }));
}

export type BackgroundWritable = {
  name: string;
  slug: string;
  description: string | null;
  image_url_day: string | null;
  image_url_night: string | null;
  rarity: PetBackground["rarity"];
  is_exclusive: boolean;
  price_coins: number;
  active: boolean;
  sort_order: number;
  min_level: number;
};

export async function createBackground(input: BackgroundWritable): Promise<PetBackground> {
  const { data, error } = await supabase
    .from("pet_backgrounds" as any)
    .insert(input as any)
    .select("*")
    .single();
  if (error) throw error;
  return hydrate(data as unknown as PetBackground);
}

export async function updateBackground(
  id: string,
  patch: Partial<BackgroundWritable>,
): Promise<PetBackground> {
  const { data, error } = await supabase
    .from("pet_backgrounds" as any)
    .update(patch as any)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return hydrate(data as unknown as PetBackground);
}

export async function deleteBackground(id: string): Promise<void> {
  const { error } = await supabase.from("pet_backgrounds" as any).delete().eq("id", id);
  if (error) throw error;
}

export async function setBackgroundCompat(
  backgroundId: string,
  rules: { category_id: string; species_id: string | null }[],
): Promise<void> {
  const { error: dErr } = await supabase
    .from("pet_background_compat" as any)
    .delete()
    .eq("background_id", backgroundId);
  if (dErr) throw dErr;
  if (!rules.length) return;
  const rows = rules.map((r) => ({ background_id: backgroundId, ...r }));
  const { error: iErr } = await supabase.from("pet_background_compat" as any).insert(rows as any);
  if (iErr) throw iErr;
}

// ---------- User-facing ----------

export async function listCompatibleBackgroundsForPet(opts: {
  categoryId: string;
  speciesId: string | null;
}): Promise<PetBackground[]> {
  // Fetch active backgrounds whose compat matches this category (any species) or this exact species.
  const { data: cdata, error: cerr } = await supabase
    .from("pet_background_compat" as any)
    .select("background_id, category_id, species_id");
  if (cerr) throw cerr;
  const compat = (cdata ?? []) as unknown as PetBackgroundCompat[];
  const allowed = new Set<string>();
  for (const c of compat) {
    if (c.category_id !== opts.categoryId) continue;
    if (c.species_id === null) allowed.add(c.background_id);
    else if (opts.speciesId && c.species_id === opts.speciesId) allowed.add(c.background_id);
  }
  if (!allowed.size) return [];
  const { data, error } = await supabase
    .from("pet_backgrounds" as any)
    .select("*")
    .in("id", Array.from(allowed))
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return hydrateAll(((data ?? []) as unknown) as PetBackground[]);
}

export async function listMyBackgroundUnlocks(): Promise<UserPetBackground[]> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from("user_pet_backgrounds" as any)
    .select("*")
    .eq("user_id", uid);
  if (error) throw error;
  return (data ?? []) as unknown as UserPetBackground[];
}

export async function getEquippedBackground(): Promise<PetBackground | null> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("user_pet_backgrounds" as any)
    .select("background_id, pet_backgrounds(*)")
    .eq("user_id", uid)
    .eq("is_equipped", true)
    .maybeSingle();
  if (error) throw error;
  const bg = (data as any)?.pet_backgrounds as PetBackground | undefined;
  if (!bg) return null;
  return hydrate(bg);
}

export async function unlockPetBackground(backgroundId: string): Promise<string> {
  const { data, error } = await supabase.rpc("unlock_pet_background" as any, {
    _background_id: backgroundId,
  });
  if (error) throw error;
  return data as string;
}

export async function equipPetBackground(backgroundId: string | null): Promise<void> {
  const { error } = await supabase.rpc("equip_pet_background" as any, {
    _background_id: backgroundId,
  });
  if (error) throw error;
}