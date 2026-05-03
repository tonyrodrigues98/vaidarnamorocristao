
-- 1. Add verified columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid;

-- 2. Verification requests
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected', 'more_info');

CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  selfie_path text NOT NULL,
  document_path text NOT NULL,
  document_type text NOT NULL,
  status public.verification_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_requests_user ON public.verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON public.verification_requests(status);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_verification_requests_updated
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: user sees own
CREATE POLICY "user sees own verification"
ON public.verification_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "user creates own verification"
ON public.verification_requests FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_accepted_current_terms(auth.uid())
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved'::profile_status)
);

CREATE POLICY "user updates own pending verification"
ON public.verification_requests FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status IN ('pending','more_info'))
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins manage verifications"
ON public.verification_requests FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- 3. Trigger: only admins can change `verified` on profiles
CREATE OR REPLACE FUNCTION public.protect_profile_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.verified_by IS DISTINCT FROM OLD.verified_by THEN
    IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
      NEW.verified := OLD.verified;
      NEW.verified_at := OLD.verified_at;
      NEW.verified_by := OLD.verified_by;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_profile_verified
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_verified();

-- 4. Private storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('verifications', 'verifications', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: user can upload/read own files; admins can read all
CREATE POLICY "user uploads own verification files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'verifications'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "user reads own verification files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'verifications'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin')
  )
);

CREATE POLICY "user deletes own verification files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'verifications'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(),'super_admin')
  )
);
