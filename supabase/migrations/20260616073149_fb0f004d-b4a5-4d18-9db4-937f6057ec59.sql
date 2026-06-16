CREATE OR REPLACE FUNCTION public.perform_grab(_pool_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_cfg public.grab_config;
  v_pool public.grab_pools;
  v_free_daily int;
  v_cost int;
  v_daily public.user_daily_grabs;
  v_is_free boolean;
  v_total_weight bigint;
  v_pick numeric;
  v_running bigint := 0;
  v_prize public.grab_pool_prizes;
  v_new_balance int;
  v_coins_row public.user_coins;
  v_box_title text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_cfg FROM public.grab_config WHERE id = 1;
  SELECT * INTO v_pool FROM public.grab_pools WHERE id = _pool_id AND active;
  IF v_pool.id IS NULL THEN RAISE EXCEPTION 'pool_not_found'; END IF;

  v_free_daily := COALESCE(v_pool.free_daily_uses, v_cfg.default_free_daily);
  v_cost := COALESCE(v_pool.cost_coins, v_cfg.default_paid_cost_coins);

  INSERT INTO public.user_daily_grabs (user_id, day) VALUES (uid, v_today)
    ON CONFLICT (user_id, day) DO NOTHING;
  SELECT * INTO v_daily FROM public.user_daily_grabs WHERE user_id = uid AND day = v_today FOR UPDATE;

  IF v_daily.free_used < v_free_daily THEN
    v_is_free := true;
    UPDATE public.user_daily_grabs SET free_used = free_used + 1 WHERE id = v_daily.id;
  ELSE
    v_is_free := false;
    IF v_cost > 0 THEN
      INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100)
        ON CONFLICT (user_id) DO NOTHING;
      SELECT * INTO v_coins_row FROM public.user_coins WHERE user_id = uid FOR UPDATE;
      IF v_coins_row.balance < v_cost THEN
        RAISE EXCEPTION 'insufficient_coins' USING ERRCODE='check_violation';
      END IF;
      UPDATE public.user_coins
        SET balance = v_coins_row.balance - v_cost, updated_at = now()
        WHERE user_id = uid;
      v_box_title := v_pool.name || ' aberta';
      PERFORM public.log_coin_tx(
        uid, 'grab_open', 'out', v_cost, v_coins_row.balance - v_cost,
        v_box_title, NULL, NULL, 'grab:' || v_pool.slug
      );
    END IF;
    UPDATE public.user_daily_grabs SET paid_used = paid_used + 1 WHERE id = v_daily.id;
  END IF;

  SELECT COALESCE(SUM(weight), 0) INTO v_total_weight FROM public.grab_pool_prizes
    WHERE pool_id = _pool_id AND active;
  IF v_total_weight <= 0 THEN RAISE EXCEPTION 'pool_empty'; END IF;
  v_pick := random() * v_total_weight;

  FOR v_prize IN
    SELECT * FROM public.grab_pool_prizes WHERE pool_id = _pool_id AND active ORDER BY id
  LOOP
    v_running := v_running + v_prize.weight;
    IF v_pick < v_running THEN EXIT; END IF;
  END LOOP;

  IF v_prize.prize_kind = 'care_item' THEN
    INSERT INTO public.user_grab_inventory (user_id, prize_kind, prize_ref_id, quantity)
      VALUES (uid, 'care_item', v_prize.prize_ref_id, v_prize.prize_amount)
      ON CONFLICT (user_id, prize_kind, prize_ref_id)
      DO UPDATE SET quantity = public.user_grab_inventory.quantity + EXCLUDED.quantity;
  ELSIF v_prize.prize_kind = 'pet_background' THEN
    INSERT INTO public.user_pet_backgrounds (user_id, background_id)
      VALUES (uid, v_prize.prize_ref_id)
      ON CONFLICT (user_id, background_id) DO NOTHING;
  ELSIF v_prize.prize_kind = 'decoration' THEN
    -- is_free_claim=false: grab prizes are NOT "free claims" (the partial unique
    -- index user_decorations_one_free_claim_per_user limits is_free_claim=true to one per user)
    INSERT INTO public.user_decorations (user_id, decoration_id, is_free_claim)
      VALUES (uid, v_prize.prize_ref_id, false)
      ON CONFLICT (user_id, decoration_id) DO NOTHING;
  ELSIF v_prize.prize_kind = 'name_gradient' THEN
    INSERT INTO public.user_name_gradients (user_id, gradient_id)
      VALUES (uid, v_prize.prize_ref_id)
      ON CONFLICT (user_id, gradient_id) DO NOTHING;
  ELSIF v_prize.prize_kind = 'coins' THEN
    PERFORM public.grant_coin_event(uid, v_prize.prize_amount, 'grab:' || _pool_id::text);
  ELSIF v_prize.prize_kind = 'xp' THEN
    PERFORM public.award_xp('grab', v_prize.prize_amount, NULL, jsonb_build_object('pool_id', _pool_id));
  END IF;

  INSERT INTO public.user_grab_log (user_id, pool_id, prize_kind, prize_ref_id, prize_amount, was_paid)
    VALUES (uid, _pool_id, v_prize.prize_kind, v_prize.prize_ref_id, v_prize.prize_amount, NOT v_is_free);

  SELECT balance INTO v_new_balance FROM public.user_coins WHERE user_id = uid;

  RETURN jsonb_build_object(
    'prize_kind', v_prize.prize_kind,
    'prize_ref_id', v_prize.prize_ref_id,
    'prize_amount', v_prize.prize_amount,
    'was_paid', NOT v_is_free,
    'new_balance', COALESCE(v_new_balance, 0),
    'free_remaining', GREATEST(0, v_free_daily - (v_daily.free_used + CASE WHEN v_is_free THEN 1 ELSE 0 END)),
    'cost_paid', CASE WHEN v_is_free THEN 0 ELSE v_cost END
  );
END;
$$;

-- Backfill: entregar molduras de grab que não foram inseridas por causa do bug
INSERT INTO public.user_decorations (user_id, decoration_id, is_free_claim)
SELECT DISTINCT gl.user_id, gl.prize_ref_id, false
FROM public.user_grab_log gl
WHERE gl.prize_kind = 'decoration'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_decorations ud
    WHERE ud.user_id = gl.user_id AND ud.decoration_id = gl.prize_ref_id
  )
ON CONFLICT (user_id, decoration_id) DO NOTHING;