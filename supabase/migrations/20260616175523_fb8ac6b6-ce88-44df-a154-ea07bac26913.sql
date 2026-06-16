
-- Tiered pity: each pool guarantees a tier (not just "rare+")
ALTER TABLE public.grab_pools
  ADD COLUMN IF NOT EXISTS pity_tier text NOT NULL DEFAULT 'rare'
    CHECK (pity_tier IN ('rare','epic','legendary'));

UPDATE public.grab_pools SET pity_tier = CASE
  WHEN rarity = 'epic' THEN 'legendary'
  WHEN rarity IN ('rare','special') THEN 'epic'
  ELSE 'rare'
END;

CREATE OR REPLACE FUNCTION public.grab_rarity_rank(_r text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(COALESCE(_r,'common'))
    WHEN 'legendary' THEN 4
    WHEN 'epic' THEN 3
    WHEN 'rare' THEN 2
    ELSE 1 END
$$;

CREATE OR REPLACE FUNCTION public.get_grab_state()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_cfg public.grab_config;
  v_daily public.user_daily_grabs;
  v_pools jsonb;
  v_recent jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_cfg FROM public.grab_config WHERE id = 1;
  SELECT * INTO v_daily FROM public.user_daily_grabs WHERE user_id = uid AND day = v_today;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'name', p.name, 'description', p.description,
    'sort_order', p.sort_order,
    'cost_coins', COALESCE(p.cost_coins, v_cfg.default_paid_cost_coins),
    'free_daily', COALESCE(p.free_daily_uses, v_cfg.default_free_daily),
    'rarity', p.rarity,
    'cooldown_hours', p.cooldown_hours,
    'icon_key', p.icon_key,
    'featured_until', p.featured_until,
    'pity_threshold', p.pity_threshold,
    'pity_tier', p.pity_tier,
    'pity_eligible', EXISTS (
      SELECT 1 FROM public.grab_pool_prizes pp
      WHERE pp.pool_id = p.id AND pp.active
        AND public.grab_rarity_rank(public.grab_prize_rarity(pp.prize_kind, pp.prize_ref_id, pp.prize_amount))
            >= public.grab_rarity_rank(p.pity_tier)
    ) AND EXISTS (
      SELECT 1 FROM public.grab_pool_prizes pp
      WHERE pp.pool_id = p.id AND pp.active
        AND public.grab_rarity_rank(public.grab_prize_rarity(pp.prize_kind, pp.prize_ref_id, pp.prize_amount))
            < public.grab_rarity_rank(p.pity_tier)
    ),
    'pity_count', COALESCE((SELECT rolls_since_rare FROM public.grab_pool_pity WHERE user_id = uid AND pool_id = p.id), 0),
    'cooldown_seconds', GREATEST(0, COALESCE(EXTRACT(EPOCH FROM (
        (SELECT available_at FROM public.grab_pool_cooldowns WHERE user_id = uid AND pool_id = p.id) - now()
      ))::int, 0)),
    'prize_count', (SELECT count(*) FROM public.grab_pool_prizes pp WHERE pp.pool_id = p.id AND pp.active)
  ) ORDER BY p.sort_order, p.name), '[]'::jsonb)
  INTO v_pools FROM public.grab_pools p WHERE p.active;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'prize_kind', l.prize_kind, 'prize_ref_id', l.prize_ref_id,
    'prize_amount', l.prize_amount, 'was_paid', l.was_paid, 'rolled_at', l.rolled_at
  ) ORDER BY l.rolled_at DESC), '[]'::jsonb)
  INTO v_recent FROM (
    SELECT * FROM public.user_grab_log WHERE user_id = uid ORDER BY rolled_at DESC LIMIT 10
  ) l;

  RETURN jsonb_build_object(
    'pools', v_pools,
    'free_used', COALESCE(v_daily.free_used, 0),
    'paid_used', COALESCE(v_daily.paid_used, 0),
    'default_free_daily', v_cfg.default_free_daily,
    'default_paid_cost', v_cfg.default_paid_cost_coins,
    'recent', v_recent
  );
END $function$;

