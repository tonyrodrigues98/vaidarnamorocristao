-- Allow authenticated users to read role rows of staff so badges display with the correct color across the app.
CREATE POLICY "auth users read staff roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  role IN ('super_admin'::app_role, 'admin'::app_role, 'apresentador'::app_role, 'moderador'::app_role)
);