import { supabase } from "@/integrations/supabase/client";

export async function recomputeMyBadges(userId: string | null | undefined) {
  if (!userId) return;
  try {
    await supabase.rpc("recompute_user_badges", { _user_id: userId });
  } catch {
    // silent — cron will catch up
  }
}
