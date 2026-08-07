
-- 1) Novos campos no item de cuidado
ALTER TABLE public.pet_care_items
  ADD COLUMN IF NOT EXISTS energy_cost int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sleep_hours numeric(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_uses int NOT NULL DEFAULT 0; -- 0 = ilimitado

-- 2) Índice para contagem rápida de eventos por dia
CREATE INDEX IF NOT EXISTS pet_care_events_pet_item_created_idx
  ON public.pet_care_events (user_pet_id, item_id, created_at DESC);

-- 3) RPC atualizada: respeita limite diário (TZ São Paulo), consome energia, e
--    para "sleep" usa sleep_hours para restaurar sono e energia.
CREATE OR REPLACE FUNCTION public.apply_pet_care(_user_pet_id uuid, _item_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id, user_id, category_id, species_id INTO v_pet FROM public.user_pets_v2 WHERE id = _user_pet_id;
  IF v_pet IS NULL OR v_pet.user_id <> uid THEN RAISE EXCEPTION 'pet not found'; END IF;
  SELECT * INTO v_item FROM public.pet_care_items WHERE id = _item_id AND active;
  IF v_item IS NULL THEN RAISE EXCEPTION 'item not found'; END IF;

  -- compat
  SELECT count(*) INTO v_compat FROM public.pet_care_item_compat c
    WHERE c.item_id = v_item.id
      AND c.category_id = v_pet.category_id
      AND (c.species_id IS NULL OR c.species_id = v_pet.species_id);
  IF v_compat = 0 THEN RAISE EXCEPTION 'item incompativel com este pet'; END IF;

  v_kind_text := v_item.kind::text;
  SELECT * INTO v_cfg FROM public.pet_care_config WHERE id = 1;
  IF v_cfg IS NULL THEN v_cfg.decay_per_hour := 2; v_cfg.energy_regen_minutes_per_point := 6; END IF;

  -- limite diário (00:00 America/Sao_Paulo)
  IF v_item.daily_uses > 0 THEN
    v_today_start_utc := (date_trunc('day', (now() AT TIME ZONE 'America/Sao_Paulo')) AT TIME ZONE 'America/Sao_Paulo');
    SELECT count(*) INTO v_uses_today FROM public.pet_care_events
      WHERE user_pet_id = _user_pet_id AND item_id = v_item.id AND created_at >= v_today_start_utc;
    IF v_uses_today >= v_item.daily_uses THEN
      RAISE EXCEPTION 'limite_diario_atingido';
    END IF;
  END IF;

  -- carrega/cria estado da barra-alvo
  INSERT INTO public.pet_care_state (user_pet_id, kind, value_at_anchor, anchor_at)
    VALUES (_user_pet_id, v_kind_text, 80, now())
    ON CONFLICT (user_pet_id, kind) DO NOTHING;
  SELECT * INTO v_state FROM public.pet_care_state WHERE user_pet_id = _user_pet_id AND kind = v_kind_text FOR UPDATE;

  v_minutes := EXTRACT(EPOCH FROM (now() - v_state.anchor_at)) / 60.0;
  v_decay := (v_cfg.decay_per_hour::numeric) * (v_minutes / 60.0);
  v_current := GREATEST(0, LEAST(100, FLOOR(v_state.value_at_anchor - v_decay)::int));

  -- energia: precisamos do estado atual também (para checar custo e para sleep restaurar)
  INSERT INTO public.pet_care_state (user_pet_id, kind, value_at_anchor, anchor_at)
    VALUES (_user_pet_id, 'energy', 100, now())
    ON CONFLICT (user_pet_id, kind) DO NOTHING;
  SELECT * INTO v_energy_state FROM public.pet_care_state WHERE user_pet_id = _user_pet_id AND kind = 'energy' FOR UPDATE;
  -- valor corrente de energia (regen)
  v_minutes := EXTRACT(EPOCH FROM (now() - v_energy_state.anchor_at)) / 60.0;
  v_energy_current := GREATEST(0, LEAST(100, v_energy_state.value_at_anchor + FLOOR(v_minutes / GREATEST(1, v_cfg.energy_regen_minutes_per_point))::int));

  IF v_kind_text = 'sleep' THEN
    -- sleep_hours define o quanto restaura (sono e energia). Fallback p/ restore_amount se 0.
    IF v_item.sleep_hours > 0 THEN
      v_sleep_restore := LEAST(100, ROUND(v_item.sleep_hours * 12.5)::int); -- 8h => 100
      v_energy_restore := LEAST(100, ROUND(v_item.sleep_hours * 12.5)::int);
    ELSE
      v_sleep_restore := v_item.restore_amount;
      v_energy_restore := v_item.restore_amount;
    END IF;
    v_new := LEAST(100, v_current + v_sleep_restore);
    v_energy_new := LEAST(100, v_energy_current + v_energy_restore);
  ELSE
    -- exige energia suficiente
    IF v_item.energy_cost > 0 AND v_energy_current < v_item.energy_cost THEN
      RAISE EXCEPTION 'energia_insuficiente';
    END IF;
    v_new := LEAST(100, v_current + v_item.restore_amount);
    v_energy_new := GREATEST(0, v_energy_current - v_item.energy_cost);
  END IF;

  -- moedas
  IF v_item.cost_coins > 0 THEN
    PERFORM public.spend_coin(v_item.cost_coins);
  END IF;

  UPDATE public.pet_care_state SET value_at_anchor = v_new, anchor_at = now() WHERE id = v_state.id;
  UPDATE public.pet_care_state SET value_at_anchor = v_energy_new, anchor_at = now() WHERE id = v_energy_state.id;

  INSERT INTO public.pet_care_events (user_pet_id, user_id, kind, item_id, delta, cost_coins)
    VALUES (_user_pet_id, uid, v_kind_text, v_item.id, v_new - v_current, v_item.cost_coins);

  RETURN v_new;
END $$;

-- 4) Helper: usos restantes hoje (TZ SP) por item para um pet
CREATE OR REPLACE FUNCTION public.pet_care_uses_today(_user_pet_id uuid, _item_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.pet_care_events
   WHERE user_pet_id = _user_pet_id AND item_id = _item_id
     AND created_at >= (date_trunc('day', (now() AT TIME ZONE 'America/Sao_Paulo')) AT TIME ZONE 'America/Sao_Paulo')
$$;

GRANT EXECUTE ON FUNCTION public.pet_care_uses_today(uuid, uuid) TO authenticated;
