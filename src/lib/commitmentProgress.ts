import { supabase } from "@/integrations/supabase/client";

export interface CommitmentProgress {
  percentage: number;
  canCommit: boolean;
  requirements: {
    hasMatch: boolean;
    threeConversationDays: boolean;
    twentyMessagesEach: boolean;
  };
}

export async function getCommitmentProgress(matchId: string): Promise<CommitmentProgress> {
  let percentage = 0;
  const requirements = {
    hasMatch: false,
    threeConversationDays: false,
    twentyMessagesEach: false,
  };

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (match) {
    requirements.hasMatch = true;
    percentage += 25;
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("sender_id, created_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (!messages?.length) {
    return { percentage, canCommit: false, requirements };
  }

  const days = new Set(
    messages.map((m: { created_at: string }) => new Date(m.created_at).toDateString()),
  );

  if (days.size >= 3) {
    requirements.threeConversationDays = true;
    percentage += 35;
  }

  const senderCount = messages.reduce<Record<string, number>>((acc, msg: { sender_id: string }) => {
    acc[msg.sender_id] = (acc[msg.sender_id] || 0) + 1;
    return acc;
  }, {});

  const counts = Object.values(senderCount);

  if (counts.length >= 2 && counts.every((value) => value >= 20)) {
    requirements.twentyMessagesEach = true;
    percentage += 40;
  }

  return {
    percentage,
    canCommit:
      requirements.hasMatch &&
      requirements.threeConversationDays &&
      requirements.twentyMessagesEach,
    requirements,
  };
}
