import { supabase } from "@/integrations/supabase/client";

export type XpState = {
  xp_total: number;
  level: number;
  xp_into_level: number;
  xp_for_next: number;
  is_max: boolean;
};

export type AwardResult = {
  granted: number;
  xp_total?: number;
  level?: number;
  reason?: string;
};

/** Faixa textual por nível. Cap 50. */
export function levelTitle(level: number): string {
  if (level <= 5) return "Filhote";
  if (level <= 10) return "Curioso";
  if (level <= 20) return "Companheiro";
  if (level <= 30) return "Fiel";
  if (level <= 40) return "Sábio";
  return "Lendário";
}

export async function getMyXpState(): Promise<XpState> {
  const { data, error } = await supabase.rpc("get_my_xp_state" as never);
  if (error) throw error;
  return data as XpState;
}

/** Reivindica XP de um evento de cuidado já persistido e pertencente ao usuário. */
export async function awardCareXp(userPetId: string): Promise<AwardResult | null> {
  try {
    const { data, error } = await supabase.rpc(
      "award_my_care_xp" as never,
      {
        _user_pet_id: userPetId,
      } as never,
    );
    if (error) return null;
    return (data as AwardResult) ?? null;
  } catch {
    return null;
  }
}
