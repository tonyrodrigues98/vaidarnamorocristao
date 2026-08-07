
-- Additional profile photos (Tinder-style carousel), up to 6 per user
CREATE TABLE public.profile_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profile_photos_user ON public.profile_photos(user_id, sort_order);

ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see photos belonging to approved profiles (or owner / admin)
CREATE POLICY "auth read photos of approved"
ON public.profile_photos FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_photos.user_id
      AND p.status = 'approved'::profile_status
      AND p.deactivated_at IS NULL
      AND p.deletion_requested_at IS NULL
      AND p.is_anonymized = false
  )
);

CREATE POLICY "owner inserts own photo"
ON public.profile_photos FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "owner updates own photo"
ON public.profile_photos FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "owner deletes own photo"
ON public.profile_photos FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Limit max 6 photos per user (additional only — main profile photo stays on profiles.photo_url)
CREATE OR REPLACE FUNCTION public.enforce_profile_photos_limit()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profile_photos WHERE user_id = NEW.user_id) >= 6 THEN
    RAISE EXCEPTION 'Limite de 6 fotos adicionais atingido';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profile_photos_limit
BEFORE INSERT ON public.profile_photos
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_photos_limit();
