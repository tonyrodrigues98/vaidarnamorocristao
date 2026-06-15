
-- =========================================================
-- track_achievement: progress + unlock rewards
-- =========================================================
CREATE OR REPLACE FUNCTION public.track_achievement(_user_id uuid, _category text, _inc integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _ach record;
  _prog int;
  _new_prog int;
  _already_unlocked timestamptz;
  _cur_balance int;
  _new_balance int;
  _pet_image text;
BEGIN
  IF _user_id IS NULL OR _category IS NULL THEN RETURN; END IF;

  FOR _ach IN
    SELECT id, slug, name, goal, xp_reward, coin_reward, icon
    FROM public.pet_achievements
    WHERE active = true AND category = _category
  LOOP
    -- ensure row
    INSERT INTO public.user_achievements (user_id, achievement_id, progress)
    VALUES (_user_id, _ach.id, 0)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;

    SELECT progress, unlocked_at INTO _prog, _already_unlocked
    FROM public.user_achievements
    WHERE user_id = _user_id AND achievement_id = _ach.id
    FOR UPDATE;

    IF _already_unlocked IS NOT NULL THEN CONTINUE; END IF;

    _new_prog := LEAST(_ach.goal, COALESCE(_prog, 0) + _inc);

    UPDATE public.user_achievements
       SET progress = _new_prog,
           unlocked_at = CASE WHEN _new_prog >= _ach.goal THEN now() ELSE NULL END
     WHERE user_id = _user_id AND achievement_id = _ach.id;

    IF _new_prog >= _ach.goal THEN
      -- award xp
      IF _ach.xp_reward > 0 THEN
        BEGIN
          PERFORM public.award_xp('achievement_unlock', _ach.xp_reward, NULL,
            jsonb_build_object('achievement', _ach.slug));
        EXCEPTION WHEN OTHERS THEN NULL; END;
      END IF;

      -- award coins + log
      IF _ach.coin_reward > 0 THEN
        INSERT INTO public.user_coins (user_id, balance) VALUES (_user_id, 0)
        ON CONFLICT (user_id) DO NOTHING;
        SELECT balance INTO _cur_balance FROM public.user_coins WHERE user_id = _user_id FOR UPDATE;
        _new_balance := LEAST(500, _cur_balance + _ach.coin_reward);
        UPDATE public.user_coins SET balance = _new_balance, updated_at = now() WHERE user_id = _user_id;

        _pet_image := public.get_user_equipped_pet_image(_user_id);

        BEGIN
          PERFORM public.log_coin_tx(
            _user_id,
            'achievement_unlock',
            'in',
            _ach.coin_reward,
            _new_balance,
            'Conquista: ' || _ach.name,
            CASE WHEN _new_balance < _cur_balance + _ach.coin_reward
                 THEN 'Recompensa registrada (limite de moedas atingido)'
                 ELSE 'Recompensa de conquista desbloqueada' END,
            NULL,
            _pet_image
          );
        EXCEPTION WHEN OTHERS THEN NULL; END;
      END IF;

      -- notification (best effort)
      BEGIN
        INSERT INTO public.notifications (user_id, type, title, body, data)
        VALUES (_user_id, 'achievement_unlock',
                'Conquista desbloqueada!',
                _ach.name,
                jsonb_build_object('achievement', _ach.slug));
      EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.track_achievement(uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_achievement(uuid, text, integer) TO authenticated, service_role;

-- =========================================================
-- Hook into progress_mission_action: track 'mission' on complete
-- =========================================================
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

      -- track mission achievement
      PERFORM public.track_achievement(_user_id, 'mission', 1);
    END IF;
  END LOOP;
END $function$;

-- =========================================================
-- Trigger on pet_care_events: track 'care' achievement
-- =========================================================
CREATE OR REPLACE FUNCTION public.tg_achievement_care_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.track_achievement(NEW.user_id, 'care', 1);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS achievement_care_event ON public.pet_care_events;
CREATE TRIGGER achievement_care_event AFTER INSERT ON public.pet_care_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_achievement_care_event();

-- =========================================================
-- Hook into answer_quiz: track 'quiz' on correct answer
-- =========================================================
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
    PERFORM public.track_achievement(_uid, 'quiz', 1);
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

-- =========================================================
-- BACKFILL: compute initial progress from existing source data
-- =========================================================
DO $$
DECLARE
  _u record;
  _ach record;
  _cnt int;
BEGIN
  FOR _u IN SELECT id FROM auth.users LOOP
    FOR _ach IN
      SELECT id, slug, category, goal FROM public.pet_achievements
      WHERE active = true AND category IN ('mission','care','quiz')
    LOOP
      _cnt := 0;
      IF _ach.category = 'mission' THEN
        SELECT count(*) INTO _cnt FROM public.user_daily_missions
         WHERE user_id = _u.id AND completed_at IS NOT NULL;
      ELSIF _ach.category = 'care' THEN
        SELECT count(*) INTO _cnt FROM public.pet_care_events WHERE user_id = _u.id;
      ELSIF _ach.category = 'quiz' THEN
        SELECT count(*) INTO _cnt FROM public.user_quiz_attempts
         WHERE user_id = _u.id AND correct = true;
      END IF;

      IF _cnt > 0 THEN
        INSERT INTO public.user_achievements (user_id, achievement_id, progress, unlocked_at)
        VALUES (
          _u.id, _ach.id,
          LEAST(_ach.goal, _cnt),
          CASE WHEN _cnt >= _ach.goal THEN now() ELSE NULL END
        )
        ON CONFLICT (user_id, achievement_id) DO UPDATE
          SET progress = GREATEST(public.user_achievements.progress, LEAST(_ach.goal, _cnt)),
              unlocked_at = COALESCE(
                public.user_achievements.unlocked_at,
                CASE WHEN _cnt >= _ach.goal THEN now() ELSE NULL END
              );
      END IF;
    END LOOP;
  END LOOP;
END $$;
