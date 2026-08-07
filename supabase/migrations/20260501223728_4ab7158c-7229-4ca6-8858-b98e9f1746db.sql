
CREATE TYPE public.daily_post_kind AS ENUM ('news', 'devotional');

ALTER TABLE public.daily_posts
  ADD COLUMN kind public.daily_post_kind NOT NULL DEFAULT 'news';

CREATE INDEX idx_daily_posts_kind ON public.daily_posts (kind, published_at DESC);
