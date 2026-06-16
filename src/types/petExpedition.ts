export type ExpeditionDifficulty = "easy" | "medium" | "hard" | "extreme";
export type ExpeditionOutcome = "pending" | "success" | "crit" | "fail";

export const DIFFICULTY_LABEL: Record<ExpeditionDifficulty, string> = {
  easy: "Fácil",
  medium: "Média",
  hard: "Difícil",
  extreme: "Extrema",
};

export const DIFFICULTY_TONE: Record<ExpeditionDifficulty, string> = {
  easy: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  medium: "bg-amber-100 text-amber-700 ring-amber-200",
  hard: "bg-orange-100 text-orange-700 ring-orange-200",
  extreme: "bg-rose-100 text-rose-700 ring-rose-200",
};

/** Defaults aplicados no admin quando muda a dificuldade. */
export const DIFFICULTY_DEFAULTS: Record<
  ExpeditionDifficulty,
  {
    duration_minutes: number;
    energy_cost: number;
    min_user_level: number;
    xp_reward: number;
    coin_reward: number;
    success_rate: number;
    crit_rate: number;
  }
> = {
  easy: { duration_minutes: 60, energy_cost: 20, min_user_level: 1, xp_reward: 20, coin_reward: 30, success_rate: 100, crit_rate: 10 },
  medium: { duration_minutes: 240, energy_cost: 40, min_user_level: 3, xp_reward: 50, coin_reward: 60, success_rate: 85, crit_rate: 12 },
  hard: { duration_minutes: 480, energy_cost: 60, min_user_level: 5, xp_reward: 120, coin_reward: 150, success_rate: 70, crit_rate: 15 },
  extreme: { duration_minutes: 960, energy_cost: 80, min_user_level: 10, xp_reward: 280, coin_reward: 320, success_rate: 50, crit_rate: 20 },
};

export type PetExpedition = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  difficulty: ExpeditionDifficulty;
  duration_minutes: number;
  energy_cost: number;
  min_user_level: number;
  xp_reward: number;
  coin_reward: number;
  item_reward_label: string | null;
  success_rate: number;
  crit_rate: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PetExpeditionWritable = Omit<PetExpedition, "id" | "created_at" | "updated_at">;

export type TodayExpedition = {
  id: string; // user_daily_expeditions id
  expedition_id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  difficulty: ExpeditionDifficulty;
  duration_minutes: number;
  energy_cost: number;
  min_user_level: number;
  xp_reward: number;
  coin_reward: number;
  item_reward_label: string | null;
  success_rate: number;
  crit_rate: number;
  sent_at: string | null;
};

export type ActiveExpedition = {
  run_id: string;
  expedition_id: string;
  slug: string;
  title: string;
  icon: string;
  image_url: string | null;
  difficulty: ExpeditionDifficulty;
  started_at: string;
  ends_at: string;
  duration_minutes: number;
  xp_reward: number;
  coin_reward: number;
  item_reward_label: string | null;
  success_rate: number;
  crit_rate: number;
};

export type ClaimResult = {
  outcome: Exclude<ExpeditionOutcome, "pending">;
  xp: number;
  coins: number;
  item: string | null;
};