CREATE OR REPLACE FUNCTION public.perform_grab(_pool_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
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
  v_cd timestamptz;
  v_pity int := 0;
  v_force_rare boolean := false;
  v_prize_rarity text;
  v_award_amount int;
  v_tier_rank int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_cfg FROM public.grab_config WHERE id = 1;
  SELECT * INTO v_pool FROM public.grab_pools WHERE id = _pool_id AND active;
  IF v_pool.id IS NULL THEN RAISE EXCEPTION 'pool_not_found'; END IF;

  IF v_pool.cooldown_hours > 0 THEN
    SELECT available_at INTO v_cd FROM public.grab_pool_cooldowns
      WHERE user_id = uid AND pool_id = _pool_id;
    IF v_cd IS NOT NULL AND v_cd > now() THEN
      RAISE EXCEPTION 'pool_on_cooldown' USING ERRCODE='check_violation';
    END IF;
  END IF;

  v_free_daily := COALESCE(v_pool.free_daily_uses, v_cfg.default_free_daily);
  v_cost := LEAST(COALESCE(v_pool.cost_coins, v_cfg.default_paid_cost_coins), 500);

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

  v_tier_rank := public.grab_rarity_rank(v_pool.pity_tier);

  IF v_pool.pity_threshold > 0 THEN
    SELECT rolls_since_rare INTO v_pity FROM public.grab_pool_pity
      WHERE user_id = uid AND pool_id = _pool_id;
    v_pity := COALESCE(v_pity, 0);
    IF v_pity + 1 >= v_pool.pity_threshold THEN
      v_force_rare := true;
    END IF;
  END IF;

  IF v_pool.rarity = 'legendary' THEN
    v_force_rare := true;
  END IF;

  IF v_force_rare THEN
    SELECT COALESCE(SUM(weight), 0) INTO v_total_weight
      FROM public.grab_pool_prizes pp
      WHERE pp.pool_id = _pool_id AND pp.active
        AND public.grab_rarity_rank(public.grab_prize_rarity(pp.prize_kind, pp.prize_ref_id, pp.prize_amount)) >= v_tier_rank;
    IF v_total_weight > 0 THEN
      v_pick := random() * v_total_weight;
      FOR v_prize IN
        SELECT * FROM public.grab_pool_prizes
          WHERE pool_id = _pool_id AND active
            AND public.grab_rarity_rank(public.grab_prize_rarity(prize_kind, prize_ref_id, prize_amount)) >= v_tier_rank
          ORDER BY id
      LOOP
        v_running := v_running + v_prize.weight;
        IF v_pick < v_running THEN EXIT; END IF;
      END LOOP;
    ELSE
      v_force_rare := false;
    END IF;
  END IF;

  IF NOT v_force_rare THEN
    SELECT COALESCE(SUM(weight), 0) INTO v_total_weight FROM public.grab_pool_prizes
      WHERE pool_id = _pool_id AND active;
    IF v_total_weight <= 0 THEN RAISE EXCEPTION 'pool_empty'; END IF;
    v_pick := random() * v_total_weight;
    v_running := 0;
    FOR v_prize IN
      SELECT * FROM public.grab_pool_prizes WHERE pool_id = _pool_id AND active ORDER BY id
    LOOP
      v_running := v_running + v_prize.weight;
      IF v_pick < v_running THEN EXIT; END IF;
    END LOOP;
  END IF;

  IF v_prize.prize_kind = 'care_item' THEN
    INSERT INTO public.user_grab_inventory (user_id, prize_kind, prize_ref_id, quantity)
      VALUES (uid, 'care_item', v_prize.prize_ref_id, v_prize.prize_amount)
      ON CONFLICT (user_id, prize_kind, prize_ref_id)
      DO UPDATE SET quantity = public.user_grab_inventory.quantity + EXCLUDED.quantity;
  ELSIF v_prize.prize_kind = 'pet_background' THEN
    INSERT INTO public.user_pet_backgrounds (user_id, background_id)
      VALUES (uid, v_prize.prize_ref_id) ON CONFLICT (user_id, background_id) DO NOTHING;
  ELSIF v_prize.prize_kind = 'decoration' THEN
    INSERT INTO public.user_decorations (user_id, decoration_id, is_free_claim)
      VALUES (uid, v_prize.prize_ref_id, false) ON CONFLICT (user_id, decoration_id) DO NOTHING;
  ELSIF v_prize.prize_kind = 'name_gradient' THEN
    INSERT INTO public.user_name_gradients (user_id, gradient_id)
      VALUES (uid, v_prize.prize_ref_id) ON CONFLICT (user_id, gradient_id) DO NOTHING;
  ELSIF v_prize.prize_kind = 'coins' THEN
    v_award_amount := LEAST(GREATEST(COALESCE(v_prize.prize_amount, 0), 0), 500);
    INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 0)
      ON CONFLICT (user_id) DO NOTHING;
    SELECT * INTO v_coins_row FROM public.user_coins WHERE user_id = uid FOR UPDATE;
    v_new_balance := LEAST(500, v_coins_row.balance + v_award_amount);
    UPDATE public.user_coins SET balance = v_new_balance, updated_at = now() WHERE user_id = uid;
    IF v_new_balance > v_coins_row.balance THEN
      PERFORM public.log_coin_tx(
        uid, 'grab_prize', 'in', v_new_balance - v_coins_row.balance, v_new_balance,
        'Prêmio da caixa', v_pool.name, NULL, 'grab:' || v_pool.slug
      );
    END IF;
  ELSIF v_prize.prize_kind = 'xp' THEN
    PERFORM public.award_xp('grab', v_prize.prize_amount, NULL, jsonb_build_object('pool_id', _pool_id));
  END IF;

  IF v_pool.pity_threshold > 0 THEN
    v_prize_rarity := public.grab_prize_rarity(v_prize.prize_kind, v_prize.prize_ref_id, v_prize.prize_amount);
    INSERT INTO public.grab_pool_pity (user_id, pool_id, rolls_since_rare)
      VALUES (uid, _pool_id, 0)
      ON CONFLICT (user_id, pool_id) DO NOTHING;
    IF public.grab_rarity_rank(v_prize_rarity) >= v_tier_rank THEN
      UPDATE public.grab_pool_pity SET rolls_since_rare = 0
        WHERE user_id = uid AND pool_id = _pool_id;
    ELSE
      UPDATE public.grab_pool_pity SET rolls_since_rare = rolls_since_rare + 1
        WHERE user_id = uid AND pool_id = _pool_id;
    END IF;
  END IF;

  IF v_pool.cooldown_hours > 0 THEN
    INSERT INTO public.grab_pool_cooldowns (user_id, pool_id, available_at)
      VALUES (uid, _pool_id, now() + (v_pool.cooldown_hours || ' hours')::interval)
      ON CONFLICT (user_id, pool_id)
      DO UPDATE SET available_at = EXCLUDED.available_at;
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
END $function$;
