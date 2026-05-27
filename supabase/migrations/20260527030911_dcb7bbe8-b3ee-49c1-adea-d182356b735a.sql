-- Tighten profile_advanced SELECT to exclude deactivated/anonymized profiles
DROP POLICY IF EXISTS "auth read advanced of approved" ON public.profile_advanced;
CREATE POLICY "auth read advanced of approved"
ON public.profile_advanced
FOR SELECT
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_advanced.user_id
      AND (
        (p.status = 'approved'::profile_status
          AND p.deactivated_at IS NULL
          AND p.deletion_requested_at IS NULL
          AND p.is_anonymized = false)
        OR p.id = auth.uid()
      )
  ))
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Restrict storage SELECT on profile-photos to owner+staff only.
-- Public viewing still works via CDN (public bucket bypasses RLS for direct URL access);
-- this prevents listing files in the bucket through the storage API.
DROP POLICY IF EXISTS "photos auth read by id only" ON storage.objects;
CREATE POLICY "photos owner or staff read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos'::text
  AND name IS NOT NULL
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'apresentador'::app_role)
    OR public.has_role(auth.uid(), 'moderador'::app_role)
  )
);