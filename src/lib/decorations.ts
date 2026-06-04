import { supabase } from "@/integrations/supabase/client";

import alianca from "@/assets/decorations/frame-alianca-ouro.webp";
import coroa from "@/assets/decorations/frame-coroa-espinhos.webp";
import louros from "@/assets/decorations/frame-louros-dourados.webp";
import floral from "@/assets/decorations/frame-floral-rosa.webp";
import vitral from "@/assets/decorations/frame-vitral-sagrado.webp";
import eclipseDourado from "@/assets/decorations/frame-eclipse-dourado.webp";
import neonVioleta from "@/assets/decorations/frame-neon-violeta.webp";
import horizonte from "@/assets/decorations/frame-horizonte.webp";
import cristalRei from "@/assets/decorations/frame-cristal-do-rei.webp";
import chamaSagrada from "@/assets/decorations/frame-chama-sagrada.webp";
import galaxia from "@/assets/decorations/frame-galaxia.webp";
import auroraBoreal from "@/assets/decorations/frame-aurora-boreal.webp";
import minimalistaPrata from "@/assets/decorations/frame-minimalista-prata.webp";
import coracaoRadiante from "@/assets/decorations/frame-coracao-radiante.webp";
import vortice from "@/assets/decorations/frame-vortice.webp";
import folhasOliveiras from "@/assets/decorations/frame-folhas-oliveiras.webp";
import pomba from "@/assets/decorations/sticker-pomba.webp";
import cruz from "@/assets/decorations/sticker-cruz-dourada.webp";
import coracao from "@/assets/decorations/sticker-coracao-sagrado.webp";
import estrela from "@/assets/decorations/sticker-estrela-belem.webp";

export type DecorationType = "frame" | "aura" | "sticker";
export type DecorationRarity = "common" | "rare" | "epic" | "legendary" | "exclusive";

export type Decoration = {
  id: string;
  type: DecorationType;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  css_value: string | null;
  price_coins: number;
  rarity: DecorationRarity;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string | null;
};

export const DECORATION_RARITY_STYLE: Record<
  DecorationRarity,
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

export const DECORATION_ASSETS: Record<string, string> = {
  "frame-alianca-ouro.png": alianca,
  "frame-coroa-espinhos.png": coroa,
  "frame-louros-dourados.png": louros,
  "frame-floral-rosa.png": floral,
  "frame-vitral-sagrado.png": vitral,
  "frame-eclipse-dourado.png": eclipseDourado,
  "frame-neon-violeta.png": neonVioleta,
  "frame-horizonte.png": horizonte,
  "frame-cristal-do-rei.png": cristalRei,
  "frame-chama-sagrada.png": chamaSagrada,
  "frame-galaxia.png": galaxia,
  "frame-aurora-boreal.png": auroraBoreal,
  "frame-minimalista-prata.png": minimalistaPrata,
  "frame-coracao-radiante.png": coracaoRadiante,
  "frame-vortice.png": vortice,
  "frame-folhas-oliveiras.png": folhasOliveiras,
  "sticker-pomba.png": pomba,
  "sticker-cruz-dourada.png": cruz,
  "sticker-coracao-sagrado.png": coracao,
  "sticker-estrela-belem.png": estrela,
};

