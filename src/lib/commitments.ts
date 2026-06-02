createCommitmentRequest();
acceptCommitment();
rejectCommitment();
getCommitment();
import { supabase } from "@/lib/supabase";

export type CommitmentStatus = "pending" | "active" | "ended";

export interface RelationshipCommitment {
  id: string;
  match_id: string;

  user_a: string;
  user_b: string;

  requested_by: string;

  status: CommitmentStatus;

  requested_at: string;
  accepted_at: string | null;

  created_at: string;
}

export async function getCommitmentByMatch(matchId: string) {
  const { data, error } = await supabase
    .from("relationship_commitments")
    .select("*")
    .eq("match_id", matchId)
    .neq("status", "ended")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as RelationshipCommitment | null;
}

export async function createCommitmentRequest(matchId: string, userA: string, userB: string, requestedBy: string) {
  const existing = await getCommitmentByMatch(matchId);

  if (existing) {
    throw new Error("Já existe um compromisso ativo para este match.");
  }

  const { data, error } = await supabase
    .from("relationship_commitments")
    .insert({
      match_id: matchId,
      user_a: userA,
      user_b: userB,
      requested_by: requestedBy,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function acceptCommitment(commitmentId: string) {
  const { data, error } = await supabase
    .from("relationship_commitments")
    .update({
      status: "active",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", commitmentId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function rejectCommitment(commitmentId: string) {
  const { error } = await supabase.from("relationship_commitments").delete().eq("id", commitmentId);

  if (error) {
    throw error;
  }
}

export async function endCommitment(commitmentId: string) {
  const { data, error } = await supabase
    .from("relationship_commitments")
    .update({
      status: "ended",
    })
    .eq("id", commitmentId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
