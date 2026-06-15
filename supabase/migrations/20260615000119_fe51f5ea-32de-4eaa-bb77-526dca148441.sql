CREATE OR REPLACE FUNCTION public.answer_quiz(_question_id uuid, _chosen smallint)
RETURNS TABLE (correct boolean, correct_index smallint, reference text, explanation text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _day date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _q record;
  _ok boolean;
  _today_attempts int;
  _today_correct int;
  _xp int := 0;
  _coins int := 0;
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
      BEGIN
        INSERT INTO public.coin_transactions (user_id, amount, kind, source, description)
        VALUES (_uid, _coins, 'credit', 'quiz', 'Quiz bíblico: ' || _today_correct || '/3 acertos');
        INSERT INTO public.user_coins (user_id, balance) VALUES (_uid, _coins)
        ON CONFLICT (user_id) DO UPDATE SET balance = LEAST(500, public.user_coins.balance + EXCLUDED.balance);
      EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
  END IF;

  RETURN QUERY SELECT _ok, _q.correct_index, _q.reference, _q.explanation;
END $$;