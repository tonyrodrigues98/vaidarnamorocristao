-- Registrar compras de cuidados do pet no extrato com nome e imagem do item;
-- e corrigir grant_coin_event para usar o logger correto

-- 1) Helper: gastar moedas atribuindo a um item de cuidado (loga título/ícone do item)
CREATE OR REPLACE FUNCTION public.spend_coin_for_pet_care(
  _amount int,
  _item_id uuid,
  _user_pet_id uuid
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  r public.user_coins;
  v_new int;
  v_item public.pet_care_items;
  v_pet_name text;
  v_kind_label text;
  v_action_label text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RETURN NULL; END IF;

  SELECT * INTO v_item FROM public.pet_care_items WHERE id = _item_id;
  IF v_item IS NULL THEN RAISE EXCEPTION 'item not found'; END IF;

  SELECT COALESCE(name, 'seu pet') INTO v_pet_name
  FROM public.user_pets_v2 WHERE id = _user_pet_id;

  v_kind_label := CASE v_item.kind::text
    WHEN 'feed' THEN 'Alimento'
    WHEN 'play' THEN 'Brincadeira'
    WHEN 'hygiene' THEN 'Banho'
    WHEN 'sleep' THEN 'Cama'
    WHEN 'affection' THEN 'Carinho'
    ELSE 'Cuidado'
  END;

  v_action_label := CASE v_item.kind::text
    WHEN 'feed' THEN 'Alimentou'
    WHEN 'play' THEN 'Brincou'
    WHEN 'hygiene' THEN 'Banhou'
    WHEN 'sleep' THEN 'Colocou para dormir'
    WHEN 'affection' THEN 'Fez carinho em'
    ELSE 'Cuidou de'
  END;

  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO r FROM public.user_coins WHERE user_id = uid FOR UPDATE;
  IF r.balance < _amount THEN
    RAISE EXCEPTION 'insufficient_coins' USING ERRCODE='check_violation';
  END IF;
  v_new := r.balance - _amount;
  UPDATE public.user_coins SET balance = v_new, updated_at = now() WHERE user_id = uid;

  PERFORM public.log_coin_tx(
    uid,
    'pet_care_spend',
    'out',
    _amount,
    v_new,
    v_kind_label || ': ' || v_item.name,
    v_action_label || ' ' || v_pet_name || ' com "' || v_item.name || '"',
    _item_id,
    v_item.image_url
  );

  RETURN v_new;
END $$;
GRANT EXECUTE ON FUNCTION public.spend_coin_for_pet_care(int, uuid, uuid) TO authenticated;

-- 2) Reescreve apply_pet_care para usar o novo logger (somente a parte do spend)
CREATE OR REPLACE FUNCTION public.apply_pet_care(_user_pet_id uuid, _item_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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

  IF v_item.cost_coins > 0 THEN
    PERFORM public.spend_coin_for_pet_care(v_item.cost_coins, v_item.id, _user_pet_id);
  END IF;

  UPDATE public.pet_care_state SET value_at_anchor = v_new, anchor_at = now() WHERE id = v_state.id;
  UPDATE public.pet_care_state SET value_at_anchor = v_energy_new, anchor_at = now() WHERE id = v_energy_state.id;
  INSERT INTO public.pet_care_events (user_pet_id, user_id, kind, item_id, delta, cost_coins)
    VALUES (_user_pet_id, uid, v_kind_text, v_item.id, v_new - v_current, v_item.cost_coins);

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
    'random_event', v_event_result
  );
END $$;
GRANT EXECUTE ON FUNCTION public.apply_pet_care(uuid, uuid) TO authenticated;

-- 3) grant_coin_event: usa o logger correto (a versão antiga insere colunas inexistentes)
CREATE OR REPLACE FUNCTION public.grant_coin_event(_user uuid, _amount int, _ref text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_new int;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN RETURN; END IF;
  INSERT INTO public.user_coins (user_id, balance) VALUES (_user, _amount)
  ON CONFLICT (user_id) DO UPDATE SET balance = public.user_coins.balance + EXCLUDED.balance
  RETURNING balance INTO v_new;
  PERFORM public.log_coin_tx(
    _user, 'pet_random_event', 'in', _amount, v_new,
    'Evento do pet', 'Moedas encontradas durante o cuidado', NULL, NULL
  );
END $$;
GRANT EXECUTE ON FUNCTION public.grant_coin_event(uuid, int, text) TO authenticated;