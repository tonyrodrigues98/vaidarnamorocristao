-- Helper: list of admin user IDs (security definer, bypasses user_roles RLS)
CREATE OR REPLACE FUNCTION public.get_admin_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.user_roles WHERE role = 'admin';
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_ids() TO authenticated, anon;

-- Prevent common users from sending interest to an admin.
-- Admins themselves can still send interest to anyone.
DROP POLICY IF EXISTS "send interest" ON public.interests;

CREATE POLICY "send interest" ON public.interests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.status = 'approved'::profile_status
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = interests.receiver_id AND profiles.status = 'approved'::profile_status
  )
  AND (
    -- Receiver is not an admin, OR sender is themselves an admin
    NOT public.has_role(interests.receiver_id, 'admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);