-- Defensive explicit deny SELECT policy on push_queue.
-- RLS is enabled and no SELECT policy exists today, so PostgREST already
-- returns nothing for authenticated/anon users. This explicit policy
-- guarantees that any future permissive policy added by mistake cannot
-- silently expose queue rows. service_role bypasses RLS and continues
-- to read/write as before.
DROP POLICY IF EXISTS "push_queue deny select" ON public.push_queue;
CREATE POLICY "push_queue deny select"
  ON public.push_queue
  FOR SELECT
  TO authenticated, anon
  USING (false);