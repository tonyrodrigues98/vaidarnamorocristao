
-- 1) Fix mutable search_path on v2_purpose_state
CREATE OR REPLACE FUNCTION public.v2_purpose_state(_status text, _end_reason text, _archived_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path = public
AS $function$
  SELECT CASE
    WHEN _archived_at IS NOT NULL THEN 'archived'
    WHEN _status = 'pending' THEN 'requested'
    WHEN _status = 'active' THEN 'active'
    WHEN _end_reason = 'rejected' THEN 'rejected'
    WHEN _end_reason = 'cancelled' THEN 'cancelled'
    ELSE 'ended'
  END;
$function$;

-- 2) Harden profiles UPDATE policy — lock moderation/verification/ban/AI/cosmetic fields for non-admins
DROP POLICY IF EXISTS "update own profile fields" ON public.profiles;

CREATE POLICY "update own profile fields"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  (auth.uid() = id)
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      -- Non-admins: every sensitive field must remain equal to its current stored value.
      status IS NOT DISTINCT FROM (SELECT p.status FROM public.profiles p WHERE p.id = profiles.id)
      AND rejection_reason IS NOT DISTINCT FROM (SELECT p.rejection_reason FROM public.profiles p WHERE p.id = profiles.id)
      AND verified IS NOT DISTINCT FROM (SELECT p.verified FROM public.profiles p WHERE p.id = profiles.id)
      AND verified_at IS NOT DISTINCT FROM (SELECT p.verified_at FROM public.profiles p WHERE p.id = profiles.id)
      AND verified_by IS NOT DISTINCT FROM (SELECT p.verified_by FROM public.profiles p WHERE p.id = profiles.id)
      AND banned_at IS NOT DISTINCT FROM (SELECT p.banned_at FROM public.profiles p WHERE p.id = profiles.id)
      AND banned_reason IS NOT DISTINCT FROM (SELECT p.banned_reason FROM public.profiles p WHERE p.id = profiles.id)
      AND banned_by IS NOT DISTINCT FROM (SELECT p.banned_by FROM public.profiles p WHERE p.id = profiles.id)
      AND contributor_highlight IS NOT DISTINCT FROM (SELECT p.contributor_highlight FROM public.profiles p WHERE p.id = profiles.id)
      AND avatar_ai_verified IS NOT DISTINCT FROM (SELECT p.avatar_ai_verified FROM public.profiles p WHERE p.id = profiles.id)
      AND avatar_ai_confidence IS NOT DISTINCT FROM (SELECT p.avatar_ai_confidence FROM public.profiles p WHERE p.id = profiles.id)
      AND avatar_ai_checked_at IS NOT DISTINCT FROM (SELECT p.avatar_ai_checked_at FROM public.profiles p WHERE p.id = profiles.id)
      AND is_anonymized IS NOT DISTINCT FROM (SELECT p.is_anonymized FROM public.profiles p WHERE p.id = profiles.id)
      AND deletion_scheduled_for IS NOT DISTINCT FROM (SELECT p.deletion_scheduled_for FROM public.profiles p WHERE p.id = profiles.id)
    )
  )
);
