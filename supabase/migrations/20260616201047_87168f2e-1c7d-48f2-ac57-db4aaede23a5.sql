
CREATE OR REPLACE FUNCTION public.roll_daily_missions()
RETURNS SETOF public.user_daily_missions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _day date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _have int;
  _level int;
  _slots int;
  _need int;
  _rec record;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT COALESCE(level, 1) INTO _level FROM public.user_xp WHERE user_id = _uid;
  _level := COALESCE(_level, 1);

  -- 3 missões base + 1 slot a partir do nível 5 + 1 slot a partir do nível 20
  _slots := 3
          + CASE WHEN _level >= 5  THEN 1 ELSE 0 END
          + CASE WHEN _level >= 20 THEN 1 ELSE 0 END;

  SELECT count(*) INTO _have FROM public.user_daily_missions WHERE user_id = _uid AND day = _day;
  _need := GREATEST(_slots - _have, 0);

  IF _need > 0 THEN
    FOR _rec IN
      WITH already AS (
        SELECT m.category
        FROM public.user_daily_missions u
        JOIN public.pet_missions m ON m.id = u.mission_id
        WHERE u.user_id = _uid AND u.day = _day
      ),
      picks AS (
        SELECT DISTINCT ON (category) id, category
        FROM public.pet_missions
        WHERE active
          AND category NOT IN (SELECT category FROM already)
        ORDER BY category, random()
      )
      SELECT id FROM picks ORDER BY random() LIMIT _need
    LOOP
      INSERT INTO public.user_daily_missions (user_id, mission_id, day)
      VALUES (_uid, _rec.id, _day)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN QUERY SELECT * FROM public.user_daily_missions WHERE user_id = _uid AND day = _day;
END $$;
