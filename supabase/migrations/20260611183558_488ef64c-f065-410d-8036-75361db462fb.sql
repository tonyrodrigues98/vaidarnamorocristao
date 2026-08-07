
CREATE POLICY "Imagens de pets são visíveis publicamente"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pets');

CREATE POLICY "Admins enviam imagens de pets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pets'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  );

CREATE POLICY "Admins atualizam imagens de pets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pets'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  );

CREATE POLICY "Admins removem imagens de pets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pets'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  );
