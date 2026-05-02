
-- Add badge_color and public_listing to user_roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS badge_color text,
  ADD COLUMN IF NOT EXISTS public_listing boolean NOT NULL DEFAULT false;

-- is_staff helper
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::app_role,'super_admin'::app_role,'apresentador'::app_role,'moderador'::app_role)
  );
$$;

-- get_user_primary_role
CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'super_admin'::app_role THEN 1
    WHEN 'admin'::app_role THEN 2
    WHEN 'apresentador'::app_role THEN 3
    WHEN 'moderador'::app_role THEN 4
    WHEN 'user'::app_role THEN 5
  END
  LIMIT 1;
$$;

-- get_admin_ids redefined: returns all staff
CREATE OR REPLACE FUNCTION public.get_admin_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT user_id FROM public.user_roles
  WHERE role IN ('admin'::app_role,'super_admin'::app_role,'apresentador'::app_role,'moderador'::app_role);
$$;

-- get_hidden_staff_ids: staff who are not public_listing
CREATE OR REPLACE FUNCTION public.get_hidden_staff_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT user_id FROM public.user_roles
  WHERE role IN ('admin'::app_role,'super_admin'::app_role,'apresentador'::app_role,'moderador'::app_role)
    AND public_listing = false;
$$;

-- Update interests INSERT policy
DROP POLICY IF EXISTS "send interest" ON public.interests;
CREATE POLICY "send interest" ON public.interests
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved')
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = receiver_id AND status = 'approved')
  AND (NOT public.is_staff(receiver_id) OR public.is_staff(auth.uid()))
);

-- Allow moderators (and admins/super_admin) to delete community messages
DROP POLICY IF EXISTS "delete own global message or admin" ON public.global_messages;
CREATE POLICY "delete own or staff moderator" ON public.global_messages
FOR DELETE TO authenticated
USING (
  auth.uid() = sender_id
  OR public.has_role(auth.uid(),'admin'::app_role)
  OR public.has_role(auth.uid(),'super_admin'::app_role)
  OR public.has_role(auth.uid(),'moderador'::app_role)
);

-- Pre-cadastros
CREATE TABLE IF NOT EXISTS public.pre_cadastros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  full_name text,
  email text,
  phone text,
  age integer,
  height_cm integer,
  sex text,
  marital text,
  city text,
  state text,
  church text,
  years_baptized integer,
  bio text,
  pref_age_min integer,
  pref_age_max integer,
  pref_location_scope text,
  pref_custom_states text[],
  pref_desired_quality text,
  pref_accepts_children boolean,
  pref_looking_for_bio text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pre_cadastros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "creator or super_admin select" ON public.pre_cadastros;
CREATE POLICY "creator or super_admin select" ON public.pre_cadastros
FOR SELECT TO authenticated
USING (auth.uid() = created_by OR public.has_role(auth.uid(),'super_admin'::app_role));

DROP POLICY IF EXISTS "apresentador or super_admin insert" ON public.pre_cadastros;
CREATE POLICY "apresentador or super_admin insert" ON public.pre_cadastros
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND (public.has_role(auth.uid(),'apresentador'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role))
);

DROP POLICY IF EXISTS "creator or super_admin update" ON public.pre_cadastros;
CREATE POLICY "creator or super_admin update" ON public.pre_cadastros
FOR UPDATE TO authenticated
USING (auth.uid() = created_by OR public.has_role(auth.uid(),'super_admin'::app_role))
WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(),'super_admin'::app_role));

DROP POLICY IF EXISTS "creator or super_admin delete" ON public.pre_cadastros;
CREATE POLICY "creator or super_admin delete" ON public.pre_cadastros
FOR DELETE TO authenticated
USING (auth.uid() = created_by OR public.has_role(auth.uid(),'super_admin'::app_role));

DROP TRIGGER IF EXISTS update_pre_cadastros_updated_at ON public.pre_cadastros;
CREATE TRIGGER update_pre_cadastros_updated_at
BEFORE UPDATE ON public.pre_cadastros
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Promote super_admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role FROM auth.users
WHERE email = 'tony.rodrigues7897@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
