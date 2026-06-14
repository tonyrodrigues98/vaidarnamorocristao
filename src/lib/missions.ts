import { supabase } from "@/integrations/supabase/client";

export type TodayMission = {
  id: string; // user_daily_missions id
  mission_id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string;
  category: string;
  action_key: string;
  target: number;
  difficulty: "easy" | "med" | "hard" | string;
  xp_reward: number;
  coin_reward: number;
  progress: number;
  completed_at: string | null;
};

/** Sorteia (se ainda não houver) e retorna as 3 missões do dia. */
export async function rollAndGetTodayMissions(): Promise<TodayMission[]> {
  // 1) garante sorteio idempotente
  await supabase.rpc("roll_daily_missions" as never).then(() => null).catch(() => null);
  // 2) lista com progresso
  const { data, error } = await supabase.rpc("get_today_missions" as never);
  if (error) return [];
  return ((data as unknown) as TodayMission[]) ?? [];
}

export const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Fácil",
  med: "Média",
  hard: "Difícil",
};