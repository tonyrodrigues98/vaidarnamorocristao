
-- Tipo
CREATE TYPE public.decoration_type AS ENUM ('frame', 'aura', 'sticker');

-- Catálogo
CREATE TABLE public.avatar_decorations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.decoration_type NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_url TEXT,
  css_value TEXT,
  price_coins INTEGER NOT NULL DEFAULT 0 CHECK (price_coins >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.avatar_decorations TO anon, authenticated;
GRANT ALL ON public.avatar_decorations TO service_role;

ALTER TABLE public.avatar_decorations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Decorations are publicly viewable"
  ON public.avatar_decorations FOR SELECT
  USING (active = true);

-- Compras
CREATE TABLE public.user_decorations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decoration_id UUID NOT NULL REFERENCES public.avatar_decorations(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, decoration_id)
);

CREATE INDEX idx_user_decorations_user ON public.user_decorations(user_id);

GRANT SELECT ON public.user_decorations TO authenticated;
GRANT ALL ON public.user_decorations TO service_role;

ALTER TABLE public.user_decorations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases"
  ON public.user_decorations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Campos em profiles
ALTER TABLE public.profiles
  ADD COLUMN equipped_frame_id UUID REFERENCES public.avatar_decorations(id) ON DELETE SET NULL,
  ADD COLUMN equipped_aura_id UUID REFERENCES public.avatar_decorations(id) ON DELETE SET NULL,
  ADD COLUMN equipped_sticker_id UUID REFERENCES public.avatar_decorations(id) ON DELETE SET NULL;

-- Compra atômica
CREATE OR REPLACE FUNCTION public.purchase_decoration(_decoration_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _price INTEGER;
  _balance INTEGER;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT price_coins INTO _price
  FROM public.avatar_decorations
  WHERE id = _decoration_id AND active = true;

  IF _price IS NULL THEN
    RAISE EXCEPTION 'decoration_not_found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_decorations
    WHERE user_id = _user_id AND decoration_id = _decoration_id
  ) THEN
    RAISE EXCEPTION 'already_owned';
  END IF;

  SELECT balance INTO _balance
  FROM public.user_coins
  WHERE user_id = _user_id
  FOR UPDATE;

  IF _balance IS NULL OR _balance < _price THEN
    RAISE EXCEPTION 'insufficient_coins';
  END IF;

  UPDATE public.user_coins
  SET balance = balance - _price, updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO public.user_decorations(user_id, decoration_id)
  VALUES (_user_id, _decoration_id);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', _balance - _price
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_decoration(UUID) TO authenticated;

-- Equipar / desequipar (passa NULL para remover)
CREATE OR REPLACE FUNCTION public.equip_decoration(_decoration_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _type public.decoration_type;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF _decoration_id IS NULL THEN
    RAISE EXCEPTION 'use equip_decoration_by_type to unequip';
  END IF;

  SELECT type INTO _type
  FROM public.avatar_decorations
  WHERE id = _decoration_id AND active = true;

  IF _type IS NULL THEN
    RAISE EXCEPTION 'decoration_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_decorations
    WHERE user_id = _user_id AND decoration_id = _decoration_id
  ) THEN
    RAISE EXCEPTION 'not_owned';
  END IF;

  IF _type = 'frame' THEN
    UPDATE public.profiles SET equipped_frame_id = _decoration_id WHERE id = _user_id;
  ELSIF _type = 'aura' THEN
    UPDATE public.profiles SET equipped_aura_id = _decoration_id WHERE id = _user_id;
  ELSIF _type = 'sticker' THEN
    UPDATE public.profiles SET equipped_sticker_id = _decoration_id WHERE id = _user_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'type', _type);
END;
$$;

GRANT EXECUTE ON FUNCTION public.equip_decoration(UUID) TO authenticated;

-- Desequipar por tipo
CREATE OR REPLACE FUNCTION public.unequip_decoration(_type public.decoration_type)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF _type = 'frame' THEN
    UPDATE public.profiles SET equipped_frame_id = NULL WHERE id = _user_id;
  ELSIF _type = 'aura' THEN
    UPDATE public.profiles SET equipped_aura_id = NULL WHERE id = _user_id;
  ELSIF _type = 'sticker' THEN
    UPDATE public.profiles SET equipped_sticker_id = NULL WHERE id = _user_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.unequip_decoration(public.decoration_type) TO authenticated;
