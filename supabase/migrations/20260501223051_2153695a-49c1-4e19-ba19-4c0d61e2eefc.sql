
-- Global community chat
CREATE TABLE public.global_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approved users send global messages"
ON public.global_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved')
);

CREATE POLICY "auth users read global messages"
ON public.global_messages FOR SELECT TO authenticated
USING (true);

CREATE POLICY "delete own global message or admin"
ON public.global_messages FOR DELETE TO authenticated
USING (auth.uid() = sender_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_global_messages_created_at ON public.global_messages (created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.global_messages;
ALTER TABLE public.global_messages REPLICA IDENTITY FULL;

-- Daily posts / news
CREATE TABLE public.daily_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users read published daily posts"
ON public.daily_posts FOR SELECT TO authenticated
USING (published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins insert daily posts"
ON public.daily_posts FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = author_id);

CREATE POLICY "admins update daily posts"
ON public.daily_posts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete daily posts"
ON public.daily_posts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_daily_posts_updated_at
BEFORE UPDATE ON public.daily_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_daily_posts_published_at ON public.daily_posts (published_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_posts;
