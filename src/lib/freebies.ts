import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export type FreebieCategory =
  | "profile_background"
  | "pet_background"
  | "decoration_frame"
  | "decoration_aura"
  | "name_gradient";

export type FreebieRarity = "rare" | "epic" | "legendary";

export type FreebieStatus = {
  category: FreebieCategory;
  rarity: FreebieRarity;
  required_level: number;
  unlocked: boolean;
  claimed: boolean;
  claimed_item_id: string | null;
};

export async function fetchMyFreebieStatus(): Promise<FreebieStatus[]> {
  const { data, error } = await supabase.rpc("list_my_freebie_status" as never);
  if (error) throw error;
  return (data ?? []) as unknown as FreebieStatus[];
}

export function freebieStatusQueryOptions(userId: string | null | undefined) {
  return queryOptions({
    queryKey: ["freebie-status", userId ?? "anon"] as const,
    queryFn: fetchMyFreebieStatus,
    enabled: !!userId,
    staleTime: 60_000,
  });
}

/** Retorna true se a pessoa pode resgatar um brinde grátis nesse tier. */
export function canClaimFreebie(
  statuses: FreebieStatus[] | undefined,
  category: FreebieCategory,
  rarity: string | null | undefined,
): boolean {
  if (!statuses || !rarity) return false;
  const s = statuses.find((x) => x.category === category && x.rarity === rarity);
  return !!s && s.unlocked && !s.claimed;
}

export async function claimFreebie(
  category: FreebieCategory,
  rarity: FreebieRarity,
  itemId: string,
) {
  const { data, error } = await supabase.rpc(
    "claim_freebie" as never,
    {
      _category: category,
      _rarity: rarity,
      _item_id: itemId,
    } as never,
  );
  if (error) throw error;
  return data as unknown as { success: boolean; item_id: string };
}
