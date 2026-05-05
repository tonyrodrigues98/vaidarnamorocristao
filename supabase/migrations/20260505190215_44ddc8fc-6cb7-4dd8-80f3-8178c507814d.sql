-- 1. Moderation status enum
DO $$ BEGIN
  CREATE TYPE public.prayer_moderation_status AS ENUM ('visible', 'hidden', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Add moderation_status to prayer_requests
ALTER TABLE public.prayer_requests
  ADD COLUMN IF NOT EXISTS moderation_status public.prayer_moderation_status NOT NULL DEFAULT 'visible';

-- 3. Reports table
CREATE TABLE IF NOT EXISTS public.prayer_request_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prayer_request_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approved users create prayer reports" ON public.prayer_request_reports;
CREATE POLICY "approved users create prayer reports"
ON public.prayer_request_reports FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = reporter_id
  AND public.has_accepted_current_terms(auth.uid())
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved')
);

DROP POLICY IF EXISTS "see own or staff prayer reports" ON public.prayer_request_reports;
CREATE POLICY "see own or staff prayer reports"
ON public.prayer_request_reports FOR SELECT TO authenticated
USING (
  auth.uid() = reporter_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'moderador'::app_role)
);

DROP POLICY IF EXISTS "staff manage prayer reports" ON public.prayer_request_reports;
CREATE POLICY "staff manage prayer reports"
ON public.prayer_request_reports FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'moderador'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'moderador'::app_role)
);

DROP POLICY IF EXISTS "staff delete prayer reports" ON public.prayer_request_reports;
CREATE POLICY "staff delete prayer reports"
ON public.prayer_request_reports FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE INDEX IF NOT EXISTS idx_prayer_request_reports_request ON public.prayer_request_reports(request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_request_reports_status ON public.prayer_request_reports(status);

-- 4. Update read policy on prayer_requests so hidden/removed are filtered for non-staff/non-owner
DROP POLICY IF EXISTS "auth users read prayer requests" ON public.prayer_requests;
CREATE POLICY "auth users read prayer requests"
ON public.prayer_requests FOR SELECT TO authenticated
USING (
  (
    (public.has_accepted_current_terms(auth.uid()) OR public.is_staff(auth.uid()))
    AND (
      moderation_status = 'visible'
      OR auth.uid() = user_id
      OR public.is_staff(auth.uid())
    )
  )
);

-- 5. Allow staff/moderator to update moderation_status on any prayer request
DROP POLICY IF EXISTS "staff moderates prayer requests" ON public.prayer_requests;
CREATE POLICY "staff moderates prayer requests"
ON public.prayer_requests FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'moderador'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'moderador'::app_role)
);

-- 6. Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS update_prayer_request_reports_updated_at ON public.prayer_request_reports;
CREATE TRIGGER update_prayer_request_reports_updated_at
BEFORE UPDATE ON public.prayer_request_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_request_reports;
