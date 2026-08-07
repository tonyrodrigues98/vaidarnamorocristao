
-- =========================================================================
-- Tabela de resgates de brinde por nível
-- =========================================================================
CREATE TABLE public.user_freebie_claims (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('profile_background','pet_background','decoration_frame','decoration_aura','name_gradient')),
  rarity text NOT NULL CHECK (rarity IN ('rare','epic','legendary')),
  item_id uuid NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category, rarity)
);

GRANT SELECT, INSERT ON public.user_freebie_claims TO authenticated;
GRANT ALL ON public.user_freebie_claims TO service_role;

ALTER TABLE public.user_freebie_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own freebie claims"
  ON public.user_freebie_claims FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own freebie claims"
  ON public.user_freebie_claims FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =========================================================================
-- freebie_required_level: nível necessário pra liberar o brinde
-- Espelha LEVEL_REWARDS em src/lib/levelRewards.ts
-- =========================================================================
CREATE OR REPLACE FUNCTION public.freebie_required_level(_category text, _rarity text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _category = 'pet_background'     AND _rarity = 'rare'      THEN 3
    WHEN _category = 'pet_background'     AND _rarity = 'epic'      THEN 9
    WHEN _category = 'pet_background'     AND _rarity = 'legendary' THEN 30
    WHEN _category = 'profile_background' AND _rarity = 'rare'      THEN 12
    WHEN _category = 'decoration_frame'   AND _rarity = 'rare'      THEN 25
    WHEN _category = 'decoration_frame'   AND _rarity = 'epic'      THEN 40
    WHEN _category = 'decoration_frame'   AND _rarity = 'legendary' THEN 50
    WHEN _category = 'name_gradient'      AND _rarity = 'legendary' THEN 45
    ELSE NULL
  END;
$$;

-- =========================================================================
-- list_my_freebie_status: estado de cada brinde p/ a pessoa logada
-- =========================================================================
CREATE OR REPLACE FUNCTION public.list_my_freebie_status()
RETURNS TABLE (
  category text,
  rarity text,
  required_level integer,
  unlocked boolean,
  claimed boolean,
  claimed_item_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _lv integer;
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;
  SELECT COALESCE(level, 1) INTO _lv FROM public.user_xp WHERE user_id = _uid;
  IF _lv IS NULL THEN _lv := 1; END IF;

  RETURN QUERY
  WITH tiers(category, rarity) AS (
    VALUES
      ('pet_background','rare'),
      ('pet_background','epic'),
      ('pet_background','legendary'),
      ('profile_background','rare'),
      ('decoration_frame','rare'),
      ('decoration_frame','epic'),
      ('decoration_frame','legendary'),
      ('name_gradient','legendary')
  )
  SELECT
    t.category,
    t.rarity,
    public.freebie_required_level(t.category, t.rarity) AS required_level,
    _lv >= public.freebie_required_level(t.category, t.rarity) AS unlocked,
    c.user_id IS NOT NULL AS claimed,
    c.item_id AS claimed_item_id
  FROM tiers t
  LEFT JOIN public.user_freebie_claims c
    ON c.user_id = _uid AND c.category = t.category AND c.rarity = t.rarity;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_freebie_status() TO authenticated;

-- =========================================================================
-- claim_freebie: resgata o brinde
-- =========================================================================
CREATE OR REPLACE FUNCTION public.claim_freebie(_category text, _rarity text, _item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _lv integer;
  _req integer;
  _item_rarity text;
  _exists boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '28000';
  END IF;

  _req := public.freebie_required_level(_category, _rarity);
  IF _req IS NULL THEN
    RAISE EXCEPTION 'Brinde indisponível para esta categoria/raridade';
  END IF;

  SELECT COALESCE(level, 1) INTO _lv FROM public.user_xp WHERE user_id = _uid;
  IF _lv IS NULL THEN _lv := 1; END IF;
  IF _lv < _req THEN
    RAISE EXCEPTION 'Nível % necessário para esse brinde', _req;
  END IF;

  -- Já resgatou esse tier?
  SELECT TRUE INTO _exists FROM public.user_freebie_claims
    WHERE user_id = _uid AND category = _category AND rarity = _rarity;
  IF _exists THEN
    RAISE EXCEPTION 'Brinde desta raridade já foi resgatado';
  END IF;

  -- Valida o item + insere posse conforme a categoria
  IF _category = 'profile_background' THEN
    SELECT rarity INTO _item_rarity FROM public.profile_backgrounds
      WHERE id = _item_id AND is_active = TRUE;
    IF _item_rarity IS NULL THEN RAISE EXCEPTION 'Fundo não encontrado'; END IF;
    IF _item_rarity <> _rarity THEN RAISE EXCEPTION 'Item não pertence à raridade %', _rarity; END IF;
    INSERT INTO public.user_profile_backgrounds (user_id, background_id)
      VALUES (_uid, _item_id)
      ON CONFLICT DO NOTHING;

  ELSIF _category = 'pet_background' THEN
    SELECT rarity INTO _item_rarity FROM public.pet_backgrounds
      WHERE id = _item_id AND active = TRUE;
    IF _item_rarity IS NULL THEN RAISE EXCEPTION 'Fundo de pet não encontrado'; END IF;
    IF _item_rarity <> _rarity THEN RAISE EXCEPTION 'Item não pertence à raridade %', _rarity; END IF;
    INSERT INTO public.user_pet_backgrounds (user_id, background_id, is_equipped)
      VALUES (_uid, _item_id, FALSE)
      ON CONFLICT DO NOTHING;

  ELSIF _category IN ('decoration_frame','decoration_aura') THEN
    DECLARE _expected_type text := CASE WHEN _category = 'decoration_frame' THEN 'frame' ELSE 'aura' END;
            _item_type text;
    BEGIN
      SELECT rarity, type::text INTO _item_rarity, _item_type FROM public.avatar_decorations
        WHERE id = _item_id AND active = TRUE;
      IF _item_rarity IS NULL THEN RAISE EXCEPTION 'Decoração não encontrada'; END IF;
      IF _item_type <> _expected_type THEN RAISE EXCEPTION 'Item não é do tipo %', _expected_type; END IF;
      IF _item_rarity <> _rarity THEN RAISE EXCEPTION 'Item não pertence à raridade %', _rarity; END IF;
      INSERT INTO public.user_decorations (user_id, decoration_id, is_free_claim)
        VALUES (_uid, _item_id, TRUE)
        ON CONFLICT DO NOTHING;
    END;

  ELSIF _category = 'name_gradient' THEN
    SELECT 'legendary' INTO _item_rarity FROM public.name_gradients
      WHERE id = _item_id AND is_active = TRUE;
    IF _item_rarity IS NULL THEN RAISE EXCEPTION 'Gradiente não encontrado'; END IF;
    -- name_gradients não tem coluna rarity; assumimos que o catálogo inteiro é lendário (nv 45).
    INSERT INTO public.user_name_gradients (user_id, gradient_id)
      VALUES (_uid, _item_id)
      ON CONFLICT DO NOTHING;

  ELSE
    RAISE EXCEPTION 'Categoria inválida';
  END IF;

  INSERT INTO public.user_freebie_claims (user_id, category, rarity, item_id)
    VALUES (_uid, _category, _rarity, _item_id);

  RETURN jsonb_build_object('success', true, 'item_id', _item_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_freebie(text, text, uuid) TO authenticated;
