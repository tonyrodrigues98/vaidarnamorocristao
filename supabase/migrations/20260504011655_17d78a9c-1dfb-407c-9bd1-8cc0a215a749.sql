
-- Lock pinned_at on global_messages for non-admins
CREATE OR REPLACE FUNCTION public.protect_global_message_pin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pinned_at IS DISTINCT FROM OLD.pinned_at THEN
    IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
      NEW.pinned_at := OLD.pinned_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_global_message_pin ON public.global_messages;
CREATE TRIGGER trg_protect_global_message_pin
BEFORE UPDATE ON public.global_messages
FOR EACH ROW EXECUTE FUNCTION public.protect_global_message_pin();

-- Lock status/reviewed_by/reviewed_at/admin_notes on verification_requests for non-admins
CREATE OR REPLACE FUNCTION public.protect_verification_request_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    NEW.status := OLD.status;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.admin_notes := OLD.admin_notes;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_verification_request_fields ON public.verification_requests;
CREATE TRIGGER trg_protect_verification_request_fields
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.protect_verification_request_fields();
