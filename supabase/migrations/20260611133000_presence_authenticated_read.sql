-- Allow any authenticated user to read presence_last_seen so the OnlineDot
-- indicator works across the app. Only the non-sensitive last_seen_at
-- timestamp is exposed; writes remain restricted to the owner.
DROP POLICY IF EXISTS "users read own presence or staff reads all" ON public.presence_last_seen;

CREATE POLICY "authenticated read presence"
  ON public.presence_last_seen FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);
