-- Premium profile backgrounds catalog, inventory, equipment and storage.
-- Idempotent by design so it can repair databases where a previous attempt ran only partially.

DO $$
BEGIN
  CREATE TYPE public.profile_background_rarity AS ENUM ('common', 'rare', 'epic', 'legendary', 'exclusive');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.profile_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  price integer NOT NULL DEFAULT 0 CHECK (price >= 0),
  rarity public.profile_background_rarity NOT NULL DEFAULT 'common',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_backgrounds
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS price integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rarity public.profile_background_rarity NOT NULL DEFAULT 'common',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.profile_backgrounds
  DROP CONSTRAINT IF EXISTS profile_backgrounds_price_check,
  ADD CONSTRAINT profile_backgrounds_price_check CHECK (price >= 0);

CREATE INDEX IF NOT EXISTS profile_backgrounds_active_sort_idx
  ON public.profile_backgrounds (is_active, sort_order, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_backgrounds TO authenticated;
GRANT SELECT ON public.profile_backgrounds TO anon;
GRANT ALL ON public.profile_backgrounds TO service_role;

ALTER TABLE public.profile_backgrounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "active profile backgrounds readable" ON public.profile_backgrounds;
CREATE POLICY "active profile backgrounds readable"
ON public.profile_backgrounds
FOR SELECT
USING (
  is_active = true
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS "admins manage profile backgrounds" ON public.profile_backgrounds;
CREATE POLICY "admins manage profile backgrounds"
ON public.profile_backgrounds
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

CREATE TABLE IF NOT EXISTS public.user_profile_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  background_id uuid NOT NULL REFERENCES public.profile_backgrounds(id) ON DELETE CASCADE,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, background_id)
);

ALTER TABLE public.user_profile_backgrounds
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS background_id uuid,
  ADD COLUMN IF NOT EXISTS purchased_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_profile_backgrounds_user_id_fkey'
      AND conrelid = 'public.user_profile_backgrounds'::regclass
  ) THEN
    ALTER TABLE public.user_profile_backgrounds
      ADD CONSTRAINT user_profile_backgrounds_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_profile_backgrounds_background_id_fkey'
      AND conrelid = 'public.user_profile_backgrounds'::regclass
  ) THEN
    ALTER TABLE public.user_profile_backgrounds
      ADD CONSTRAINT user_profile_backgrounds_background_id_fkey
      FOREIGN KEY (background_id) REFERENCES public.profile_backgrounds(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_profile_backgrounds_user_id_background_id_key'
      AND conrelid = 'public.user_profile_backgrounds'::regclass
  ) THEN
    ALTER TABLE public.user_profile_backgrounds
      ADD CONSTRAINT user_profile_backgrounds_user_id_background_id_key UNIQUE (user_id, background_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS user_profile_backgrounds_user_idx
  ON public.user_profile_backgrounds (user_id, purchased_at DESC);

GRANT SELECT ON public.user_profile_backgrounds TO authenticated;
GRANT ALL ON public.user_profile_backgrounds TO service_role;

ALTER TABLE public.user_profile_backgrounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own profile backgrounds" ON public.user_profile_backgrounds;
CREATE POLICY "users read own profile backgrounds"
ON public.user_profile_backgrounds
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS equipped_background_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_equipped_background_id_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_equipped_background_id_fkey
      FOREIGN KEY (equipped_background_id) REFERENCES public.profile_backgrounds(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_equipped_background_idx
  ON public.profiles (equipped_background_id);

CREATE OR REPLACE FUNCTION public.purchase_profile_background(_background_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_price integer;
  v_balance integer;
  v_name text;
  v_img text;
  v_new_balance integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT price, name, image_url INTO v_price, v_name, v_img
  FROM public.profile_backgrounds
  WHERE id = _background_id AND is_active = true;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'background_not_found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_profile_backgrounds
    WHERE user_id = uid AND background_id = _background_id
  ) THEN
    RAISE EXCEPTION 'already_owned';
  END IF;

  INSERT INTO public.user_coins (user_id, balance)
  VALUES (uid, 100)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO v_balance
  FROM public.user_coins
  WHERE user_id = uid
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < v_price THEN
    RAISE EXCEPTION 'insufficient_coins' USING ERRCODE = 'check_violation';
  END IF;

  v_new_balance := v_balance - v_price;

  UPDATE public.user_coins
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = uid;

  INSERT INTO public.user_profile_backgrounds(user_id, background_id)
  VALUES (uid, _background_id);

  PERFORM public.log_coin_tx(
    uid,
    'profile_background_purchase',
    'out',
    v_price,
    v_new_balance,
    COALESCE(v_name, 'Fundo de Perfil'),
    'Fundo de Perfil',
    _background_id,
    v_img
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_profile_background(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.equip_profile_background(_background_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profile_backgrounds
    WHERE id = _background_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'background_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_profile_backgrounds
    WHERE user_id = uid AND background_id = _background_id
  ) THEN
    RAISE EXCEPTION 'not_owned';
  END IF;

  UPDATE public.profiles
  SET equipped_background_id = _background_id
  WHERE id = uid;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.equip_profile_background(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.unequip_profile_background()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE public.profiles
  SET equipped_background_id = NULL
  WHERE id = uid;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.unequip_profile_background() TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-backgrounds', 'profile-backgrounds', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "profile-backgrounds public read" ON storage.objects;
CREATE POLICY "profile-backgrounds public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-backgrounds');

DROP POLICY IF EXISTS "admins upload profile-backgrounds" ON storage.objects;
CREATE POLICY "admins upload profile-backgrounds"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-backgrounds'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);

DROP POLICY IF EXISTS "admins update profile-backgrounds" ON storage.objects;
CREATE POLICY "admins update profile-backgrounds"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-backgrounds'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
)
WITH CHECK (
  bucket_id = 'profile-backgrounds'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);

DROP POLICY IF EXISTS "admins delete profile-backgrounds" ON storage.objects;
CREATE POLICY "admins delete profile-backgrounds"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-backgrounds'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);
