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

/**
 * Concede XP via RPC. Respeita cap diário por fonte quando informado.
 * Falhas são silenciosas (XP é side-effect, não bloqueia ações).
 */
export async function awardXp(
  source: string,
  amount: number,
  dailyCap?: number,
  meta?: Record<string, unknown>,
): Promise<AwardResult | null> {
  try {
    const { data, error } = await supabase.rpc("award_xp" as never, {
      _source: source,
      _amount: amount,
      _daily_cap: dailyCap ?? null,
      _meta: meta ?? null,
    } as never);
    if (error) return null;
    return (data as AwardResult) ?? null;
  } catch {
    return null;
  }
}

/** Fontes oficiais de XP — mantém os strings consistentes pelo app inteiro. */
export const XP_SOURCES = {
  CARE_LOW: { source: "care_low", amount: 8, cap: 6 }, // barra < 50%
  CARE_RESCUE: { source: "care_rescue", amount: 15, cap: 4 }, // barra < 20%
  DAILY_LOGIN: { source: "daily_login", amount: 20, cap: 1 },
  MISSION_DONE: { source: "mission_done", amount: 30, cap: 3 },
  QUIZ_CORRECT: { source: "quiz_correct", amount: 10, cap: 9 },
  MATCH_RECEIVED: { source: "match_received", amount: 25, cap: 5 },
  FIRST_MSG: { source: "first_msg", amount: 15, cap: 3 },
  DEVOTIONAL: { source: "devotional", amount: 20, cap: 1 },
  PRAYED_FOR: { source: "prayed_for", amount: 5, cap: 5 },
  PROFILE_COMPLETE: { source: "profile_complete", amount: 50, cap: 1 },
} as const;