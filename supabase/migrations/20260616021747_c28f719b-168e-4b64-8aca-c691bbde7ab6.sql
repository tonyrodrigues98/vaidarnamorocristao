REVOKE EXECUTE ON FUNCTION public.roll_daily_expeditions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_today_expeditions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_active_expedition(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.start_expedition(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_expedition(uuid) FROM PUBLIC;
