-- Drop the old restrictive SELECT policy and replace with a public-to-auth one
DROP POLICY IF EXISTS "own preferences read" ON public.profile_preferences;

CREATE POLICY "auth users read all preferences"
ON public.profile_preferences
FOR SELECT
TO authenticated
USING (true);