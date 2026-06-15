
-- 1) Streak counter
ALTER TABLE public.user_coins
  ADD COLUMN IF NOT EXISTS claim_streak integer NOT NULL DEFAULT 0;

-- 2) Daily claim with streak progression
CREATE OR REPLACE FUNCTION public.claim_daily_coins()
RETURNS TABLE(balance integer, awarded integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid UUID := auth.uid();
  r public.user_coins;
  new_balance INTEGER;
  base INTEGER;
  bonus INTEGER := 0;
  award INTEGER;
  new_streak INTEGER;
  step INTEGER;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO r FROM public.user_coins WHERE user_id = uid FOR UPDATE;
  IF r.balance >= 500 THEN RAISE EXCEPTION 'max_balance' USING ERRCODE='check_violation'; END IF;
  IF r.last_claim_date IS NOT NULL AND r.last_claim_date >= CURRENT_DATE THEN
    RAISE EXCEPTION 'already_claimed' USING ERRCODE='check_violation';
  END IF;

  -- streak: +1 if claimed yesterday, else reset to 1
  IF r.last_claim_date IS NOT NULL AND r.last_claim_date = (CURRENT_DATE - 1) THEN
    new_streak := COALESCE(r.claim_streak, 0) + 1;
  ELSE
    new_streak := 1;
  END IF;

  -- progression cycle of 7: 10,10,12,12,15,15,20
  step := ((new_streak - 1) % 7) + 1;
  base := CASE step
    WHEN 1 THEN 10
    WHEN 2 THEN 10
    WHEN 3 THEN 12
    WHEN 4 THEN 12
    WHEN 5 THEN 15
    WHEN 6 THEN 15
    WHEN 7 THEN 20
  END;

  bonus := public.pet_perk_sum(uid, ARRAY['daily_coins_plus_1','daily_coins_plus_2','daily_coins_plus_3']);
  award := base + GREATEST(0, bonus);
  new_balance := LEAST(500, r.balance + award);
  award := new_balance - r.balance;

  UPDATE public.user_coins
    SET balance = new_balance,
        last_claim_date = CURRENT_DATE,
        claim_streak = new_streak,
        updated_at = now()
    WHERE user_id = uid;

  PERFORM public.log_coin_tx(uid, 'daily_claim', 'in', award, new_balance,
    CASE WHEN bonus > 0 THEN 'Resgate diário (+ bônus do pet)' ELSE 'Resgate diário' END,
    'Sequência: ' || new_streak::text || 'd');
  RETURN QUERY SELECT new_balance, award;
END;
$function$;

-- 3) Quiz answer with reduced coin rewards
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
    -- New economy: 3/3=15, 2/3=8, 1/3=3
    _coins := CASE _today_correct WHEN 3 THEN 15 WHEN 2 THEN 8 WHEN 1 THEN 3 ELSE 0 END;
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
        _new_balance - _cur_balance,
        _new_balance,
        'Bônus do Quiz Bíblico',
        _today_correct::text || ' de 3 acertos'
      );
    END IF;
  END IF;

  RETURN QUERY SELECT _ok, _q.correct_index, _q.reference, _q.explanation;
END;
$function$;

-- 4) Cap random pet events to 3 coins max
CREATE OR REPLACE FUNCTION public.grant_coin_event(_user uuid, _amount integer, _ref text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new int;
  v_cur int;
  v_amount int;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN RETURN; END IF;
  -- New economy: random events cap at 3 coins
  v_amount := LEAST(_amount, 3);
  INSERT INTO public.user_coins (user_id, balance) VALUES (_user, 0)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO v_cur FROM public.user_coins WHERE user_id = _user FOR UPDATE;
  v_new := LEAST(500, v_cur + v_amount);
  IF v_new = v_cur THEN RETURN; END IF;
  UPDATE public.user_coins SET balance = v_new, updated_at = now() WHERE user_id = _user;
  PERFORM public.log_coin_tx(
    _user, 'pet_random_event', 'in', v_new - v_cur, v_new,
    'Evento do pet', 'Moedas surpresa: ' || COALESCE(_ref, '')
  );
END;
$function$;

-- 5) Daily economy view
CREATE OR REPLACE VIEW public.v_economy_daily
WITH (security_invoker = on) AS
SELECT
  ct.user_id,
  (ct.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS day,
  SUM(CASE WHEN ct.direction = 'in'  THEN ct.amount ELSE 0 END)::int AS coins_in,
  SUM(CASE WHEN ct.direction = 'out' THEN ct.amount ELSE 0 END)::int AS coins_out,
  COUNT(*) FILTER (WHERE ct.direction = 'in')::int  AS tx_in,
  COUNT(*) FILTER (WHERE ct.direction = 'out')::int AS tx_out,
  MAX(ct.balance_after)::int AS peak_balance
FROM public.coin_transactions ct
GROUP BY ct.user_id, (ct.created_at AT TIME ZONE 'America/Sao_Paulo')::date;

GRANT SELECT ON public.v_economy_daily TO authenticated;

-- 6) Admin economy summary (last N days)
CREATE OR REPLACE FUNCTION public.admin_economy_summary(_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  result jsonb;
  d int := GREATEST(1, LEAST(_days, 365));
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT (public.has_role(uid, 'admin') OR public.has_role(uid, 'super_admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  WITH window_tx AS (
    SELECT * FROM public.coin_transactions
    WHERE created_at >= now() - (d || ' days')::interval
  ),
  totals AS (
    SELECT
      COUNT(*) AS tx_count,
      COUNT(DISTINCT user_id) AS active_users,
      SUM(CASE WHEN direction = 'in'  THEN amount ELSE 0 END)::int AS coins_in,
      SUM(CASE WHEN direction = 'out' THEN amount ELSE 0 END)::int AS coins_out
    FROM window_tx
  ),
  by_kind AS (
    SELECT kind, direction,
           COUNT(*)::int AS tx_count,
           SUM(amount)::int AS total
    FROM window_tx
    GROUP BY kind, direction
    ORDER BY SUM(amount) DESC
  ),
  balance_dist AS (
    SELECT
      COUNT(*)                                         AS users_total,
      COUNT(*) FILTER (WHERE balance >= 500)::int      AS users_at_cap,
      COUNT(*) FILTER (WHERE balance >= 400 AND balance < 500)::int AS users_400_499,
      COUNT(*) FILTER (WHERE balance >= 200 AND balance < 400)::int AS users_200_399,
      COUNT(*) FILTER (WHERE balance >= 50  AND balance < 200)::int AS users_50_199,
      COUNT(*) FILTER (WHERE balance < 50)::int        AS users_under_50,
      AVG(balance)::numeric(10,2)                       AS avg_balance,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY balance)::int AS median_balance
    FROM public.user_coins
  ),
  daily AS (
    SELECT
      (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS day,
      SUM(CASE WHEN direction='in'  THEN amount ELSE 0 END)::int AS coins_in,
      SUM(CASE WHEN direction='out' THEN amount ELSE 0 END)::int AS coins_out,
      COUNT(DISTINCT user_id)::int AS active_users
    FROM window_tx
    GROUP BY 1
    ORDER BY 1
  )
  SELECT jsonb_build_object(
    'window_days', d,
    'totals',      (SELECT row_to_json(totals) FROM totals),
    'by_kind',     COALESCE((SELECT jsonb_agg(row_to_json(by_kind)) FROM by_kind), '[]'::jsonb),
    'balance_dist',(SELECT row_to_json(balance_dist) FROM balance_dist),
    'daily',       COALESCE((SELECT jsonb_agg(row_to_json(daily)) FROM daily), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_economy_summary(integer) TO authenticated;
