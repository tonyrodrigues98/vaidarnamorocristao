-- 1. Update pre_cadastros: new fields
ALTER TABLE public.pre_cadastros
  ADD COLUMN IF NOT EXISTS pref_distance_ok boolean,
  ADD COLUMN IF NOT EXISTS has_children boolean,
  ADD COLUMN IF NOT EXISTS children_count integer,
  ADD COLUMN IF NOT EXISTS accepts_partner_with_children boolean;

-- 2. Restricted words table
CREATE TABLE IF NOT EXISTS public.restricted_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL UNIQUE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.restricted_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users read restricted words"
  ON public.restricted_words FOR SELECT TO authenticated USING (true);

CREATE POLICY "super_admin insert restricted words"
  ON public.restricted_words FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "super_admin update restricted words"
  ON public.restricted_words FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "super_admin delete restricted words"
  ON public.restricted_words FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 3. Cron extensions + nightly cleanup at midnight São Paulo (UTC-3 = 03:00 UTC)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$ BEGIN
  PERFORM cron.unschedule('purge-global-messages-midnight-sp');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'purge-global-messages-midnight-sp',
  '0 3 * * *',
  $$ DELETE FROM public.global_messages; $$
);