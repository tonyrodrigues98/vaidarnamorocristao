import { supabase } from "@/integrations/supabase/client";

export type PetEvolutionStatus =
  | {
      pet_id: string;
      stage_kind: "baby" | "adult";
      is_baby: boolean;
      level: number;
      streak: number;
      required_level: number;
      required_streak: number;
      eligible: boolean;
    }
  | { eligible: false; reason: "auth" | "no_pet" };

export async function getPetEvolutionStatus(): Promise<PetEvolutionStatus> {
  const { data, error } = await supabase.rpc("get_pet_evolution_status" as never);
  if (error) throw error;
  return data as unknown as PetEvolutionStatus;
}

export type EvolveResult =
  | { ok: true; pet_id: string; xp_bonus: number; adult_unlocked: boolean }
  | {
      ok: false;
      reason: "auth" | "no_pet" | "not_baby" | "gate" | "no_adult_stage";
      level?: number;
      streak?: number;
      required_level?: number;
      required_streak?: number;
    };

export async function evolveMyPet(): Promise<EvolveResult> {
  const { data, error } = await supabase.rpc("evolve_my_pet" as never);
  if (error) throw error;
  return data as unknown as EvolveResult;
}

/** Verifica se o usuário pode escolher adulto direto em pets futuros. */
export async function isAdultPetUnlocked(): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return false;
  const { data, error } = await supabase
    .from("user_pet_unlocks" as never)
    .select("adult_unlocked_at")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) return false;
  return Boolean((data as { adult_unlocked_at?: string | null } | null)?.adult_unlocked_at);
}

export const ADULT_PET_UNLOCK_COST = 250;

export type UnlockAdultResult =
  | { ok: true; already_unlocked: boolean; balance: number; cost?: number }
  | {
      ok: false;
      reason: "auth" | "invalid_amount" | "insufficient_coins";
      balance?: number;
      cost?: number;
    };

/** Paga moedas pra desbloquear escolha de pet adulto. */
export async function unlockAdultPetWithCoins(
  cost = ADULT_PET_UNLOCK_COST,
): Promise<UnlockAdultResult> {
  const { data, error } = await supabase.rpc(
    "unlock_adult_pet_with_coins" as never,
    { _cost: cost } as never,
  );
  if (error) throw error;
  return data as unknown as UnlockAdultResult;
}
