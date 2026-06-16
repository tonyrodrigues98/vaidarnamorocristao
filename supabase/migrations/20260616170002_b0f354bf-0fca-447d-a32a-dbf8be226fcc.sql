-- Correct grab economy to respect the 500-coin wallet cap and real item prices.

UPDATE public.grab_pools
SET cost_coins = CASE slug
  WHEN 'cofre_moedas' THEN 15
  WHEN 'capsula_xp' THEN 15
  WHEN 'bau_cuidado' THEN 12
  WHEN 'caixa_cenarios' THEN 30
  WHEN 'caixa_decoracoes' THEN 45
  WHEN 'caixa_gradientes' THEN 25
  WHEN 'caixa_comum' THEN 15
  WHEN 'caixa_rara' THEN 35
  WHEN 'caixa_epica' THEN 55
  WHEN 'caixa_lendaria' THEN 80
  WHEN 'roleta_sorte' THEN 20
  ELSE LEAST(COALESCE(cost_coins, 0), 500)
END,
pity_threshold = CASE slug
  WHEN 'caixa_cenarios' THEN 6
  WHEN 'caixa_decoracoes' THEN 5
  WHEN 'caixa_gradientes' THEN 5
  WHEN 'caixa_comum' THEN 8
  WHEN 'caixa_rara' THEN 6
  WHEN 'caixa_epica' THEN 4
  ELSE pity_threshold
END,
description = CASE slug
  WHEN 'cofre_moedas' THEN 'Só moedas — aposta barata com retorno médio baixo e jackpot raro.'
  WHEN 'capsula_xp' THEN 'XP para o seu pet evoluir mais rápido, com custo baixo.'
  WHEN 'bau_cuidado' THEN 'Itens de cuidado baratos, pensado para girar sem quebrar o saldo.'
  WHEN 'caixa_cenarios' THEN 'Cenários para o quarto do pet, com preço provisório baixo até o catálogo crescer.'
  WHEN 'caixa_decoracoes' THEN 'Molduras e decorações de perfil na faixa real de 15 a 80 moedas.'
  WHEN 'caixa_gradientes' THEN 'Gradientes para o nome, alinhado ao preço atual de 20 moedas.'
  WHEN 'caixa_epica' THEN 'Chance real de itens fortes sem passar da média alta dos itens atuais.'
  WHEN 'caixa_lendaria' THEN 'Garantia de épico+, limitada pelo teto real da economia.'
  WHEN 'roleta_sorte' THEN 'Loteria com TODOS os prêmios — barata de girar, brutalmente difícil de acertar algo grande.'
  ELSE description
END,
updated_at = now()
WHERE slug IN (
  'cofre_moedas','capsula_xp','bau_cuidado','caixa_cenarios','caixa_decoracoes',
  'caixa_gradientes','caixa_comum','caixa_rara','caixa_epica','caixa_lendaria','roleta_sorte'
);

DO $$
DECLARE pid uuid;
BEGIN
  SELECT id INTO pid FROM public.grab_pools WHERE slug = 'cofre_moedas';
  IF pid IS NOT NULL THEN
    DELETE FROM public.grab_pool_prizes WHERE pool_id = pid;
    INSERT INTO public.grab_pool_prizes (pool_id, prize_kind, prize_amount, weight, active, sort_order) VALUES
      (pid, 'coins', 1,   600, true, 0),
      (pid, 'coins', 5,   280, true, 1),
      (pid, 'coins', 15,   95, true, 2),
      (pid, 'coins', 40,   22, true, 3),
      (pid, 'coins', 100,   3, true, 4);
  END IF;

  SELECT id INTO pid FROM public.grab_pools WHERE slug = 'capsula_xp';
  IF pid IS NOT NULL THEN
    DELETE FROM public.grab_pool_prizes WHERE pool_id = pid;
    INSERT INTO public.grab_pool_prizes (pool_id, prize_kind, prize_amount, weight, active, sort_order) VALUES
      (pid, 'xp', 25,  560, true, 0),
      (pid, 'xp', 75,  300, true, 1),
      (pid, 'xp', 150, 110, true, 2),
      (pid, 'xp', 300,  30, true, 3);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.grab_prize_rarity(_kind public.grab_prize_kind, _ref_id uuid, _amount int)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_r text;
