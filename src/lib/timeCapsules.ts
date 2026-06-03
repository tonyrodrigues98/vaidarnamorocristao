import { supabase } from "@/integrations/supabase/client";

export async function createTimeCapsule(
  matchId: string,
  message: string,
  unlockAt: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("couple_time_capsules")
    .insert({
      match_id: matchId,
      author_id: user.id,
      message,
      unlock_at: unlockAt,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function listTimeCapsules(
  matchId: string
) {
  const { data, error } = await supabase
    .from("couple_time_capsules")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data ?? [];
}

export async function openTimeCapsule(
  capsuleId: string
) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("couple_time_capsules")
    .update({
      opened_at: now,
    })
    .eq("id", capsuleId)
    .select()
    .single();

  if (error) throw error;

  return data;
}
