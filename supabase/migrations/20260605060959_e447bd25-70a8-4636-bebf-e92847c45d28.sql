CREATE POLICY "authenticated can read profile photos for signing"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'profile-photos');