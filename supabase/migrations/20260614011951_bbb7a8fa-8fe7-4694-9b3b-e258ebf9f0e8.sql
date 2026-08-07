
-- 1) Catalog table
CREATE TABLE public.pet_backgrounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url_day TEXT,
  image_url_night TEXT,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  is_exclusive BOOLEAN NOT NULL DEFAULT false,
  price_coins INTEGER NOT NULL DEFAULT 0 CHECK (price_coins >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pet_backgrounds TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_backgrounds TO authenticated;
GRANT ALL ON public.pet_backgrounds TO service_role;

ALTER TABLE public.pet_backgrounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active backgrounds"
  ON public.pet_backgrounds FOR SELECT
  USING (active = true OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Admins manage backgrounds"
  ON public.pet_backgrounds FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER trg_pet_backgrounds_updated_at
  BEFORE UPDATE ON public.pet_backgrounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Compatibility rules
CREATE TABLE public.pet_background_compat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  background_id UUID NOT NULL REFERENCES public.pet_backgrounds(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.pet_categories(id) ON DELETE CASCADE,
  species_id UUID REFERENCES public.pet_species(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX pet_background_compat_uniq
  ON public.pet_background_compat (background_id, category_id, COALESCE(species_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX pet_background_compat_bg ON public.pet_background_compat(background_id);
CREATE INDEX pet_background_compat_cat ON public.pet_background_compat(category_id);
CREATE INDEX pet_background_compat_sp ON public.pet_background_compat(species_id);

GRANT SELECT ON public.pet_background_compat TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_background_compat TO authenticated;
GRANT ALL ON public.pet_background_compat TO service_role;

ALTER TABLE public.pet_background_compat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view compat rules"
  ON public.pet_background_compat FOR SELECT USING (true);

CREATE POLICY "Admins manage compat rules"
  ON public.pet_background_compat FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- 3) User unlocks & equipped
CREATE TABLE public.user_pet_backgrounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  background_id UUID NOT NULL REFERENCES public.pet_backgrounds(id) ON DELETE CASCADE,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, background_id)
);

CREATE INDEX user_pet_backgrounds_user ON public.user_pet_backgrounds(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_pet_backgrounds TO authenticated;
GRANT ALL ON public.user_pet_backgrounds TO service_role;

ALTER TABLE public.user_pet_backgrounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own bg unlocks"
  ON public.user_pet_backgrounds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own bg unlocks"
  ON public.user_pet_backgrounds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own bg unlocks"
  ON public.user_pet_backgrounds FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own bg unlocks"
  ON public.user_pet_backgrounds FOR DELETE
  USING (auth.uid() = user_id);

-- 4) RPCs
CREATE OR REPLACE FUNCTION public.unlock_pet_background(_background_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  bg public.pet_backgrounds;
  v_bal int;
  v_new int;
  v_existing uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO bg FROM public.pet_backgrounds WHERE id = _background_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'background_not_found'; END IF;

  SELECT id INTO v_existing FROM public.user_pet_backgrounds
    WHERE user_id = uid AND background_id = _background_id;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  IF bg.is_exclusive AND bg.price_coins > 0 THEN
    INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100) ON CONFLICT (user_id) DO NOTHING;
    SELECT balance INTO v_bal FROM public.user_coins WHERE user_id = uid FOR UPDATE;
    IF v_bal < bg.price_coins THEN RAISE EXCEPTION 'insufficient_coins' USING ERRCODE='check_violation'; END IF;
    v_new := v_bal - bg.price_coins;
    UPDATE public.user_coins SET balance = v_new, updated_at = now() WHERE user_id = uid;
    PERFORM public.log_coin_tx(uid, 'pet_background_purchase', 'out', bg.price_coins, v_new,
      'Cenário do pet: ' || bg.name, 'Pet', _background_id, bg.image_url_day);
  END IF;

  INSERT INTO public.user_pet_backgrounds (user_id, background_id, is_equipped)
  VALUES (uid, _background_id, false)
  RETURNING id INTO v_existing;

  RETURN v_existing;
END;
$$;

CREATE OR REPLACE FUNCTION public.equip_pet_background(_background_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_owned uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  IF _background_id IS NULL THEN
    UPDATE public.user_pet_backgrounds SET is_equipped = false
      WHERE user_id = uid AND is_equipped = true;
    RETURN;
  END IF;

  SELECT id INTO v_owned FROM public.user_pet_backgrounds
    WHERE user_id = uid AND background_id = _background_id;
  IF v_owned IS NULL THEN RAISE EXCEPTION 'not_owned'; END IF;

  UPDATE public.user_pet_backgrounds SET is_equipped = false
    WHERE user_id = uid AND is_equipped = true AND id <> v_owned;
  UPDATE public.user_pet_backgrounds SET is_equipped = true
    WHERE id = v_owned;
END;
$$;

GRANT EXECUTE ON FUNCTION public.unlock_pet_background(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equip_pet_background(UUID) TO authenticated;
