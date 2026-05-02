-- Switch default to true so staff appear in pretendentes by default
ALTER TABLE public.user_roles ALTER COLUMN public_listing SET DEFAULT true;

-- Turn on for all existing staff roles (they can still toggle off in profile)
UPDATE public.user_roles
SET public_listing = true
WHERE role IN ('super_admin'::app_role, 'admin'::app_role, 'apresentador'::app_role, 'moderador'::app_role);