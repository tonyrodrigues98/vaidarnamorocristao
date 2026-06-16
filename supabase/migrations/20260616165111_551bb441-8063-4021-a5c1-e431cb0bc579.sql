
-- =====================================================================
-- CAIXAS V2: rarity, cooldown, pity
-- =====================================================================

-- 1. Add columns to grab_pools
ALTER TABLE public.grab_pools
  ADD COLUMN IF NOT EXISTS rarity text NOT NULL DEFAULT 'common',
  ADD COLUMN IF NOT EXISTS cooldown_hours int NOT NULL DEFAULT 0 CHECK (cooldown_hours >= 0),
  ADD COLUMN IF NOT EXISTS icon_key text,
  ADD COLUMN IF NOT EXISTS featured_until timestamptz,
  ADD COLUMN IF NOT EXISTS pity_threshold int NOT NULL DEFAULT 0 CHECK (pity_threshold >= 0);

DO $$ BEGIN
  ALTER TABLE public.grab_pools
    ADD CONSTRAINT grab_pools_rarity_chk
    CHECK (rarity IN ('starter','common','rare','epic','legendary','special'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Pity table
CREATE TABLE IF NOT EXISTS public.grab_pool_pity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pool_id uuid NOT NULL REFERENCES public.grab_pools(id) ON DELETE CASCADE,
  rolls_since_rare int NOT NULL DEFAULT 0 CHECK (rolls_since_rare >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pool_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grab_pool_pity TO authenticated;
GRANT ALL ON public.grab_pool_pity TO service_role;
ALTER TABLE public.grab_pool_pity ENABLE ROW LEVEL SECURITY;
CREATE POLICY grab_pool_pity_own ON public.grab_pool_pity FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY grab_pool_pity_admin_read ON public.grab_pool_pity FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 3. Cooldowns table
CREATE TABLE IF NOT EXISTS public.grab_pool_cooldowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pool_id uuid NOT NULL REFERENCES public.grab_pools(id) ON DELETE CASCADE,
  available_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pool_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grab_pool_cooldowns TO authenticated;
GRANT ALL ON public.grab_pool_cooldowns TO service_role;
ALTER TABLE public.grab_pool_cooldowns ENABLE ROW LEVEL SECURITY;
CREATE POLICY grab_pool_cooldowns_own ON public.grab_pool_cooldowns FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- updated_at triggers
DROP TRIGGER IF EXISTS grab_pool_pity_touch ON public.grab_pool_pity;
CREATE TRIGGER grab_pool_pity_touch BEFORE UPDATE ON public.grab_pool_pity
  FOR EACH ROW EXECUTE FUNCTION public.tg_grab_touch_updated_at();
DROP TRIGGER IF EXISTS grab_pool_cooldowns_touch ON public.grab_pool_cooldowns;
CREATE TRIGGER grab_pool_cooldowns_touch BEFORE UPDATE ON public.grab_pool_cooldowns
  FOR EACH ROW EXECUTE FUNCTION public.tg_grab_touch_updated_at();

-- 4. Migrate existing pools → Caixa do Iniciante (rarity starter)
UPDATE public.grab_pools
  SET rarity = 'starter',
      icon_key = COALESCE(icon_key, 'sparkles')
  WHERE rarity = 'common'
    AND created_at < now();

-- 5. Seed new pools (safe upsert by slug)
INSERT INTO public.grab_pools (slug, name, description, active, sort_order, cost_coins, free_daily_uses, weight, rarity, cooldown_hours, icon_key, pity_threshold) VALUES
  ('cofre_moedas', 'Cofre de Moedas', 'Só moedas — de pequenas faixas ao jackpot.', true, 10, 50, 0, 1, 'common', 0, 'coins', 0),
  ('capsula_xp', 'Cápsula de XP', 'XP para o seu pet evoluir mais rápido.', true, 11, 60, 0, 1, 'common', 0, 'zap', 0),
  ('bau_cuidado', 'Baú de Cuidado', 'Itens para alimentar, brincar e cuidar.', true, 12, 80, 0, 1, 'common', 0, 'utensils', 0),
  ('caixa_cenarios', 'Caixa de Cenários', 'Cenários exclusivos para o quarto do pet.', true, 20, 250, 0, 1, 'rare', 0, 'image', 8),
  ('caixa_decoracoes', 'Caixa de Decorações', 'Molduras e decorações de perfil.', true, 21, 250, 0, 1, 'rare', 0, 'frame', 8),
  ('caixa_gradientes', 'Caixa de Gradientes', 'Gradientes raros para o seu nome.', true, 22, 800, 0, 1, 'epic', 0, 'palette', 6),
  ('caixa_comum', 'Caixa Comum', 'Mistura ampla de prêmios básicos.', true, 30, 50, 0, 1, 'common', 0, 'box', 10),
  ('caixa_rara', 'Caixa Rara', 'Drops de qualidade média garantida.', true, 31, 300, 0, 1, 'rare', 0, 'box', 8),
  ('caixa_epica', 'Caixa Épica', 'Chance real de itens fortes.', true, 32, 1500, 0, 1, 'epic', 0, 'gem', 5),
  ('caixa_lendaria', 'Caixa Lendária', 'Garantia de épico+, cooldown de 7 dias.', true, 33, 5000, 0, 1, 'legendary', 168, 'crown', 0),
  ('roleta_sorte', 'Roleta da Sorte', 'Loteria com TODOS os prêmios — pesos brutais, jackpot raríssimo.', true, 40, 200, 0, 1, 'special', 0, 'dices', 0)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  cooldown_hours = EXCLUDED.cooldown_hours,
  icon_key = EXCLUDED.icon_key,
  pity_threshold = EXCLUDED.pity_threshold,
  sort_order = EXCLUDED.sort_order;

-- 6. Seed prizes for Cofre de Moedas (5 faixas, pesos decrescentes)
DO $$
DECLARE pid uuid;
BEGIN
  SELECT id INTO pid FROM public.grab_pools WHERE slug = 'cofre_moedas';
  IF pid IS NOT NULL THEN
    DELETE FROM public.grab_pool_prizes WHERE pool_id = pid;
    INSERT INTO public.grab_pool_prizes (pool_id, prize_kind, prize_amount, weight, active, sort_order) VALUES
      (pid, 'coins', 10,   500, true, 0),
      (pid, 'coins', 50,   300, true, 1),
      (pid, 'coins', 200,  150, true, 2),
      (pid, 'coins', 1000,  45, true, 3),
      (pid, 'coins', 5000,   5, true, 4);
  END IF;

  SELECT id INTO pid FROM public.grab_pools WHERE slug = 'capsula_xp';
  IF pid IS NOT NULL THEN
    DELETE FROM public.grab_pool_prizes WHERE pool_id = pid;
    INSERT INTO public.grab_pool_prizes (pool_id, prize_kind, prize_amount, weight, active, sort_order) VALUES
      (pid, 'xp', 50,   500, true, 0),
      (pid, 'xp', 200,  300, true, 1),
      (pid, 'xp', 500,  150, true, 2),
      (pid, 'xp', 1500,  50, true, 3);
  END IF;
END $$;

-- 7. Helper: classify prize rarity inside SQL (matches frontend rarityFromString)
CREATE OR REPLACE FUNCTION public.grab_prize_rarity(_kind public.grab_prize_kind, _ref_id uuid, _amount int)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_r text;
BEGIN
  IF _kind = 'care_item' THEN
    SELECT CASE
      WHEN COALESCE(cost_coins,0) > 20 OR COALESCE(restore_amount,0) >= 80 THEN 'legendary'
      WHEN COALESCE(cost_coins,0) > 10 THEN 'epic'
      WHEN COALESCE(cost_coins,0) > 5  THEN 'rare'
      ELSE 'common' END INTO v_r
    FROM public.pet_care_items WHERE id = _ref_id;
  ELSIF _kind = 'pet_background' THEN
    SELECT lower(COALESCE(rarity,'common')) INTO v_r FROM public.pet_backgrounds WHERE id = _ref_id;
  ELSIF _kind = 'decoration' THEN
    SELECT lower(COALESCE(rarity,'common')) INTO v_r FROM public.avatar_decorations WHERE id = _ref_id;
  ELSIF _kind = 'name_gradient' THEN
    SELECT CASE
      WHEN COALESCE(price,0) >= 3000 THEN 'legendary'
      WHEN COALESCE(price,0) >= 1500 THEN 'epic'
      WHEN COALESCE(price,0) >= 600  THEN 'rare'
      ELSE 'common' END INTO v_r
    FROM public.name_gradients WHERE id = _ref_id;
  ELSIF _kind = 'coins' THEN
    v_r := CASE WHEN _amount >= 1000 THEN 'legendary'
                WHEN _amount >= 200 THEN 'epic'
                WHEN _amount >= 50  THEN 'rare'
                ELSE 'common' END;
  ELSIF _kind = 'xp' THEN
    v_r := CASE WHEN _amount >= 1000 THEN 'legendary'
                WHEN _amount >= 400 THEN 'epic'
                WHEN _amount >= 150 THEN 'rare'
                ELSE 'common' END;
  END IF;
  IF v_r IN ('exclusive','lendaria','lendária') THEN v_r := 'legendary'; END IF;
  IF v_r IN ('epica','épica') THEN v_r := 'epic'; END IF;
  IF v_r = 'rara' THEN v_r := 'rare'; END IF;
  RETURN COALESCE(v_r,'common');
END $$;
GRANT EXECUTE ON FUNCTION public.grab_prize_rarity(public.grab_prize_kind, uuid, int) TO authenticated;

-- 8. Updated get_grab_state with rarity / cooldown / pity
CREATE OR REPLACE FUNCTION public.get_grab_state()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END $$;

-- 9. Updated perform_grab with cooldown + pity
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
  v_chosen_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_cfg FROM public.grab_config WHERE id = 1;
  SELECT * INTO v_pool FROM public.grab_pools WHERE id = _pool_id AND active;
  IF v_pool.id IS NULL THEN RAISE EXCEPTION 'pool_not_found'; END IF;

  -- Cooldown check
  IF v_pool.cooldown_hours > 0 THEN
    SELECT available_at INTO v_cd FROM public.grab_pool_cooldowns
      WHERE user_id = uid AND pool_id = _pool_id;
    IF v_cd IS NOT NULL AND v_cd > now() THEN
      RAISE EXCEPTION 'pool_on_cooldown' USING ERRCODE='check_violation';
    END IF;
  END IF;

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

  -- Pity check: if threshold > 0 and reached, force rare+
  IF v_pool.pity_threshold > 0 THEN
    SELECT rolls_since_rare INTO v_pity FROM public.grab_pool_pity
      WHERE user_id = uid AND pool_id = _pool_id;
    v_pity := COALESCE(v_pity, 0);
    IF v_pity + 1 >= v_pool.pity_threshold THEN
      v_force_rare := true;
    END IF;
  END IF;

  -- Lendária: always guarantee epic+
  IF v_pool.rarity = 'legendary' THEN
    v_force_rare := true;
  END IF;

  -- Pick prize (weighted)
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
      v_force_rare := false; -- no rare+ available, fall back
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

  -- Award prize
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
    PERFORM public.grant_coin_event(uid, v_prize.prize_amount, 'grab:' || _pool_id::text);
  ELSIF v_prize.prize_kind = 'xp' THEN
    PERFORM public.award_xp('grab', v_prize.prize_amount, NULL, jsonb_build_object('pool_id', _pool_id));
  END IF;

  -- Update pity counter
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

  -- Set cooldown
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
