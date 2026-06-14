
-- Drop função antiga para permitir mudança do tipo de retorno
DROP FUNCTION IF EXISTS public.apply_pet_care(uuid, uuid);

-- 1) pet_personality_effects
CREATE TABLE IF NOT EXISTS public.pet_personality_effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personality_id uuid NOT NULL REFERENCES public.pet_personalities(id) ON DELETE CASCADE,
  kind text NOT NULL,
  restore_mult numeric(4,2) NOT NULL DEFAULT 1.00,
  energy_cost_mult numeric(4,2) NOT NULL DEFAULT 1.00,
  decay_mult numeric(4,2) NOT NULL DEFAULT 1.00,
  cap_max int,
  daypart text NOT NULL DEFAULT 'any',
  condition_kind text,
  condition_op text,
  condition_value int,
  note text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pet_personality_effects_kind_chk CHECK (kind IN ('feed','play','hygiene','sleep','affection','energy','all')),
  CONSTRAINT pet_personality_effects_daypart_chk CHECK (daypart IN ('any','day','night')),
  CONSTRAINT pet_personality_effects_op_chk CHECK (condition_op IS NULL OR condition_op IN ('gt','lt','gte','lte'))
);
CREATE INDEX IF NOT EXISTS pet_personality_effects_personality_idx
  ON public.pet_personality_effects (personality_id, active);
GRANT SELECT ON public.pet_personality_effects TO anon, authenticated;
GRANT ALL ON public.pet_personality_effects TO service_role;
ALTER TABLE public.pet_personality_effects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "personality_effects_public_read" ON public.pet_personality_effects;
DROP POLICY IF EXISTS "personality_effects_admin_write" ON public.pet_personality_effects;
CREATE POLICY "personality_effects_public_read"
  ON public.pet_personality_effects FOR SELECT USING (true);
CREATE POLICY "personality_effects_admin_write"
  ON public.pet_personality_effects FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) pet_random_events
