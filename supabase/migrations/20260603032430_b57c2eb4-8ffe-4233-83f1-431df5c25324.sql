
-- 1) Enable RLS + policies on relationship_commitments
ALTER TABLE public.relationship_commitments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participants select commitments" ON public.relationship_commitments;
CREATE POLICY "participants select commitments"
ON public.relationship_commitments FOR SELECT
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "participants insert commitments" ON public.relationship_commitments;
CREATE POLICY "participants insert commitments"
ON public.relationship_commitments FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = requested_by
  AND (auth.uid() = user_a OR auth.uid() = user_b)
);

DROP POLICY IF EXISTS "participants update commitments" ON public.relationship_commitments;
CREATE POLICY "participants update commitments"
ON public.relationship_commitments FOR UPDATE
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b)
WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "participants delete commitments" ON public.relationship_commitments;
CREATE POLICY "participants delete commitments"
ON public.relationship_commitments FOR DELETE
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relationship_commitments TO authenticated;
GRANT ALL ON public.relationship_commitments TO service_role;

-- 2) Remove broad storage read for profile-photos bucket
DROP POLICY IF EXISTS "authenticated read profile photos" ON storage.objects;

-- 3) Tighten can_access_support_ticket: assigned_to only counts for staff
CREATE OR REPLACE FUNCTION public.can_access_support_ticket(_ticket_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = _ticket_id
      AND (
        t.user_id = auth.uid()
        OR (t.assigned_to = auth.uid() AND public.is_support_staff(auth.uid()))
        OR public.has_role(auth.uid(), 'admin'::app_role)
      )
  );
$function$;

-- 4) Prevent admins from creating/modifying super_admin roles
DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;

CREATE POLICY "admins manage non-super roles"
ON public.user_roles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND (role <> 'super_admin'::app_role OR public.has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND (role <> 'super_admin'::app_role OR public.has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "super admins manage all roles"
ON public.user_roles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));
