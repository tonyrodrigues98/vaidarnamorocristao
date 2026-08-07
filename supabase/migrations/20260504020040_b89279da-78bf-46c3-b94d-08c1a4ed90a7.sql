ALTER TABLE public.daily_posts
  ADD COLUMN IF NOT EXISTS bible_reference text,
  ADD COLUMN IF NOT EXISTS bible_text text;