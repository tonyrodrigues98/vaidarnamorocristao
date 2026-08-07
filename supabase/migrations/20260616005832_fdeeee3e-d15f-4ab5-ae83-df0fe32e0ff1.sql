-- RPC: desbloquear escolha de pet adulto pagando moedas (default 250)
CREATE OR REPLACE FUNCTION public.unlock_adult_pet_with_coins(_cost integer DEFAULT 250)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  r public.user_coins;
  new_balance integer;
  already boolean;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'auth');
  END IF;
  IF _cost IS NULL OR _cost <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;

  -- Já desbloqueado? Devolve sucesso sem cobrar.
  SELECT (adult_unlocked_at IS NOT NULL) INTO already
  FROM public.user_pet_unlocks WHERE user_id = uid;
  IF COALESCE(already, false) THEN
    SELECT balance INTO new_balance FROM public.user_coins WHERE user_id = uid;
    RETURN jsonb_build_object('ok', true, 'already_unlocked', true, 'balance', COALESCE(new_balance, 0));
  END IF;

  -- Garante linha de moedas
  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO r FROM public.user_coins WHERE user_id = uid FOR UPDATE;
  IF r.balance < _cost THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_coins', 'balance', r.balance, 'cost', _cost);
  END IF;

  new_balance := r.balance - _cost;
  UPDATE public.user_coins
    SET balance = new_balance, updated_at = now()
    WHERE user_id = uid;

  PERFORM public.log_coin_tx(uid, 'pet_adult_unlock', 'out', _cost, new_balance,
    'Desbloqueio de pet adulto', 'Pet');

  INSERT INTO public.user_pet_unlocks (user_id, adult_unlocked_at)
  VALUES (uid, now())
  ON CONFLICT (user_id) DO UPDATE
    SET adult_unlocked_at = COALESCE(public.user_pet_unlocks.adult_unlocked_at, EXCLUDED.adult_unlocked_at),
        updated_at = now();

  RETURN jsonb_build_object('ok', true, 'already_unlocked', false, 'balance', new_balance, 'cost', _cost);
END;
$$;

GRANT EXECUTE ON FUNCTION public.unlock_adult_pet_with_coins(integer) TO authenticated;