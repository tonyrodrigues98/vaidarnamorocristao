BEGIN;

DO $$
DECLARE
  _required_signature text;
BEGIN
  FOREACH _required_signature IN ARRAY ARRAY[
    'public.purchase_decoration(uuid)',
    'public.purchase_profile_background(uuid)',
    'public.purchase_name_gradient(uuid)',
    'public.equip_decoration(uuid)',
    'public.unequip_decoration(public.decoration_type)',
    'public.equip_profile_background(uuid)',
    'public.unequip_profile_background()',
    'public.equip_name_gradient(uuid)',
    'public.unequip_name_gradient()',
    'public.admin_grant_coins(uuid,integer,text)'
  ]
  LOOP
    IF to_regprocedure(_required_signature) IS NULL THEN
      RAISE EXCEPTION 'V2 economy preflight failed: missing %', _required_signature;
    END IF;
  END LOOP;
END;
$$;

CREATE TABLE IF NOT EXISTS public.economy_commands_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  idempotency_key uuid NOT NULL,
  action text NOT NULL
    CHECK (action IN ('purchase', 'equip', 'unequip', 'admin-adjust')),
  target_user_id uuid NOT NULL,
  item_kind text,
  item_id uuid,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (actor_id, idempotency_key),
  CHECK (jsonb_typeof(result) = 'object')
);

CREATE INDEX IF NOT EXISTS economy_commands_v2_target_created_idx
  ON public.economy_commands_v2 (target_user_id, created_at DESC);

ALTER TABLE public.economy_commands_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.economy_commands_v2 FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.economy_commands_v2 TO authenticated;
GRANT ALL ON TABLE public.economy_commands_v2 TO service_role;

