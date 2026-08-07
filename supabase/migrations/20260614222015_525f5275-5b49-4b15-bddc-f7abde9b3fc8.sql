
CREATE TABLE public.bible_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  correct_index smallint NOT NULL CHECK (correct_index IN (0,1,2)),
  reference text NOT NULL,
  explanation text NOT NULL,
  difficulty text NOT NULL DEFAULT 'med',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bible_quiz_questions TO authenticated;
GRANT ALL ON public.bible_quiz_questions TO service_role;
ALTER TABLE public.bible_quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bqq_read_auth" ON public.bible_quiz_questions FOR SELECT TO authenticated USING (active);

CREATE TABLE public.user_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.bible_quiz_questions(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date),
  chosen_index smallint NOT NULL,
  correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);
CREATE INDEX uqa_user_day_idx ON public.user_quiz_attempts(user_id, day);
GRANT SELECT, INSERT ON public.user_quiz_attempts TO authenticated;
GRANT ALL ON public.user_quiz_attempts TO service_role;
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uqa_read_own" ON public.user_quiz_attempts FOR SELECT TO authenticated USING (user_id = auth.uid());
-- inserts apenas via RPC SECURITY DEFINER

-- RPC: 3 perguntas inéditas do dia
CREATE OR REPLACE FUNCTION public.get_today_quiz()
RETURNS TABLE (
  id uuid,
  question text,
  option_a text,
  option_b text,
  option_c text,
  reference text,
  difficulty text,
  already_answered boolean,
  was_correct boolean,
  chosen_index smallint,
  correct_index smallint,
  explanation text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _uid uuid := auth.uid();
  _day date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _today_count int;
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;

  SELECT count(*) INTO _today_count FROM public.user_quiz_attempts WHERE user_id = _uid AND day = _day;

  -- 1) perguntas já respondidas hoje (mostrar com gabarito)
  RETURN QUERY
    SELECT q.id, q.question, q.option_a, q.option_b, q.option_c, q.reference, q.difficulty,
           true AS already_answered, a.correct AS was_correct, a.chosen_index,
           q.correct_index, q.explanation
    FROM public.user_quiz_attempts a
    JOIN public.bible_quiz_questions q ON q.id = a.question_id
    WHERE a.user_id = _uid AND a.day = _day
    ORDER BY a.created_at;

  IF _today_count >= 3 THEN RETURN; END IF;

  -- 2) completar até 3 com perguntas nunca respondidas (sem revelar gabarito)
  RETURN QUERY
    SELECT q.id, q.question, q.option_a, q.option_b, q.option_c, q.reference, q.difficulty,
           false, NULL::boolean, NULL::smallint, NULL::smallint, NULL::text
    FROM public.bible_quiz_questions q
    WHERE q.active
      AND NOT EXISTS (SELECT 1 FROM public.user_quiz_attempts ua WHERE ua.user_id = _uid AND ua.question_id = q.id)
    ORDER BY md5(q.id::text || _uid::text || _day::text)
    LIMIT (3 - _today_count);
END $$;

-- RPC: responder
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

  -- XP imediato por acerto (cap diário 3)
  IF _ok THEN
    BEGIN PERFORM public.award_xp('quiz_correct', 10, 3, jsonb_build_object('q', _question_id)); EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;

  -- Bônus de moedas ao terminar as 3 do dia (escala por acertos)
  IF (_today_attempts + 1) >= 3 THEN
    SELECT count(*) FILTER (WHERE correct) INTO _today_correct
      FROM public.user_quiz_attempts WHERE user_id = _uid AND day = _day;
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
