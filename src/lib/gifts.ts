import { supabase } from "@/integrations/supabase/client";

export type GiftCategory = "romantic" | "spiritual" | "caring" | "friendship" | "fun" | "legendary";
export type GiftRarity = "common" | "rare" | "epic" | "legendary" | "exclusive";

export type VirtualGift = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  emoji: string | null;
  price_coins: number;
  category: GiftCategory;
  rarity: GiftRarity;
  active: boolean;
  sort_order: number;
};

export type GiftTransaction = {
  id: string;
  sender_id: string;
  receiver_id: string;
  gift_id: string;
  price_paid: number;
  message: string | null;
  status: "held" | "redeemed";
  redeemed_coins: number | null;
  redeemed_at: string | null;
  created_at: string;
  gift?: VirtualGift;
  sender_name?: string | null;
  sender_photo?: string | null;
};

export const CATEGORY_LABELS: Record<GiftCategory, { label: string; emoji: string }> = {
  romantic: { label: "Românticos", emoji: "❤️" },
  spiritual: { label: "Espirituais", emoji: "🙏" },
  caring: { label: "Carinhosos", emoji: "🌹" },
  friendship: { label: "Amizade", emoji: "☕" },
  fun: { label: "Divertidos", emoji: "🎉" },
  legendary: { label: "Lendários", emoji: "👑" },
};

export const RARITY_STYLE: Record<
  GiftRarity,
  { label: string; glow: string; border: string; ring: string; chip: string; gradient: string }
> = {
  common: {
    label: "Comum",
    glow: "shadow-[0_8px_30px_rgba(148,163,184,0.18)]",
    border: "border-slate-300/40",
    ring: "ring-slate-300/30",
    chip: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    gradient: "from-slate-200/40 to-slate-100/10",
  },
  rare: {
    label: "Raro",
    glow: "shadow-[0_10px_40px_rgba(59,130,246,0.30)]",
    border: "border-sky-400/50",
    ring: "ring-sky-400/40",
    chip: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    gradient: "from-sky-400/30 to-cyan-300/10",
  },
  epic: {
    label: "Épico",
    glow: "shadow-[0_12px_45px_rgba(168,85,247,0.40)]",
    border: "border-purple-400/60",
    ring: "ring-purple-400/50",
    chip: "bg-purple-500/15 text-purple-600 dark:text-purple-300",
    gradient: "from-purple-500/30 to-fuchsia-400/15",
  },
  legendary: {
    label: "Lendário",
    glow: "shadow-[0_14px_55px_rgba(251,191,36,0.50)]",
    border: "border-amber-400/70",
    ring: "ring-amber-400/60",
    chip: "bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950",
    gradient: "from-amber-400/40 to-orange-300/20",
  },
  exclusive: {
    label: "Exclusivo",
    glow: "shadow-[0_18px_60px_rgba(236,72,153,0.55)]",
    border: "border-pink-400/70",
    ring: "ring-pink-400/60",
    chip: "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 text-white",
    gradient: "from-pink-500/40 via-fuchsia-400/30 to-purple-500/30",
  },
};

export async function listGifts(): Promise<VirtualGift[]> {
  const { data, error } = await supabase
    .from("virtual_gifts" as never)
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as VirtualGift[];
}

export async function listAllGiftsAdmin(): Promise<VirtualGift[]> {
  const { data, error } = await supabase
    .from("virtual_gifts" as never)
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as VirtualGift[];
}

export async function sendGift(receiverId: string, giftId: string, message?: string): Promise<string> {
  const { data, error } = await supabase.rpc(
    "send_virtual_gift" as never,
    {
      _receiver_id: receiverId,
      _gift_id: giftId,
      _message: message ?? null,
    } as never,
  );
  if (error) throw error;
  return data as unknown as string;
}

export async function redeemGift(txId: string): Promise<number> {
  const { data, error } = await supabase.rpc("redeem_virtual_gift" as never, { _tx_id: txId } as never);
  if (error) throw error;
  return Number(data ?? 0);
}

export async function listMyReceivedGifts(userId: string): Promise<GiftTransaction[]> {
  const { data, error } = await supabase
    .from("gift_transactions" as never)
    .select("*, gift:virtual_gifts(*)")
    .eq("receiver_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as GiftTransaction[];
  const senderIds = Array.from(new Set(rows.map((r) => r.sender_id)));
  if (senderIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id, full_name, photo_url").in("id", senderIds);
    const map = new Map(
      (profs ?? []).map((p: { id: string; full_name: string; photo_url: string | null }) => [p.id, p]),
    );
    rows.forEach((r) => {
      const p = map.get(r.sender_id);
      r.sender_name = p?.full_name ?? null;
      r.sender_photo = p?.photo_url ?? null;
    });
  }
  return rows;
}

export type PublicGiftHighlight = {
  id: string;
  gift_id: string;
  sender_id: string;
  message: string | null;
  created_at: string;
  gift_name: string;
  gift_image_url: string | null;
  gift_emoji: string | null;
  gift_rarity: GiftRarity;
  gift_category: GiftCategory;
};

export async function listPublicGiftHighlights(userId: string, limit = 6): Promise<PublicGiftHighlight[]> {
  const { data, error } = await supabase.rpc(
    "get_received_gifts_public" as never,
    {
      _user_id: userId,
      _limit: limit,
    } as never,
  );
  if (error) throw error;
  return (data ?? []) as unknown as PublicGiftHighlight[];
}

export async function createGift(payload: {
  slug: string;
  name: string;
  description?: string;
  image_url?: string | null;
  emoji?: string | null;
  price_coins: number;
  category: GiftCategory;
  rarity: GiftRarity;
  active?: boolean;
}) {
  const { data, error } = await supabase
    .from("virtual_gifts" as never)
    .insert({
      slug: payload.slug,
      name: payload.name,
      description: payload.description ?? null,
      image_url: payload.image_url ?? null,
      emoji: payload.emoji ?? null,
      price_coins: payload.price_coins,
      category: payload.category,
      rarity: payload.rarity,
      active: payload.active ?? true,
    } as never)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateGift(id: string, payload: Partial<VirtualGift>) {
  const { data, error } = await supabase
    .from("virtual_gifts" as never)
    .update(payload as never)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function toggleGift(id: string, active: boolean) {
  const { error } = await supabase
    .from("virtual_gifts" as never)
    .update({ active } as never)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteGift(id: string) {
  const { error } = await supabase
    .from("virtual_gifts" as never)
    .delete()
    .eq("id", id);

  if (error) throw error;
}
