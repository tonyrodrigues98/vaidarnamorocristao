-- Admin CRUD support for profile frames and auras.
-- Uses the existing avatar_decorations catalog used by the store/customization flow.
-- Safe to run more than once: it only creates missing objects/columns/policies.

DO $$
BEGIN
  CREATE TYPE public.decoration_type AS ENUM ('frame', 'aura', 'sticker');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.decoration_type ADD VALUE IF NOT EXISTS 'frame';
ALTER TYPE public.decoration_type ADD VALUE IF NOT EXISTS 'aura';
ALTER TYPE public.decoration_type ADD VALUE IF NOT EXISTS 'sticker';

CREATE TABLE IF NOT EXISTS public.avatar_decorations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.decoration_type NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_url text,
  css_value text,
  price_coins integer NOT NULL DEFAULT 0,
  rarity text NOT NULL DEFAULT 'common',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS public.avatar_decorations
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS rarity text NOT NULL DEFAULT 'common',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE IF EXISTS public.avatar_decorations
  ALTER COLUMN price_coins SET DEFAULT 0,
  ALTER COLUMN sort_order SET DEFAULT 0,
  ALTER COLUMN active SET DEFAULT true,
  ALTER COLUMN rarity SET DEFAULT 'common',
  ALTER COLUMN updated_at SET DEFAULT now();

UPDATE public.avatar_decorations
SET
  price_coins = COALESCE(price_coins, 0),
  sort_order = COALESCE(sort_order, 0),
  active = COALESCE(active, true),
  rarity = COALESCE(rarity, 'common'),
  updated_at = COALESCE(updated_at, created_at, now())
WHERE
  price_coins IS NULL
  OR sort_order IS NULL
  OR active IS NULL
  OR rarity IS NULL
  OR updated_at IS NULL;

ALTER TABLE IF EXISTS public.avatar_decorations
  ALTER COLUMN price_coins SET NOT NULL,
  ALTER COLUMN sort_order SET NOT NULL,
  ALTER COLUMN active SET NOT NULL,
  ALTER COLUMN rarity SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE IF EXISTS public.avatar_decorations
  DROP CONSTRAINT IF EXISTS avatar_decorations_rarity_check;

ALTER TABLE IF EXISTS public.avatar_decorations
  ADD CONSTRAINT avatar_decorations_rarity_check
  CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'exclusive'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'avatar_decorations_price_coins_nonnegative'
      AND conrelid = 'public.avatar_decorations'::regclass
  ) THEN
    ALTER TABLE public.avatar_decorations
      ADD CONSTRAINT avatar_decorations_price_coins_nonnegative CHECK (price_coins >= 0);
  END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS public.user_decorations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decoration_id uuid NOT NULL REFERENCES public.avatar_decorations(id) ON DELETE CASCADE,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, decoration_id)
);

CREATE INDEX IF NOT EXISTS idx_user_decorations_user
  ON public.user_decorations (user_id);

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS equipped_frame_id uuid REFERENCES public.avatar_decorations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipped_aura_id uuid REFERENCES public.avatar_decorations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipped_sticker_id uuid REFERENCES public.avatar_decorations(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS avatar_decorations_updated_at ON public.avatar_decorations;
CREATE TRIGGER avatar_decorations_updated_at
  BEFORE UPDATE ON public.avatar_decorations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT ON public.avatar_decorations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avatar_decorations TO authenticated;
GRANT ALL ON public.avatar_decorations TO service_role;
GRANT SELECT ON public.user_decorations TO authenticated;
GRANT ALL ON public.user_decorations TO service_role;

ALTER TABLE public.avatar_decorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_decorations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Decorations are publicly viewable" ON public.avatar_decorations;
CREATE POLICY "Decorations are publicly viewable"
  ON public.avatar_decorations
  FOR SELECT
  USING (active = true);

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

DROP POLICY IF EXISTS "Users view own purchases" ON public.user_decorations;
CREATE POLICY "Users view own purchases"
  ON public.user_decorations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins_can_view_user_decorations" ON public.user_decorations;
CREATE POLICY "admins_can_view_user_decorations"
  ON public.user_decorations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );
