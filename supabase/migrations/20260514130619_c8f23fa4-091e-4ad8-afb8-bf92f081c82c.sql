
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_ai_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_ai_confidence numeric,
  ADD COLUMN IF NOT EXISTS avatar_ai_checked_at timestamptz;

ALTER TABLE public.profile_photos
  ADD COLUMN IF NOT EXISTS ai_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_confidence numeric,
  ADD COLUMN IF NOT EXISTS ai_checked_at timestamptz;

DO $$ BEGIN
  CREATE TYPE public.photo_moderation_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.photo_moderation_scope AS ENUM ('avatar','extra');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.photo_moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  photo_url text NOT NULL,
  scope public.photo_moderation_scope NOT NULL,
  photo_id uuid,
  ai_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.photo_moderation_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pmq_status ON public.photo_moderation_queue(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pmq_user ON public.photo_moderation_queue(user_id);

ALTER TABLE public.photo_moderation_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner reads own queue" ON public.photo_moderation_queue;
CREATE POLICY "owner reads own queue" ON public.photo_moderation_queue
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()
         OR public.has_role(auth.uid(), 'admin'::app_role)
         OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "owner inserts own queue" ON public.photo_moderation_queue;
CREATE POLICY "owner inserts own queue" ON public.photo_moderation_queue
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admins update queue" ON public.photo_moderation_queue;
CREATE POLICY "admins update queue" ON public.photo_moderation_queue
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)
         OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role)
              OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "admins delete queue" ON public.photo_moderation_queue;
CREATE POLICY "admins delete queue" ON public.photo_moderation_queue
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)
         OR public.has_role(auth.uid(), 'super_admin'::app_role));
