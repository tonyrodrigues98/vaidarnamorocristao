import { supabase } from "@/integrations/supabase/client";

/** Boost noturno: 2x XP entre 23h e 03h (horário de São Paulo). */
export function isNightBoostActive(now: Date = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .find((p) => p.type === "hour")?.value ?? "0",
  );
  return hour >= 23 || hour < 3;
}

/** Minutos até começar/terminar a janela noturna (para countdown). */
export function nightBoostCountdownMs(now: Date = new Date()): {
  active: boolean;
  msUntilChange: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const s = Number(parts.find((p) => p.type === "second")?.value ?? "0");
  const minsNow = h * 60 + m;
  const active = h >= 23 || h < 3;
  // Próxima troca: 23:00 (ativa) ou 03:00 (desativa).
  let target: number;
  if (active) {
    target = h >= 23 ? 27 * 60 : 3 * 60; // próxima 03:00
  } else {
    target = 23 * 60;
  }
  const minsLeft = target - minsNow;
  const secsLeft = minsLeft * 60 - s;
  return { active, msUntilChange: Math.max(0, secsLeft * 1000) };
}

export type StarterBundleState =
  | { claimed: false }
  | { claimed: true; claimed_at: string; coins_granted: number; xp_granted: number };

export async function getStarterBundle(): Promise<StarterBundleState> {
  const { data, error } = await supabase.rpc("get_my_starter_bundle" as never);
  if (error) throw error;
  return data as StarterBundleState;
}

export type ClaimStarterResult =
  | { ok: false; reason: string }
  | {
      ok: true;
      coins_granted: number;
      xp_granted: number;
      new_balance: number;
    };

export async function claimStarterBundle(): Promise<ClaimStarterResult> {
  const { data, error } = await supabase.rpc("claim_starter_bundle" as never);
  if (error) throw error;
  return data as ClaimStarterResult;
}

export type PrestigeState = {
  level: number;
  total_rebirths: number;
  last_prestige_at: string | null;
  current_xp_level: number;
  current_xp_total: number;
  can_rebirth: boolean;
  xp_bonus_pct: number;
};

export async function getPrestige(): Promise<PrestigeState> {
  const { data, error } = await supabase.rpc("get_my_prestige" as never);
  if (error) throw error;
  return data as PrestigeState;
}

export type RebirthResult =
  | { ok: false; reason: string; required_level?: number }
  | {
      ok: true;
      new_prestige_level: number;
      xp_bonus_pct: number;
      medal: MedalKind | null;
    };

export async function prestigeRebirth(): Promise<RebirthResult> {
  const { data, error } = await supabase.rpc("prestige_rebirth" as never);
  if (error) throw error;
  return data as RebirthResult;
}

export type MedalKind = "bronze" | "silver" | "gold" | "diamond";

/** Marcos de prestígio que desbloqueiam medalhas. */
export const PRESTIGE_MEDALS: ReadonlyArray<{
  level: number;
  medal: MedalKind;
  label: string;
}> = [
  { level: 1, medal: "bronze", label: "Bronze" },
  { level: 3, medal: "silver", label: "Prata" },
  { level: 5, medal: "gold", label: "Ouro" },
  { level: 10, medal: "diamond", label: "Diamante" },
];

/** Próxima medalha a conquistar com base no nível de prestígio atual. */
export function nextMedal(currentLevel: number): {
  next: { level: number; medal: MedalKind; label: string } | null;
  current: { level: number; medal: MedalKind; label: string } | null;
  progress: number; // 0..1 até a próxima medalha
} {
  const past = PRESTIGE_MEDALS.filter((m) => currentLevel >= m.level);
  const current = past.length ? past[past.length - 1] : null;
  const next = PRESTIGE_MEDALS.find((m) => m.level > currentLevel) ?? null;
  if (!next) return { next: null, current, progress: 1 };
  const start = current?.level ?? 0;
  const span = next.level - start;
  const done = currentLevel - start;
  return {
    next,
    current,
    progress: span > 0 ? Math.max(0, Math.min(1, done / span)) : 0,
  };
}

export type RebirthHistoryRow = {
  id: string;
  prestige_level: number;
  xp_at_rebirth: number;
  medal: MedalKind | null;
  created_at: string;
};

export async function getRebirthHistory(): Promise<RebirthHistoryRow[]> {
  const { data, error } = await supabase.rpc("get_my_rebirth_history" as never);
  if (error) throw error;
  return (data ?? []) as RebirthHistoryRow[];
}