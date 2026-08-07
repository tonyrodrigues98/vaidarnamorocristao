
-- =====================================================================
-- GRAB SYSTEM
-- =====================================================================

-- Enum de tipo de prêmio
DO $$ BEGIN
  CREATE TYPE public.grab_prize_kind AS ENUM (
    'care_item','pet_background','decoration','name_gradient','coins','xp'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- grab_config (singleton) ----------
CREATE TABLE IF NOT EXISTS public.grab_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_free_daily int NOT NULL DEFAULT 3 CHECK (default_free_daily >= 0),
  default_paid_cost_coins int NOT NULL DEFAULT 10 CHECK (default_paid_cost_coins >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.grab_config TO authenticated;
GRANT ALL ON public.grab_config TO service_role;
ALTER TABLE public.grab_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY grab_config_read ON public.grab_config FOR SELECT TO authenticated USING (true);
CREATE POLICY grab_config_admin_all ON public.grab_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.grab_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ---------- grab_pools ----------
CREATE TABLE IF NOT EXISTS public.grab_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  cost_coins int,               -- override
  free_daily_uses int,          -- override
  weight int NOT NULL DEFAULT 1 CHECK (weight > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.grab_pools TO authenticated;
GRANT ALL ON public.grab_pools TO service_role;
ALTER TABLE public.grab_pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY grab_pools_read_active ON public.grab_pools FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY grab_pools_admin_all ON public.grab_pools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------- grab_pool_prizes ----------
CREATE TABLE IF NOT EXISTS public.grab_pool_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES public.grab_pools(id) ON DELETE CASCADE,
  prize_kind public.grab_prize_kind NOT NULL,
  prize_ref_id uuid,
  prize_amount int NOT NULL DEFAULT 1 CHECK (prize_amount > 0),
  weight int NOT NULL DEFAULT 1 CHECK (weight > 0),
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS grab_pool_prizes_pool_idx ON public.grab_pool_prizes(pool_id) WHERE active;
GRANT SELECT ON public.grab_pool_prizes TO authenticated;
GRANT ALL ON public.grab_pool_prizes TO service_role;
ALTER TABLE public.grab_pool_prizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY grab_pool_prizes_read ON public.grab_pool_prizes FOR SELECT TO authenticated USING (true);
CREATE POLICY grab_pool_prizes_admin_all ON public.grab_pool_prizes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------- user_grab_inventory ----------
CREATE TABLE IF NOT EXISTS public.user_grab_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prize_kind public.grab_prize_kind NOT NULL,
  prize_ref_id uuid NOT NULL,
  quantity int NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, prize_kind, prize_ref_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_grab_inventory TO authenticated;
GRANT ALL ON public.user_grab_inventory TO service_role;
ALTER TABLE public.user_grab_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_grab_inventory_own ON public.user_grab_inventory FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- user_daily_grabs ----------
CREATE TABLE IF NOT EXISTS public.user_daily_grabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL,
  free_used int NOT NULL DEFAULT 0,
  paid_used int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);
GRANT SELECT, INSERT, UPDATE ON public.user_daily_grabs TO authenticated;
GRANT ALL ON public.user_daily_grabs TO service_role;
ALTER TABLE public.user_daily_grabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_daily_grabs_own ON public.user_daily_grabs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- user_grab_log ----------
CREATE TABLE IF NOT EXISTS public.user_grab_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pool_id uuid REFERENCES public.grab_pools(id) ON DELETE SET NULL,
  prize_kind public.grab_prize_kind NOT NULL,
  prize_ref_id uuid,
  prize_amount int NOT NULL DEFAULT 1,
  was_paid boolean NOT NULL DEFAULT false,
  rolled_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_grab_log_user_idx ON public.user_grab_log(user_id, rolled_at DESC);
GRANT SELECT, INSERT ON public.user_grab_log TO authenticated;
GRANT ALL ON public.user_grab_log TO service_role;
ALTER TABLE public.user_grab_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_grab_log_own_read ON public.user_grab_log FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY user_grab_log_admin_read ON public.user_grab_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.tg_grab_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS grab_pools_touch ON public.grab_pools;
CREATE TRIGGER grab_pools_touch BEFORE UPDATE ON public.grab_pools FOR EACH ROW EXECUTE FUNCTION public.tg_grab_touch_updated_at();
DROP TRIGGER IF EXISTS grab_config_touch ON public.grab_config;
CREATE TRIGGER grab_config_touch BEFORE UPDATE ON public.grab_config FOR EACH ROW EXECUTE FUNCTION public.tg_grab_touch_updated_at();
DROP TRIGGER IF EXISTS user_grab_inventory_touch ON public.user_grab_inventory;
CREATE TRIGGER user_grab_inventory_touch BEFORE UPDATE ON public.user_grab_inventory FOR EACH ROW EXECUTE FUNCTION public.tg_grab_touch_updated_at();
DROP TRIGGER IF EXISTS user_daily_grabs_touch ON public.user_daily_grabs;
CREATE TRIGGER user_daily_grabs_touch BEFORE UPDATE ON public.user_daily_grabs FOR EACH ROW EXECUTE FUNCTION public.tg_grab_touch_updated_at();

-- =====================================================================
-- FUNCTIONS
-- =====================================================================

-- Consume 1 unit from inventory; returns true if consumed
CREATE OR REPLACE FUNCTION public.consume_care_inventory(_item_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_row public.user_grab_inventory;
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  SELECT * INTO v_row FROM public.user_grab_inventory
    WHERE user_id = uid AND prize_kind = 'care_item' AND prize_ref_id = _item_id
    FOR UPDATE;
  IF v_row.id IS NULL OR v_row.quantity <= 0 THEN RETURN false; END IF;
  UPDATE public.user_grab_inventory SET quantity = quantity - 1 WHERE id = v_row.id;
  RETURN true;
END $$;

-- get_grab_state: pools + quota + recent prizes
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
    'prize_count', (SELECT count(*) FROM public.grab_pool_prizes pp WHERE pp.pool_id = p.id AND pp.active)
  ) ORDER BY p.sort_order, p.name), '[]'::jsonb)
  INTO v_pools FROM public.grab_pools p WHERE p.active;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'prize_kind', l.prize_kind, 'prize_ref_id', l.prize_ref_id,
    'prize_amount', l.prize_amount, 'was_paid', l.was_paid, 'rolled_at', l.rolled_at
  ) ORDER BY l.rolled_at DESC), '[]'::jsonb)
  INTO v_recent FROM (
    SELECT * FROM public.user_grab_log WHERE user_id = uid ORDER BY rolled_at DESC LIMIT 5
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

-- perform_grab
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
  v_prize_label text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_cfg FROM public.grab_config WHERE id = 1;
  SELECT * INTO v_pool FROM public.grab_pools WHERE id = _pool_id AND active;
  IF v_pool.id IS NULL THEN RAISE EXCEPTION 'pool_not_found'; END IF;

  v_free_daily := COALESCE(v_pool.free_daily_uses, v_cfg.default_free_daily);
  v_cost := COALESCE(v_pool.cost_coins, v_cfg.default_paid_cost_coins);

  -- ensure daily row
  INSERT INTO public.user_daily_grabs (user_id, day) VALUES (uid, v_today)
    ON CONFLICT (user_id, day) DO NOTHING;
  SELECT * INTO v_daily FROM public.user_daily_grabs WHERE user_id = uid AND day = v_today FOR UPDATE;

  IF v_daily.free_used < v_free_daily THEN
    v_is_free := true;
    UPDATE public.user_daily_grabs SET free_used = free_used + 1 WHERE id = v_daily.id;
  ELSE
    v_is_free := false;
    IF v_cost > 0 THEN
      PERFORM public.spend_coin(v_cost);
    END IF;
    UPDATE public.user_daily_grabs SET paid_used = paid_used + 1 WHERE id = v_daily.id;
  END IF;

  -- weighted random pick
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

  -- award
  IF v_prize.prize_kind = 'care_item' THEN
    INSERT INTO public.user_grab_inventory (user_id, prize_kind, prize_ref_id, quantity)
      VALUES (uid, 'care_item', v_prize.prize_ref_id, v_prize.prize_amount)
      ON CONFLICT (user_id, prize_kind, prize_ref_id)
      DO UPDATE SET quantity = public.user_grab_inventory.quantity + EXCLUDED.quantity;
  ELSIF v_prize.prize_kind = 'pet_background' THEN
    INSERT INTO public.user_pet_backgrounds (user_id, background_id)
      VALUES (uid, v_prize.prize_ref_id) ON CONFLICT DO NOTHING;
  ELSIF v_prize.prize_kind = 'decoration' THEN
    INSERT INTO public.user_decorations (user_id, decoration_id, is_free_claim)
      VALUES (uid, v_prize.prize_ref_id, true) ON CONFLICT DO NOTHING;
  ELSIF v_prize.prize_kind = 'name_gradient' THEN
    INSERT INTO public.user_name_gradients (user_id, gradient_id)
      VALUES (uid, v_prize.prize_ref_id) ON CONFLICT DO NOTHING;
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
END $$;

GRANT EXECUTE ON FUNCTION public.consume_care_inventory(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_grab_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.perform_grab(uuid) TO authenticated;

-- =====================================================================
-- ALTER apply_pet_care: consume inventory before coin charge
-- =====================================================================
CREATE OR REPLACE FUNCTION public.apply_pet_care(_user_pet_id uuid, _item_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  uid uuid := auth.uid();
  v_pet record;
  v_item public.pet_care_items;
  v_kind_text text;
  v_state public.pet_care_state;
  v_cfg public.pet_care_config;
  v_decay numeric;
  v_minutes numeric;
  v_current int;
  v_new int;
  v_compat int;
  v_uses_today int;
  v_energy_state public.pet_care_state;
  v_energy_current int;
  v_energy_new int;
  v_sleep_restore int;
  v_energy_restore int;
  v_today_start_utc timestamptz;
  v_mods jsonb;
  v_rule jsonb;
  v_restore_mult numeric := 1.0;
  v_energy_mult numeric := 1.0;
  v_cap_max int := 100;
  v_buff_mult numeric := 1.0;
  v_applied_notes text[] := ARRAY[]::text[];
  v_restore_int int;
  v_energy_cost_int int;
  v_evt record;
  v_event_result jsonb := NULL;
  v_event_chance numeric;
  v_event_count int;
  v_buff_kind text;
  v_buff_dur int;
  v_buff_mult_payload numeric;
  v_coin_min int;
  v_coin_max int;
  v_coin_amount int;
  v_used_stock boolean := false;
  v_charged_coins int := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id, user_id, category_id, species_id, personality_id INTO v_pet FROM public.user_pets_v2 WHERE id = _user_pet_id;
  IF v_pet IS NULL OR v_pet.user_id <> uid THEN RAISE EXCEPTION 'pet not found'; END IF;
  SELECT * INTO v_item FROM public.pet_care_items WHERE id = _item_id AND active;
  IF v_item IS NULL THEN RAISE EXCEPTION 'item not found'; END IF;
  SELECT count(*) INTO v_compat FROM public.pet_care_item_compat c
    WHERE c.item_id = v_item.id AND c.category_id = v_pet.category_id
      AND (c.species_id IS NULL OR c.species_id = v_pet.species_id);
  IF v_compat = 0 THEN RAISE EXCEPTION 'item incompativel com este pet'; END IF;
  v_kind_text := v_item.kind::text;
  SELECT * INTO v_cfg FROM public.pet_care_config WHERE id = 1;
  IF v_cfg IS NULL THEN v_cfg.decay_per_hour := 2; v_cfg.energy_regen_minutes_per_point := 6; END IF;

  IF v_item.daily_uses > 0 THEN
    v_today_start_utc := (date_trunc('day', (now() AT TIME ZONE 'America/Sao_Paulo')) AT TIME ZONE 'America/Sao_Paulo');
    SELECT count(*) INTO v_uses_today FROM public.pet_care_events
      WHERE user_pet_id = _user_pet_id AND item_id = v_item.id AND created_at >= v_today_start_utc;
    IF v_uses_today >= v_item.daily_uses THEN RAISE EXCEPTION 'limite_diario_atingido'; END IF;
  END IF;

  INSERT INTO public.pet_care_state (user_pet_id, kind, value_at_anchor, anchor_at)
    VALUES (_user_pet_id, v_kind_text, 80, now())
    ON CONFLICT (user_pet_id, kind) DO NOTHING;
  SELECT * INTO v_state FROM public.pet_care_state WHERE user_pet_id = _user_pet_id AND kind = v_kind_text FOR UPDATE;
  v_minutes := EXTRACT(EPOCH FROM (now() - v_state.anchor_at)) / 60.0;
  v_decay := (v_cfg.decay_per_hour::numeric) * (v_minutes / 60.0);
  v_current := GREATEST(0, LEAST(100, FLOOR(v_state.value_at_anchor - v_decay)::int));

  INSERT INTO public.pet_care_state (user_pet_id, kind, value_at_anchor, anchor_at)
    VALUES (_user_pet_id, 'energy', 100, now())
    ON CONFLICT (user_pet_id, kind) DO NOTHING;
  SELECT * INTO v_energy_state FROM public.pet_care_state WHERE user_pet_id = _user_pet_id AND kind = 'energy' FOR UPDATE;
  v_minutes := EXTRACT(EPOCH FROM (now() - v_energy_state.anchor_at)) / 60.0;
  v_energy_current := GREATEST(0, LEAST(100, v_energy_state.value_at_anchor + FLOOR(v_minutes / GREATEST(1, v_cfg.energy_regen_minutes_per_point))::int));

  v_mods := public.pet_runtime_modifiers(_user_pet_id);
  FOR v_rule IN SELECT * FROM jsonb_array_elements(v_mods->'rules') LOOP
    IF (v_rule->>'kind') IN (v_kind_text, 'all') THEN
      v_restore_mult := v_restore_mult * COALESCE((v_rule->>'restore_mult')::numeric, 1.0);
      v_energy_mult  := v_energy_mult  * COALESCE((v_rule->>'energy_cost_mult')::numeric, 1.0);
      IF (v_rule->>'cap_max') IS NOT NULL AND (v_rule->>'cap_max') <> 'null' THEN
        v_cap_max := LEAST(v_cap_max, (v_rule->>'cap_max')::int);
      END IF;
      IF v_rule->>'note' IS NOT NULL THEN
        v_applied_notes := array_append(v_applied_notes, v_rule->>'note');
      END IF;
    END IF;
  END LOOP;
  FOR v_rule IN SELECT * FROM jsonb_array_elements(v_mods->'buffs') LOOP
    IF (v_rule->>'kind') IN (v_kind_text, 'all') THEN
      v_buff_mult := v_buff_mult * COALESCE((v_rule->>'restore_mult')::numeric, 1.0);
      IF v_rule->>'label' IS NOT NULL THEN
        v_applied_notes := array_append(v_applied_notes, v_rule->>'label');
      END IF;
    END IF;
  END LOOP;

  v_restore_int := GREATEST(0, ROUND(v_item.restore_amount * v_restore_mult * v_buff_mult)::int);
  v_energy_cost_int := GREATEST(0, ROUND(v_item.energy_cost * v_energy_mult)::int);

  IF v_kind_text = 'sleep' THEN
    IF v_item.sleep_hours > 0 THEN
      v_sleep_restore  := ROUND(v_item.sleep_hours * 12.5 * v_restore_mult * v_buff_mult)::int;
      v_energy_restore := ROUND(v_item.sleep_hours * 12.5 * v_restore_mult)::int;
    ELSE
      v_sleep_restore := v_restore_int; v_energy_restore := v_restore_int;
    END IF;
    v_new := LEAST(v_cap_max, v_current + v_sleep_restore);
    v_energy_new := LEAST(100, v_energy_current + v_energy_restore);
  ELSE
    IF v_energy_cost_int > 0 AND v_energy_current < v_energy_cost_int THEN
      RAISE EXCEPTION 'energia_insuficiente';
    END IF;
    v_new := LEAST(v_cap_max, v_current + v_restore_int);
    v_energy_new := GREATEST(0, v_energy_current - v_energy_cost_int);
  END IF;

  -- NEW: consume inventory before charging coins
  IF v_item.cost_coins > 0 THEN
    v_used_stock := public.consume_care_inventory(v_item.id);
    IF NOT v_used_stock THEN
      PERFORM public.spend_coin_for_pet_care(v_item.cost_coins, v_item.id, _user_pet_id);
      v_charged_coins := v_item.cost_coins;
    END IF;
  END IF;

  UPDATE public.pet_care_state SET value_at_anchor = v_new, anchor_at = now() WHERE id = v_state.id;
  UPDATE public.pet_care_state SET value_at_anchor = v_energy_new, anchor_at = now() WHERE id = v_energy_state.id;
  INSERT INTO public.pet_care_events (user_pet_id, user_id, kind, item_id, delta, cost_coins)
    VALUES (_user_pet_id, uid, v_kind_text, v_item.id, v_new - v_current, v_charged_coins);

  -- Eventos aleatórios
  FOR v_evt IN
    SELECT * FROM public.pet_random_events
     WHERE active AND (
       (scope = 'item' AND item_id = v_item.id)
       OR (scope = 'kind' AND (kind = v_kind_text OR kind = 'all'))
     )
     ORDER BY sort_order
  LOOP
    IF v_evt.daily_cap > 0 THEN
      v_today_start_utc := (date_trunc('day', (now() AT TIME ZONE 'America/Sao_Paulo')) AT TIME ZONE 'America/Sao_Paulo');
      SELECT count(*) INTO v_event_count FROM public.user_pet_random_event_log
        WHERE user_pet_id = _user_pet_id AND event_id = v_evt.id AND created_at >= v_today_start_utc;
      IF v_event_count >= v_evt.daily_cap THEN CONTINUE; END IF;
    END IF;
    v_event_chance := v_evt.base_chance;
    IF v_evt.personality_id IS NOT NULL AND v_evt.personality_id = v_pet.personality_id THEN
      v_event_chance := LEAST(1.0, v_event_chance * v_evt.personality_chance_mult);
    END IF;
    IF random() > v_event_chance THEN CONTINUE; END IF;
    IF v_evt.payload->>'type' = 'coins' THEN
      v_coin_min := COALESCE((v_evt.payload->>'min')::int, 1);
      v_coin_max := COALESCE((v_evt.payload->>'max')::int, v_coin_min);
      v_coin_amount := v_coin_min + floor(random() * (v_coin_max - v_coin_min + 1))::int;
      PERFORM public.grant_coin_event(uid, v_coin_amount, v_evt.id::text);
      v_event_result := jsonb_build_object('type','coins','amount',v_coin_amount,
        'label', COALESCE(v_evt.payload->>'label', 'Moedas encontradas!'));
    ELSIF v_evt.payload->>'type' = 'buff' THEN
      v_buff_kind := COALESCE(v_evt.payload->>'kind', v_kind_text);
      v_buff_dur := COALESCE((v_evt.payload->>'duration_min')::int, 30);
      v_buff_mult_payload := COALESCE((v_evt.payload->>'mult')::numeric, 1.15);
      INSERT INTO public.user_pet_buffs (user_pet_id, user_id, kind, restore_mult, source, label, expires_at)
        VALUES (_user_pet_id, uid, v_buff_kind, v_buff_mult_payload, 'random',
                COALESCE(v_evt.payload->>'label','Buff temporário'),
                now() + make_interval(mins => v_buff_dur));
      v_event_result := jsonb_build_object('type','buff','kind',v_buff_kind,'mult',v_buff_mult_payload,
        'duration_min',v_buff_dur,'label', COALESCE(v_evt.payload->>'label', 'Buff temporário!'));
    END IF;
    INSERT INTO public.user_pet_random_event_log (user_pet_id, user_id, event_id, payload)
      VALUES (_user_pet_id, uid, v_evt.id, v_event_result);
    EXIT;
  END LOOP;

  RETURN jsonb_build_object(
    'new_value', v_new,
    'restore', v_new - v_current,
    'energy', v_energy_new,
    'energy_delta', v_energy_new - v_energy_current,
    'multiplier', round(v_restore_mult * v_buff_mult, 2),
    'notes', to_jsonb(v_applied_notes),
    'random_event', v_event_result,
    'used_stock', v_used_stock
  );
END $function$;

-- Seed: default pool
INSERT INTO public.grab_pools (slug, name, description, active, sort_order)
VALUES ('comum', 'Caixa Comum', 'Sorteio diário com prêmios variados', true, 1)
ON CONFLICT (slug) DO NOTHING;
