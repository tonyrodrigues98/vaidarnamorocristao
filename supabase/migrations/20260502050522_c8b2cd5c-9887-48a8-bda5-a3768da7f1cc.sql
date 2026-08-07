CREATE OR REPLACE FUNCTION public.set_default_public_listing()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.public_listing IS NULL OR NEW.public_listing = true THEN
    IF NEW.role IN ('super_admin'::app_role, 'admin'::app_role) THEN
      NEW.public_listing := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_roles_default_public_listing ON public.user_roles;
CREATE TRIGGER trg_user_roles_default_public_listing
BEFORE INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.set_default_public_listing();