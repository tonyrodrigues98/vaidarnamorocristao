
-- Revoke broad execute on security-definer functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.protect_profile_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Tighten storage bucket: only authenticated can list/select via API.
-- Public URLs to specific objects still work because they go through the public CDN path.
DROP POLICY IF EXISTS "photos public read" ON storage.objects;
CREATE POLICY "photos auth read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'profile-photos');
