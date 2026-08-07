-- Repair profile backgrounds after manual table creation:
-- purchase RPC, grants, rarity check and storage policies.

ALTER TABLE public.profile_backgrounds
  DROP CONSTRAINT IF EXISTS profile_backgrounds_rarity_check;

ALTER TABLE public.profile_backgrounds
  ADD CONSTRAINT profile_backgrounds_rarity_check
  CHECK (rarity::text IN ('common', 'rare', 'epic', 'legendary', 'exclusive'));

ALTER TABLE public.profile_backgrounds
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

GRANT SELECT ON public.profile_backgrounds TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profile_backgrounds TO authenticated;
GRANT ALL ON public.profile_backgrounds TO service_role;

GRANT SELECT ON public.user_profile_backgrounds TO authenticated;
GRANT ALL ON public.user_profile_backgrounds TO service_role;

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

  SELECT price, name, image_url
  INTO v_price, v_name, v_img
  FROM public.profile_backgrounds
  WHERE id = _background_id
    AND is_active = true;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'background_not_found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_profile_backgrounds
    WHERE user_id = uid
      AND background_id = _background_id
  ) THEN
    RAISE EXCEPTION 'already_owned';
  END IF;

  INSERT INTO public.user_coins (user_id, balance)
  VALUES (uid, 100)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance
  INTO v_balance
  FROM public.user_coins
  WHERE user_id = uid
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < v_price THEN
    RAISE EXCEPTION 'insufficient_coins' USING ERRCODE = 'check_violation';
  END IF;

  v_new_balance := v_balance - v_price;

  UPDATE public.user_coins
  SET balance = v_new_balance,
      updated_at = now()
  WHERE user_id = uid;

  INSERT INTO public.user_profile_backgrounds (user_id, background_id)
  VALUES (uid, _background_id);

  PERFORM public.log_coin_tx(
    uid,
    'profile_background_purchase',
    'out',
    v_price,
    v_new_balance,
    'Fundo comprado: ' || COALESCE(v_name, 'Fundo de Perfil'),
    'Fundos de Perfil',
    _background_id,
    v_img
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_profile_background(uuid) TO authenticated;

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
