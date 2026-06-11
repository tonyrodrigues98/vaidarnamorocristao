
-- Allow all authenticated users to view presence (needed for OnlineDot indicator)
DROP POLICY IF EXISTS "users read own presence or staff reads all" ON public.presence_last_seen;
CREATE POLICY "authenticated read presence"
  ON public.presence_last_seen
  FOR SELECT
  TO authenticated
  USING (true);

-- Restrict public equipped-pets read to authenticated users only
DROP POLICY IF EXISTS "Pets equipados são públicos" ON public.user_pets;
CREATE POLICY "Pets equipados visíveis a autenticados"
  ON public.user_pets
  FOR SELECT
  TO authenticated
  USING (is_equipped = true);
