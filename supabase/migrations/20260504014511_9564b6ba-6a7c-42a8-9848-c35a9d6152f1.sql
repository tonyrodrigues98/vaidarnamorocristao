ALTER TABLE public.devotional_comments REPLICA IDENTITY FULL;
ALTER TABLE public.devotional_comment_likes REPLICA IDENTITY FULL;
ALTER TABLE public.devotional_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.devotional_prayed REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.devotional_comments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.devotional_comment_likes; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.devotional_reactions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.devotional_prayed; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;