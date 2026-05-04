import { supabase } from "@/integrations/supabase/client";
import { invalidateUserBadges } from "@/components/UserBadges";

export async function recomputeMyBadges(userId: string | null | undefined) {
  if (!userId) return;
  try {
    await supabase.rpc("recompute_user_badges", { _user_id: userId });
    invalidateUserBadges(userId);
  } catch {
    // silent — cron will catch up
  }
}