-- Corrige o helper compartilhado pelos jogos novos do Pet Arcade.
-- O projeto instala pgcrypto no schema extensions, que precisa ser qualificado
-- porque as RPCs usam um search_path restrito ao schema public.

CREATE OR REPLACE FUNCTION public._pet_arcade_begin(
  _game_type text,
  _entry integer,
  _difficulty text,
  _client_seed text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.pet_arcade_rounds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_settings public.pet_arcade_settings;
  v_cfg public.pet_arcade_game_configs;
  v_pet uuid;
  v_wallet public.user_coins;
  v_round public.pet_arcade_rounds;
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_count integer;
  v_free integer;
  v_seed text := encode(extensions.gen_random_bytes(32), 'hex');
  v_nonce bigint;
  v_client text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext(uid::text));

  SELECT * INTO v_settings
  FROM public.pet_arcade_settings
  WHERE id = 1;

  SELECT * INTO v_cfg
  FROM public.pet_arcade_game_configs
  WHERE game_type = _game_type;

  IF v_cfg.id IS NULL OR NOT v_settings.is_enabled OR NOT v_cfg.is_enabled THEN
    RAISE EXCEPTION 'game_unavailable';
  END IF;

  SELECT id INTO v_pet
  FROM public.user_pets_v2
  WHERE user_id = uid AND is_equipped = true
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_pet IS NULL THEN RAISE EXCEPTION 'pet_required'; END IF;

  SELECT count(*) INTO v_count
  FROM public.pet_arcade_rounds
  WHERE user_id = uid AND day = v_today;

  IF v_count >= v_settings.daily_play_limit THEN
    RAISE EXCEPTION 'daily_round_limit';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.pet_arcade_rounds
  WHERE user_id = uid AND game_type = _game_type AND day = v_today;

  IF v_count >= v_cfg.daily_play_limit THEN
    RAISE EXCEPTION 'game_daily_limit';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.pet_arcade_rounds
    WHERE user_id = uid AND game_type = _game_type AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'round_in_progress';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.pet_arcade_rounds
    WHERE user_id = uid
      AND game_type = _game_type
      AND created_at > clock_timestamp() - make_interval(secs => v_cfg.cooldown_seconds)
  ) THEN
    RAISE EXCEPTION 'cooldown_active';
  END IF;

  v_free := COALESCE((v_cfg.reward_config->>'free_daily')::integer, 0);

  IF _entry = 0 THEN
    IF v_count >= v_free THEN RAISE EXCEPTION 'invalid_entry'; END IF;
  ELSIF _game_type = 'piggybank' AND (_entry < v_cfg.min_entry OR _entry > v_cfg.max_entry) THEN
    RAISE EXCEPTION 'invalid_entry';
  ELSIF _game_type <> 'piggybank' AND (
    _entry < GREATEST(v_settings.global_min_entry, v_cfg.min_entry)
    OR _entry > LEAST(v_settings.global_max_entry, v_cfg.max_entry)
  ) THEN
    RAISE EXCEPTION 'invalid_entry';
  END IF;

  INSERT INTO public.user_coins(user_id, balance)
  VALUES(uid, 100)
  ON CONFLICT(user_id) DO NOTHING;

  SELECT * INTO v_wallet
  FROM public.user_coins
  WHERE user_id = uid
  FOR UPDATE;

  IF v_wallet.balance < _entry THEN RAISE EXCEPTION 'insufficient_coins'; END IF;

  v_client := COALESCE(
    NULLIF(trim(_client_seed), ''),
    encode(extensions.digest(uid::text || clock_timestamp()::text, 'sha256'), 'hex')
  );

  SELECT COALESCE(max(nonce), 0) + 1 INTO v_nonce
  FROM public.pet_arcade_rounds
  WHERE user_id = uid;

  UPDATE public.user_coins
  SET balance = v_wallet.balance - _entry, updated_at = now()
  WHERE user_id = uid;

  INSERT INTO public.pet_arcade_rounds(
    user_id,
    user_pet_id,
    game_type,
    status,
    entry_coins,
    difficulty,
    server_seed,
    server_seed_hash,
    client_seed,
    nonce,
    day,
    metadata
  )
  VALUES(
    uid,
    v_pet,
    _game_type,
    'active',
    _entry,
    _difficulty,
    v_seed,
    encode(extensions.digest(v_seed, 'sha256'), 'hex'),
    v_client,
    v_nonce,
    v_today,
    COALESCE(_metadata, '{}'::jsonb)
  )
  RETURNING * INTO v_round;

  IF _entry > 0 THEN
    PERFORM public.log_coin_tx(
      uid,
      'pet_arcade_entry',
      'out',
      _entry,
      v_wallet.balance - _entry,
      'Entrada em ' || v_cfg.display_name,
      NULL,
      v_round.id,
      NULL
    );
  END IF;

  PERFORM public._pet_arcade_add_event(
    v_round.id,
    'started',
    jsonb_build_object('entry', _entry, 'difficulty', _difficulty)
  );

  RETURN v_round;
END;
$$;

REVOKE ALL ON FUNCTION public._pet_arcade_begin(text, integer, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;

