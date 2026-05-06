
-- ============================================================
-- 1) Realtime: scope messages SELECT to match participants
-- ============================================================
DROP POLICY IF EXISTS "authenticated can subscribe" ON realtime.messages;

-- Replace the public 'see match messages' to also restrict realtime CDC
-- (Realtime uses the same SELECT policies on the source table for RLS-checked
--  postgres_changes when private channels are used. To be safe, also tighten
--  the table's SELECT policy to ensure no overly-broad rule exists.)
-- The existing 'see match messages' policy is already participant-scoped,
-- so removing the unrestricted realtime.messages policy is sufficient.

-- ============================================================
-- 2) profile_preferences: restrict SELECT to owner + staff
-- ============================================================
DROP POLICY IF EXISTS "auth users read all preferences" ON public.profile_preferences;

CREATE POLICY "own preferences select"
ON public.profile_preferences FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_staff(auth.uid())
);

-- ============================================================
-- 3) Remove sensitive tables from realtime publication to prevent
--    unscoped channel broadcast leakage
-- ============================================================
ALTER PUBLICATION supabase_realtime DROP TABLE public.prayer_request_reports;
ALTER PUBLICATION supabase_realtime DROP TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime DROP TABLE public.support_tickets;

-- ============================================================
-- 4) Lock down SECURITY DEFINER functions: revoke EXECUTE from anon
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.award_contributor_badge(uuid, numeric, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_remove_badge(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recompute_all_badges() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recompute_user_badges(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.count_advanced_sections(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_active_streak(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_missions() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_article_views(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_my_activity() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_support_staff(uuid) FROM anon, PUBLIC;

-- Trigger / internal functions: revoke from PUBLIC and anon (only triggers should call them)
REVOKE EXECUTE ON FUNCTION public.protect_verification_admin_fields() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_global_message_pin() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_devotional_comment_pin() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_verification_request_fields() FROM anon, PUBLIC;
