import { supabase } from "@/integrations/supabase/client";
import { resolvePetImage } from "@/lib/petCatalog";
import { assetFor as decorationAssetFor } from "@/lib/decorations";
import type {
  GrabConfig,
  GrabInventoryItem,
  GrabMultiResult,
  GrabPool,
  GrabPoolPrize,
  GrabResult,
  GrabState,
} from "@/types/petGrab";

/* ===================== User-facing ===================== */

export async function getGrabState(): Promise<GrabState> {
  const { data, error } = await supabase.rpc("get_grab_state" as any);
  if (error) throw error;
  return data as GrabState;
}

export async function performGrab(poolId: string): Promise<GrabResult> {
  const { data, error } = await supabase.rpc("perform_grab" as any, { _pool_id: poolId });
  if (error) throw error;
  return data as GrabResult;
}

export async function performGrabMulti(poolId: string, count: 5 | 10): Promise<GrabMultiResult> {
  const { data, error } = await supabase.rpc("perform_grab_multi" as any, {
    _pool_id: poolId,
    _count: count,
  });
  if (error) throw error;
  return data as GrabMultiResult;
}

export async function listMyGrabInventory(): Promise<GrabInventoryItem[]> {
  const { data, error } = await supabase
    .from("user_grab_inventory" as any)
    .select("id, prize_kind, prize_ref_id, quantity")
    .gt("quantity", 0)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as GrabInventoryItem[];
}

export async function getCareItemStock(itemId: string): Promise<number> {
  const { data, error } = await supabase
    .from("user_grab_inventory" as any)
    .select("quantity")
    .eq("prize_kind", "care_item")
    .eq("prize_ref_id", itemId)
    .maybeSingle();
  if (error) throw error;
  return ((data as any)?.quantity as number) ?? 0;
}

export async function getCareItemStockMap(itemIds: string[]): Promise<Record<string, number>> {
  if (!itemIds.length) return {};
  const { data, error } = await supabase
    .from("user_grab_inventory" as any)
    .select("prize_ref_id, quantity")
    .eq("prize_kind", "care_item")
    .in("prize_ref_id", itemIds);
  if (error) throw error;
  const out: Record<string, number> = {};
  for (const r of (data ?? []) as any[]) out[r.prize_ref_id] = r.quantity ?? 0;
  return out;
}

/* ===================== Admin ===================== */

export async function getGrabConfig(): Promise<GrabConfig> {
  const { data, error } = await supabase
    .from("grab_config" as any)
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return (data as any) ?? { id: 1, default_free_daily: 3, default_paid_cost_coins: 10 };
}

export async function updateGrabConfig(patch: Partial<GrabConfig>): Promise<void> {
  const { error } = await supabase
    .from("grab_config" as any)
    .update(patch as any)
    .eq("id", 1);
  if (error) throw error;
}

export async function listGrabPools(): Promise<GrabPool[]> {
  const { data, error } = await supabase
    .from("grab_pools" as any)
    .select("*")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as GrabPool[];
}

export type GrabPoolWritable = Omit<GrabPool, "id" | "created_at" | "updated_at">;

export async function createGrabPool(p: GrabPoolWritable): Promise<GrabPool> {
  const { data, error } = await supabase
    .from("grab_pools" as any)
    .insert(p as any)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as GrabPool;
}

