-- 1) cinema_media_processing_v2: owner/admin read access
GRANT SELECT ON public.cinema_media_processing_v2 TO authenticated;
GRANT ALL ON public.cinema_media_processing_v2 TO service_role;

DROP POLICY IF EXISTS "owner or admin read cinema processing" ON public.cinema_media_processing_v2;
CREATE POLICY "owner or admin read cinema processing"
ON public.cinema_media_processing_v2
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.cinema_media_v2 m
    WHERE m.id = cinema_media_processing_v2.media_id
      AND m.owner_id = auth.uid()
  )
);

-- 2) photo_moderation_settings: explicit admin-only INSERT
DROP POLICY IF EXISTS "admins insert photo settings" ON public.photo_moderation_settings;
CREATE POLICY "admins insert photo settings"
ON public.photo_moderation_settings
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- 3) pre_cadastros: limit PII reads to the creator and super admins
DROP POLICY IF EXISTS "staff select pre_cadastros" ON public.pre_cadastros;
CREATE POLICY "creator or super_admin select pre_cadastros"
ON public.pre_cadastros
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- 4) user_roles: hard-lock privileged columns on staff self-update
CREATE OR REPLACE FUNCTION public.enforce_user_roles_self_update()
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

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.is_support_agent IS DISTINCT FROM OLD.is_support_agent THEN
    RAISE EXCEPTION 'Only badge_color and public_listing can be changed on your own role row';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_user_roles_self_update ON public.user_roles;
CREATE TRIGGER enforce_user_roles_self_update
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_user_roles_self_update();