CREATE TABLE IF NOT EXISTS public.pet_random_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  kind text,
  item_id uuid REFERENCES public.pet_care_items(id) ON DELETE CASCADE,
  personality_id uuid REFERENCES public.pet_personalities(id) ON DELETE CASCADE,
  personality_chance_mult numeric(4,2) NOT NULL DEFAULT 2.00,
  base_chance numeric(5,4) NOT NULL DEFAULT 0.05,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  daily_cap int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pet_random_events_scope_chk CHECK (scope IN ('kind','item')),
  CONSTRAINT pet_random_events_kind_chk CHECK (
    scope <> 'kind' OR kind IN ('feed','play','hygiene','sleep','affection','all')
  )
);
CREATE INDEX IF NOT EXISTS pet_random_events_lookup_idx ON public.pet_random_events (active, scope);
GRANT SELECT ON public.pet_random_events TO anon, authenticated;
GRANT ALL ON public.pet_random_events TO service_role;
ALTER TABLE public.pet_random_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "random_events_public_read" ON public.pet_random_events;
DROP POLICY IF EXISTS "random_events_admin_write" ON public.pet_random_events;
CREATE POLICY "random_events_public_read" ON public.pet_random_events FOR SELECT USING (true);
CREATE POLICY "random_events_admin_write" ON public.pet_random_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) user_pet_buffs
CREATE TABLE IF NOT EXISTS public.user_pet_buffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_pet_id uuid NOT NULL REFERENCES public.user_pets_v2(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  restore_mult numeric(4,2) NOT NULL DEFAULT 1.00,
  decay_mult numeric(4,2) NOT NULL DEFAULT 1.00,
  source text NOT NULL DEFAULT 'random',
  label text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_pet_buffs_active_idx ON public.user_pet_buffs (user_pet_id, expires_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_pet_buffs TO authenticated;
GRANT ALL ON public.user_pet_buffs TO service_role;
ALTER TABLE public.user_pet_buffs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "buffs_owner_read" ON public.user_pet_buffs;
DROP POLICY IF EXISTS "buffs_owner_write" ON public.user_pet_buffs;
CREATE POLICY "buffs_owner_read" ON public.user_pet_buffs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "buffs_owner_write" ON public.user_pet_buffs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4) user_pet_random_event_log
CREATE TABLE IF NOT EXISTS public.user_pet_random_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_pet_id uuid NOT NULL REFERENCES public.user_pets_v2(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_id uuid REFERENCES public.pet_random_events(id) ON DELETE SET NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_pet_random_event_log_lookup_idx
  ON public.user_pet_random_event_log (user_pet_id, event_id, created_at DESC);
GRANT SELECT ON public.user_pet_random_event_log TO authenticated;
GRANT ALL ON public.user_pet_random_event_log TO service_role;
ALTER TABLE public.user_pet_random_event_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rev_log_owner_read" ON public.user_pet_random_event_log;
CREATE POLICY "rev_log_owner_read" ON public.user_pet_random_event_log FOR SELECT USING (auth.uid() = user_id);

-- 5) Helpers
CREATE OR REPLACE FUNCTION public.pet_daypart_sp(_now timestamptz DEFAULT now())
RETURNS text LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT CASE
    WHEN EXTRACT(HOUR FROM (_now AT TIME ZONE 'America/Sao_Paulo')) BETWEEN 6 AND 17 THEN 'day'
    ELSE 'night'
  END
$$;

CREATE OR REPLACE FUNCTION public.pet_effect_condition_passes(
  _condition_kind text, _condition_op text, _condition_value int, _values jsonb
) RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE v int;
BEGIN
  IF _condition_kind IS NULL OR _condition_op IS NULL OR _condition_value IS NULL THEN RETURN true; END IF;
  v := COALESCE((_values ->> _condition_kind)::int, 100);
  RETURN CASE _condition_op
    WHEN 'gt'  THEN v >  _condition_value
    WHEN 'gte' THEN v >= _condition_value
    WHEN 'lt'  THEN v <  _condition_value
    WHEN 'lte' THEN v <= _condition_value
    ELSE true
  END;
END $$;

CREATE OR REPLACE FUNCTION public.pet_state_snapshot(_user_pet_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cfg public.pet_care_config;
  r record;
  v_result jsonb := jsonb_build_object('feed',80,'play',80,'hygiene',80,'sleep',80,'affection',80,'energy',100);
  v_minutes numeric;
  v_value int;
BEGIN
  SELECT * INTO v_cfg FROM public.pet_care_config WHERE id = 1;
  IF v_cfg IS NULL THEN v_cfg.decay_per_hour := 2; v_cfg.energy_regen_minutes_per_point := 6; END IF;
  FOR r IN SELECT kind, value_at_anchor, anchor_at FROM public.pet_care_state WHERE user_pet_id = _user_pet_id LOOP
    v_minutes := EXTRACT(EPOCH FROM (now() - r.anchor_at)) / 60.0;
    IF r.kind = 'energy' THEN
      v_value := GREATEST(0, LEAST(100, r.value_at_anchor + FLOOR(v_minutes / GREATEST(1, v_cfg.energy_regen_minutes_per_point))::int));
    ELSE
      v_value := GREATEST(0, LEAST(100, FLOOR(r.value_at_anchor - (v_cfg.decay_per_hour::numeric) * (v_minutes/60.0))::int));
    END IF;
    v_result := v_result || jsonb_build_object(r.kind, v_value);
  END LOOP;
  RETURN v_result;
END $$;
GRANT EXECUTE ON FUNCTION public.pet_state_snapshot(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pet_daypart_sp(timestamptz) TO authenticated, anon;

-- 6) pet_runtime_modifiers
CREATE OR REPLACE FUNCTION public.pet_runtime_modifiers(_user_pet_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pet record;
  v_daypart text := public.pet_daypart_sp();
  v_values jsonb := public.pet_state_snapshot(_user_pet_id);
  v_rules jsonb := '[]'::jsonb;
  v_buffs jsonb := '[]'::jsonb;
  v_last_affection timestamptz;
  v_neglect_hours numeric := 0;
  r record;
BEGIN
  SELECT id, personality_id, user_id INTO v_pet FROM public.user_pets_v2 WHERE id = _user_pet_id;
  IF v_pet IS NULL OR v_pet.user_id <> auth.uid() THEN
    RETURN jsonb_build_object('rules','[]'::jsonb,'buffs','[]'::jsonb,'daypart',v_daypart,'values',v_values);
  END IF;
  FOR r IN SELECT * FROM public.pet_personality_effects
            WHERE personality_id = v_pet.personality_id AND active LOOP
    IF r.daypart <> 'any' AND r.daypart <> v_daypart THEN CONTINUE; END IF;
    IF NOT public.pet_effect_condition_passes(r.condition_kind, r.condition_op, r.condition_value, v_values) THEN CONTINUE; END IF;
    v_rules := v_rules || jsonb_build_object(
      'kind', r.kind, 'restore_mult', r.restore_mult,
      'energy_cost_mult', r.energy_cost_mult, 'decay_mult', r.decay_mult,
      'cap_max', r.cap_max, 'note', r.note
    );
  END LOOP;
  SELECT anchor_at INTO v_last_affection FROM public.pet_care_state
    WHERE user_pet_id = _user_pet_id AND kind = 'affection';
  IF v_last_affection IS NOT NULL THEN
    v_neglect_hours := EXTRACT(EPOCH FROM (now() - v_last_affection)) / 3600.0;
  END IF;
  IF v_neglect_hours >= 24 AND EXISTS (
    SELECT 1 FROM public.pet_personalities WHERE id = v_pet.personality_id AND slug = 'carinhoso'
  ) THEN
    v_rules := v_rules || jsonb_build_object(
      'kind','all','restore_mult',0.90,'energy_cost_mult',1.00,'decay_mult',1.00,'cap_max',null,
      'note','Está com saudade de carinho'
    );
  END IF;
  FOR r IN SELECT kind, restore_mult, decay_mult, label, expires_at
             FROM public.user_pet_buffs
            WHERE user_pet_id = _user_pet_id AND expires_at > now()
            ORDER BY created_at DESC LOOP
    v_buffs := v_buffs || jsonb_build_object(
      'kind', r.kind, 'restore_mult', r.restore_mult, 'decay_mult', r.decay_mult,
      'label', r.label, 'expires_at', r.expires_at
    );
  END LOOP;
  RETURN jsonb_build_object('rules', v_rules, 'buffs', v_buffs, 'daypart', v_daypart, 'values', v_values);
END $$;
GRANT EXECUTE ON FUNCTION public.pet_runtime_modifiers(uuid) TO authenticated;

-- grant_coin wrapper (idempotente)
CREATE OR REPLACE FUNCTION public.grant_coin_event(_user uuid, _amount int, _ref text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_coins (user_id, balance) VALUES (_user, _amount)
  ON CONFLICT (user_id) DO UPDATE SET balance = public.user_coins.balance + EXCLUDED.balance;
  INSERT INTO public.coin_transactions (user_id, amount, source, reference_id, kind, description)
    VALUES (_user, _amount, 'pet_random_event', _ref, 'credit', 'Evento aleatório do pet');
END $$;
GRANT EXECUTE ON FUNCTION public.grant_coin_event(uuid, int, text) TO authenticated;

-- 7) apply_pet_care REESCRITA — retorna jsonb
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

  IF v_item.cost_coins > 0 THEN PERFORM public.spend_coin(v_item.cost_coins); END IF;

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

-- 8) Triggers updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at_now()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_personality_effects_updated ON public.pet_personality_effects;
CREATE TRIGGER trg_personality_effects_updated BEFORE UPDATE ON public.pet_personality_effects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();
DROP TRIGGER IF EXISTS trg_random_events_updated ON public.pet_random_events;
CREATE TRIGGER trg_random_events_updated BEFORE UPDATE ON public.pet_random_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- 9) SEEDS — 5 personalidades
INSERT INTO public.pet_personality_effects
  (personality_id, kind, restore_mult, energy_cost_mult, decay_mult, cap_max, daypart, condition_kind, condition_op, condition_value, note, sort_order)
SELECT (SELECT id FROM public.pet_personalities WHERE slug=s.slug), s.kind, s.rm, s.em, s.dm, s.cap, s.dp, s.ck, s.co, s.cv, s.note, s.so
FROM (VALUES
  ('calmo','energy',1.25,1.00,1.00,NULL,'any',NULL,NULL,NULL,'Energia regenera mais rápido',1),
  ('calmo','play',1.00,1.00,0.80,NULL,'any',NULL,NULL,NULL,'Decai humor mais lento',2),
  ('calmo','all',1.15,1.00,1.00,NULL,'night',NULL,NULL,NULL,'Bônus noturno',3),
  ('calmo','sleep',1.00,1.00,1.00,70,'any',NULL,NULL,NULL,'Sono leve (máx. 70)',4),
  ('brincalhao','play',1.30,1.00,1.00,NULL,'any',NULL,NULL,NULL,'Adora brincar (+30%)',1),
  ('brincalhao','play',1.15,1.00,1.00,NULL,'day',NULL,NULL,NULL,'Energia extra de dia',2),
  ('brincalhao','play',1.00,1.00,1.25,NULL,'any',NULL,NULL,NULL,'Entedia rápido',3),
  ('brincalhao','hygiene',0.80,1.00,1.00,NULL,'any',NULL,NULL,NULL,'Não fica parado no banho',4),
  ('curioso','hygiene',1.00,1.00,1.20,NULL,'any',NULL,NULL,NULL,'Mexe em tudo, se suja',1),
  ('curioso','all',1.00,1.10,1.00,NULL,'any',NULL,NULL,NULL,'Sempre alerta (+10% energia)',2),
  ('Energético','all',1.00,0.70,1.00,NULL,'any',NULL,NULL,NULL,'Atleta (-30% energia)',1),
  ('Energético','play',1.20,1.00,1.00,NULL,'day',NULL,NULL,NULL,'Brincar rende mais de dia',2),
  ('Energético','feed',1.00,1.00,1.25,NULL,'any',NULL,NULL,NULL,'Queima calorias rápido',3),
  ('Energético','sleep',0.80,1.00,1.00,NULL,'any',NULL,NULL,NULL,'Dorme inquieto',4),
  ('carinhoso','affection',1.30,1.00,1.00,NULL,'any',NULL,NULL,NULL,'Carinho rende +30%',1),
  ('carinhoso','play',1.15,1.00,1.00,NULL,'any',NULL,NULL,NULL,'Afeto contagia humor',2),
  ('carinhoso','affection',1.00,1.00,0.70,NULL,'any','play','gte',70,'Feliz = seguro',3),
  ('carinhoso','affection',1.00,1.00,1.50,NULL,'any','play','lt',30,'Triste = inseguro',4)
) AS s(slug,kind,rm,em,dm,cap,dp,ck,co,cv,note,so)
WHERE EXISTS (SELECT 1 FROM public.pet_personalities WHERE slug = s.slug)
  AND NOT EXISTS (
    SELECT 1 FROM public.pet_personality_effects e
    WHERE e.personality_id = (SELECT id FROM public.pet_personalities WHERE slug=s.slug)
      AND e.kind = s.kind AND e.note = s.note
  );

INSERT INTO public.pet_random_events
  (scope, kind, personality_id, personality_chance_mult, base_chance, payload, daily_cap, sort_order)
SELECT v.scope, v.kind, (SELECT id FROM public.pet_personalities WHERE slug=v.pslug), v.pmult, v.chance, v.payload::jsonb, v.cap, v.so
FROM (VALUES
  ('kind','play','curioso',2.00,0.06,'{"type":"coins","min":1,"max":5,"label":"Moedas encontradas!"}',10,1),
  ('kind','all','curioso',2.00,0.03,'{"type":"buff","kind":"feed","mult":1.15,"duration_min":60,"label":"Petisco surpresa"}',3,2),
  ('kind','affection',NULL,1.00,0.04,'{"type":"buff","kind":"play","mult":1.20,"duration_min":30,"label":"Boa companhia"}',5,3)
) AS v(scope,kind,pslug,pmult,chance,payload,cap,so)
WHERE NOT EXISTS (
  SELECT 1 FROM public.pet_random_events e
  WHERE e.scope = v.scope AND COALESCE(e.kind,'') = COALESCE(v.kind,'')
    AND (e.payload->>'label') = (v.payload::jsonb->>'label')
);
