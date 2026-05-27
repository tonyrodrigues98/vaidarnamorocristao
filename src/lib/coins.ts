import { supabase } from "@/integrations/supabase/client";

export type CoinsStatus = {
  balance: number;
  last_claim_date: string | null;
  can_claim_today: boolean;
};

export async function getMyCoins(): Promise<CoinsStatus> {
  const { data, error } = await supabase.rpc("get_my_coins");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    balance: row?.balance ?? 0,
    last_claim_date: (row?.last_claim_date as string | null) ?? null,
    can_claim_today: !!row?.can_claim_today,
  };
}

export async function claimDailyCoins(): Promise<{ balance: number; awarded: number }> {
  const { data, error } = await supabase.rpc("claim_daily_coins");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { balance: row?.balance ?? 0, awarded: row?.awarded ?? 0 };
}

export async function spendCoin(amount = 1): Promise<number> {
  const { data, error } = await supabase.rpc("spend_coin", { _amount: amount });
  if (error) throw error;
  return Number(data ?? 0);
}

export const COIN_MAX = 500;
export const COIN_DAILY = 10;
export const COIN_STICKER_COST = 1;

export function timeUntilMidnight(): string {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const diff = next.getTime() - now.getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}