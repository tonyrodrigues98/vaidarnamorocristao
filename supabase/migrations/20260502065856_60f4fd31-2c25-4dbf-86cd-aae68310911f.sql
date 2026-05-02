-- Allow staff users to update their OWN role row (specifically badge_color and public_listing)
-- Without this, moderador/apresentador can't toggle their own visibility because the
-- existing "admins manage roles" policy requires admin role.

CREATE POLICY "staff update own role row"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND role IN ('super_admin'::app_role, 'admin'::app_role, 'apresentador'::app_role, 'moderador'::app_role)
)
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('super_admin'::app_role, 'admin'::app_role, 'apresentador'::app_role, 'moderador'::app_role)
);