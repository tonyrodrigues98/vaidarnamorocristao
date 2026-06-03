import { supabase } from "@/integrations/supabase/client";

export type ProfileBackgroundRarity = "common" | "rare" | "epic" | "legendary" | "exclusive";

export type ProfileBackground = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  rarity: ProfileBackgroundRarity;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export const BACKGROUND_RARITY_STYLE: Record<
  ProfileBackgroundRarity,
  { label: string; chip: string; border: string }
> = {
  common: {
    label: "Comum",
    chip: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    border: "border-slate-300/40",
  },
  rare: {
    label: "Raro",
    chip: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    border: "border-sky-400/50",
  },
  epic: {
    label: "Epico",
    chip: "bg-purple-500/15 text-purple-600 dark:text-purple-300",
    border: "border-purple-400/60",
  },
  legendary: {
    label: "Lendario",
    chip: "bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950",
    border: "border-amber-400/70",
  },
  exclusive: {
    label: "Exclusivo",
    chip: "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 text-white",
    border: "border-pink-400/70",
  },
};

let backgroundsCache: ProfileBackground[] | null = null;
let backgroundsPromise: Promise<ProfileBackground[]> | null = null;

export async function fetchProfileBackgroundCatalog(): Promise<ProfileBackground[]> {
  if (backgroundsCache) return backgroundsCache;
  if (backgroundsPromise) return backgroundsPromise;
  backgroundsPromise = (async () => {
    const { data, error } = await supabase
      .from("profile_backgrounds" as never)
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    backgroundsCache = (data ?? []) as unknown as ProfileBackground[];
    return backgroundsCache;
  })();
  return backgroundsPromise;
}

export function invalidateProfileBackgroundCatalog() {
  backgroundsCache = null;
  backgroundsPromise = null;
}

export async function fetchAllProfileBackgroundsAdmin(): Promise<ProfileBackground[]> {
  const { data, error } = await supabase
    .from("profile_backgrounds" as never)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ProfileBackground[];
}

export async function fetchMyOwnedBackgroundIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("user_profile_backgrounds" as never)
    .select("background_id");
  if (error) throw error;
  return new Set(((data ?? []) as Array<{ background_id: string }>).map((r) => r.background_id));
}

export async function purchaseProfileBackground(backgroundId: string) {
  const { data, error } = await supabase.rpc("purchase_profile_background" as never, {
    _background_id: backgroundId,
  } as never);
  if (error) throw error;
  return data as unknown as { success: boolean; new_balance: number };
}

export async function equipProfileBackground(backgroundId: string) {
  const { error } = await supabase.rpc("equip_profile_background" as never, {
    _background_id: backgroundId,
  } as never);
  if (error) throw error;
}

export async function unequipProfileBackground() {
  const { error } = await supabase.rpc("unequip_profile_background" as never);
  if (error) throw error;
}

export async function createProfileBackground(payload: {
  name: string;
  description?: string | null;
  image_url?: string | null;
  price: number;
  rarity: ProfileBackgroundRarity;
  is_active?: boolean;
  sort_order?: number;
}) {
  const { data, error } = await supabase
    .from("profile_backgrounds" as never)
    .insert({
      name: payload.name,
      description: payload.description ?? null,
      image_url: payload.image_url ?? null,
      price: payload.price,
      rarity: payload.rarity,
      is_active: payload.is_active ?? true,
      sort_order: payload.sort_order ?? 0,
    } as never)
    .select()
    .single();
  if (error) throw error;
  invalidateProfileBackgroundCatalog();
  return data as unknown as ProfileBackground;
}

export async function updateProfileBackground(id: string, payload: Partial<ProfileBackground>) {
  const { data, error } = await supabase
    .from("profile_backgrounds" as never)
    .update(payload as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  invalidateProfileBackgroundCatalog();
  return data as unknown as ProfileBackground;
}

export async function deleteProfileBackground(id: string) {
  const { error } = await supabase.from("profile_backgrounds" as never).delete().eq("id", id);
  if (error) throw error;
  invalidateProfileBackgroundCatalog();
}