export function assetFor(d: Pick<Decoration, "image_url"> | null | undefined): string | null {
  if (!d?.image_url) return null;
  if (DECORATION_ASSETS[d.image_url]) return DECORATION_ASSETS[d.image_url];
  if (/^(https?:|data:|blob:|\/)/.test(d.image_url)) return d.image_url;
  if (d.image_url.startsWith("avatar-decorations/")) {
    return supabase.storage.from("gift-images").getPublicUrl(d.image_url).data.publicUrl;
  }
  if (d.image_url.startsWith("gift-images/")) {
    const path = d.image_url.replace(/^gift-images\//, "");
    return supabase.storage.from("gift-images").getPublicUrl(path).data.publicUrl;
  }
  return d.image_url;
}

let catalogCache: Decoration[] | null = null;
let catalogPromise: Promise<Decoration[]> | null = null;
let renderCatalogCache: Decoration[] | null = null;
let renderCatalogPromise: Promise<Decoration[]> | null = null;

export async function fetchDecorationCatalog(): Promise<Decoration[]> {
  if (catalogCache) return catalogCache;
  if (catalogPromise) return catalogPromise;
  catalogPromise = (async () => {
    const { data, error } = await supabase
      .from("avatar_decorations" as never)
      .select("*")
      .eq("active", true)
      .order("type")
      .order("sort_order");
    if (error) throw error;
    catalogCache = (data ?? []) as unknown as Decoration[];
    return catalogCache;
  })();
  return catalogPromise;
}

export function invalidateDecorationCatalog() {
  catalogCache = null;
  catalogPromise = null;
  renderCatalogCache = null;
  renderCatalogPromise = null;
}

export async function fetchDecorationRenderCatalog(force = false): Promise<Decoration[]> {
  if (force) {
    renderCatalogCache = null;
    renderCatalogPromise = null;
  }
  if (renderCatalogCache) return renderCatalogCache;
  if (renderCatalogPromise) return renderCatalogPromise;
  renderCatalogPromise = (async () => {
    const { data, error } = await supabase
      .from("avatar_decorations" as never)
      .select("*")
      .order("type")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    renderCatalogCache = (data ?? []) as unknown as Decoration[];
    return renderCatalogCache;
  })();
  return renderCatalogPromise;
}

export async function fetchAdminDecorations(type: DecorationType): Promise<Decoration[]> {
  const { data, error } = await supabase
    .from("avatar_decorations" as never)
    .select("*")
    .eq("type", type)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Decoration[];
}

export type DecorationPayload = {
  type: DecorationType;
  slug: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  css_value?: string | null;
  price_coins: number;
  rarity?: DecorationRarity;
  sort_order?: number;
  active?: boolean;
};

export async function createDecoration(payload: DecorationPayload) {
  const { data, error } = await supabase
    .from("avatar_decorations" as never)
    .insert({
      type: payload.type,
      slug: payload.slug,
      name: payload.name,
      description: payload.description ?? null,
      image_url: payload.image_url ?? null,
      css_value: payload.css_value ?? null,
      price_coins: payload.price_coins,
      rarity: payload.rarity ?? "common",
      sort_order: payload.sort_order ?? 0,
      active: payload.active ?? true,
    } as never)
    .select()
    .single();
  if (error) throw error;
  invalidateDecorationCatalog();
  return data as unknown as Decoration;
}

export async function updateDecoration(id: string, payload: Partial<DecorationPayload>) {
  const { data, error } = await supabase
    .from("avatar_decorations" as never)
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  invalidateDecorationCatalog();
  return data as unknown as Decoration;
}

export async function reorderDecorations(updates: Array<Pick<Decoration, "id" | "sort_order">>) {
  const results = await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase
        .from("avatar_decorations" as never)
        .update({
          sort_order,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
  invalidateDecorationCatalog();
}

export async function getDecorationUsage(decorationId: string) {
  const [{ count: ownedCount, error: ownedError }, { count: equippedCount, error: equippedError }] =
    await Promise.all([
      supabase
        .from("user_decorations" as never)
        .select("id", { count: "exact", head: true })
        .eq("decoration_id", decorationId),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .or(
          `equipped_frame_id.eq.${decorationId},equipped_aura_id.eq.${decorationId},equipped_sticker_id.eq.${decorationId}`,
        ),
    ]);
  if (ownedError) throw ownedError;
  if (equippedError) throw equippedError;
  return {
    ownedCount: ownedCount ?? 0,
    equippedCount: equippedCount ?? 0,
  };
}

export async function deleteDecoration(id: string) {
  const { error } = await supabase
    .from("avatar_decorations" as never)
    .delete()
    .eq("id", id);
  if (error) throw error;
  invalidateDecorationCatalog();
}

export async function fetchMyOwnedIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("user_decorations" as never)
    .select("decoration_id")
    .eq("user_id", userId);

  if (error) throw error;

  return new Set(((data ?? []) as Array<{ decoration_id: string }>).map((r) => r.decoration_id));
}

export async function purchaseDecoration(decorationId: string) {
  const { data, error } = await supabase.rpc(
    "purchase_decoration" as never,
    {
      _decoration_id: decorationId,
    } as never,
  );
  if (error) throw error;
  return data as unknown as { success: boolean; new_balance: number };
}

export function decorationErrorMessage(
  error: unknown,
  fallback = "Não foi possível concluir a ação.",
) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message)
        : "";

  if (message.includes("not_authenticated")) {
    return "Você precisa estar logado para fazer isso.";
  }

  if (message.includes("decoration_not_found")) {
    return "Este item não foi encontrado ou não está mais disponível.";
  }

  if (message.includes("decoration_inactive")) {
    return "Este item está inativo no admin e não pode ser equipado.";
  }

  if (message.includes("not_owned")) {
    return "Você ainda não possui este item. Compre ou desbloqueie antes de equipar.";
  }

  if (message.includes("profile_not_found")) {
    return "Seu perfil não foi encontrado. Complete seu perfil antes de equipar itens.";
  }

  if (message.includes("invalid_decoration_type")) {
    return "Tipo de item inválido. Verifique se ele foi criado como moldura ou aura corretamente.";
  }

  if (message.includes("schema cache") || message.includes("equip_decoration")) {
    return "A função de equipar no banco está desatualizada. Rode a correção SQL da função equip_decoration.";
  }

  return message || fallback;
}

export type EquippedDecorations = {
  frame: string | null;
  aura: string | null;
  sticker: string | null;
};

export async function fetchMyEquippedDecorations(userId: string): Promise<EquippedDecorations> {
  const { data, error } = await supabase
    .from("profiles")
    .select("equipped_frame_id, equipped_aura_id, equipped_sticker_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  const profile = (data ?? {}) as {
    equipped_frame_id?: string | null;
    equipped_aura_id?: string | null;
    equipped_sticker_id?: string | null;
  };

  return {
    frame: profile.equipped_frame_id ?? null,
    aura: profile.equipped_aura_id ?? null,
    sticker: profile.equipped_sticker_id ?? null,
  };
}

export async function equipDecoration(decorationId: string) {
  const { data, error } = await supabase.rpc(
    "equip_decoration" as never,
    {
      _decoration_id: decorationId,
    } as never,
  );

  if (error) throw error;

  invalidateDecorationCatalog();

  return data as unknown as {
    success: boolean;
    type: DecorationType;
    decoration_id: string;
  };
}

export async function unequipDecoration(type: DecorationType) {
  const { data, error } = await supabase.rpc(
    "unequip_decoration" as never,
    {
      _type: type,
    } as never,
  );

  if (error) throw error;

  invalidateDecorationCatalog();

  return data as unknown as {
    success: boolean;
    type: DecorationType;
  };
}
