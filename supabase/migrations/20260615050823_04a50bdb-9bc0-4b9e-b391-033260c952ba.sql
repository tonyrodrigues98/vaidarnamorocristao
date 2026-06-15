
-- Helper: get current user's equipped pet image
CREATE OR REPLACE FUNCTION public.get_user_equipped_pet_image(_uid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(v.image_url_adult, v.image_url, s.image_url)
  FROM public.user_pets_v2 up
  LEFT JOIN public.pet_variants v ON v.id = up.variant_id
  LEFT JOIN public.pet_species s ON s.id = up.species_id
  WHERE up.user_id = _uid AND up.is_equipped = true
  ORDER BY up.updated_at DESC
  LIMIT 1;
$$;

-- Fix answer_quiz: use correct coin_transactions schema via log_coin_tx
CREATE OR REPLACE FUNCTION public.answer_quiz(_question_id uuid, _chosen smallint)
RETURNS TABLE(correct boolean, correct_index smallint, reference text, explanation text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _day date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _q record;
  _ok boolean;
  _today_attempts int;
  _today_correct int;
  _xp int := 0;
  _coins int := 0;
  _cur_balance int;
  _new_balance int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF _chosen NOT IN (0,1,2) THEN RAISE EXCEPTION 'invalid option'; END IF;

  SELECT count(*) INTO _today_attempts FROM public.user_quiz_attempts WHERE user_id = _uid AND day = _day;
  IF _today_attempts >= 3 THEN RAISE EXCEPTION 'daily limit reached'; END IF;

  SELECT * INTO _q FROM public.bible_quiz_questions WHERE id = _question_id AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'question not found'; END IF;

  IF EXISTS (SELECT 1 FROM public.user_quiz_attempts WHERE user_id = _uid AND question_id = _question_id) THEN
    RAISE EXCEPTION 'already answered';
  END IF;

  _ok := (_chosen = _q.correct_index);

  INSERT INTO public.user_quiz_attempts (user_id, question_id, day, chosen_index, correct)
  VALUES (_uid, _question_id, _day, _chosen, _ok);

  IF _ok THEN
    BEGIN PERFORM public.award_xp('quiz_correct', 10, 3, jsonb_build_object('q', _question_id)); EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;

  IF (_today_attempts + 1) >= 3 THEN
    SELECT count(*) FILTER (WHERE uqa.correct) INTO _today_correct
      FROM public.user_quiz_attempts uqa WHERE uqa.user_id = _uid AND uqa.day = _day;
    _coins := CASE _today_correct WHEN 3 THEN 40 WHEN 2 THEN 15 WHEN 1 THEN 5 ELSE 0 END;
    _xp    := CASE _today_correct WHEN 3 THEN 30 WHEN 2 THEN 10 WHEN 1 THEN 0 ELSE 0 END;

    IF _xp > 0 THEN
      BEGIN PERFORM public.award_xp('quiz_session', _xp, NULL, jsonb_build_object('day', _day, 'hits', _today_correct)); EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    IF _coins > 0 THEN
      INSERT INTO public.user_coins (user_id, balance) VALUES (_uid, 0)
      ON CONFLICT (user_id) DO NOTHING;
      SELECT balance INTO _cur_balance FROM public.user_coins WHERE user_id = _uid FOR UPDATE;
      _new_balance := LEAST(500, _cur_balance + _coins);
      UPDATE public.user_coins SET balance = _new_balance, updated_at = now() WHERE user_id = _uid;

      PERFORM public.log_coin_tx(
        _uid,
        'quiz_bonus',
        'in',
        _coins,
        _new_balance,
        'Quiz Bíblico: ' || _today_correct || '/3 acertos',
        CASE WHEN _new_balance < _cur_balance + _coins
             THEN 'Bônus registrado (limite de moedas atingido)'
             ELSE 'Bônus do quiz do dia' END,
        NULL,
        NULL
      );
    END IF;
  END IF;

  RETURN QUERY SELECT _ok, _q.correct_index, _q.reference, _q.explanation;
END $function$;

-- Fix progress_mission_action: deposit & log correctly, using equipped pet image as icon
CREATE OR REPLACE FUNCTION public.progress_mission_action(_user_id uuid, _action_key text, _inc integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _day date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _row record;
  _new int;
  _cur_balance int;
  _new_balance int;
  _pet_image text;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;

  FOR _row IN
    SELECT u.id AS udm_id, u.progress, u.completed_at, m.target, m.xp_reward, m.coin_reward, m.slug, m.title
    FROM public.user_daily_missions u
    JOIN public.pet_missions m ON m.id = u.mission_id
    WHERE u.user_id = _user_id
      AND u.day = _day
      AND m.action_key = _action_key
      AND u.completed_at IS NULL
  LOOP
    _new := LEAST(_row.target, _row.progress + _inc);
    UPDATE public.user_daily_missions
       SET progress = _new,
           completed_at = CASE WHEN _new >= _row.target THEN now() ELSE NULL END
     WHERE id = _row.udm_id;

    IF _new >= _row.target THEN
      BEGIN
        PERFORM public.award_xp('mission_done', _row.xp_reward, NULL,
          jsonb_build_object('mission', _row.slug));
      EXCEPTION WHEN OTHERS THEN NULL; END;

      IF _row.coin_reward > 0 THEN
        INSERT INTO public.user_coins (user_id, balance) VALUES (_user_id, 0)
        ON CONFLICT (user_id) DO NOTHING;
        SELECT balance INTO _cur_balance FROM public.user_coins WHERE user_id = _user_id FOR UPDATE;
        _new_balance := LEAST(500, _cur_balance + _row.coin_reward);
        UPDATE public.user_coins SET balance = _new_balance, updated_at = now() WHERE user_id = _user_id;

        _pet_image := public.get_user_equipped_pet_image(_user_id);

        PERFORM public.log_coin_tx(
          _user_id,
          'mission_done',
          'in',
          _row.coin_reward,
          _new_balance,
          'Missão concluída: ' || COALESCE(_row.title, _row.slug),
          CASE WHEN _new_balance < _cur_balance + _row.coin_reward
               THEN 'Recompensa registrada (limite de moedas atingido)'
               ELSE 'Recompensa de missão diária' END,
          NULL,
          _pet_image
        );
      END IF;
    END IF;
  END LOOP;
END $function$;
