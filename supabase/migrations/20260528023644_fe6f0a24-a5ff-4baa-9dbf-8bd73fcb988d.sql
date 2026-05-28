-- Make profile-photos bucket private and allow signed URL reads by authenticated users
UPDATE storage.buckets SET public = false WHERE id = 'profile-photos';

DROP POLICY IF EXISTS "authenticated read profile-photos" ON storage.objects;
CREATE POLICY "authenticated read profile-photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'profile-photos');