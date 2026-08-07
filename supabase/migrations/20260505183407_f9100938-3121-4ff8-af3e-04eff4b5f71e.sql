
-- Categoria
CREATE TYPE public.prayer_category AS ENUM ('health','family','relationship','financial','spiritual','other');

-- prayer_requests
CREATE TABLE public.prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category public.prayer_category NOT NULL DEFAULT 'other',
  is_anonymous boolean NOT NULL DEFAULT false,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX prayer_requests_created_at_idx ON public.prayer_requests (created_at DESC);
CREATE INDEX prayer_requests_user_id_idx ON public.prayer_requests (user_id);

ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users read prayer requests"
ON public.prayer_requests FOR SELECT TO authenticated
USING (public.has_accepted_current_terms(auth.uid()) OR public.is_staff(auth.uid()));

CREATE POLICY "approved users create prayer requests"
ON public.prayer_requests FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_accepted_current_terms(auth.uid())
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved'::profile_status)
);

CREATE POLICY "owner updates own prayer request"
ON public.prayer_requests FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "owner or staff deletes prayer request"
ON public.prayer_requests FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'moderador')
);

CREATE TRIGGER prayer_requests_set_updated_at
BEFORE UPDATE ON public.prayer_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- prayer_request_prayed
CREATE TABLE public.prayer_request_prayed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, user_id)
);

CREATE INDEX prayer_request_prayed_request_idx ON public.prayer_request_prayed (request_id);

ALTER TABLE public.prayer_request_prayed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read prayer prayed"
ON public.prayer_request_prayed FOR SELECT TO authenticated
USING (true);

CREATE POLICY "user adds own prayer prayed"
ON public.prayer_request_prayed FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_accepted_current_terms(auth.uid())
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved'::profile_status)
);

CREATE POLICY "user removes own prayer prayed"
ON public.prayer_request_prayed FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_request_prayed;
