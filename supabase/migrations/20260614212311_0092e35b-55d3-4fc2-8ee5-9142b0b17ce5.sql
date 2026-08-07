
-- =========================================================
-- user_xp
-- =========================================================
CREATE TABLE public.user_xp (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_total integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_xp TO authenticated;
GRANT ALL ON public.user_xp TO service_role;
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own xp" ON public.user_xp
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- xp_events (log + daily cap)
-- =========================================================
CREATE TABLE public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL,
  amount integer NOT NULL,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX xp_events_user_source_day_idx
  ON public.xp_events (user_id, source, ((created_at AT TIME ZONE 'America/Sao_Paulo')::date));

GRANT SELECT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own xp events" ON public.xp_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- pet_achievements (catalog)
-- =========================================================
CREATE TABLE public.pet_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'Trophy',
  category text NOT NULL DEFAULT 'general',
  goal integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 0,
  coin_reward integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pet_achievements TO authenticated, anon;
GRANT ALL ON public.pet_achievements TO service_role;
ALTER TABLE public.pet_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements public read" ON public.pet_achievements
  FOR SELECT USING (active = true);

-- =========================================================
-- user_achievements (progress)
-- =========================================================
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.pet_achievements(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  unlocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

GRANT SELECT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- Triggers updated_at
-- =========================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER user_xp_updated BEFORE UPDATE ON public.user_xp
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER pet_achievements_updated BEFORE UPDATE ON public.pet_achievements
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER user_achievements_updated BEFORE UPDATE ON public.user_achievements
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- Level helpers
-- =========================================================
CREATE OR REPLACE FUNCTION public.xp_for_level(_level integer)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN _level <= 1 THEN 0
              ELSE floor(100 * power(_level - 1, 1.6))::int END
$$;

CREATE OR REPLACE FUNCTION public.level_from_xp(_xp integer)
RETURNS integer LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE lv int := 1;
BEGIN
  WHILE lv < 50 AND public.xp_for_level(lv + 1) <= _xp LOOP
    lv := lv + 1;
  END LOOP;
  RETURN lv;
END $$;

-- =========================================================
-- award_xp (with daily cap)
-- =========================================================
CREATE OR REPLACE FUNCTION public.award_xp(
  _source text,
  _amount integer,
  _daily_cap integer DEFAULT NULL,
  _meta jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _today_count integer := 0;
  _granted integer := 0;
  _new_total integer;
  _old_level integer;
  _new_level integer;
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

  _granted := _amount;

  INSERT INTO public.xp_events (user_id, source, amount, meta)
  VALUES (_uid, _source, _granted, _meta);

  INSERT INTO public.user_xp (user_id, xp_total, level)
  VALUES (_uid, _granted, public.level_from_xp(_granted))
  ON CONFLICT (user_id) DO UPDATE
    SET xp_total = public.user_xp.xp_total + _granted,
        level = public.level_from_xp(public.user_xp.xp_total + _granted),
        updated_at = now()
  RETURNING xp_total, level INTO _new_total, _new_level;

  SELECT level FROM public.user_xp WHERE user_id = _uid INTO _old_level;

  RETURN jsonb_build_object(
    'granted', _granted,
    'xp_total', _new_total,
    'level', _new_level
  );
END $$;

GRANT EXECUTE ON FUNCTION public.award_xp(text, integer, integer, jsonb) TO authenticated;

-- =========================================================
-- get_my_xp_state
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_my_xp_state()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _xp integer := 0;
  _lv integer := 1;
  _cur_lv_xp integer;
  _next_lv_xp integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT xp_total, level INTO _xp, _lv FROM public.user_xp WHERE user_id = _uid;
  IF NOT FOUND THEN _xp := 0; _lv := 1; END IF;
  _cur_lv_xp := public.xp_for_level(_lv);
  _next_lv_xp := public.xp_for_level(_lv + 1);
  RETURN jsonb_build_object(
    'xp_total', _xp,
    'level', _lv,
    'xp_into_level', _xp - _cur_lv_xp,
    'xp_for_next', GREATEST(_next_lv_xp - _cur_lv_xp, 1),
    'is_max', _lv >= 50
  );
END $$;

GRANT EXECUTE ON FUNCTION public.get_my_xp_state() TO authenticated;
