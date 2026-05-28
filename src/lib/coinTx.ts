import { supabase } from "@/integrations/supabase/client";

export type CoinTxDirection = "in" | "out";

export type CoinTx = {
  id: string;
  user_id: string;
  kind: string;
  direction: CoinTxDirection;
  amount: number;
  balance_after: number;
  title: string;
  subtitle: string | null;
  ref_id: string | null;
  icon_url: string | null;
  created_at: string;
};

export async function fetchMyCoinTransactions(limit = 100): Promise<CoinTx[]> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from("coin_transactions" as never)
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as CoinTx[];
}