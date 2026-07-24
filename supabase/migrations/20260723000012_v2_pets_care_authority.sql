BEGIN;

DO $$
DECLARE
  _required_signature text;
BEGIN
  FOREACH _required_signature IN ARRAY ARRAY[
    'public.apply_pet_care(uuid,uuid)',
    'public.pet_runtime_modifiers(uuid)',
    'public.get_pet_arcade_catalog()',
    'public.get_pet_arcade_history_v2(integer)',
    'public.get_pet_arcade_usage_today()'
  ]
  LOOP
    IF to_regprocedure(_required_signature) IS NULL THEN
      RAISE EXCEPTION 'V2 pets preflight failed: missing %', _required_signature;
    END IF;
  END LOOP;
END;
$$;

CREATE TABLE IF NOT EXISTS public.pet_commands_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  idempotency_key uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('care')),
  user_pet_id uuid NOT NULL,
  item_id uuid NOT NULL,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (actor_id, idempotency_key),
  CHECK (jsonb_typeof(result) = 'object')
);

CREATE INDEX IF NOT EXISTS pet_commands_v2_actor_created_idx
  ON public.pet_commands_v2 (actor_id, created_at DESC);

ALTER TABLE public.pet_commands_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.pet_commands_v2 FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.pet_commands_v2 TO authenticated;
GRANT ALL ON TABLE public.pet_commands_v2 TO service_role;

