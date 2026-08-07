-- Unifica pagamentos do Pet Arcade. O saldo de 500 moedas era um teto legado
-- de recompensas gratuitas e nao deve anular recompensas de rodadas pagas.

ALTER TABLE public.user_coins
  DROP CONSTRAINT IF EXISTS balance_max_500;

CREATE OR REPLACE FUNCTION public._pet_arcade_finish(
  _game_id uuid,
  _status text,
  _multiplier numeric,
  _summary jsonb,
  _xp integer DEFAULT 0,
  _reward_override integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_round public.pet_arcade_rounds;
  v_cfg public.pet_arcade_game_configs;
  v_settings public.pet_arcade_settings;
  v_wallet public.user_coins;
  v_global integer;
  v_game integer;
  v_raw integer := 0;
  v_reward integer := 0;
  v_balance integer;
  v_xp jsonb;
  v_xp_granted integer := 0;
BEGIN
  SELECT * INTO v_round
  FROM public.pet_arcade_rounds
  WHERE id = _game_id AND user_id = uid
  FOR UPDATE;

  IF v_round.id IS NULL THEN RAISE EXCEPTION 'round_not_found'; END IF;
  IF v_round.status <> 'active' THEN RAISE EXCEPTION 'round_already_finished'; END IF;
  IF _status NOT IN ('collected', 'lost', 'cancelled') THEN RAISE EXCEPTION 'invalid_status'; END IF;

  SELECT * INTO v_cfg
  FROM public.pet_arcade_game_configs
  WHERE game_type = v_round.game_type;

  SELECT * INTO v_settings
  FROM public.pet_arcade_settings
  WHERE id = 1;

  SELECT COALESCE(sum(reward_coins), 0)::integer INTO v_global
  FROM public.pet_arcade_rounds
  WHERE user_id = uid
    AND day = v_round.day
    AND status = 'collected'
    AND id <> v_round.id;

  SELECT COALESCE(sum(reward_coins), 0)::integer INTO v_game
  FROM public.pet_arcade_rounds
  WHERE user_id = uid
    AND game_type = v_round.game_type
    AND day = v_round.day
    AND status = 'collected'
    AND id <> v_round.id;

  INSERT INTO public.user_coins(user_id, balance)
  VALUES(uid, 100)
  ON CONFLICT(user_id) DO NOTHING;

  SELECT * INTO v_wallet
  FROM public.user_coins
  WHERE user_id = uid
  FOR UPDATE;

  IF _status = 'collected' THEN
    v_raw := GREATEST(
      0,
      COALESCE(
        _reward_override,
        floor(v_round.entry_coins * LEAST(_multiplier, v_cfg.max_multiplier))::integer
      )
    );
    v_reward := LEAST(
      v_raw,
      GREATEST(0, v_settings.daily_win_limit - v_global),
      GREATEST(0, v_cfg.daily_win_limit - v_game)
    );
  END IF;

  v_balance := v_wallet.balance + v_reward;

  IF _xp > 0 THEN
    BEGIN
      v_xp := public.award_xp(
        'pet_arcade',
        _xp,
        NULL,
        jsonb_build_object('game_id', v_round.id, 'game_type', v_round.game_type)
      );
      v_xp_granted := COALESCE((v_xp->>'granted')::integer, 0);
    EXCEPTION WHEN OTHERS THEN
      v_xp := '{}'::jsonb;
      v_xp_granted := 0;
    END;
  END IF;

  UPDATE public.user_coins
  SET balance = v_balance, updated_at = now()
  WHERE user_id = uid;

  UPDATE public.pet_arcade_rounds
  SET status = _status,
      current_multiplier = round(_multiplier, 2),
      final_multiplier = round(_multiplier, 2),
      reward_coins = v_reward,
      xp_reward = v_xp_granted,
      result_summary = COALESCE(_summary, '{}'::jsonb),
      ended_at = now(),
      updated_at = now()
  WHERE id = v_round.id;

  IF v_reward > 0 THEN
    PERFORM public.log_coin_tx(
      uid,
      'pet_arcade_reward',
      'in',
      v_reward,
      v_balance,
      'Recompensa em ' || v_cfg.display_name,
      round(_multiplier, 2)::text || 'x',
      v_round.id,
      NULL
    );
  END IF;

  PERFORM public._pet_arcade_add_event(
    v_round.id,
    'finished',
    COALESCE(_summary, '{}'::jsonb) || jsonb_build_object(
      'status', _status,
      'raw_reward', v_raw,
      'reward', v_reward,
      'xp', v_xp_granted
    )
  );

  RETURN jsonb_build_object(
    'game_id', v_round.id,
    'round_id', v_round.id,
    'game_type', v_round.game_type,
    'status', _status,
    'multiplier', round(_multiplier, 2),
    'raw_reward', v_raw,
    'reward_coins', v_reward,
    'xp_reward', v_xp_granted,
    'new_balance', v_balance,
    'result', COALESCE(_summary, '{}'::jsonb),
    'server_seed', v_round.server_seed,
    'server_seed_hash', v_round.server_seed_hash,
    'client_seed', v_round.client_seed,
    'nonce', v_round.nonce,
    'reward_limited', v_reward < v_raw
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.pet_arcade_settle_reward(
  _round_id uuid,
  _multiplier numeric,
  _title text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_round public.pet_arcade_rounds;
  v_legacy public.pet_arcade_config;
  v_settings public.pet_arcade_settings;
  v_game public.pet_arcade_game_configs;
  v_wallet public.user_coins;
  v_global_reward integer;
  v_game_reward integer;
  v_raw integer;
  v_reward integer;
  v_new_balance integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO v_round
  FROM public.pet_arcade_rounds
  WHERE id = _round_id AND user_id = uid
  FOR UPDATE;

  IF v_round.id IS NULL THEN RAISE EXCEPTION 'round_not_found'; END IF;
  IF v_round.status <> 'active' THEN RAISE EXCEPTION 'round_already_finished'; END IF;

  SELECT * INTO v_legacy FROM public.pet_arcade_config WHERE id = 1;
  SELECT * INTO v_settings FROM public.pet_arcade_settings WHERE id = 1;
  SELECT * INTO v_game FROM public.pet_arcade_game_configs WHERE game_type = v_round.game_type;

  SELECT COALESCE(sum(reward_coins), 0)::integer INTO v_global_reward
  FROM public.pet_arcade_rounds
  WHERE user_id = uid
    AND day = v_round.day
    AND status = 'collected'
    AND id <> v_round.id;

  SELECT COALESCE(sum(reward_coins), 0)::integer INTO v_game_reward
  FROM public.pet_arcade_rounds
  WHERE user_id = uid
    AND game_type = v_round.game_type
    AND day = v_round.day
    AND status = 'collected'
    AND id <> v_round.id;

  INSERT INTO public.user_coins(user_id, balance)
  VALUES(uid, 100)
  ON CONFLICT(user_id) DO NOTHING;

  SELECT * INTO v_wallet
  FROM public.user_coins
  WHERE user_id = uid
  FOR UPDATE;

  v_raw := GREATEST(
    0,
    floor(v_round.entry_coins * LEAST(_multiplier, v_legacy.max_multiplier))::integer
  );
  v_reward := LEAST(
    v_raw,
    GREATEST(0, v_settings.daily_win_limit - v_global_reward),
    GREATEST(0, v_game.daily_win_limit - v_game_reward)
  );
  v_new_balance := v_wallet.balance + v_reward;

  UPDATE public.user_coins
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = uid;

  UPDATE public.pet_arcade_rounds
  SET status = 'collected',
      current_multiplier = round(_multiplier, 2),
      final_multiplier = round(_multiplier, 2),
      reward_coins = v_reward,
      ended_at = now(),
      updated_at = now()
  WHERE id = v_round.id;

  IF v_reward > 0 THEN
    PERFORM public.log_coin_tx(
      uid,
      'pet_arcade_reward',
      'in',
      v_reward,
      v_new_balance,
      _title,
      round(_multiplier, 2)::text || 'x',
      v_round.id,
      NULL
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'collected',
    'round_id', v_round.id,
    'multiplier', round(_multiplier, 2),
    'reward_coins', v_reward,
    'new_balance', v_new_balance,
    'raw_reward', v_raw,
    'reward_limited', v_reward < v_raw
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_pet_piggybank(_game_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.pet_arcade_rounds;
  c public.pet_arcade_game_configs;
  wallet public.user_coins;
  bonus integer;
  reward integer;
  v_balance integer;
  xp integer;
  xp_result jsonb;
BEGIN
  SELECT * INTO r FROM public.pet_arcade_rounds
  WHERE id = _game_id AND user_id = auth.uid() AND game_type = 'piggybank'
  FOR UPDATE;
  IF r.id IS NULL OR r.status <> 'active' THEN RAISE EXCEPTION 'round_not_found'; END IF;
  IF now() < (r.metadata->>'unlock_at')::timestamptz THEN RAISE EXCEPTION 'piggybank_not_ready'; END IF;

  SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type = 'piggybank';
  SELECT * INTO wallet FROM public.user_coins WHERE user_id = auth.uid() FOR UPDATE;
  bonus := floor(r.entry_coins * (r.metadata->>'bonus_percent')::numeric / 100)::integer;
  reward := r.entry_coins + bonus;
  v_balance := wallet.balance + reward;
  xp := COALESCE((c.reward_config->>'xp')::integer, 15);

  BEGIN
    xp_result := public.award_xp('pet_arcade', xp, NULL, jsonb_build_object('game_id', r.id, 'game_type', 'piggybank'));
    xp := COALESCE((xp_result->>'granted')::integer, 0);
  EXCEPTION WHEN OTHERS THEN
    xp := 0;
  END;

  UPDATE public.user_coins SET balance = v_balance, updated_at = now() WHERE user_id = auth.uid();
  UPDATE public.pet_arcade_rounds
  SET status = 'collected', reward_coins = reward, xp_reward = xp,
      current_multiplier = 1 + (r.metadata->>'bonus_percent')::numeric / 100,
      final_multiplier = 1 + (r.metadata->>'bonus_percent')::numeric / 100,
      result_summary = jsonb_build_object('deposit', r.entry_coins, 'bonus', bonus, 'unlock_at', r.metadata->>'unlock_at'),
      ended_at = now(), updated_at = now()
  WHERE id = r.id;

  PERFORM public.log_coin_tx(auth.uid(), 'pet_arcade_piggybank', 'in', reward, v_balance, 'Cofrinho do Pet aberto', NULL, r.id, NULL);
  RETURN public._pet_arcade_result(r.id) || jsonb_build_object('new_balance', v_balance);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_pet_piggybank(_game_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.pet_arcade_rounds;
  c public.pet_arcade_game_configs;
  wallet public.user_coins;
  penalty integer;
  refund integer;
  v_balance integer;
BEGIN
  SELECT * INTO r FROM public.pet_arcade_rounds
  WHERE id = _game_id AND user_id = auth.uid() AND game_type = 'piggybank'
  FOR UPDATE;
  IF r.id IS NULL OR r.status <> 'active' THEN RAISE EXCEPTION 'round_not_found'; END IF;

  SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type = 'piggybank';
  IF NOT COALESCE((c.difficulty_config->>'allow_cancel')::boolean, false) THEN
    RAISE EXCEPTION 'cancel_not_allowed';
  END IF;

  penalty := floor(r.entry_coins * COALESCE((c.difficulty_config->>'cancel_penalty_percent')::numeric, 0) / 100)::integer;
  refund := GREATEST(0, r.entry_coins - penalty);
  SELECT * INTO wallet FROM public.user_coins WHERE user_id = auth.uid() FOR UPDATE;
  v_balance := wallet.balance + refund;

  UPDATE public.user_coins SET balance = v_balance, updated_at = now() WHERE user_id = auth.uid();
  UPDATE public.pet_arcade_rounds
  SET status = 'cancelled', reward_coins = refund,
      result_summary = jsonb_build_object('deposit', r.entry_coins, 'refund', refund, 'penalty', penalty),
      ended_at = now(), updated_at = now()
  WHERE id = r.id;

  IF refund > 0 THEN
    PERFORM public.log_coin_tx(auth.uid(), 'pet_arcade_piggybank_refund', 'in', refund, v_balance, 'Cofrinho do Pet encerrado', NULL, r.id, NULL);
  END IF;
  RETURN public._pet_arcade_result(r.id) || jsonb_build_object('new_balance', v_balance);
END;
$$;

REVOKE ALL ON FUNCTION public._pet_arcade_finish(uuid, text, numeric, jsonb, integer, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pet_arcade_settle_reward(uuid, numeric, text)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_pet_arcade_reward_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.daily_win_limit IS DISTINCT FROM OLD.daily_win_limit THEN
    UPDATE public.pet_arcade_config
    SET daily_reward_limit = NEW.daily_win_limit, updated_at = now()
    WHERE id = 1;

    -- Mantem configuracoes explicitamente personalizadas por jogo.
    UPDATE public.pet_arcade_game_configs
    SET daily_win_limit = NEW.daily_win_limit, updated_at = now()
    WHERE daily_win_limit IN (2000, OLD.daily_win_limit);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pet_arcade_reward_limits_sync_trg ON public.pet_arcade_settings;
CREATE TRIGGER pet_arcade_reward_limits_sync_trg
AFTER UPDATE OF daily_win_limit ON public.pet_arcade_settings
FOR EACH ROW
EXECUTE FUNCTION public.sync_pet_arcade_reward_limits();

REVOKE ALL ON FUNCTION public.sync_pet_arcade_reward_limits()
  FROM PUBLIC, anon, authenticated;
