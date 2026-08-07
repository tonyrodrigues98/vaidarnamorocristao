ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_views;
ALTER TABLE public.profile_views REPLICA IDENTITY FULL;