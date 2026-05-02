CREATE TABLE public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid NOT NULL,
  viewed_id uuid NOT NULL,
  viewer_age integer,
  viewer_city text,
  viewer_state text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profile_views_viewed_created
  ON public.profile_views (viewed_id, created_at DESC);
CREATE INDEX idx_profile_views_viewer_created
  ON public.profile_views (viewer_id, created_at DESC);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner sees own profile views"
  ON public.profile_views FOR SELECT
  TO authenticated
  USING (auth.uid() = viewed_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "viewer registers own view"
  ON public.profile_views FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = viewer_id
    AND viewer_id <> viewed_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND status = 'approved'
    )
  );