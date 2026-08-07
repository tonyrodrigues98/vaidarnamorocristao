REVOKE EXECUTE ON FUNCTION public.get_admin_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_ids() TO authenticated;