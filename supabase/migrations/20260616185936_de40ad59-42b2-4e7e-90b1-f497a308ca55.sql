CREATE TABLE IF NOT EXISTS public.user_daily_grabs_by_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pool_id uuid NOT NULL REFERENCES public.grab_pools(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date),
  free_used integer NOT NULL DEFAULT 0,
  paid_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pool_id, day)
);

GRANT SELECT, INSERT, UPDATE ON public.user_daily_grabs_by_pool TO authenticated;
GRANT ALL ON public.user_daily_grabs_by_pool TO service_role;

ALTER TABLE public.user_daily_grabs_by_pool ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_daily_grabs_by_pool_own ON public.user_daily_grabs_by_pool;
CREATE POLICY user_daily_grabs_by_pool_own
ON public.user_daily_grabs_by_pool
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS user_daily_grabs_by_pool_touch ON public.user_daily_grabs_by_pool;
CREATE TRIGGER user_daily_grabs_by_pool_touch
BEFORE UPDATE ON public.user_daily_grabs_by_pool
FOR EACH ROW EXECUTE FUNCTION public.tg_grab_touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_user_daily_grabs_by_pool_user_day
ON public.user_daily_grabs_by_pool (user_id, day);

UPDATE public.grab_pools
SET free_daily_uses = CASE
  WHEN rarity IN ('starter', 'common', 'special') THEN COALESCE(free_daily_uses, 1)
  ELSE 0
END
WHERE free_daily_uses IS NULL OR free_daily_uses > CASE WHEN rarity IN ('starter', 'common', 'special') THEN 1 ELSE 0 END;

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
    'cost_coins', LEAST(COALESCE(p.cost_coins, v_cfg.default_paid_cost_coins), 500),
    'free_daily', COALESCE(p.free_daily_uses, 0),
    'free_used', COALESCE((SELECT bp.free_used FROM public.user_daily_grabs_by_pool bp WHERE bp.user_id = uid AND bp.pool_id = p.id AND bp.day = v_today), 0),
    'paid_used', COALESCE((SELECT bp.paid_used FROM public.user_daily_grabs_by_pool bp WHERE bp.user_id = uid AND bp.pool_id = p.id AND bp.day = v_today), 0),
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
    'default_paid_cost', LEAST(v_cfg.default_paid_cost_coins, 500),
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
  v_daily_pool public.user_daily_grabs_by_pool;
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
  v_featured boolean := false;
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

  v_free_daily := COALESCE(v_pool.free_daily_uses, 0);
  v_featured := v_pool.featured_until IS NOT NULL AND v_pool.featured_until > now();
  v_cost := LEAST(COALESCE(v_pool.cost_coins, v_cfg.default_paid_cost_coins), 500);
  IF v_featured AND v_cost > 0 THEN
    v_cost := LEAST(500, GREATEST(0, floor(v_cost * 0.8)::int));
  END IF;

  INSERT INTO public.user_daily_grabs (user_id, day) VALUES (uid, v_today)
    ON CONFLICT (user_id, day) DO NOTHING;
  SELECT * INTO v_daily FROM public.user_daily_grabs WHERE user_id = uid AND day = v_today FOR UPDATE;

  INSERT INTO public.user_daily_grabs_by_pool (user_id, pool_id, day) VALUES (uid, _pool_id, v_today)
    ON CONFLICT (user_id, pool_id, day) DO NOTHING;
  SELECT * INTO v_daily_pool FROM public.user_daily_grabs_by_pool
    WHERE user_id = uid AND pool_id = _pool_id AND day = v_today FOR UPDATE;

  IF v_daily_pool.free_used < v_free_daily THEN
    v_is_free := true;
    UPDATE public.user_daily_grabs_by_pool SET free_used = free_used + 1 WHERE id = v_daily_pool.id;
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
    UPDATE public.user_daily_grabs_by_pool SET paid_used = paid_used + 1 WHERE id = v_daily_pool.id;
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
    'free_remaining', GREATEST(0, v_free_daily - (v_daily_pool.free_used + CASE WHEN v_is_free THEN 1 ELSE 0 END)),
    'cost_paid', CASE WHEN v_is_free THEN 0 ELSE v_cost END
  );
END $function$;

CREATE OR REPLACE FUNCTION public.perform_grab_multi(_pool_id uuid, _count integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  uid uuid := auth.uid();
  v_count integer := LEAST(GREATEST(COALESCE(_count, 1), 1), 10);
  v_i integer;
  v_result jsonb;
  v_results jsonb := '[]'::jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  FOR v_i IN 1..v_count LOOP
    v_result := public.perform_grab(_pool_id);
    v_results := v_results || jsonb_build_array(v_result);
  END LOOP;
  RETURN jsonb_build_object('count', v_count, 'results', v_results);
END $function$;

GRANT EXECUTE ON FUNCTION public.perform_grab_multi(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.rotate_grab_featured_pool()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_pool_id uuid;
BEGIN
  UPDATE public.grab_pools SET featured_until = NULL WHERE featured_until IS NOT NULL;

  SELECT id INTO v_pool_id
  FROM public.grab_pools
  WHERE active = true
    AND rarity IN ('starter','common','rare','epic','special')
    AND EXISTS (SELECT 1 FROM public.grab_pool_prizes pp WHERE pp.pool_id = grab_pools.id AND pp.active)
  ORDER BY random()
  LIMIT 1;

  IF v_pool_id IS NOT NULL THEN
    UPDATE public.grab_pools
    SET featured_until = now() + interval '1 day'
    WHERE id = v_pool_id;
  END IF;
END $function$;

GRANT EXECUTE ON FUNCTION public.rotate_grab_featured_pool() TO service_role;

SELECT public.rotate_grab_featured_pool()
WHERE NOT EXISTS (
  SELECT 1 FROM public.grab_pools WHERE featured_until IS NOT NULL AND featured_until > now()
);

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rotate-grab-featured-pool') THEN
    PERFORM cron.unschedule('rotate-grab-featured-pool');
  END IF;
  PERFORM cron.schedule(
    'rotate-grab-featured-pool',
    '0 3 * * *',
    'SELECT public.rotate_grab_featured_pool();'
  );
END $$;