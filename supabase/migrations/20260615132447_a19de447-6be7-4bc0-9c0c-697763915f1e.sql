
-- 1) Bible quiz: remove broad authenticated SELECT; rely on SECURITY DEFINER RPC
DROP POLICY IF EXISTS "bqq_read_auth" ON public.bible_quiz_questions;

CREATE POLICY "bqq_staff_read"
ON public.bible_quiz_questions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- 2) Storage: replace broad profile-photos SELECT policy with one scoped to
-- owner / staff / approved-active profiles. Path layout is `{user_id}/...`.
DROP POLICY IF EXISTS "authenticated can read profile photos for signing" ON storage.objects;
DROP POLICY IF EXISTS "photos owner or staff read" ON storage.objects;

CREATE POLICY "profile-photos scoped read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND name IS NOT NULL
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'apresentador'::app_role)
    OR public.has_role(auth.uid(), 'moderador'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.status = 'approved'::profile_status
        AND p.deactivated_at IS NULL
        AND p.deletion_requested_at IS NULL
        AND p.is_anonymized = false
    )
  )
);

-- 3) Set fixed search_path on remaining functions flagged by the linter
ALTER FUNCTION public.xp_for_level(integer) SET search_path = public;
ALTER FUNCTION public.level_from_xp(integer) SET search_path = public;
ALTER FUNCTION public.pet_effect_condition_passes(text, text, integer, jsonb) SET search_path = public;
ALTER FUNCTION public.set_updated_at_now() SET search_path = public;
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;