CREATE POLICY "economy command actor reads receipt"
  ON public.economy_commands_v2
  FOR SELECT TO authenticated
  USING (actor_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.economy_feature_gates_v2 (
  feature_key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  rules_version text NOT NULL,
  reason text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.economy_feature_gates_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.economy_feature_gates_v2 FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.economy_feature_gates_v2 TO service_role;

INSERT INTO public.economy_feature_gates_v2 (
  feature_key,
  enabled,
  rules_version,
  reason
)
VALUES (
  'chance_based_boxes',
  false,
  'legal-review-required-v1',
  'Disabled until commercial, legal, odds disclosure and age-policy approval.'
)
ON CONFLICT (feature_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_economy_hub_v2()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _profile public.profiles;
  _balance integer := 0;
  _xp_total integer := 0;
  _level integer := 1;
  _latest_ledger_balance integer;
  _catalog jsonb;
  _inventory jsonb;
  _ledger jsonb;
  _receipts jsonb;
  _invalid_equipped integer := 0;
  _preserved jsonb;
  _risk_gates jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO _profile FROM public.profiles WHERE id = _uid;
  IF _profile.id IS NULL THEN
    RAISE EXCEPTION 'profile_not_available' USING ERRCODE = '42501';
  END IF;

  SELECT coalesce((
    SELECT coins.balance
    FROM public.user_coins coins
    WHERE coins.user_id = _uid
  ), 0)
  INTO _balance;

  SELECT
    coalesce((SELECT xp.xp_total FROM public.user_xp xp WHERE xp.user_id = _uid), 0),
    coalesce((SELECT xp.level FROM public.user_xp xp WHERE xp.user_id = _uid), 1)
  INTO _xp_total, _level;

  SELECT tx.balance_after
  INTO _latest_ledger_balance
  FROM public.coin_transactions tx
  WHERE tx.user_id = _uid
  ORDER BY tx.created_at DESC, tx.id DESC
  LIMIT 1;

  WITH catalog_item AS (
    SELECT
      decoration.id,
      decoration.type::text AS kind,
      decoration.name,
      decoration.description,
      decoration.image_url AS asset_url,
      decoration.css_value,
      NULL::text AS color_a,
      NULL::text AS color_b,
      decoration.price_coins AS price,
      decoration.rarity::text AS rarity,
      decoration.active,
      EXISTS (
        SELECT 1
        FROM public.user_decorations owned
        WHERE owned.user_id = _uid
          AND owned.decoration_id = decoration.id
      ) AS owned,
      CASE decoration.type::text
        WHEN 'frame' THEN _profile.equipped_frame_id = decoration.id
        WHEN 'aura' THEN _profile.equipped_aura_id = decoration.id
        WHEN 'sticker' THEN _profile.equipped_sticker_id = decoration.id
        ELSE false
      END AS equipped,
      (
        SELECT owned.purchased_at
        FROM public.user_decorations owned
        WHERE owned.user_id = _uid
          AND owned.decoration_id = decoration.id
        LIMIT 1
      ) AS acquired_at
    FROM public.avatar_decorations decoration
    WHERE decoration.active

    UNION ALL

    SELECT
      background.id,
      'background'::text,
      background.name,
      background.description,
      background.image_url,
      NULL::text,
      NULL::text,
      NULL::text,
      background.price,
      background.rarity::text,
      background.is_active,
      EXISTS (
        SELECT 1
        FROM public.user_profile_backgrounds owned
        WHERE owned.user_id = _uid
          AND owned.background_id = background.id
      ),
      _profile.equipped_background_id = background.id,
      (
        SELECT owned.purchased_at
        FROM public.user_profile_backgrounds owned
        WHERE owned.user_id = _uid
          AND owned.background_id = background.id
        LIMIT 1
      )
    FROM public.profile_backgrounds background
    WHERE background.is_active

    UNION ALL

    SELECT
      gradient.id,
      'name-gradient'::text,
      gradient.name,
      NULL::text,
      NULL::text,
      NULL::text,
      gradient.color_a,
      gradient.color_b,
      gradient.price,
      'common'::text,
      gradient.is_active,
      EXISTS (
        SELECT 1
        FROM public.user_name_gradients owned
        WHERE owned.user_id = _uid
          AND owned.gradient_id = gradient.id
      ),
      _profile.equipped_name_gradient_id = gradient.id,
      (
        SELECT owned.purchased_at
        FROM public.user_name_gradients owned
        WHERE owned.user_id = _uid
          AND owned.gradient_id = gradient.id
        LIMIT 1
      )
    FROM public.name_gradients gradient
    WHERE gradient.is_active
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', item.id,
    'kind', item.kind,
    'name', item.name,
    'description', item.description,
    'asset_url', item.asset_url,
    'css_value', item.css_value,
    'color_a', item.color_a,
    'color_b', item.color_b,
    'price', item.price,
    'rarity', item.rarity,
    'active', item.active,
    'owned', item.owned,
    'equipped', item.equipped,
    'acquired_at', item.acquired_at
  ) ORDER BY item.kind, item.price, item.id), '[]'::jsonb)
  INTO _catalog
  FROM catalog_item item;

  WITH inventory_item AS (
    SELECT
      decoration.id,
      decoration.type::text AS kind,
      decoration.name,
      decoration.description,
      decoration.image_url AS asset_url,
      decoration.css_value,
      NULL::text AS color_a,
      NULL::text AS color_b,
      decoration.price_coins AS price,
      decoration.rarity::text AS rarity,
      decoration.active,
      CASE decoration.type::text
        WHEN 'frame' THEN _profile.equipped_frame_id = decoration.id
        WHEN 'aura' THEN _profile.equipped_aura_id = decoration.id
        WHEN 'sticker' THEN _profile.equipped_sticker_id = decoration.id
        ELSE false
      END AS equipped,
      owned.purchased_at AS acquired_at,
      CASE WHEN owned.is_free_claim THEN 'free-claim' ELSE 'purchase-or-legacy' END AS origin
    FROM public.user_decorations owned
    JOIN public.avatar_decorations decoration ON decoration.id = owned.decoration_id
    WHERE owned.user_id = _uid

    UNION ALL

    SELECT
      background.id,
      'background'::text,
      background.name,
      background.description,
      background.image_url,
      NULL::text,
      NULL::text,
      NULL::text,
      background.price,
      background.rarity::text,
      background.is_active,
      _profile.equipped_background_id = background.id,
      owned.purchased_at,
      'purchase-or-legacy'::text
    FROM public.user_profile_backgrounds owned
    JOIN public.profile_backgrounds background ON background.id = owned.background_id
    WHERE owned.user_id = _uid

    UNION ALL

    SELECT
      gradient.id,
      'name-gradient'::text,
      gradient.name,
      NULL::text,
      NULL::text,
      NULL::text,
      gradient.color_a,
      gradient.color_b,
      gradient.price,
      'common'::text,
      gradient.is_active,
      _profile.equipped_name_gradient_id = gradient.id,
      owned.purchased_at,
      'purchase-or-legacy'::text
    FROM public.user_name_gradients owned
    JOIN public.name_gradients gradient ON gradient.id = owned.gradient_id
    WHERE owned.user_id = _uid
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', item.id,
    'kind', item.kind,
    'name', item.name,
    'description', item.description,
    'asset_url', item.asset_url,
    'css_value', item.css_value,
    'color_a', item.color_a,
    'color_b', item.color_b,
    'price', item.price,
    'rarity', item.rarity,
    'active', item.active,
    'owned', true,
    'equipped', item.equipped,
    'quantity', 1,
    'origin', item.origin,
    'acquired_at', item.acquired_at
  ) ORDER BY item.kind, item.acquired_at DESC, item.id), '[]'::jsonb)
  INTO _inventory
  FROM inventory_item item;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', tx.id,
    'amount', tx.amount,
    'balance_after', tx.balance_after,
    'direction', tx.direction,
    'kind', tx.kind,
    'title', tx.title,
    'subtitle', tx.subtitle,
    'created_at', tx.created_at
  ) ORDER BY tx.created_at DESC, tx.id DESC), '[]'::jsonb)
  INTO _ledger
  FROM (
    SELECT *
    FROM public.coin_transactions ledger_row
    WHERE ledger_row.user_id = _uid
    ORDER BY ledger_row.created_at DESC, ledger_row.id DESC
    LIMIT 50
  ) tx;

  SELECT coalesce(jsonb_agg(command.result ORDER BY command.created_at DESC), '[]'::jsonb)
  INTO _receipts
  FROM (
    SELECT result, created_at
    FROM public.economy_commands_v2
    WHERE actor_id = _uid
      AND completed_at IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 20
  ) command;

  _invalid_equipped :=
    CASE WHEN _profile.equipped_frame_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.user_decorations owned
      WHERE owned.user_id = _uid AND owned.decoration_id = _profile.equipped_frame_id
    ) THEN 1 ELSE 0 END
    + CASE WHEN _profile.equipped_aura_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.user_decorations owned
      WHERE owned.user_id = _uid AND owned.decoration_id = _profile.equipped_aura_id
    ) THEN 1 ELSE 0 END
    + CASE WHEN _profile.equipped_sticker_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.user_decorations owned
      WHERE owned.user_id = _uid AND owned.decoration_id = _profile.equipped_sticker_id
    ) THEN 1 ELSE 0 END
    + CASE WHEN _profile.equipped_background_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.user_profile_backgrounds owned
      WHERE owned.user_id = _uid AND owned.background_id = _profile.equipped_background_id
    ) THEN 1 ELSE 0 END
    + CASE WHEN _profile.equipped_name_gradient_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.user_name_gradients owned
      WHERE owned.user_id = _uid AND owned.gradient_id = _profile.equipped_name_gradient_id
    ) THEN 1 ELSE 0 END;

  SELECT jsonb_build_object(
    'badges', (SELECT count(*) FROM public.user_badges badge WHERE badge.user_id = _uid),
    'gifts_received', (
      SELECT count(*) FROM public.gift_transactions gift WHERE gift.receiver_id = _uid
    ),
    'avatar_legacy_items', (
      SELECT count(*) FROM public.user_avatar_inventory item WHERE item.user_id = _uid
    ),
    'pet_backgrounds', (
      SELECT count(*) FROM public.user_pet_backgrounds item WHERE item.user_id = _uid
    ),
    'pet_album_stickers', (
      SELECT coalesce(sum(item.quantity), 0)
      FROM public.user_pet_album_stickers item
      WHERE item.user_id = _uid
    )
  )
  INTO _preserved;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'feature', gate.feature_key,
    'enabled', gate.enabled,
    'rules_version', gate.rules_version,
    'reason', gate.reason
  ) ORDER BY gate.feature_key), '[]'::jsonb)
  INTO _risk_gates
  FROM public.economy_feature_gates_v2 gate;

  RETURN jsonb_build_object(
    'balance', _balance,
    'xp_total', _xp_total,
    'level', _level,
    'catalog', _catalog,
    'inventory', _inventory,
    'ledger', _ledger,
    'receipts', _receipts,
    'reconciliation', jsonb_build_object(
      'status', CASE
        WHEN _latest_ledger_balance IS NULL THEN 'baseline-unverified'
        WHEN _latest_ledger_balance = _balance AND _invalid_equipped = 0 THEN 'consistent'
        ELSE 'investigation-required'
      END,
      'latest_ledger_balance', _latest_ledger_balance,
      'balance_delta', CASE
        WHEN _latest_ledger_balance IS NULL THEN NULL
        ELSE _balance - _latest_ledger_balance
      END,
      'invalid_equipped_count', _invalid_equipped
    ),
    'preserved_families', _preserved,
    'risk_gates', _risk_gates
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.purchase_economy_item_v2(
  _item_kind text,
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
  _command public.economy_commands_v2;
  _balance integer;
  _result jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF _item_id IS NULL OR _idempotency_key IS NULL
     OR _item_kind NOT IN ('frame', 'aura', 'sticker', 'background', 'name-gradient') THEN
    RAISE EXCEPTION 'invalid_economy_purchase' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.economy_commands_v2 (
    actor_id, idempotency_key, action, target_user_id, item_kind, item_id
  )
  VALUES (_uid, _idempotency_key, 'purchase', _uid, _item_kind, _item_id)
  ON CONFLICT (actor_id, idempotency_key) DO NOTHING;

  SELECT * INTO _command
  FROM public.economy_commands_v2
  WHERE actor_id = _uid
    AND idempotency_key = _idempotency_key
  FOR UPDATE;

  IF _command.action <> 'purchase'
     OR _command.target_user_id <> _uid
     OR _command.item_kind <> _item_kind
     OR _command.item_id <> _item_id THEN
    RAISE EXCEPTION 'idempotency_key_reused' USING ERRCODE = '22023';
  END IF;
  IF _command.completed_at IS NOT NULL THEN
    RETURN _command.result;
  END IF;

  IF _item_kind IN ('frame', 'aura', 'sticker') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.avatar_decorations item
      WHERE item.id = _item_id
        AND item.active
        AND item.type::text = _item_kind
    ) THEN
      RAISE EXCEPTION 'economy_item_not_available' USING ERRCODE = '22023';
    END IF;
    PERFORM public.purchase_decoration(_item_id);
  ELSIF _item_kind = 'background' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profile_backgrounds item
      WHERE item.id = _item_id AND item.is_active
    ) THEN
      RAISE EXCEPTION 'economy_item_not_available' USING ERRCODE = '22023';
    END IF;
    PERFORM public.purchase_profile_background(_item_id);
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM public.name_gradients item
      WHERE item.id = _item_id AND item.is_active
    ) THEN
      RAISE EXCEPTION 'economy_item_not_available' USING ERRCODE = '22023';
    END IF;
    PERFORM public.purchase_name_gradient(_item_id);
  END IF;

  SELECT balance INTO _balance
  FROM public.user_coins
  WHERE user_id = _uid;

  _result := jsonb_build_object(
    'receipt_id', _command.id,
    'action', 'purchase',
    'item_kind', _item_kind,
    'item_id', _item_id,
    'balance_after', _balance,
    'completed_at', now()
  );
  UPDATE public.economy_commands_v2
  SET result = _result,
      completed_at = now()
  WHERE id = _command.id;

  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_equipped_economy_item_v2(
  _item_kind text,
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
  _action text := CASE WHEN _item_id IS NULL THEN 'unequip' ELSE 'equip' END;
  _command public.economy_commands_v2;
  _result jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF _idempotency_key IS NULL
     OR _item_kind NOT IN ('frame', 'aura', 'sticker', 'background', 'name-gradient') THEN
    RAISE EXCEPTION 'invalid_economy_equipment' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.economy_commands_v2 (
    actor_id, idempotency_key, action, target_user_id, item_kind, item_id
  )
  VALUES (_uid, _idempotency_key, _action, _uid, _item_kind, _item_id)
  ON CONFLICT (actor_id, idempotency_key) DO NOTHING;

  SELECT * INTO _command
  FROM public.economy_commands_v2
  WHERE actor_id = _uid
    AND idempotency_key = _idempotency_key
  FOR UPDATE;

  IF _command.action <> _action
     OR _command.target_user_id <> _uid
     OR _command.item_kind <> _item_kind
     OR _command.item_id IS DISTINCT FROM _item_id THEN
    RAISE EXCEPTION 'idempotency_key_reused' USING ERRCODE = '22023';
  END IF;
  IF _command.completed_at IS NOT NULL THEN
    RETURN _command.result;
  END IF;

  IF _item_kind IN ('frame', 'aura', 'sticker') THEN
    IF _item_id IS NULL THEN
      PERFORM public.unequip_decoration(_item_kind::public.decoration_type);
    ELSE
      IF NOT EXISTS (
        SELECT 1
        FROM public.user_decorations owned
        JOIN public.avatar_decorations item ON item.id = owned.decoration_id
        WHERE owned.user_id = _uid
          AND owned.decoration_id = _item_id
          AND item.active
          AND item.type::text = _item_kind
      ) THEN
        RAISE EXCEPTION 'economy_item_not_owned_or_inactive' USING ERRCODE = '42501';
      END IF;
      PERFORM public.equip_decoration(_item_id);
    END IF;
  ELSIF _item_kind = 'background' THEN
    IF _item_id IS NULL THEN
      PERFORM public.unequip_profile_background();
    ELSE
      IF NOT EXISTS (
        SELECT 1
        FROM public.user_profile_backgrounds owned
        JOIN public.profile_backgrounds item ON item.id = owned.background_id
        WHERE owned.user_id = _uid
          AND owned.background_id = _item_id
          AND item.is_active
      ) THEN
        RAISE EXCEPTION 'economy_item_not_owned_or_inactive' USING ERRCODE = '42501';
      END IF;
      PERFORM public.equip_profile_background(_item_id);
    END IF;
  ELSE
    IF _item_id IS NULL THEN
      PERFORM public.unequip_name_gradient();
    ELSE
      IF NOT EXISTS (
        SELECT 1
        FROM public.user_name_gradients owned
        JOIN public.name_gradients item ON item.id = owned.gradient_id
        WHERE owned.user_id = _uid
          AND owned.gradient_id = _item_id
          AND item.is_active
      ) THEN
        RAISE EXCEPTION 'economy_item_not_owned_or_inactive' USING ERRCODE = '42501';
      END IF;
      PERFORM public.equip_name_gradient(_item_id);
    END IF;
  END IF;

  _result := jsonb_build_object(
    'receipt_id', _command.id,
    'action', _action,
    'item_kind', _item_kind,
    'item_id', _item_id,
    'completed_at', now()
  );
  UPDATE public.economy_commands_v2
  SET result = _result,
      completed_at = now()
  WHERE id = _command.id;
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_adjust_economy_v2(
  _target_user_id uuid,
  _amount integer,
  _reason_code text,
  _idempotency_key uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _command public.economy_commands_v2;
  _legacy_result jsonb;
  _result jsonb;
BEGIN
  IF _uid IS NULL
     OR NOT (
       public.has_role(_uid, 'admin')
       OR public.has_role(_uid, 'super_admin')
     ) THEN
    RAISE EXCEPTION 'admin_capability_required' USING ERRCODE = '42501';
  END IF;
  IF _target_user_id IS NULL OR _idempotency_key IS NULL
     OR _amount = 0 OR abs(_amount) > 10000
     OR _reason_code NOT IN (
       'support_compensation',
       'moderation_reversal',
       'migration_reconciliation'
     ) THEN
    RAISE EXCEPTION 'invalid_admin_adjustment' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.economy_commands_v2 (
    actor_id,
    idempotency_key,
    action,
    target_user_id,
    item_kind,
    result
  )
  VALUES (
    _uid,
    _idempotency_key,
    'admin-adjust',
    _target_user_id,
    'coins',
    jsonb_build_object('amount', _amount, 'reason_code', _reason_code)
  )
  ON CONFLICT (actor_id, idempotency_key) DO NOTHING;

  SELECT * INTO _command
  FROM public.economy_commands_v2
  WHERE actor_id = _uid
    AND idempotency_key = _idempotency_key
  FOR UPDATE;

  IF _command.action <> 'admin-adjust'
     OR _command.target_user_id <> _target_user_id
     OR (_command.result ->> 'amount')::integer <> _amount
     OR _command.result ->> 'reason_code' <> _reason_code THEN
    RAISE EXCEPTION 'idempotency_key_reused' USING ERRCODE = '22023';
  END IF;
  IF _command.completed_at IS NOT NULL THEN
    RETURN _command.result;
  END IF;

  SELECT public.admin_grant_coins(
    _target_user_id,
    _amount,
    'V2:' || _reason_code
  )
  INTO _legacy_result;

  _result := jsonb_build_object(
    'receipt_id', _command.id,
    'action', 'admin-adjust',
    'target_user_id', _target_user_id,
    'amount', _amount,
    'reason_code', _reason_code,
    'balance_after', _legacy_result -> 'balance',
    'delta', _legacy_result -> 'delta',
    'completed_at', now()
  );
  UPDATE public.economy_commands_v2
  SET result = _result,
      completed_at = now()
  WHERE id = _command.id;
  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_economy_hub_v2() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.purchase_economy_item_v2(text, uuid, uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_equipped_economy_item_v2(text, uuid, uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_adjust_economy_v2(uuid, integer, text, uuid)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_economy_hub_v2()
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.purchase_economy_item_v2(text, uuid, uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_equipped_economy_item_v2(text, uuid, uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_adjust_economy_v2(uuid, integer, text, uuid)
  TO authenticated, service_role;

COMMENT ON TABLE public.economy_commands_v2 IS
  'Idempotent V2 receipts around preserved economy and inventory commands.';
COMMENT ON TABLE public.economy_feature_gates_v2 IS
  'Server-owned commercial/legal gates. Chance-based boxes start disabled.';
COMMENT ON FUNCTION public.get_economy_hub_v2() IS
  'Read-only owner aggregate over separate legacy catalogs, inventories, balance, XP and ledger.';
COMMENT ON FUNCTION public.purchase_economy_item_v2(text, uuid, uuid) IS
  'V2 purchase authority: server price, legacy atomic delivery and idempotent receipt.';
COMMENT ON FUNCTION public.set_equipped_economy_item_v2(text, uuid, uuid) IS
  'V2 equipment authority: ownership and active-state validation per preserved slot.';

COMMIT;
