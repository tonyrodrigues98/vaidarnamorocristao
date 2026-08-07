-- Add optional photo column
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS photo_url text;

-- Replace SELECT policy: creator, super_admin OR any apresentador can read
DROP POLICY IF EXISTS "creator or super_admin select" ON public.pre_cadastros;
CREATE POLICY "staff select pre_cadastros"
  ON public.pre_cadastros FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'apresentador'::app_role)
  );

-- Storage policies for pre-cadastros photos in profile-photos bucket (public read already enabled)
CREATE POLICY "staff upload pre-cadastros photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = 'pre-cadastros'
    AND (
      public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'apresentador'::app_role)
    )
  );

CREATE POLICY "staff update pre-cadastros photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = 'pre-cadastros'
    AND (
      public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'apresentador'::app_role)
    )
  );

CREATE POLICY "staff delete pre-cadastros photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = 'pre-cadastros'
    AND (
      public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'apresentador'::app_role)
    )
  );