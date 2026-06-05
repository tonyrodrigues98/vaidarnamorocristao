import { supabase } from "@/integrations/supabase/client";

export type NameGradient = {
  id: string;
  name: string;
  color_a: string;
  color_b: string;
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
};

let catalogCache: NameGradient[] | null = null;

export function nameGradientStyle(gradient: Pick<NameGradient, "color_a" | "color_b"> | null) {
  if (!gradient) return undefined;
  return {
    backgroundImage: `linear-gradient(90deg, ${gradient.color_a}, ${gradient.color_b})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
    fontWeight: 900,
    letterSpacing: "-0.035em",
  } as const;
}

export async function fetchNameGradientCatalog(): Promise<NameGradient[]> {
  if (catalogCache) return catalogCache;
  const { data, error } = await supabase
    .from("name_gradients" as never)
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  catalogCache = (data ?? []) as unknown as NameGradient[];
  return catalogCache;
}

export function invalidateNameGradientCatalog() {
  catalogCache = null;
}

export async function fetchNameGradientsByIds(
  ids: Array<string | null | undefined>,
): Promise<Record<string, NameGradient>> {
  const cleanIds = Array.from(new Set(ids.filter(Boolean) as string[]));
  if (!cleanIds.length) return {};

  const { data, error } = await supabase
    .from("name_gradients" as never)
    .select("*")
    .in("id", cleanIds);
  if (error) throw error;

  return Object.fromEntries(
    ((data ?? []) as unknown as NameGradient[]).map((gradient) => [gradient.id, gradient]),
  );
}

export async function fetchAllNameGradientsAdmin(): Promise<NameGradient[]> {
  const { data, error } = await supabase
    .from("name_gradients" as never)
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as NameGradient[];
}

export async function fetchMyOwnedNameGradientIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from("user_name_gradients" as never).select("gradient_id");
  if (error) throw error;
  return new Set(((data ?? []) as Array<{ gradient_id: string }>).map((row) => row.gradient_id));
}

export async function purchaseNameGradient(gradientId: string) {
  const { data, error } = await supabase.rpc(
    "purchase_name_gradient" as never,
    { _gradient_id: gradientId } as never,
  );
  if (error) throw error;
  return data as unknown as { success: boolean; new_balance: number };
}

export async function equipNameGradient(gradientId: string) {
  const { error } = await supabase.rpc(
    "equip_name_gradient" as never,
    { _gradient_id: gradientId } as never,
  );
  if (error) throw error;
}

export async function unequipNameGradient() {
  const { error } = await supabase.rpc("unequip_name_gradient" as never);
  if (error) throw error;
}

export async function createNameGradient(payload: {
  name: string;
  color_a: string;
  color_b: string;
  price: number;
  is_active?: boolean;
  sort_order?: number;
}) {
  const { data, error } = await supabase
    .from("name_gradients" as never)
    .insert({
      name: payload.name,
      color_a: payload.color_a,
      color_b: payload.color_b,
      price: payload.price,
      is_active: payload.is_active ?? true,
      sort_order: payload.sort_order ?? 0,
    } as never)
    .select()
    .single();
  if (error) throw error;
  invalidateNameGradientCatalog();
  return data as unknown as NameGradient;
}

export async function updateNameGradient(id: string, payload: Partial<NameGradient>) {
  const { data, error } = await supabase
    .from("name_gradients" as never)
    .update({ ...payload, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  invalidateNameGradientCatalog();
  return data as unknown as NameGradient;
}

export async function deleteNameGradient(id: string) {
  const { error } = await supabase
    .from("name_gradients" as never)
    .delete()
    .eq("id", id);
  if (error) throw error;
  invalidateNameGradientCatalog();
}
