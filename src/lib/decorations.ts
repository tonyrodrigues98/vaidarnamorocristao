import { supabase } from "@/integrations/supabase/client";

import alianca from "@/assets/decorations/frame-alianca-ouro.png";
import coroa from "@/assets/decorations/frame-coroa-espinhos.png";
import louros from "@/assets/decorations/frame-louros-dourados.png";
import floral from "@/assets/decorations/frame-floral-rosa.png";
import vitral from "@/assets/decorations/frame-vitral-sagrado.png";
import eclipseDourado from "@/assets/decorations/frame-eclipse-dourado.png";
import neonVioleta from "@/assets/decorations/frame-neon-violeta.png";
import horizonte from "@/assets/decorations/frame-horizonte.png";
import cristalRei from "@/assets/decorations/frame-cristal-do-rei.png";
import chamaSagrada from "@/assets/decorations/frame-chama-sagrada.png";
import galaxia from "@/assets/decorations/frame-galaxia.png";
import auroraBoreal from "@/assets/decorations/frame-aurora-boreal.png";
import minimalistaPrata from "@/assets/decorations/frame-minimalista-prata.png";
import coracaoRadiante from "@/assets/decorations/frame-coracao-radiante.png";
import vortice from "@/assets/decorations/frame-vortice.png";
import folhasOliveiras from "@/assets/decorations/frame-folhas-oliveiras.png";
import pomba from "@/assets/decorations/sticker-pomba.png";
import cruz from "@/assets/decorations/sticker-cruz-dourada.png";
import coracao from "@/assets/decorations/sticker-coracao-sagrado.png";
import estrela from "@/assets/decorations/sticker-estrela-belem.png";

export type DecorationType = "frame" | "aura" | "sticker";

export type Decoration = {
  id: string;
  type: DecorationType;
  slug: string;
  name: string;
  image_url: string | null;
  css_value: string | null;
  price_coins: number;
  sort_order: number;
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
  return DECORATION_ASSETS[d.image_url] ?? null;
}

let catalogCache: Decoration[] | null = null;
let catalogPromise: Promise<Decoration[]> | null = null;

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
}

export async function fetchMyOwnedIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("user_decorations" as never)
    .select("decoration_id");
  if (error) throw error;
  return new Set(((data ?? []) as Array<{ decoration_id: string }>).map((r) => r.decoration_id));
}

export async function purchaseDecoration(decorationId: string) {
  const { data, error } = await supabase.rpc("purchase_decoration" as never, {
    _decoration_id: decorationId,
  } as never);
  if (error) throw error;
  return data as unknown as { success: boolean; new_balance: number };
}

export async function equipDecoration(decorationId: string) {
  const { error } = await supabase.rpc("equip_decoration" as never, {
    _decoration_id: decorationId,
  } as never);
  if (error) throw error;
}

export async function unequipDecoration(type: DecorationType) {
  const { error } = await supabase.rpc("unequip_decoration" as never, {
    _type: type,
  } as never);
  if (error) throw error;
}