import { supabase } from "@/integrations/supabase/client";

export type PetStreakInfo = {
  current: number;
  best: number;
  shield: number;
  cared_today: boolean;
  last_care_date: string | null;
};

export type PetWeeklyChestInfo = {
  week_start: string;
  done: number;
  target: number;
  claimed: boolean;
  reward_coins: number;
  reward_xp: number;
};

export async function getPetStreak(): Promise<PetStreakInfo> {
  const { data, error } = await supabase.rpc("get_pet_streak" as never);
  if (error) throw error;
  return data as unknown as PetStreakInfo;
}

export async function getPetWeeklyChest(): Promise<PetWeeklyChestInfo> {
  const { data, error } = await supabase.rpc("get_pet_weekly_chest" as never);
  if (error) throw error;
  return data as unknown as PetWeeklyChestInfo;
}

export async function claimPetWeeklyChest(): Promise<{
  ok: boolean;
  reason?: string;
  coins?: number;
  xp?: number;
}> {
  const { data, error } = await supabase.rpc("claim_pet_weekly_chest" as never);
  if (error) throw error;
  return data as unknown as { ok: boolean; reason?: string; coins?: number; xp?: number };
}

/** Próximo marco do streak (linear+marcos). */
export const STREAK_MARKERS = [7, 14, 30, 60, 100];
export function nextStreakMarker(current: number): number | null {
  for (const m of STREAK_MARKERS) if (current < m) return m;
  return null;
}