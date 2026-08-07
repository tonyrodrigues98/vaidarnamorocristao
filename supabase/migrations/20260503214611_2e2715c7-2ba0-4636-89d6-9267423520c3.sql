CREATE TABLE IF NOT EXISTS public.terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, version)
);

ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own terms acceptances"
  ON public.terms_acceptances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own terms acceptances"
  ON public.terms_acceptances FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_terms_acc_user ON public.terms_acceptances(user_id, accepted_at DESC);