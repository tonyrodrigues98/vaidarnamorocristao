
-- ============================================================
-- LOT 4: XP boost noturno + bundle starter + prestígio
-- ============================================================

-- ---------- Starter bundle ----------
CREATE TABLE IF NOT EXISTS public.user_starter_bundle (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  coins_granted integer NOT NULL DEFAULT 0,
  xp_granted integer NOT NULL DEFAULT 0
);

GRANT SELECT ON public.user_starter_bundle TO authenticated;
GRANT ALL ON public.user_starter_bundle TO service_role;

ALTER TABLE public.user_starter_bundle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "starter_bundle_owner_read"
  ON public.user_starter_bundle FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------- Prestige ----------
CREATE TABLE IF NOT EXISTS public.user_prestige (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 0,
  last_prestige_at timestamptz,
  total_rebirths integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_prestige TO authenticated;
GRANT ALL ON public.user_prestige TO service_role;

ALTER TABLE public.user_prestige ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prestige_owner_read"
  ON public.user_prestige FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------- award_xp: aplica boost noturno + prestígio ----------
CREATE OR REPLACE FUNCTION public.award_xp(
  _source text,
  _amount integer,
  _daily_cap integer DEFAULT NULL,
  _meta jsonb DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today_count integer := 0;
  _granted integer := 0;
  _base integer := 0;
  _new_total integer;
  _new_level integer;
  _sp_hour integer;
  _is_night boolean := false;
  _prestige integer := 0;
  _mult numeric := 1.0;
  _meta_out jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount <= 0 THEN RETURN jsonb_build_object('granted', 0); END IF;

  IF _daily_cap IS NOT NULL THEN
    SELECT count(*) INTO _today_count
    FROM public.xp_events
    WHERE user_id = _uid
      AND source = _source
      AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date
          = (now() AT TIME ZONE 'America/Sao_Paulo')::date;
    IF _today_count >= _daily_cap THEN
      RETURN jsonb_build_object('granted', 0, 'reason', 'daily_cap');
    END IF;
  END IF;

  _base := _amount;

  -- Night boost (23h-03h SP) = 2x
  _sp_hour := EXTRACT(HOUR FROM (now() AT TIME ZONE 'America/Sao_Paulo'))::int;
  _is_night := (_sp_hour >= 23 OR _sp_hour < 3);
  IF _is_night THEN
    _mult := _mult * 2.0;
  END IF;

  -- Prestige bonus: +5% per prestige level, cap +50%
  SELECT COALESCE(level, 0) INTO _prestige
  FROM public.user_prestige WHERE user_id = _uid;
  IF _prestige > 0 THEN
    _mult := _mult * (1.0 + LEAST(_prestige, 10) * 0.05);
  END IF;

  _granted := GREATEST(1, FLOOR(_base * _mult)::int);

  _meta_out := COALESCE(_meta, '{}'::jsonb)
    || jsonb_build_object(
      'base', _base,
      'mult', _mult,
      'night_boost', _is_night,
      'prestige', _prestige
    );

  INSERT INTO public.xp_events (user_id, source, amount, meta)
  VALUES (_uid, _source, _granted, _meta_out);

  INSERT INTO public.user_xp (user_id, xp_total, level)
  VALUES (_uid, _granted, public.level_from_xp(_granted))
  ON CONFLICT (user_id) DO UPDATE
    SET xp_total = public.user_xp.xp_total + _granted,
        level = public.level_from_xp(public.user_xp.xp_total + _granted),
        updated_at = now()
  RETURNING xp_total, level INTO _new_total, _new_level;

  RETURN jsonb_build_object(
    'granted', _granted,
    'base', _base,
    'mult', _mult,
    'night_boost', _is_night,
    'prestige', _prestige,
    'xp_total', _new_total,
    'level', _new_level
  );
END
$$;

-- ---------- get_my_starter_bundle ----------
CREATE OR REPLACE FUNCTION public.get_my_starter_bundle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.user_starter_bundle%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO _row FROM public.user_starter_bundle WHERE user_id = _uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('claimed', false);
  END IF;
  RETURN jsonb_build_object(
    'claimed', true,
    'claimed_at', _row.claimed_at,
    'coins_granted', _row.coins_granted,
    'xp_granted', _row.xp_granted
  );
END
$$;

-- ---------- claim_starter_bundle ----------
CREATE OR REPLACE FUNCTION public.claim_starter_bundle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _coins integer := 300;
  _xp integer := 200;
  _xp_res jsonb;
  _new_balance integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  IF EXISTS (SELECT 1 FROM public.user_starter_bundle WHERE user_id = _uid) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END IF;

  INSERT INTO public.user_starter_bundle (user_id, coins_granted, xp_granted)
  VALUES (_uid, _coins, _xp);

  -- Coins (respeita cap 500)
  INSERT INTO public.user_coins (user_id, balance)
  VALUES (_uid, LEAST(500, 100 + _coins))
  ON CONFLICT (user_id) DO UPDATE
    SET balance = LEAST(500, public.user_coins.balance + _coins),
        updated_at = now()
  RETURNING balance INTO _new_balance;

  -- XP via award_xp (sem cap diário, sem multiplicador noturno duplicado: passa direto)
  _xp_res := public.award_xp('starter_bundle', _xp, NULL, jsonb_build_object('one_time', true));

  RETURN jsonb_build_object(
    'ok', true,
    'coins_granted', _coins,
    'xp_granted', _xp,
    'new_balance', _new_balance,
    'xp_result', _xp_res
  );
END
$$;

-- ---------- get_my_prestige ----------
CREATE OR REPLACE FUNCTION public.get_my_prestige()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _level integer := 0;
  _total integer := 0;
  _last timestamptz;
  _xp_level integer := 1;
  _xp_total integer := 0;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT COALESCE(level,0), COALESCE(total_rebirths,0), last_prestige_at
    INTO _level, _total, _last
  FROM public.user_prestige WHERE user_id = _uid;

  SELECT COALESCE(level,1), COALESCE(xp_total,0) INTO _xp_level, _xp_total
  FROM public.user_xp WHERE user_id = _uid;

  RETURN jsonb_build_object(
    'level', _level,
    'total_rebirths', _total,
    'last_prestige_at', _last,
    'current_xp_level', _xp_level,
    'current_xp_total', _xp_total,
    'can_rebirth', _xp_level >= 50,
    'xp_bonus_pct', LEAST(_level, 10) * 5
  );
END
$$;

-- ---------- prestige_rebirth ----------
CREATE OR REPLACE FUNCTION public.prestige_rebirth()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _xp_level integer := 1;
  _new_prestige integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT COALESCE(level,1) INTO _xp_level FROM public.user_xp WHERE user_id = _uid;
  IF _xp_level < 50 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'level_too_low', 'required_level', 50);
  END IF;

  -- Reset XP
  UPDATE public.user_xp
     SET xp_total = 0, level = 1, updated_at = now()
   WHERE user_id = _uid;

  -- Bump prestige
  INSERT INTO public.user_prestige (user_id, level, total_rebirths, last_prestige_at, updated_at)
  VALUES (_uid, 1, 1, now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET level = public.user_prestige.level + 1,
        total_rebirths = public.user_prestige.total_rebirths + 1,
        last_prestige_at = now(),
        updated_at = now()
  RETURNING level INTO _new_prestige;

  RETURN jsonb_build_object(
    'ok', true,
    'new_prestige_level', _new_prestige,
    'xp_bonus_pct', LEAST(_new_prestige, 10) * 5
  );
END
$$;

GRANT EXECUTE ON FUNCTION public.get_my_starter_bundle() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_starter_bundle() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_prestige() TO authenticated;
GRANT EXECUTE ON FUNCTION public.prestige_rebirth() TO authenticated;
