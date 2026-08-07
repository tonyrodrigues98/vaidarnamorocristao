REVOKE EXECUTE ON FUNCTION public.get_grab_state() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.perform_grab(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.perform_grab_multi(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rotate_grab_featured_pool() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_grab_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.perform_grab(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.perform_grab_multi(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_grab_featured_pool() TO service_role;