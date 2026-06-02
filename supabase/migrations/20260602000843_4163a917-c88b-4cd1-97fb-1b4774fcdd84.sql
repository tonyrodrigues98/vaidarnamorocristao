-- Harden user_roles self-update: prevent privilege escalation via role/is_support_agent changes
CREATE OR REPLACE FUNCTION public.prevent_role_self_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If the change is being made by the row owner and they are not an admin,
  -- lock sensitive columns so staff cannot escalate their own privileges.
  IF auth.uid() = OLD.user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.role := OLD.role;
    NEW.user_id := OLD.user_id;
    NEW.is_support_agent := OLD.is_support_agent;
  END IF;
  RETURN NEW;
END;
$function$;

-- Tighten the RLS policy as defense-in-depth: only allow self-update when the
-- role value being written matches the role already stored for this user.
DROP POLICY IF EXISTS "staff update own role meta only" ON public.user_roles;

CREATE POLICY "staff update own role meta only"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'apresentador'::app_role, 'moderador'::app_role])
)
WITH CHECK (
  auth.uid() = user_id
  AND role = (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.id = user_roles.id)
);