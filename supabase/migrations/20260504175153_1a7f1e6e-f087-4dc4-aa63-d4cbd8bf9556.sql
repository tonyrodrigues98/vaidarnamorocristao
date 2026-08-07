DROP POLICY IF EXISTS "user updates own pending verification" ON public.verification_requests;

CREATE POLICY "user updates own pending verification"
ON public.verification_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status = ANY (ARRAY['pending'::verification_status, 'more_info'::verification_status])
)
WITH CHECK (
  auth.uid() = user_id
  AND status = ANY (ARRAY['pending'::verification_status, 'more_info'::verification_status])
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
);

CREATE OR REPLACE FUNCTION public.protect_verification_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Permission denied: cannot modify admin-only fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS verification_protect_admin_fields ON public.verification_requests;
CREATE TRIGGER verification_protect_admin_fields
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.protect_verification_admin_fields();