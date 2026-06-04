-- Admin CRUD support for profile frames and auras.
-- Keeps the existing avatar_decorations model and only adds missing metadata.

ALTER TABLE public.avatar_decorations
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS rarity text NOT NULL DEFAULT 'common',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.avatar_decorations
  DROP CONSTRAINT IF EXISTS avatar_decorations_rarity_check;

ALTER TABLE public.avatar_decorations
  ADD CONSTRAINT avatar_decorations_rarity_check
  CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'exclusive'));

WITH ordered AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY type
      ORDER BY sort_order ASC, created_at ASC, name ASC
    ) AS next_sort_order
  FROM public.avatar_decorations
)
UPDATE public.avatar_decorations d
SET sort_order = ordered.next_sort_order
FROM ordered
WHERE d.id = ordered.id;

CREATE INDEX IF NOT EXISTS avatar_decorations_type_sort_idx
  ON public.avatar_decorations (type, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS avatar_decorations_active_type_sort_idx
  ON public.avatar_decorations (active, type, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.avatar_decorations TO authenticated;
GRANT SELECT ON public.user_decorations TO authenticated;

DROP POLICY IF EXISTS "authenticated_can_view_avatar_decorations_for_render" ON public.avatar_decorations;
CREATE POLICY "authenticated_can_view_avatar_decorations_for_render"
  ON public.avatar_decorations
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "admins_can_manage_avatar_decorations" ON public.avatar_decorations;
CREATE POLICY "admins_can_manage_avatar_decorations"
  ON public.avatar_decorations
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

DROP POLICY IF EXISTS "admins_can_view_user_decorations" ON public.user_decorations;
CREATE POLICY "admins_can_view_user_decorations"
  ON public.user_decorations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );
