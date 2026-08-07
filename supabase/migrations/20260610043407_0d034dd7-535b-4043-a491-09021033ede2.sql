-- 1) Marca para identificar resgate grátis
ALTER TABLE public.user_decorations
  ADD COLUMN IF NOT EXISTS is_free_claim boolean NOT NULL DEFAULT false;

-- 2) Índice único parcial: cada usuário só pode ter 1 resgate grátis
CREATE UNIQUE INDEX IF NOT EXISTS user_decorations_one_free_claim_per_user
  ON public.user_decorations(user_id)
  WHERE is_free_claim = true;

-- 3) Função para resgatar a moldura grátis com segurança
CREATE OR REPLACE FUNCTION public.claim_free_frame(_decoration_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _deco public.avatar_decorations%ROWTYPE;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO _deco FROM public.avatar_decorations WHERE id = _decoration_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'decoration_not_found';
  END IF;

  IF _deco.active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'decoration_inactive';
  END IF;

  IF _deco.type <> 'frame' THEN
    RAISE EXCEPTION 'invalid_decoration_type';
  END IF;

  IF _deco.rarity NOT IN ('common','rare') THEN
    RAISE EXCEPTION 'invalid_rarity';
  END IF;

  -- Já resgatou alguma moldura grátis?
  IF EXISTS (
    SELECT 1 FROM public.user_decorations
    WHERE user_id = _user_id AND is_free_claim = true
  ) THEN
    RAISE EXCEPTION 'already_claimed';
  END IF;

  -- Se já possui essa moldura (compra prévia), apenas marca como resgate grátis
  IF EXISTS (
    SELECT 1 FROM public.user_decorations
    WHERE user_id = _user_id AND decoration_id = _decoration_id
  ) THEN
    UPDATE public.user_decorations
       SET is_free_claim = true
     WHERE user_id = _user_id AND decoration_id = _decoration_id;
  ELSE
    INSERT INTO public.user_decorations (user_id, decoration_id, is_free_claim)
    VALUES (_user_id, _decoration_id, true);
  END IF;

  RETURN jsonb_build_object('success', true, 'decoration_id', _decoration_id);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_free_frame(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_free_frame(uuid) TO authenticated;