export async function updateGrabPool(id: string, patch: Partial<GrabPoolWritable>): Promise<void> {
  const { error } = await supabase
    .from("grab_pools" as any)
    .update(patch as any)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteGrabPool(id: string): Promise<void> {
  const { error } = await supabase
    .from("grab_pools" as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function listGrabPoolPrizes(poolId: string): Promise<GrabPoolPrize[]> {
  const { data, error } = await supabase
    .from("grab_pool_prizes" as any)
    .select("*")
    .eq("pool_id", poolId)
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as GrabPoolPrize[];
}

export type GrabPrizeWritable = Omit<GrabPoolPrize, "id">;

export async function createGrabPrize(p: GrabPrizeWritable): Promise<GrabPoolPrize> {
  const { data, error } = await supabase
    .from("grab_pool_prizes" as any)
    .insert(p as any)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as GrabPoolPrize;
}

export async function updateGrabPrize(
  id: string,
  patch: Partial<GrabPrizeWritable>,
): Promise<void> {
  const { error } = await supabase
    .from("grab_pool_prizes" as any)
    .update(patch as any)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteGrabPrize(id: string): Promise<void> {
  const { error } = await supabase
    .from("grab_pool_prizes" as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/* ===================== Prize catalogs (for admin picker) ===================== */

export type PrizeCatalogItem = { id: string; name: string };

export async function listPrizeCatalog(kind: string): Promise<PrizeCatalogItem[]> {
  switch (kind) {
    case "care_item": {
      const { data, error } = await supabase
        .from("pet_care_items" as any)
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as PrizeCatalogItem[];
    }
    case "pet_background": {
      const { data, error } = await supabase
        .from("pet_backgrounds" as any)
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as PrizeCatalogItem[];
    }
    case "decoration": {
      const { data, error } = await supabase
        .from("avatar_decorations" as any)
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as PrizeCatalogItem[];
    }
    case "name_gradient": {
      const { data, error } = await supabase
        .from("name_gradients" as any)
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as PrizeCatalogItem[];
    }
    default:
      return [];
  }
}

/* ===================== Resolve prize metadata for display ===================== */

export type PrizeRarity = "common" | "rare" | "epic" | "legendary";
export type PrizeMeta = {
  name: string;
  image_url: string | null;
  rarity?: PrizeRarity;
  kind?: string;
  amount?: number;
  gradient_css?: string;
};

function rarityFromCareItem(row: {
  cost_coins?: number | null;
  restore_amount?: number | null;
}): PrizeRarity {
  const cost = row.cost_coins ?? 0;
  const restore = row.restore_amount ?? 0;
  if (cost >= 25 || restore >= 80) return "legendary";
  if (cost >= 15) return "epic";
  if (cost >= 8) return "rare";
  return "common";
}
function rarityFromString(r: string | null | undefined): PrizeRarity {
  const v = (r ?? "").toLowerCase();
  if (v === "exclusive" || v === "legendary" || v === "lendaria" || v === "lendária")
    return "legendary";
  if (v === "epic" || v === "epica" || v === "épica") return "epic";
  if (v === "rare" || v === "rara") return "rare";
  return "common";
}
function rarityFromGradientPrice(price: number | null | undefined): PrizeRarity {
  const p = price ?? 0;
  if (p >= 80) return "legendary";
  if (p >= 50) return "epic";
  if (p >= 30) return "rare";
  return "common";
}

export async function listPoolPrizeMetas(poolId: string): Promise<PrizeMeta[]> {
  const { data, error } = await supabase
    .from("grab_pool_prizes" as any)
    .select("prize_kind, prize_ref_id, prize_amount")
    .eq("pool_id", poolId)
    .eq("active", true);
  if (error) throw error;
  const rows = (data ?? []) as unknown as {
    prize_kind: string;
    prize_ref_id: string | null;
    prize_amount: number;
  }[];
  const metas = await Promise.all(
    rows.map(async (r) => {
      const m = await resolvePrize(r.prize_kind, r.prize_ref_id);
      if (!m) return null;
      return { ...m, kind: r.prize_kind, amount: r.prize_amount } as PrizeMeta;
    }),
  );
  return metas.filter((m): m is PrizeMeta => !!m);
}

export async function resolvePrize(kind: string, refId: string | null): Promise<PrizeMeta | null> {
  if (kind === "coins") {
    return { name: "Moedas", image_url: null, kind, rarity: "common" };
  }
  if (kind === "xp") {
    return {
      name: "XP",
      image_url: new URL("../assets/caixas/capsula_xp.png", import.meta.url).href,
      kind,
      rarity: "common",
    };
  }
  if (!refId) return null;
  if (kind === "care_item") {
    const { data } = await supabase
      .from("pet_care_items" as any)
      .select("name, image_url, cost_coins, restore_amount")
      .eq("id", refId)
      .maybeSingle();
    if (!data) return null;
    return {
      name: (data as any).name,
      image_url: await resolvePetImage((data as any).image_url),
      kind,
      rarity: rarityFromCareItem(data as any),
    };
  }
  if (kind === "pet_background") {
    const { data } = await supabase
      .from("pet_backgrounds" as any)
      .select("name, image_url_day, rarity")
      .eq("id", refId)
      .maybeSingle();
    if (!data) return null;
    return {
      name: (data as any).name,
      image_url: await resolvePetImage((data as any).image_url_day),
      kind,
      rarity: rarityFromString((data as any).rarity),
    };
  }
  if (kind === "decoration") {
    const { data } = await supabase
      .from("avatar_decorations" as any)
      .select("name, image_url, rarity")
      .eq("id", refId)
      .maybeSingle();
    if (!data) return null;
    return {
      name: (data as any).name,
      image_url: decorationAssetFor({ image_url: (data as any).image_url }),
      kind,
      rarity: rarityFromString((data as any).rarity),
    };
  }
  if (kind === "name_gradient") {
    const { data } = await supabase
      .from("name_gradients" as any)
      .select("name, price, color_a, color_b")
      .eq("id", refId)
      .maybeSingle();
    if (!data) return null;
    const a = (data as any).color_a ?? "#C9A24A";
    const b = (data as any).color_b ?? "#FFFFFF";
    return {
      name: (data as any).name,
      image_url: null,
      kind,
      rarity: rarityFromGradientPrice((data as any).price),
      gradient_css: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
    };
  }
  return null;
}
