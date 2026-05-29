DROP POLICY IF EXISTS "support read own" ON storage.objects;

CREATE POLICY "support read own"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin')
    OR public.is_support_staff(auth.uid())
  )
);