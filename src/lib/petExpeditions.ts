import { supabase } from "@/integrations/supabase/client";
import type {
  ActiveExpedition,
  ClaimResult,
  PetExpedition,
  PetExpeditionWritable,
  TodayExpedition,
} from "@/types/petExpedition";

/* ------------------------------ Player API ------------------------------ */

export async function rollAndGetTodayExpeditions(): Promise<TodayExpedition[]> {
  try {
    await supabase.rpc("roll_daily_expeditions" as never);
  } catch {
    // idempotente — falha silenciosa
  }
  const { data, error } = await supabase.rpc("get_today_expeditions" as never);
  if (error) return [];
  return (data ?? []) as unknown as TodayExpedition[];
}

export async function getActiveExpedition(userPetId: string): Promise<ActiveExpedition | null> {
  const { data, error } = await supabase.rpc("get_active_expedition" as never, {
    _user_pet_id: userPetId,
  } as never);
  if (error) return null;
  const rows = (data ?? []) as unknown as ActiveExpedition[];
  return rows[0] ?? null;
}

export async function startExpedition(expeditionId: string, userPetId: string): Promise<string> {
  const { data, error } = await supabase.rpc("start_expedition" as never, {
    _expedition_id: expeditionId,
    _user_pet_id: userPetId,
  } as never);
  if (error) throw new Error(translateError(error.message));
  return data as unknown as string;
}

export async function claimExpedition(runId: string): Promise<ClaimResult> {
  const { data, error } = await supabase.rpc("claim_expedition" as never, {
    _run_id: runId,
  } as never);
  if (error) throw new Error(translateError(error.message));
  return data as unknown as ClaimResult;
}

function translateError(msg: string): string {
  if (msg.includes("not_enough_energy")) return "Energia insuficiente para esta expedição.";
  if (msg.includes("user_level_too_low")) return "Seu nível ainda é baixo para esta expedição.";
  if (msg.includes("already_on_expedition")) return "Seu pet já está em uma expedição.";
  if (msg.includes("already_sent_today")) return "Esta expedição já foi enviada hoje.";
  if (msg.includes("not_in_today_pool")) return "Esta expedição não está disponível hoje.";
  if (msg.includes("expedition_unavailable")) return "Expedição indisponível.";
  if (msg.includes("not_ready")) return "A expedição ainda não terminou.";
  if (msg.includes("already_claimed")) return "Recompensa já coletada.";
  if (msg.includes("pet_not_found")) return "Pet não encontrado.";
  return msg;
}

/* ------------------------------- Admin API ------------------------------- */

export async function listExpeditionsAdmin(): Promise<PetExpedition[]> {
  const { data, error } = await supabase
    .from("pet_expeditions" as never)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as PetExpedition[];
}

export async function createExpedition(payload: PetExpeditionWritable): Promise<PetExpedition> {
  const { data, error } = await supabase
    .from("pet_expeditions" as never)
    .insert(payload as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as PetExpedition;
}

export async function updateExpedition(
  id: string,
  payload: Partial<PetExpeditionWritable>,
): Promise<PetExpedition> {
  const { data, error } = await supabase
    .from("pet_expeditions" as never)
    .update(payload as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as PetExpedition;
}

export async function deleteExpedition(id: string): Promise<void> {
  const { error } = await supabase.from("pet_expeditions" as never).delete().eq("id", id);
  if (error) throw error;
}