BEGIN
  IF _kind = 'care_item' THEN
    SELECT CASE
      WHEN COALESCE(cost_coins,0) >= 25 OR COALESCE(restore_amount,0) >= 80 THEN 'legendary'
      WHEN COALESCE(cost_coins,0) >= 15 THEN 'epic'
      WHEN COALESCE(cost_coins,0) >= 8  THEN 'rare'
      ELSE 'common' END INTO v_r
    FROM public.pet_care_items WHERE id = _ref_id;
  ELSIF _kind = 'pet_background' THEN
    SELECT lower(COALESCE(rarity,'common')) INTO v_r FROM public.pet_backgrounds WHERE id = _ref_id;
  ELSIF _kind = 'decoration' THEN
    SELECT lower(COALESCE(rarity,'common')) INTO v_r FROM public.avatar_decorations WHERE id = _ref_id;
  ELSIF _kind = 'name_gradient' THEN
    SELECT CASE
      WHEN COALESCE(price,0) >= 80 THEN 'legendary'
      WHEN COALESCE(price,0) >= 50 THEN 'epic'
      WHEN COALESCE(price,0) >= 30 THEN 'rare'
      ELSE 'common' END INTO v_r
    FROM public.name_gradients WHERE id = _ref_id;
  ELSIF _kind = 'coins' THEN
    v_r := CASE WHEN _amount >= 100 THEN 'legendary'
                WHEN _amount >= 50 THEN 'epic'
                WHEN _amount >= 15 THEN 'rare'
                ELSE 'common' END;
  ELSIF _kind = 'xp' THEN
    v_r := CASE WHEN _amount >= 300 THEN 'legendary'
                WHEN _amount >= 150 THEN 'epic'
                WHEN _amount >= 75 THEN 'rare'
                ELSE 'common' END;
  END IF;
  IF v_r IN ('exclusive','lendaria','lendária') THEN v_r := 'legendary'; END IF;
  IF v_r IN ('epica','épica') THEN v_r := 'epic'; END IF;
  IF v_r IN ('rara') THEN v_r := 'rare'; END IF;
  RETURN COALESCE(v_r, 'common');
END $$;

CREATE OR REPLACE FUNCTION public.perform_grab(_pool_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
        AND public.grab_prize_rarity(pp.prize_kind, pp.prize_ref_id, pp.prize_amount) IN ('rare','epic','legendary');
    IF v_total_weight > 0 THEN
      v_pick := random() * v_total_weight;
      FOR v_prize IN
        SELECT * FROM public.grab_pool_prizes
          WHERE pool_id = _pool_id AND active
            AND public.grab_prize_rarity(prize_kind, prize_ref_id, prize_amount) IN ('rare','epic','legendary')
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
    IF v_prize_rarity IN ('rare','epic','legendary') THEN
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
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'grab_pools_cost_respects_wallet_cap'
      AND conrelid = 'public.grab_pools'::regclass
  ) THEN
    ALTER TABLE public.grab_pools
      ADD CONSTRAINT grab_pools_cost_respects_wallet_cap
      CHECK (cost_coins IS NULL OR (cost_coins >= 0 AND cost_coins <= 500));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'grab_coin_prizes_respect_wallet_cap'
      AND conrelid = 'public.grab_pool_prizes'::regclass
  ) THEN
    ALTER TABLE public.grab_pool_prizes
      ADD CONSTRAINT grab_coin_prizes_respect_wallet_cap
      CHECK (prize_kind <> 'coins' OR (prize_amount >= 0 AND prize_amount <= 500));
  END IF;
END $$;