CREATE POLICY "pet command actor reads receipt"
  ON public.pet_commands_v2
  FOR SELECT TO authenticated
  USING (actor_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_pet_platform_hub_v2()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _pet public.user_pets_v2;
  _pet_payload jsonb := NULL;
  _care_state jsonb := '[]'::jsonb;
  _care_items jsonb := '[]'::jsonb;
  _care_history jsonb := '[]'::jsonb;
  _config jsonb;
  _modifiers jsonb := jsonb_build_object('rules', '[]'::jsonb, 'buffs', '[]'::jsonb);
  _legacy_summary jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT pet.*
  INTO _pet
  FROM public.user_pets_v2 pet
  WHERE pet.user_id = _uid
  ORDER BY pet.is_equipped DESC, pet.created_at DESC, pet.id
  LIMIT 1;

  SELECT jsonb_build_object(
    'user_pets_count', (
      SELECT count(*) FROM public.user_pets legacy_pet WHERE legacy_pet.user_id = _uid
    ),
    'user_pets_equipped_count', (
      SELECT count(*)
      FROM public.user_pets legacy_pet
      WHERE legacy_pet.user_id = _uid AND legacy_pet.is_equipped
    ),
    'user_pets_v2_count', (
      SELECT count(*) FROM public.user_pets_v2 current_pet WHERE current_pet.user_id = _uid
    ),
    'user_pets_v2_equipped_count', (
      SELECT count(*)
      FROM public.user_pets_v2 current_pet
      WHERE current_pet.user_id = _uid AND current_pet.is_equipped
    )
  )
  INTO _legacy_summary;

  SELECT jsonb_build_object(
    'decay_per_hour', coalesce(config.decay_per_hour, 2),
    'energy_regen_minutes_per_point',
      coalesce(config.energy_regen_minutes_per_point, 6)
  )
  INTO _config
  FROM (SELECT 1) seed
  LEFT JOIN public.pet_care_config config ON config.id = 1;

  IF _pet.id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', _pet.id,
      'custom_name', _pet.custom_name,
      'visibility', _pet.visibility,
      'is_equipped', _pet.is_equipped,
      'created_at', _pet.created_at,
      'category', jsonb_build_object(
        'id', category.id,
        'name', category.name,
        'image_url', category.image_url
      ),
      'species', CASE WHEN species.id IS NULL THEN NULL ELSE jsonb_build_object(
        'id', species.id,
        'name', species.name,
        'image_url', species.image_url,
        'image_url_baby', species.image_url_baby,
        'image_url_adult', species.image_url_adult
      ) END,
      'variant', CASE WHEN variant.id IS NULL THEN NULL ELSE jsonb_build_object(
        'id', variant.id,
        'name', variant.name,
        'image_url', variant.image_url,
        'image_url_baby', variant.image_url_baby,
        'image_url_adult', variant.image_url_adult
      ) END,
      'life_stage', jsonb_build_object(
        'id', stage.id,
        'name', stage.name,
        'kind', stage.kind
      ),
      'personality', jsonb_build_object(
        'id', personality.id,
        'name', personality.name,
        'description', personality.description
      ),
      'benefit', CASE WHEN benefit.id IS NULL THEN NULL ELSE jsonb_build_object(
        'id', benefit.id,
        'name', benefit.name,
        'description', benefit.description
      ) END
    )
    INTO _pet_payload
    FROM public.pet_categories category
    LEFT JOIN public.pet_species species ON species.id = _pet.species_id
    LEFT JOIN public.pet_variants variant ON variant.id = _pet.variant_id
    JOIN public.pet_life_stages stage ON stage.id = _pet.life_stage_id
    JOIN public.pet_personalities personality ON personality.id = _pet.personality_id
    LEFT JOIN public.pet_benefits benefit ON benefit.id = _pet.benefit_id
    WHERE category.id = _pet.category_id;

    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'kind', state.kind,
      'value_at_anchor', state.value_at_anchor,
      'anchor_at', state.anchor_at
    ) ORDER BY state.kind), '[]'::jsonb)
    INTO _care_state
    FROM public.pet_care_state state
    WHERE state.user_pet_id = _pet.id;

    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', item.id,
      'kind', item.kind,
      'name', item.name,
      'description', item.description,
      'image_url', item.image_url,
      'cost_coins', item.cost_coins,
      'restore_amount', item.restore_amount,
      'energy_cost', item.energy_cost,
      'sleep_hours', item.sleep_hours,
      'daily_uses', item.daily_uses,
      'uses_today', (
        SELECT count(*)
        FROM public.pet_care_events care_event
        WHERE care_event.user_pet_id = _pet.id
          AND care_event.item_id = item.id
          AND care_event.created_at >= (
            date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
            AT TIME ZONE 'America/Sao_Paulo'
          )
      )
    ) ORDER BY item.kind, item.sort_order, item.name), '[]'::jsonb)
    INTO _care_items
    FROM public.pet_care_items item
    WHERE item.active
      AND EXISTS (
        SELECT 1
        FROM public.pet_care_item_compat compat
        WHERE compat.item_id = item.id
          AND compat.category_id = _pet.category_id
          AND (compat.species_id IS NULL OR compat.species_id = _pet.species_id)
      );

    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', care_event.id,
      'kind', care_event.kind,
      'delta', care_event.delta,
      'cost_coins', care_event.cost_coins,
      'created_at', care_event.created_at
    ) ORDER BY care_event.created_at DESC, care_event.id DESC), '[]'::jsonb)
    INTO _care_history
    FROM (
      SELECT care_source.*
      FROM public.pet_care_events care_source
      WHERE care_source.user_id = _uid
        AND care_source.user_pet_id = _pet.id
      ORDER BY care_source.created_at DESC, care_source.id DESC
      LIMIT 20
    ) care_event;

    _modifiers := coalesce(
      public.pet_runtime_modifiers(_pet.id),
      jsonb_build_object('rules', '[]'::jsonb, 'buffs', '[]'::jsonb)
    );
  END IF;

  RETURN jsonb_build_object(
    'server_now', now(),
    'pet', _pet_payload,
    'care_config', _config,
    'care_state', _care_state,
    'care_items', _care_items,
    'care_history', _care_history,
    'modifiers', _modifiers,
    'preserved_families', _legacy_summary
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_pet_care_v2(
  _user_pet_id uuid,
  _item_id uuid,
  _idempotency_key uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _command public.pet_commands_v2;
  _legacy_result jsonb;
  _result jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF _user_pet_id IS NULL OR _item_id IS NULL OR _idempotency_key IS NULL THEN
    RAISE EXCEPTION 'invalid_pet_care_command' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_pets_v2 pet
    WHERE pet.id = _user_pet_id AND pet.user_id = _uid
  ) THEN
    RAISE EXCEPTION 'pet_not_owned' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.pet_care_items item WHERE item.id = _item_id AND item.active
  ) THEN
    RAISE EXCEPTION 'care_item_not_available' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.pet_commands_v2 (
    actor_id, idempotency_key, action, user_pet_id, item_id
  )
  VALUES (_uid, _idempotency_key, 'care', _user_pet_id, _item_id)
  ON CONFLICT (actor_id, idempotency_key) DO NOTHING;

  SELECT *
  INTO _command
  FROM public.pet_commands_v2
  WHERE actor_id = _uid AND idempotency_key = _idempotency_key
  FOR UPDATE;

  IF _command.action <> 'care'
     OR _command.user_pet_id <> _user_pet_id
     OR _command.item_id <> _item_id THEN
    RAISE EXCEPTION 'idempotency_key_reused' USING ERRCODE = '22023';
  END IF;
  IF _command.completed_at IS NOT NULL THEN
    RETURN _command.result;
  END IF;

  SELECT public.apply_pet_care(_user_pet_id, _item_id)
  INTO _legacy_result;

  _result := jsonb_build_object(
    'receipt_id', _command.id,
    'action', 'care',
    'user_pet_id', _user_pet_id,
    'item_id', _item_id,
    'care_result', _legacy_result,
    'completed_at', now()
  );
  UPDATE public.pet_commands_v2
  SET result = _result,
      completed_at = now()
  WHERE id = _command.id;
  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_pet_platform_hub_v2() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.apply_pet_care_v2(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pet_platform_hub_v2() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.apply_pet_care_v2(uuid, uuid, uuid)
  TO authenticated, service_role;

COMMENT ON TABLE public.pet_commands_v2 IS
  'Idempotent V2 receipts around preserved pet care commands.';
COMMENT ON FUNCTION public.get_pet_platform_hub_v2() IS
  'Owner-only pet projection that keeps user_pets and user_pets_v2 separate.';
COMMENT ON FUNCTION public.apply_pet_care_v2(uuid, uuid, uuid) IS
  'V2 pet care authority with owner validation, replay protection and preserved atomic rules.';

COMMIT;
