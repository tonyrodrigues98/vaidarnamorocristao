-- Pet Arcade: server-authoritative pet adventures using internal coins only.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.pet_arcade_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  treasure_active boolean NOT NULL DEFAULT true,
  flight_active boolean NOT NULL DEFAULT true,
  maintenance boolean NOT NULL DEFAULT false,
  min_entry integer NOT NULL DEFAULT 10 CHECK (min_entry > 0),
  max_entry integer NOT NULL DEFAULT 300 CHECK (max_entry >= min_entry),
  daily_round_limit integer NOT NULL DEFAULT 30 CHECK (daily_round_limit > 0),
  daily_reward_limit integer NOT NULL DEFAULT 2000 CHECK (daily_reward_limit >= 0),
  max_multiplier numeric(8,2) NOT NULL DEFAULT 20 CHECK (max_multiplier >= 1),
  treasure_grid_size integer NOT NULL DEFAULT 16 CHECK (treasure_grid_size BETWEEN 9 AND 36),
  treasure_difficulties jsonb NOT NULL DEFAULT '{"leve":3,"aventureiro":5,"radical":7}'::jsonb,
  explanatory_text text NOT NULL DEFAULT 'Aventuras do seu pet com moedas internas do app. Recolha sua recompensa antes do desafio terminar.',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.pet_arcade_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.pet_arcade_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_pet_id uuid NOT NULL REFERENCES public.user_pets_v2(id) ON DELETE RESTRICT,
  game_type text NOT NULL CHECK (game_type IN ('treasure','flight')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','collected','lost','cancelled')),
  entry_coins integer NOT NULL CHECK (entry_coins > 0),
  current_multiplier numeric(10,2) NOT NULL DEFAULT 1,
  reward_coins integer NOT NULL DEFAULT 0 CHECK (reward_coins >= 0),
  server_seed text NOT NULL,
  server_seed_hash text NOT NULL,
  client_seed text NOT NULL,
  nonce bigint NOT NULL,
  day date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pet_arcade_active_game_per_user_idx
  ON public.pet_arcade_rounds(user_id, game_type) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS pet_arcade_user_created_idx
  ON public.pet_arcade_rounds(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pet_arcade_day_idx
  ON public.pet_arcade_rounds(user_id, day);

CREATE TABLE IF NOT EXISTS public.pet_arcade_treasure_rounds (
  round_id uuid PRIMARY KEY REFERENCES public.pet_arcade_rounds(id) ON DELETE CASCADE,
  difficulty text NOT NULL CHECK (difficulty IN ('leve','aventureiro','radical')),
  grid_size integer NOT NULL CHECK (grid_size BETWEEN 9 AND 36),
  trap_count integer NOT NULL CHECK (trap_count > 0),
  trap_positions integer[] NOT NULL,
  revealed_positions integer[] NOT NULL DEFAULT '{}',
  safe_reveals integer NOT NULL DEFAULT 0 CHECK (safe_reveals >= 0)
);

CREATE TABLE IF NOT EXISTS public.pet_arcade_flight_rounds (
  round_id uuid PRIMARY KEY REFERENCES public.pet_arcade_rounds(id) ON DELETE CASCADE,
  final_multiplier numeric(10,2) NOT NULL CHECK (final_multiplier >= 1),
  auto_collect_multiplier numeric(10,2),
  ends_at timestamptz NOT NULL
);

ALTER TABLE public.pet_arcade_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_arcade_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_arcade_treasure_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_arcade_flight_rounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pet arcade config read" ON public.pet_arcade_config;
CREATE POLICY "pet arcade config read" ON public.pet_arcade_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pet arcade config admin manage" ON public.pet_arcade_config;
CREATE POLICY "pet arcade config admin manage" ON public.pet_arcade_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "pet arcade rounds admin read" ON public.pet_arcade_rounds;
CREATE POLICY "pet arcade rounds admin read" ON public.pet_arcade_rounds
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "pet arcade treasure admin read" ON public.pet_arcade_treasure_rounds;
CREATE POLICY "pet arcade treasure admin read" ON public.pet_arcade_treasure_rounds
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "pet arcade flight admin read" ON public.pet_arcade_flight_rounds;
CREATE POLICY "pet arcade flight admin read" ON public.pet_arcade_flight_rounds
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

GRANT SELECT ON public.pet_arcade_config TO authenticated;
GRANT SELECT ON public.pet_arcade_rounds, public.pet_arcade_treasure_rounds, public.pet_arcade_flight_rounds TO authenticated;
GRANT ALL ON public.pet_arcade_config, public.pet_arcade_rounds, public.pet_arcade_treasure_rounds, public.pet_arcade_flight_rounds TO service_role;

CREATE OR REPLACE FUNCTION public.pet_arcade_seed_unit(
  _server_seed text, _client_seed text, _nonce bigint, _counter integer
) RETURNS numeric
LANGUAGE sql IMMUTABLE STRICT SET search_path = public AS $$
  SELECT ((('x' || substr(encode(digest(
    _server_seed || ':' || _client_seed || ':' || _nonce::text || ':' || _counter::text,
    'sha256'
  ), 'hex'), 1, 8))::bit(32)::bigint)::numeric / 4294967296::numeric);
$$;

CREATE OR REPLACE FUNCTION public.pet_arcade_treasure_multiplier(
  _grid_size integer, _trap_count integer, _safe_reveals integer, _max numeric
) RETURNS numeric
LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = public AS $$
DECLARE
  v_safe integer := _grid_size - _trap_count;
  v_result numeric := 0.97;
  i integer;
BEGIN
  IF _safe_reveals <= 0 THEN RETURN 1.00; END IF;
  FOR i IN 0..(_safe_reveals - 1) LOOP
    v_result := v_result * ((_grid_size - i)::numeric / GREATEST(1, v_safe - i)::numeric);
  END LOOP;
  RETURN LEAST(_max, GREATEST(1.01, round(v_result, 2)));
END;
$$;

CREATE OR REPLACE FUNCTION public.pet_arcade_flight_multiplier_at(
  _started_at timestamptz, _at timestamptz, _max numeric
) RETURNS numeric
LANGUAGE sql IMMUTABLE STRICT SET search_path = public AS $$
  SELECT LEAST(_max, GREATEST(1.00,
    round(exp(GREATEST(0, extract(epoch FROM (_at - _started_at))) / 12.0)::numeric, 2)
  ));
$$;

CREATE OR REPLACE FUNCTION public.pet_arcade_settle_reward(
  _round_id uuid, _multiplier numeric, _title text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  v_round public.pet_arcade_rounds;
  v_cfg public.pet_arcade_config;
  v_wallet public.user_coins;
  v_daily_reward integer;
  v_raw integer;
  v_reward integer;
  v_new_balance integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO v_round FROM public.pet_arcade_rounds
    WHERE id = _round_id AND user_id = uid FOR UPDATE;
  IF v_round.id IS NULL THEN RAISE EXCEPTION 'round_not_found'; END IF;
  IF v_round.status <> 'active' THEN RAISE EXCEPTION 'round_already_finished'; END IF;

  SELECT * INTO v_cfg FROM public.pet_arcade_config WHERE id = 1;
  SELECT COALESCE(sum(reward_coins), 0)::integer INTO v_daily_reward
    FROM public.pet_arcade_rounds
    WHERE user_id = uid AND day = v_round.day AND status = 'collected' AND id <> v_round.id;

  INSERT INTO public.user_coins(user_id, balance) VALUES (uid, 100)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO v_wallet FROM public.user_coins WHERE user_id = uid FOR UPDATE;

  v_raw := GREATEST(0, floor(v_round.entry_coins * LEAST(_multiplier, v_cfg.max_multiplier))::integer);
  v_reward := LEAST(
    v_raw,
    GREATEST(0, v_cfg.daily_reward_limit - v_daily_reward),
    GREATEST(0, 500 - v_wallet.balance)
  );
  v_new_balance := v_wallet.balance + v_reward;

  UPDATE public.user_coins SET balance = v_new_balance, updated_at = now() WHERE user_id = uid;
  UPDATE public.pet_arcade_rounds
    SET status = 'collected', current_multiplier = round(_multiplier, 2),
        reward_coins = v_reward, ended_at = now()
    WHERE id = v_round.id;

  IF v_reward > 0 THEN
    PERFORM public.log_coin_tx(
      uid, 'pet_arcade_reward', 'in', v_reward, v_new_balance,
      _title, round(_multiplier, 2)::text || 'x', v_round.id, NULL
    );
  END IF;

  RETURN jsonb_build_object(
    'status','collected','round_id',v_round.id,'multiplier',round(_multiplier,2),
    'reward_coins',v_reward,'new_balance',v_new_balance,'raw_reward',v_raw,
    'reward_limited',v_reward < v_raw
  );
END;
$$;

REVOKE ALL ON FUNCTION public.pet_arcade_settle_reward(uuid,numeric,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_pet_arcade_config()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT to_jsonb(c) FROM public.pet_arcade_config c WHERE id = 1;
$$;

CREATE OR REPLACE FUNCTION public.start_pet_arcade_treasure(
  _entry_coins integer, _difficulty text, _client_seed text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  v_cfg public.pet_arcade_config;
  v_pet_id uuid;
  v_wallet public.user_coins;
  v_round_id uuid := gen_random_uuid();
  v_seed text := encode(gen_random_bytes(32),'hex');
  v_client text;
  v_nonce bigint;
  v_traps integer;
  v_positions integer[] := '{}';
  v_position integer;
  v_counter integer := 0;
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(uid::text));
  SELECT * INTO v_cfg FROM public.pet_arcade_config WHERE id = 1;
  IF v_cfg.maintenance OR NOT v_cfg.treasure_active THEN RAISE EXCEPTION 'game_unavailable'; END IF;
  IF _entry_coins IS NULL OR _entry_coins < v_cfg.min_entry OR _entry_coins > v_cfg.max_entry THEN
    RAISE EXCEPTION 'invalid_entry';
  END IF;
  IF NOT (v_cfg.treasure_difficulties ? _difficulty) THEN RAISE EXCEPTION 'invalid_difficulty'; END IF;

  SELECT id INTO v_pet_id FROM public.user_pets_v2
    WHERE user_id = uid AND is_equipped = true ORDER BY updated_at DESC LIMIT 1;
  IF v_pet_id IS NULL THEN RAISE EXCEPTION 'pet_required'; END IF;
  IF EXISTS (SELECT 1 FROM public.pet_arcade_rounds WHERE user_id=uid AND game_type='treasure' AND status='active') THEN
    RAISE EXCEPTION 'round_in_progress';
  END IF;
  IF (SELECT count(*) FROM public.pet_arcade_rounds WHERE user_id=uid AND day=v_today) >= v_cfg.daily_round_limit THEN
    RAISE EXCEPTION 'daily_round_limit';
  END IF;

  INSERT INTO public.user_coins(user_id,balance) VALUES(uid,100) ON CONFLICT(user_id) DO NOTHING;
  SELECT * INTO v_wallet FROM public.user_coins WHERE user_id=uid FOR UPDATE;
  IF v_wallet.balance < _entry_coins THEN RAISE EXCEPTION 'insufficient_coins'; END IF;

  v_client := COALESCE(NULLIF(trim(_client_seed),''), encode(digest(uid::text || clock_timestamp()::text,'sha256'),'hex'));
  SELECT COALESCE(max(nonce),0)+1 INTO v_nonce FROM public.pet_arcade_rounds WHERE user_id=uid;
  v_traps := (v_cfg.treasure_difficulties ->> _difficulty)::integer;
  IF v_traps <= 0 OR v_traps >= v_cfg.treasure_grid_size THEN RAISE EXCEPTION 'invalid_game_config'; END IF;

  WHILE cardinality(v_positions) < v_traps LOOP
    v_position := floor(public.pet_arcade_seed_unit(v_seed,v_client,v_nonce,v_counter) * v_cfg.treasure_grid_size)::integer;
    IF NOT (v_position = ANY(v_positions)) THEN v_positions := array_append(v_positions,v_position); END IF;
    v_counter := v_counter + 1;
    IF v_counter > 500 THEN RAISE EXCEPTION 'seed_generation_failed'; END IF;
  END LOOP;

  UPDATE public.user_coins SET balance=v_wallet.balance-_entry_coins, updated_at=now() WHERE user_id=uid;
  INSERT INTO public.pet_arcade_rounds(
    id,user_id,user_pet_id,game_type,entry_coins,server_seed,server_seed_hash,client_seed,nonce,day
  ) VALUES (
    v_round_id,uid,v_pet_id,'treasure',_entry_coins,v_seed,encode(digest(v_seed,'sha256'),'hex'),v_client,v_nonce,v_today
  );
  INSERT INTO public.pet_arcade_treasure_rounds(round_id,difficulty,grid_size,trap_count,trap_positions)
    VALUES(v_round_id,_difficulty,v_cfg.treasure_grid_size,v_traps,v_positions);
  PERFORM public.log_coin_tx(uid,'pet_arcade_entry','out',_entry_coins,v_wallet.balance-_entry_coins,
    'Entrada no Campo de Tesouros',initcap(_difficulty),v_round_id,NULL);

  RETURN jsonb_build_object(
    'round_id',v_round_id,'status','active','difficulty',_difficulty,
    'grid_size',v_cfg.treasure_grid_size,'trap_count',v_traps,'revealed_positions','[]'::jsonb,
    'multiplier',1.00,'potential_reward',_entry_coins,'new_balance',v_wallet.balance-_entry_coins,
    'server_seed_hash',encode(digest(v_seed,'sha256'),'hex'),'client_seed',v_client,'nonce',v_nonce
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reveal_pet_arcade_treasure(
  _round_id uuid, _position integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  v_round public.pet_arcade_rounds;
  v_game public.pet_arcade_treasure_rounds;
  v_cfg public.pet_arcade_config;
  v_multiplier numeric;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO v_round FROM public.pet_arcade_rounds
    WHERE id=_round_id AND user_id=uid AND game_type='treasure' FOR UPDATE;
  IF v_round.id IS NULL THEN RAISE EXCEPTION 'round_not_found'; END IF;
  IF v_round.status <> 'active' THEN RAISE EXCEPTION 'round_already_finished'; END IF;
  SELECT * INTO v_game FROM public.pet_arcade_treasure_rounds WHERE round_id=_round_id FOR UPDATE;
  IF _position < 0 OR _position >= v_game.grid_size THEN RAISE EXCEPTION 'invalid_position'; END IF;
  IF _position = ANY(v_game.revealed_positions) THEN RAISE EXCEPTION 'position_already_revealed'; END IF;

  UPDATE public.pet_arcade_treasure_rounds
    SET revealed_positions=array_append(revealed_positions,_position)
    WHERE round_id=_round_id;

  IF _position = ANY(v_game.trap_positions) THEN
    UPDATE public.pet_arcade_rounds SET status='lost',ended_at=now() WHERE id=_round_id;
    RETURN jsonb_build_object(
      'round_id',_round_id,'status','lost','position',_position,'is_trap',true,
      'multiplier',v_round.current_multiplier,'reward_coins',0,
      'trap_positions',to_jsonb(v_game.trap_positions),'server_seed',v_round.server_seed,
      'server_seed_hash',v_round.server_seed_hash,'client_seed',v_round.client_seed,'nonce',v_round.nonce
    );
  END IF;

  SELECT * INTO v_cfg FROM public.pet_arcade_config WHERE id=1;
  v_multiplier := public.pet_arcade_treasure_multiplier(
    v_game.grid_size,v_game.trap_count,v_game.safe_reveals+1,v_cfg.max_multiplier
  );
  UPDATE public.pet_arcade_treasure_rounds SET safe_reveals=safe_reveals+1 WHERE round_id=_round_id;
  UPDATE public.pet_arcade_rounds SET current_multiplier=v_multiplier WHERE id=_round_id;

  RETURN jsonb_build_object(
    'round_id',_round_id,'status','active','position',_position,'is_trap',false,
    'safe_reveals',v_game.safe_reveals+1,'multiplier',v_multiplier,
    'potential_reward',LEAST(500,floor(v_round.entry_coins*v_multiplier)::integer)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.collect_pet_arcade_treasure(_round_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  v_round public.pet_arcade_rounds;
  v_game public.pet_arcade_treasure_rounds;
  v_result jsonb;
BEGIN
  SELECT * INTO v_round FROM public.pet_arcade_rounds
    WHERE id=_round_id AND user_id=uid AND game_type='treasure' FOR UPDATE;
  IF v_round.id IS NULL THEN RAISE EXCEPTION 'round_not_found'; END IF;
  IF v_round.status <> 'active' THEN RAISE EXCEPTION 'round_already_finished'; END IF;
  SELECT * INTO v_game FROM public.pet_arcade_treasure_rounds WHERE round_id=_round_id;
  IF v_game.safe_reveals < 1 THEN RAISE EXCEPTION 'nothing_to_collect'; END IF;
  v_result := public.pet_arcade_settle_reward(_round_id,v_round.current_multiplier,'Tesouro recolhido');
  RETURN v_result || jsonb_build_object(
    'trap_positions',to_jsonb(v_game.trap_positions),'server_seed',v_round.server_seed,
    'server_seed_hash',v_round.server_seed_hash,'client_seed',v_round.client_seed,'nonce',v_round.nonce
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.start_pet_arcade_flight(
  _entry_coins integer, _auto_collect_multiplier numeric DEFAULT NULL, _client_seed text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  v_cfg public.pet_arcade_config;
  v_pet_id uuid;
  v_wallet public.user_coins;
  v_round_id uuid := gen_random_uuid();
  v_seed text := encode(gen_random_bytes(32),'hex');
  v_client text;
  v_nonce bigint;
  v_unit numeric;
  v_final numeric;
  v_started timestamptz := clock_timestamp();
  v_ends timestamptz;
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(uid::text));
  SELECT * INTO v_cfg FROM public.pet_arcade_config WHERE id=1;
  IF v_cfg.maintenance OR NOT v_cfg.flight_active THEN RAISE EXCEPTION 'game_unavailable'; END IF;
  IF _entry_coins IS NULL OR _entry_coins < v_cfg.min_entry OR _entry_coins > v_cfg.max_entry THEN RAISE EXCEPTION 'invalid_entry'; END IF;
  IF _auto_collect_multiplier IS NOT NULL AND (_auto_collect_multiplier < 1.01 OR _auto_collect_multiplier > v_cfg.max_multiplier) THEN
    RAISE EXCEPTION 'invalid_auto_collect';
  END IF;
  SELECT id INTO v_pet_id FROM public.user_pets_v2
    WHERE user_id=uid AND is_equipped=true ORDER BY updated_at DESC LIMIT 1;
  IF v_pet_id IS NULL THEN RAISE EXCEPTION 'pet_required'; END IF;
  IF EXISTS (SELECT 1 FROM public.pet_arcade_rounds WHERE user_id=uid AND game_type='flight' AND status='active') THEN
    RAISE EXCEPTION 'round_in_progress';
  END IF;
  IF (SELECT count(*) FROM public.pet_arcade_rounds WHERE user_id=uid AND day=v_today) >= v_cfg.daily_round_limit THEN
    RAISE EXCEPTION 'daily_round_limit';
  END IF;

  INSERT INTO public.user_coins(user_id,balance) VALUES(uid,100) ON CONFLICT(user_id) DO NOTHING;
  SELECT * INTO v_wallet FROM public.user_coins WHERE user_id=uid FOR UPDATE;
  IF v_wallet.balance < _entry_coins THEN RAISE EXCEPTION 'insufficient_coins'; END IF;
  v_client := COALESCE(NULLIF(trim(_client_seed),''),encode(digest(uid::text||clock_timestamp()::text,'sha256'),'hex'));
  SELECT COALESCE(max(nonce),0)+1 INTO v_nonce FROM public.pet_arcade_rounds WHERE user_id=uid;
  v_unit := GREATEST(0.000001,public.pet_arcade_seed_unit(v_seed,v_client,v_nonce,0));
  v_final := LEAST(v_cfg.max_multiplier,GREATEST(1.01,round((0.97/v_unit)::numeric,2)));
  v_ends := v_started + make_interval(secs => (ln(v_final::double precision)*12.0));

  UPDATE public.user_coins SET balance=v_wallet.balance-_entry_coins,updated_at=now() WHERE user_id=uid;
  INSERT INTO public.pet_arcade_rounds(
    id,user_id,user_pet_id,game_type,entry_coins,server_seed,server_seed_hash,client_seed,nonce,day,started_at
  ) VALUES(v_round_id,uid,v_pet_id,'flight',_entry_coins,v_seed,encode(digest(v_seed,'sha256'),'hex'),v_client,v_nonce,v_today,v_started);
  INSERT INTO public.pet_arcade_flight_rounds(round_id,final_multiplier,auto_collect_multiplier,ends_at)
    VALUES(v_round_id,v_final,_auto_collect_multiplier,v_ends);
  PERFORM public.log_coin_tx(uid,'pet_arcade_entry','out',_entry_coins,v_wallet.balance-_entry_coins,
    'Entrada no Voo Estelar',NULL,v_round_id,NULL);

  RETURN jsonb_build_object(
    'round_id',v_round_id,'status','active','started_at',v_started,'server_now',clock_timestamp(),
    'multiplier',1.00,'auto_collect_multiplier',_auto_collect_multiplier,
    'new_balance',v_wallet.balance-_entry_coins,'server_seed_hash',encode(digest(v_seed,'sha256'),'hex'),
    'client_seed',v_client,'nonce',v_nonce
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.collect_pet_arcade_flight(_round_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  v_round public.pet_arcade_rounds;
  v_game public.pet_arcade_flight_rounds;
  v_multiplier numeric;
  v_result jsonb;
BEGIN
  SELECT * INTO v_round FROM public.pet_arcade_rounds
    WHERE id=_round_id AND user_id=uid AND game_type='flight' FOR UPDATE;
  IF v_round.id IS NULL THEN RAISE EXCEPTION 'round_not_found'; END IF;
  IF v_round.status <> 'active' THEN RAISE EXCEPTION 'round_already_finished'; END IF;
  SELECT * INTO v_game FROM public.pet_arcade_flight_rounds WHERE round_id=_round_id;
  IF clock_timestamp() >= v_game.ends_at THEN
    UPDATE public.pet_arcade_rounds SET status='lost',ended_at=clock_timestamp(),current_multiplier=v_game.final_multiplier WHERE id=_round_id;
    RETURN jsonb_build_object('round_id',_round_id,'status','lost','multiplier',v_game.final_multiplier,'reward_coins',0,
      'server_seed',v_round.server_seed,'server_seed_hash',v_round.server_seed_hash,'client_seed',v_round.client_seed,'nonce',v_round.nonce);
  END IF;
  v_multiplier := LEAST(v_game.final_multiplier,public.pet_arcade_flight_multiplier_at(v_round.started_at,clock_timestamp(),v_game.final_multiplier));
  v_result := public.pet_arcade_settle_reward(_round_id,v_multiplier,'Voo Estelar recolhido');
  RETURN v_result || jsonb_build_object(
    'server_seed',v_round.server_seed,'server_seed_hash',v_round.server_seed_hash,
    'client_seed',v_round.client_seed,'nonce',v_round.nonce
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_pet_arcade_flight(_round_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  v_round public.pet_arcade_rounds;
  v_game public.pet_arcade_flight_rounds;
  v_auto_at timestamptz;
  v_current numeric;
  v_result jsonb;
BEGIN
  SELECT * INTO v_round FROM public.pet_arcade_rounds
    WHERE id=_round_id AND user_id=uid AND game_type='flight' FOR UPDATE;
  IF v_round.id IS NULL THEN RAISE EXCEPTION 'round_not_found'; END IF;
  SELECT * INTO v_game FROM public.pet_arcade_flight_rounds WHERE round_id=_round_id;
  IF v_round.status <> 'active' THEN
    RETURN jsonb_build_object('round_id',_round_id,'status',v_round.status,'multiplier',v_round.current_multiplier,'reward_coins',v_round.reward_coins);
  END IF;

  IF v_game.auto_collect_multiplier IS NOT NULL AND v_game.auto_collect_multiplier <= v_game.final_multiplier THEN
    v_auto_at := v_round.started_at + make_interval(secs => ln(v_game.auto_collect_multiplier::double precision)*12.0);
    IF clock_timestamp() >= v_auto_at THEN
      v_result := public.pet_arcade_settle_reward(_round_id,v_game.auto_collect_multiplier,'Voo Estelar recolhido automaticamente');
      RETURN v_result || jsonb_build_object(
        'server_seed',v_round.server_seed,'server_seed_hash',v_round.server_seed_hash,
        'client_seed',v_round.client_seed,'nonce',v_round.nonce
      );
    END IF;
  END IF;

  IF clock_timestamp() >= v_game.ends_at THEN
    UPDATE public.pet_arcade_rounds SET status='lost',ended_at=clock_timestamp(),current_multiplier=v_game.final_multiplier WHERE id=_round_id;
    RETURN jsonb_build_object(
      'round_id',_round_id,'status','lost','multiplier',v_game.final_multiplier,'reward_coins',0,
      'server_seed',v_round.server_seed,'server_seed_hash',v_round.server_seed_hash,
      'client_seed',v_round.client_seed,'nonce',v_round.nonce
    );
  END IF;

  v_current := public.pet_arcade_flight_multiplier_at(v_round.started_at,clock_timestamp(),v_game.final_multiplier);
  RETURN jsonb_build_object('round_id',_round_id,'status','active','multiplier',v_current,'server_now',clock_timestamp());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_pet_arcade_history(_limit integer DEFAULT 20)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(row_data ORDER BY created_at DESC),'[]'::jsonb)
  FROM (
    SELECT r.created_at,
      jsonb_build_object(
        'id',r.id,'game_type',r.game_type,'status',r.status,'entry_coins',r.entry_coins,
        'multiplier',r.current_multiplier,'reward_coins',r.reward_coins,'started_at',r.started_at,
        'ended_at',r.ended_at,'server_seed_hash',r.server_seed_hash,
        'server_seed',CASE WHEN r.status='active' THEN NULL ELSE r.server_seed END,
        'client_seed',r.client_seed,'nonce',r.nonce,
        'difficulty',t.difficulty,
        'trap_positions',CASE WHEN r.status='active' THEN NULL ELSE to_jsonb(t.trap_positions) END,
        'final_multiplier',CASE WHEN r.status='active' THEN NULL ELSE f.final_multiplier END
      ) AS row_data
    FROM public.pet_arcade_rounds r
    LEFT JOIN public.pet_arcade_treasure_rounds t ON t.round_id=r.id
    LEFT JOIN public.pet_arcade_flight_rounds f ON f.round_id=r.id
    WHERE r.user_id=auth.uid()
    ORDER BY r.created_at DESC
    LIMIT LEAST(GREATEST(COALESCE(_limit,20),1),50)
  ) q;
$$;

CREATE OR REPLACE FUNCTION public.get_pet_arcade_active_rounds()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(row_data ORDER BY started_at DESC),'[]'::jsonb)
  FROM (
    SELECT r.started_at,
      jsonb_build_object(
        'round_id',r.id,'game_type',r.game_type,'status',r.status,
        'entry_coins',r.entry_coins,'multiplier',r.current_multiplier,
        'started_at',r.started_at,'server_seed_hash',r.server_seed_hash,
        'client_seed',r.client_seed,'nonce',r.nonce,
        'difficulty',t.difficulty,'grid_size',t.grid_size,'trap_count',t.trap_count,
        'revealed_positions',to_jsonb(t.revealed_positions),'safe_reveals',t.safe_reveals,
        'auto_collect_multiplier',f.auto_collect_multiplier
      ) AS row_data
    FROM public.pet_arcade_rounds r
    LEFT JOIN public.pet_arcade_treasure_rounds t ON t.round_id=r.id
    LEFT JOIN public.pet_arcade_flight_rounds f ON f.round_id=r.id
    WHERE r.user_id=auth.uid() AND r.status='active'
  ) q;
$$;

CREATE OR REPLACE FUNCTION public.pet_arcade_admin_update_config(_patch jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.pet_arcade_config;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.pet_arcade_config SET
    treasure_active=COALESCE((_patch->>'treasure_active')::boolean,treasure_active),
    flight_active=COALESCE((_patch->>'flight_active')::boolean,flight_active),
    maintenance=COALESCE((_patch->>'maintenance')::boolean,maintenance),
    min_entry=COALESCE((_patch->>'min_entry')::integer,min_entry),
    max_entry=COALESCE((_patch->>'max_entry')::integer,max_entry),
    daily_round_limit=COALESCE((_patch->>'daily_round_limit')::integer,daily_round_limit),
    daily_reward_limit=COALESCE((_patch->>'daily_reward_limit')::integer,daily_reward_limit),
    max_multiplier=COALESCE((_patch->>'max_multiplier')::numeric,max_multiplier),
    explanatory_text=COALESCE(_patch->>'explanatory_text',explanatory_text),
    updated_at=now()
  WHERE id=1 RETURNING * INTO v_row;
  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.pet_arcade_admin_recent_rounds(_limit integer DEFAULT 100)
RETURNS SETOF public.pet_arcade_rounds
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT * FROM public.pet_arcade_rounds ORDER BY created_at DESC LIMIT LEAST(GREATEST(COALESCE(_limit,100),1),500);
END;
$$;

CREATE OR REPLACE FUNCTION public.pet_arcade_admin_user_signals()
RETURNS TABLE(user_id uuid, rounds_7d bigint, total_entries bigint, total_rewards bigint, net_coins bigint, high_activity boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT r.user_id,count(*),sum(r.entry_coins)::bigint,sum(r.reward_coins)::bigint,
    (sum(r.reward_coins)-sum(r.entry_coins))::bigint,(count(*) >= 20)
  FROM public.pet_arcade_rounds r
  WHERE r.created_at >= now()-interval '7 days'
  GROUP BY r.user_id
  HAVING count(*) >= 10 OR abs(sum(r.reward_coins)-sum(r.entry_coins)) >= 500
  ORDER BY count(*) DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.pet_arcade_seed_unit(text,text,bigint,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pet_arcade_treasure_multiplier(integer,integer,integer,numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pet_arcade_flight_multiplier_at(timestamptz,timestamptz,numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_pet_arcade_config() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.start_pet_arcade_treasure(integer,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reveal_pet_arcade_treasure(uuid,integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.collect_pet_arcade_treasure(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.start_pet_arcade_flight(integer,numeric,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.collect_pet_arcade_flight(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finalize_pet_arcade_flight(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_pet_arcade_history(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_pet_arcade_active_rounds() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pet_arcade_admin_update_config(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pet_arcade_admin_recent_rounds(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pet_arcade_admin_user_signals() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_pet_arcade_config() TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_pet_arcade_treasure(integer,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reveal_pet_arcade_treasure(uuid,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.collect_pet_arcade_treasure(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_pet_arcade_flight(integer,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.collect_pet_arcade_flight(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_pet_arcade_flight(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pet_arcade_history(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pet_arcade_active_rounds() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pet_arcade_admin_update_config(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pet_arcade_admin_recent_rounds(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pet_arcade_admin_user_signals() TO authenticated;
