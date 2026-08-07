
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
  level_bonus INTEGER := 0;
  user_level INTEGER := 1;
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

  IF r.last_claim_date IS NOT NULL AND r.last_claim_date = (CURRENT_DATE - 1) THEN
    new_streak := COALESCE(r.claim_streak, 0) + 1;
  ELSE
    new_streak := 1;
  END IF;

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

  -- Bônus por recompensa de nível (cumulativo até o maior atingido)
  SELECT COALESCE(level, 1) INTO user_level FROM public.user_xp WHERE user_id = uid;
  user_level := COALESCE(user_level, 1);
  level_bonus :=
      CASE WHEN user_level >= 35 THEN 10
           WHEN user_level >= 15 THEN 5
           WHEN user_level >= 7  THEN 3
           WHEN user_level >= 2  THEN 1
           ELSE 0 END;

  bonus := public.pet_perk_sum(uid, ARRAY['daily_coins_plus_1','daily_coins_plus_2','daily_coins_plus_3']);
  award := base + GREATEST(0, bonus) + level_bonus;
  new_balance := LEAST(500, r.balance + award);
  award := new_balance - r.balance;

  UPDATE public.user_coins
    SET balance = new_balance,
        last_claim_date = CURRENT_DATE,
        claim_streak = new_streak,
        updated_at = now()
    WHERE user_id = uid;

  PERFORM public.log_coin_tx(uid, 'daily_claim', 'in', award, new_balance,
    CASE
      WHEN bonus > 0 AND level_bonus > 0 THEN 'Resgate diário (+ bônus pet + nível)'
      WHEN bonus > 0 THEN 'Resgate diário (+ bônus do pet)'
      WHEN level_bonus > 0 THEN 'Resgate diário (+ bônus de nível)'
      ELSE 'Resgate diário'
    END,
    'Sequência: ' || new_streak::text || 'd');
  RETURN QUERY SELECT new_balance, award;
END;
$function$;
