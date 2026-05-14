
-- 1. Photo moderation settings (singleton row)
CREATE TABLE IF NOT EXISTS public.photo_moderation_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  extra_reject_threshold NUMERIC NOT NULL DEFAULT 0.6 CHECK (extra_reject_threshold BETWEEN 0 AND 1),
  extra_review_threshold NUMERIC NOT NULL DEFAULT 0.4 CHECK (extra_review_threshold BETWEEN 0 AND 1),
  main_approve_threshold NUMERIC NOT NULL DEFAULT 0.7 CHECK (main_approve_threshold BETWEEN 0 AND 1),
  main_review_threshold NUMERIC NOT NULL DEFAULT 0.5 CHECK (main_review_threshold BETWEEN 0 AND 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT singleton_row CHECK (id = true)
);

INSERT INTO public.photo_moderation_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

ALTER TABLE public.photo_moderation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read photo settings"
  ON public.photo_moderation_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "admins update photo settings"
  ON public.photo_moderation_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- 2. Photo moderation audit log (every AI verification recorded)
CREATE TABLE IF NOT EXISTS public.photo_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scope public.photo_moderation_scope NOT NULL,
  photo_url TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('approved','needs_review','rejected','soft_fail')),
  confidence NUMERIC,
  ai_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_photo_mod_log_user ON public.photo_moderation_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photo_mod_log_decision ON public.photo_moderation_log (decision, created_at DESC);

ALTER TABLE public.photo_moderation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner inserts own log"
  ON public.photo_moderation_log FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "owner reads own log"
  ON public.photo_moderation_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "admins delete log"
  ON public.photo_moderation_log FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
