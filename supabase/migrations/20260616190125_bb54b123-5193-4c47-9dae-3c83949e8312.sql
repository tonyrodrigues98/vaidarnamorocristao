CREATE OR REPLACE FUNCTION public.get_grab_state()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_cfg public.grab_config;
  v_daily public.user_daily_grabs;
  v_pools jsonb;
  v_recent jsonb;
  v_coin_balance int := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_cfg FROM public.grab_config WHERE id = 1;
  SELECT * INTO v_daily FROM public.user_daily_grabs WHERE user_id = uid AND day = v_today;
  SELECT LEAST(COALESCE(balance, 0), 500) INTO v_coin_balance FROM public.user_coins WHERE user_id = uid;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'name', p.name, 'description', p.description,
    'sort_order', p.sort_order,
    'cost_coins', CASE
      WHEN p.featured_until IS NOT NULL AND p.featured_until > now()
        THEN LEAST(500, GREATEST(0, floor(LEAST(COALESCE(p.cost_coins, v_cfg.default_paid_cost_coins), 500) * 0.8)::int))
      ELSE LEAST(COALESCE(p.cost_coins, v_cfg.default_paid_cost_coins), 500)
    END,
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
    'coin_balance', COALESCE(v_coin_balance, 0),
    'default_free_daily', v_cfg.default_free_daily,
    'default_paid_cost', LEAST(v_cfg.default_paid_cost_coins, 500),
    'recent', v_recent
  );
END $function$;

REVOKE EXECUTE ON FUNCTION public.get_grab_state() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_grab_state() TO authenticated;