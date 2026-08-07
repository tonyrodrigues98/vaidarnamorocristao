ALTER TABLE public.daily_posts REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_posts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;