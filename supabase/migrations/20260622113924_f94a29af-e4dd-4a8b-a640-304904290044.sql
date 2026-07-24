-- Expansao do Pet Arcade: configuracao por jogo, eventos auditaveis e novas aventuras.

ALTER TABLE public.pet_arcade_rounds
  DROP CONSTRAINT IF EXISTS pet_arcade_rounds_game_type_check;
ALTER TABLE public.pet_arcade_rounds
  ADD CONSTRAINT pet_arcade_rounds_game_type_check CHECK (game_type IN (
    'treasure','flight','plinko','keno','wheel','hilo','towers','coinflip',
    'race','memory','piggybank','dice'
  ));
ALTER TABLE public.pet_arcade_rounds
  DROP CONSTRAINT IF EXISTS pet_arcade_rounds_entry_coins_check;
ALTER TABLE public.pet_arcade_rounds
  ADD CONSTRAINT pet_arcade_rounds_entry_coins_check CHECK (entry_coins >= 0);
ALTER TABLE public.pet_arcade_rounds
  ADD COLUMN IF NOT EXISTS difficulty text,
  ADD COLUMN IF NOT EXISTS final_multiplier numeric(10,2),
  ADD COLUMN IF NOT EXISTS xp_reward integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS result_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.pet_arcade_config
SET daily_round_limit = 50,
    daily_reward_limit = 2500,
    explanatory_text = 'Essas aventuras usam apenas moedas internas do app, sem valor financeiro real. Jogue com equilibrio e cuide bem do seu pet.'
WHERE id = 1;

CREATE TABLE IF NOT EXISTS public.pet_arcade_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_enabled boolean NOT NULL DEFAULT true,
  daily_play_limit integer NOT NULL DEFAULT 50 CHECK (daily_play_limit > 0),
  daily_win_limit integer NOT NULL DEFAULT 2500 CHECK (daily_win_limit >= 0),
  global_min_entry integer NOT NULL DEFAULT 10 CHECK (global_min_entry >= 0),
  global_max_entry integer NOT NULL DEFAULT 300 CHECK (global_max_entry >= global_min_entry),
  maintenance_message text NOT NULL DEFAULT 'O Pet Arcade esta recebendo melhorias. Volte em breve.',
  healthy_play_message text NOT NULL DEFAULT 'Essas aventuras usam apenas moedas internas do app, sem valor financeiro real. Jogue com equilibrio e cuide bem do seu pet.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.pet_arcade_settings(id) VALUES(1) ON CONFLICT(id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.pet_arcade_game_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type text NOT NULL UNIQUE CHECK (game_type IN (
    'treasure','flight','plinko','keno','wheel','hilo','towers','coinflip',
    'race','memory','piggybank','dice'
  )),
  display_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'quick' CHECK (category IN ('quick','strategy','luck','care')),
  is_enabled boolean NOT NULL DEFAULT true,
  min_entry integer NOT NULL DEFAULT 10 CHECK (min_entry >= 0),
  max_entry integer NOT NULL DEFAULT 300 CHECK (max_entry >= min_entry),
  daily_play_limit integer NOT NULL DEFAULT 30 CHECK (daily_play_limit > 0),
  daily_win_limit integer NOT NULL DEFAULT 2000 CHECK (daily_win_limit >= 0),
  cooldown_seconds integer NOT NULL DEFAULT 5 CHECK (cooldown_seconds >= 0),
  max_multiplier numeric(10,2) NOT NULL DEFAULT 20 CHECK (max_multiplier >= 1),
  difficulty_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  reward_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  visual_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pet_arcade_game_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.pet_arcade_rounds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pet_arcade_events_game_idx ON public.pet_arcade_game_events(game_id, created_at);
CREATE INDEX IF NOT EXISTS pet_arcade_events_user_idx ON public.pet_arcade_game_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pet_arcade_rounds_game_created_idx ON public.pet_arcade_rounds(game_type, created_at DESC);

ALTER TABLE public.pet_arcade_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_arcade_game_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_arcade_game_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pet arcade settings read" ON public.pet_arcade_settings;
CREATE POLICY "pet arcade settings read" ON public.pet_arcade_settings FOR SELECT TO authenticated USING(true);
DROP POLICY IF EXISTS "pet arcade settings admin" ON public.pet_arcade_settings;
CREATE POLICY "pet arcade settings admin" ON public.pet_arcade_settings FOR ALL TO authenticated
  USING(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
DROP POLICY IF EXISTS "pet arcade configs read" ON public.pet_arcade_game_configs;
CREATE POLICY "pet arcade configs read" ON public.pet_arcade_game_configs FOR SELECT TO authenticated USING(true);
DROP POLICY IF EXISTS "pet arcade configs admin" ON public.pet_arcade_game_configs;
CREATE POLICY "pet arcade configs admin" ON public.pet_arcade_game_configs FOR ALL TO authenticated
  USING(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
DROP POLICY IF EXISTS "pet arcade events admin read" ON public.pet_arcade_game_events;
CREATE POLICY "pet arcade events admin read" ON public.pet_arcade_game_events FOR SELECT TO authenticated
  USING(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

GRANT SELECT ON public.pet_arcade_settings, public.pet_arcade_game_configs TO authenticated;
GRANT SELECT ON public.pet_arcade_game_events TO authenticated;
GRANT ALL ON public.pet_arcade_settings, public.pet_arcade_game_configs, public.pet_arcade_game_events TO service_role;

INSERT INTO public.pet_arcade_game_configs
  (game_type,display_name,description,category,min_entry,max_entry,daily_play_limit,daily_win_limit,cooldown_seconds,max_multiplier,difficulty_config,reward_config,visual_config,sort_order)
VALUES
('treasure','Campo de Tesouros','Explore casas e recolha tesouros antes de encontrar uma armadilha.','strategy',10,300,30,2000,3,20,
 '{"leve":{"traps":3},"aventureiro":{"traps":5},"radical":{"traps":7}}','{}','{"accent":"amber"}',1),
('flight','Voo Estelar','Acompanhe o voo do pet e recolha a recompensa no momento certo.','quick',10,300,30,2000,3,20,
 '{}','{}','{"accent":"sky"}',2),
('plinko','Chuva de Biscoitos','Solte um biscoito pelo tabuleiro e acompanhe a trilha ate a recompensa.','luck',10,300,30,2000,8,20,
 '{"leve":{"rows":8,"multipliers":[2,1.5,1.2,0.8,0.6,0.8,1.2,1.5,2]},"aventureiro":{"rows":10,"multipliers":[5,2,1.2,0.6,0.3,0.6,1.2,2,5]},"radical":{"rows":12,"multipliers":[20,5,1.5,0.4,0.2,0.4,1.5,5,20]}}',
 '{}','{"accent":"orange"}',3),
('keno','Numeros da Sorte do Pet','Escolha casas e descubra quantas combinam com a sequencia da rodada.','strategy',10,300,30,2000,8,25,
 '{"grid_size":40,"draw_count":10,"pick_count":6}',
 '{"payouts":{"0":0,"1":0.25,"2":0.6,"3":1.2,"4":3,"5":10,"6":25}}','{"accent":"violet"}',4),
('wheel','Roda do Biscoito','Acompanhe a roda desacelerar ate o segmento escolhido pelo servidor.','luck',10,300,30,2000,8,20,
 '{"leve":{"segments":[{"m":0.5,"w":25},{"m":0.8,"w":25},{"m":1.2,"w":25},{"m":2,"w":20},{"m":5,"w":5}]},"aventureiro":{"segments":[{"m":0.3,"w":35},{"m":0.7,"w":25},{"m":1.5,"w":20},{"m":3,"w":15},{"m":10,"w":5}]},"radical":{"segments":[{"m":0.2,"w":45},{"m":0.5,"w":25},{"m":2,"w":15},{"m":5,"w":10},{"m":20,"w":5}]}}',
 '{}','{"accent":"rose"}',5),
('hilo','Maior ou Menor do Pet','Leia a carta, escolha a proxima direcao e recolha quando desejar.','strategy',10,300,30,2000,3,15,
 '{"deck_size":13,"max_sequence":10,"step_multiplier":1.45}','{}','{"accent":"indigo"}',6),
('towers','Torre dos Petiscos','Suba os andares escolhendo caminhos e recolha antes de continuar.','strategy',10,300,30,2000,3,20,
 '{"leve":{"floors":6,"options":3,"safe":2,"step_multiplier":1.35},"aventureiro":{"floors":7,"options":3,"safe":1,"step_multiplier":1.8},"radical":{"floors":8,"options":4,"safe":1,"step_multiplier":2.2}}',
 '{}','{"accent":"emerald"}',7),
('coinflip','Moeda do Pet','Escolha entre patinha e coracao e acompanhe o giro.','quick',10,300,30,1500,5,1.95,
 '{"sides":["paw","heart"],"win_chance":0.5}','{}','{"accent":"pink"}',8),
('race','Corrida dos Pets','Seu pet corre com outros pets da mesma fase em uma disputa de cuidado e energia.','care',10,300,20,1500,20,1,
 '{"duration_seconds":10,"care_weight":0.65,"random_weight":0.35}',
 '{"coins":{"1":150,"2":75,"3":40},"xp":{"participation":10,"1":40,"2":25,"3":15},"free_daily":1}','{"accent":"cyan"}',9),
('memory','Memoria dos Pets','Encontre pares de pets com menos tentativas e em menos tempo.','care',10,300,20,1200,15,1,
 '{"leve":{"pairs":4,"time_limit":120},"aventureiro":{"pairs":6,"time_limit":150},"radical":{"pairs":8,"time_limit":180}}',
 '{"coins":{"leve":30,"aventureiro":60,"radical":100},"xp":{"leve":10,"aventureiro":20,"radical":35},"free_daily":1}','{"accent":"teal"}',10),
('piggybank','Cofrinho do Pet','Guarde moedas com seu pet e acompanhe o cofrinho crescer com o tempo.','care',50,1000,3,1000,0,1.05,
 '{"min_hours":8,"max_hours":24,"default_hours":8,"bonus_percent":5,"max_active":1,"allow_cancel":true,"cancel_penalty_percent":0}',
 '{"xp":15}','{"accent":"amber"}',11),
('dice','Dados da Sorte do Pet','Escolha acima ou abaixo, ajuste o alvo e acompanhe o resultado.','luck',10,300,30,2000,5,20,
 '{"min_target":5,"max_target":95,"house_factor":0.97}','{}','{"accent":"blue"}',12)
ON CONFLICT(game_type) DO UPDATE SET
  display_name=EXCLUDED.display_name,
  description=EXCLUDED.description,
  category=EXCLUDED.category,
  sort_order=EXCLUDED.sort_order;

CREATE OR REPLACE FUNCTION public._pet_arcade_add_event(_game_id uuid,_event_type text,_payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.pet_arcade_game_events(game_id,user_id,event_type,payload)
  SELECT id,user_id,_event_type,COALESCE(_payload,'{}'::jsonb)
  FROM public.pet_arcade_rounds WHERE id=_game_id;
END $$;

CREATE OR REPLACE FUNCTION public._pet_arcade_begin(
  _game_type text,_entry integer,_difficulty text,_client_seed text,_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS public.pet_arcade_rounds
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  uid uuid:=auth.uid(); v_settings public.pet_arcade_settings; v_cfg public.pet_arcade_game_configs;
  v_pet uuid; v_wallet public.user_coins; v_round public.pet_arcade_rounds; v_today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_count integer; v_free integer; v_seed text:=encode(gen_random_bytes(32),'hex'); v_nonce bigint; v_client text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(uid::text));
  SELECT * INTO v_settings FROM public.pet_arcade_settings WHERE id=1;
  SELECT * INTO v_cfg FROM public.pet_arcade_game_configs WHERE game_type=_game_type;
  IF v_cfg.id IS NULL OR NOT v_settings.is_enabled OR NOT v_cfg.is_enabled THEN RAISE EXCEPTION 'game_unavailable'; END IF;
  SELECT id INTO v_pet FROM public.user_pets_v2 WHERE user_id=uid AND is_equipped=true ORDER BY updated_at DESC LIMIT 1;
  IF v_pet IS NULL THEN RAISE EXCEPTION 'pet_required'; END IF;
  SELECT count(*) INTO v_count FROM public.pet_arcade_rounds WHERE user_id=uid AND day=v_today;
  IF v_count >= v_settings.daily_play_limit THEN RAISE EXCEPTION 'daily_round_limit'; END IF;
  SELECT count(*) INTO v_count FROM public.pet_arcade_rounds WHERE user_id=uid AND game_type=_game_type AND day=v_today;
  IF v_count >= v_cfg.daily_play_limit THEN RAISE EXCEPTION 'game_daily_limit'; END IF;
  IF EXISTS(SELECT 1 FROM public.pet_arcade_rounds WHERE user_id=uid AND game_type=_game_type AND status='active') THEN RAISE EXCEPTION 'round_in_progress'; END IF;
  IF EXISTS(SELECT 1 FROM public.pet_arcade_rounds WHERE user_id=uid AND game_type=_game_type
    AND created_at > clock_timestamp()-make_interval(secs=>v_cfg.cooldown_seconds)) THEN RAISE EXCEPTION 'cooldown_active'; END IF;
  v_free:=COALESCE((v_cfg.reward_config->>'free_daily')::integer,0);
  IF _entry=0 THEN
    IF v_count >= v_free THEN RAISE EXCEPTION 'invalid_entry'; END IF;
  ELSIF _game_type='piggybank' AND (_entry<v_cfg.min_entry OR _entry>v_cfg.max_entry) THEN
    RAISE EXCEPTION 'invalid_entry';
  ELSIF _game_type<>'piggybank' AND (_entry < GREATEST(v_settings.global_min_entry,v_cfg.min_entry)
    OR _entry > LEAST(v_settings.global_max_entry,v_cfg.max_entry)) THEN RAISE EXCEPTION 'invalid_entry'; END IF;
  INSERT INTO public.user_coins(user_id,balance) VALUES(uid,100) ON CONFLICT(user_id) DO NOTHING;
  SELECT * INTO v_wallet FROM public.user_coins WHERE user_id=uid FOR UPDATE;
  IF v_wallet.balance < _entry THEN RAISE EXCEPTION 'insufficient_coins'; END IF;
  v_client:=COALESCE(NULLIF(trim(_client_seed),''),encode(extensions.digest(uid::text||clock_timestamp()::text,'sha256'),'hex'));
  SELECT COALESCE(max(nonce),0)+1 INTO v_nonce FROM public.pet_arcade_rounds WHERE user_id=uid;
  UPDATE public.user_coins SET balance=v_wallet.balance-_entry,updated_at=now() WHERE user_id=uid;
  INSERT INTO public.pet_arcade_rounds(user_id,user_pet_id,game_type,status,entry_coins,difficulty,server_seed,server_seed_hash,client_seed,nonce,day,metadata)
  VALUES(uid,v_pet,_game_type,'active',_entry,_difficulty,v_seed,encode(extensions.digest(v_seed,'sha256'),'hex'),v_client,v_nonce,v_today,COALESCE(_metadata,'{}'::jsonb))
  RETURNING * INTO v_round;
  IF _entry>0 THEN PERFORM public.log_coin_tx(uid,'pet_arcade_entry','out',_entry,v_wallet.balance-_entry,
    'Entrada em '||v_cfg.display_name,NULL,v_round.id,NULL); END IF;
  PERFORM public._pet_arcade_add_event(v_round.id,'started',jsonb_build_object('entry',_entry,'difficulty',_difficulty));
  RETURN v_round;
END $$;

CREATE OR REPLACE FUNCTION public._pet_arcade_finish(
  _game_id uuid,_status text,_multiplier numeric,_summary jsonb,_xp integer DEFAULT 0,_reward_override integer DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  uid uuid:=auth.uid(); v_round public.pet_arcade_rounds; v_cfg public.pet_arcade_game_configs; v_settings public.pet_arcade_settings;
  v_wallet public.user_coins; v_global integer; v_game integer; v_raw integer:=0; v_reward integer:=0; v_balance integer; v_xp jsonb; v_xp_granted integer:=0;
BEGIN
  SELECT * INTO v_round FROM public.pet_arcade_rounds WHERE id=_game_id AND user_id=uid FOR UPDATE;
  IF v_round.id IS NULL THEN RAISE EXCEPTION 'round_not_found'; END IF;
  IF v_round.status<>'active' THEN RAISE EXCEPTION 'round_already_finished'; END IF;
  IF _status NOT IN('collected','lost','cancelled') THEN RAISE EXCEPTION 'invalid_status'; END IF;
  SELECT * INTO v_cfg FROM public.pet_arcade_game_configs WHERE game_type=v_round.game_type;
  SELECT * INTO v_settings FROM public.pet_arcade_settings WHERE id=1;
  SELECT COALESCE(sum(reward_coins),0)::integer INTO v_global FROM public.pet_arcade_rounds
    WHERE user_id=uid AND day=v_round.day AND status='collected' AND id<>v_round.id;
  SELECT COALESCE(sum(reward_coins),0)::integer INTO v_game FROM public.pet_arcade_rounds
    WHERE user_id=uid AND game_type=v_round.game_type AND day=v_round.day AND status='collected' AND id<>v_round.id;
  INSERT INTO public.user_coins(user_id,balance) VALUES(uid,100) ON CONFLICT(user_id) DO NOTHING;
  SELECT * INTO v_wallet FROM public.user_coins WHERE user_id=uid FOR UPDATE;
  IF _status='collected' THEN
    v_raw:=GREATEST(0,COALESCE(_reward_override,floor(v_round.entry_coins*LEAST(_multiplier,v_cfg.max_multiplier))::integer));
    v_reward:=LEAST(v_raw,GREATEST(0,v_settings.daily_win_limit-v_global),GREATEST(0,v_cfg.daily_win_limit-v_game),GREATEST(0,500-v_wallet.balance));
  END IF;
  v_balance:=v_wallet.balance+v_reward;
  IF _xp>0 THEN BEGIN v_xp:=public.award_xp('pet_arcade',_xp,NULL,jsonb_build_object('game_id',v_round.id,'game_type',v_round.game_type)); v_xp_granted:=COALESCE((v_xp->>'granted')::integer,0); EXCEPTION WHEN OTHERS THEN v_xp:='{}'::jsonb; v_xp_granted:=0; END; END IF;
  UPDATE public.user_coins SET balance=v_balance,updated_at=now() WHERE user_id=uid;
  UPDATE public.pet_arcade_rounds SET status=_status,current_multiplier=round(_multiplier,2),final_multiplier=round(_multiplier,2),
    reward_coins=v_reward,xp_reward=v_xp_granted,result_summary=COALESCE(_summary,'{}'::jsonb),ended_at=now(),updated_at=now()
    WHERE id=v_round.id;
  IF v_reward>0 THEN PERFORM public.log_coin_tx(uid,'pet_arcade_reward','in',v_reward,v_balance,
    'Recompensa em '||v_cfg.display_name,round(_multiplier,2)::text||'x',v_round.id,NULL); END IF;
  PERFORM public._pet_arcade_add_event(v_round.id,'finished',COALESCE(_summary,'{}'::jsonb)||jsonb_build_object('status',_status,'reward',v_reward,'xp',v_xp_granted));
  RETURN jsonb_build_object('game_id',v_round.id,'round_id',v_round.id,'game_type',v_round.game_type,'status',_status,
    'multiplier',round(_multiplier,2),'reward_coins',v_reward,'xp_reward',v_xp_granted,'new_balance',v_balance,
    'result',COALESCE(_summary,'{}'::jsonb),'server_seed',v_round.server_seed,'server_seed_hash',v_round.server_seed_hash,
    'client_seed',v_round.client_seed,'nonce',v_round.nonce,'reward_limited',v_reward<v_raw);
END $$;

CREATE OR REPLACE FUNCTION public._pet_arcade_result(_game_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); r public.pet_arcade_rounds;
BEGIN
  SELECT * INTO r FROM public.pet_arcade_rounds WHERE id=_game_id AND user_id=uid;
  IF r.id IS NULL THEN RAISE EXCEPTION 'round_not_found'; END IF;
  RETURN jsonb_build_object('game_id',r.id,'round_id',r.id,'game_type',r.game_type,'status',r.status,'entry_coins',r.entry_coins,
    'multiplier',r.current_multiplier,'reward_coins',r.reward_coins,'xp_reward',r.xp_reward,'result',r.result_summary,
    'server_seed',CASE WHEN r.status='active' THEN NULL ELSE r.server_seed END,'server_seed_hash',r.server_seed_hash,
    'client_seed',r.client_seed,'nonce',r.nonce);
END $$;

CREATE OR REPLACE FUNCTION public.get_pet_arcade_catalog()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object(
    'settings',(SELECT to_jsonb(s) FROM public.pet_arcade_settings s WHERE id=1),
    'games',(SELECT COALESCE(jsonb_agg(to_jsonb(c) ORDER BY c.sort_order),'[]'::jsonb) FROM public.pet_arcade_game_configs c)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_pet_arcade_history_v2(_limit integer DEFAULT 30)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC),'[]'::jsonb) FROM (
    SELECT id,game_type,status,entry_coins,difficulty,current_multiplier,reward_coins,xp_reward,result_summary,started_at,ended_at,created_at
    FROM public.pet_arcade_rounds WHERE user_id=auth.uid() ORDER BY created_at DESC LIMIT LEAST(GREATEST(_limit,1),100)
  ) x;
$$;

-- Jogos de resolucao imediata -------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_pet_plinko(_entry_coins integer,_difficulty text,_client_seed text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; c public.pet_arcade_game_configs; a jsonb; n integer; slot integer; mult numeric; result jsonb;
BEGIN
  r:=public._pet_arcade_begin('plinko',_entry_coins,_difficulty,_client_seed,'{}');
  SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='plinko';
  a:=c.difficulty_config->_difficulty->'multipliers'; n:=jsonb_array_length(a);
  IF n<2 THEN RAISE EXCEPTION 'invalid_game_config'; END IF;
  slot:=floor(public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,0)*n)::integer;
  mult:=(a->>slot)::numeric;
  result:=jsonb_build_object('slot',slot,'slots',a,'rows',(c.difficulty_config->_difficulty->>'rows')::integer);
  RETURN public._pet_arcade_finish(r.id,CASE WHEN mult>0 THEN 'collected' ELSE 'lost' END,mult,result,2,NULL);
END $$;
CREATE OR REPLACE FUNCTION public.finish_pet_plinko(_game_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public._pet_arcade_result(_game_id); $$;

CREATE OR REPLACE FUNCTION public.start_pet_keno(_entry_coins integer,_chosen_numbers integer[],_client_seed text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; c public.pet_arcade_game_configs; grid integer; draw_count integer; pick_count integer;
  drawn integer[]:='{}'; p integer; counter integer:=0; hits integer; mult numeric; result jsonb;
BEGIN
  SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='keno';
  grid:=(c.difficulty_config->>'grid_size')::integer; draw_count:=(c.difficulty_config->>'draw_count')::integer; pick_count:=(c.difficulty_config->>'pick_count')::integer;
  IF cardinality(_chosen_numbers)<>pick_count OR (SELECT count(DISTINCT x) FROM unnest(_chosen_numbers)x)<>pick_count
    OR EXISTS(SELECT 1 FROM unnest(_chosen_numbers)x WHERE x<1 OR x>grid) THEN RAISE EXCEPTION 'invalid_selection'; END IF;
  r:=public._pet_arcade_begin('keno',_entry_coins,'padrao',_client_seed,jsonb_build_object('chosen',_chosen_numbers));
  WHILE cardinality(drawn)<draw_count LOOP
    p:=1+floor(public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,counter)*grid)::integer;
    IF NOT(p=ANY(drawn)) THEN drawn:=array_append(drawn,p); END IF; counter:=counter+1;
  END LOOP;
  SELECT count(*) INTO hits FROM unnest(_chosen_numbers)x WHERE x=ANY(drawn);
  mult:=COALESCE((c.reward_config->'payouts'->>hits::text)::numeric,0);
  result:=jsonb_build_object('chosen_numbers',to_jsonb(_chosen_numbers),'drawn_numbers',to_jsonb(drawn),'hits',hits,'grid_size',grid);
  RETURN public._pet_arcade_finish(r.id,CASE WHEN mult>0 THEN 'collected' ELSE 'lost' END,mult,result,2+hits,NULL);
END $$;
CREATE OR REPLACE FUNCTION public.finish_pet_keno(_game_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public._pet_arcade_result(_game_id); $$;

CREATE OR REPLACE FUNCTION public.start_pet_wheel(_entry_coins integer,_difficulty text,_client_seed text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; c public.pet_arcade_game_configs; seg jsonb; total numeric:=0; cursor numeric:=0; pick numeric; i integer; chosen integer:=0; mult numeric; item jsonb;
BEGIN
  r:=public._pet_arcade_begin('wheel',_entry_coins,_difficulty,_client_seed,'{}'); SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='wheel';
  seg:=c.difficulty_config->_difficulty->'segments'; IF jsonb_array_length(seg)<2 THEN RAISE EXCEPTION 'invalid_game_config'; END IF;
  FOR i IN 0..jsonb_array_length(seg)-1 LOOP total:=total+COALESCE((seg->i->>'w')::numeric,1); END LOOP;
  pick:=public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,0)*total;
  FOR i IN 0..jsonb_array_length(seg)-1 LOOP cursor:=cursor+COALESCE((seg->i->>'w')::numeric,1); IF pick<cursor THEN chosen:=i; EXIT; END IF; END LOOP;
  item:=seg->chosen; mult:=(item->>'m')::numeric;
  RETURN public._pet_arcade_finish(r.id,CASE WHEN mult>0 THEN 'collected' ELSE 'lost' END,mult,
    jsonb_build_object('segment_index',chosen,'segments',seg),2,NULL);
END $$;
CREATE OR REPLACE FUNCTION public.finish_pet_wheel(_game_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public._pet_arcade_result(_game_id); $$;

CREATE OR REPLACE FUNCTION public.start_pet_coinflip(_entry_coins integer,_side text,_client_seed text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; c public.pet_arcade_game_configs; outcome text; mult numeric;
BEGIN
  IF _side NOT IN('paw','heart') THEN RAISE EXCEPTION 'invalid_selection'; END IF;
  r:=public._pet_arcade_begin('coinflip',_entry_coins,'padrao',_client_seed,jsonb_build_object('side',_side));
  SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='coinflip';
  outcome:=CASE WHEN public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,0)<0.5 THEN 'paw' ELSE 'heart' END;
  mult:=CASE WHEN outcome=_side THEN c.max_multiplier ELSE 0 END;
  RETURN public._pet_arcade_finish(r.id,CASE WHEN mult>0 THEN 'collected' ELSE 'lost' END,mult,jsonb_build_object('chosen_side',_side,'outcome',outcome),1,NULL);
END $$;
CREATE OR REPLACE FUNCTION public.finish_pet_coinflip(_game_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public._pet_arcade_result(_game_id); $$;

CREATE OR REPLACE FUNCTION public.start_pet_dice(_entry_coins integer,_condition text,_target integer,_client_seed text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; c public.pet_arcade_game_configs; value integer; chance numeric; mult numeric; won boolean;
BEGIN
  SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='dice';
  IF _condition NOT IN('above','below') OR _target<(c.difficulty_config->>'min_target')::integer OR _target>(c.difficulty_config->>'max_target')::integer THEN RAISE EXCEPTION 'invalid_selection'; END IF;
  r:=public._pet_arcade_begin('dice',_entry_coins,'padrao',_client_seed,jsonb_build_object('condition',_condition,'target',_target));
  value:=floor(public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,0)*101)::integer;
  chance:=CASE WHEN _condition='above' THEN (100-_target)::numeric/101 ELSE _target::numeric/101 END;
  mult:=LEAST(c.max_multiplier,round(COALESCE((c.difficulty_config->>'house_factor')::numeric,0.97)/GREATEST(chance,0.01),2));
  won:=CASE WHEN _condition='above' THEN value>_target ELSE value<_target END;
  RETURN public._pet_arcade_finish(r.id,CASE WHEN won THEN 'collected' ELSE 'lost' END,CASE WHEN won THEN mult ELSE 0 END,
    jsonb_build_object('condition',_condition,'target',_target,'value',value,'chance_percent',round(chance*100,1)),1,NULL);
END $$;
CREATE OR REPLACE FUNCTION public.finish_pet_dice(_game_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public._pet_arcade_result(_game_id); $$;

-- Jogos sequenciais ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_pet_hilo(_entry_coins integer,_client_seed text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; card integer;
BEGIN
  r:=public._pet_arcade_begin('hilo',_entry_coins,'padrao',_client_seed,'{}'); card:=1+floor(public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,0)*13)::integer;
  UPDATE public.pet_arcade_rounds SET metadata=jsonb_build_object('current_card',card,'step',0),current_multiplier=1 WHERE id=r.id;
  PERFORM public._pet_arcade_add_event(r.id,'card',jsonb_build_object('card',card,'step',0));
  RETURN jsonb_build_object('game_id',r.id,'round_id',r.id,'status','active','current_card',card,'step',0,'multiplier',1,'new_balance',(SELECT balance FROM public.user_coins WHERE user_id=auth.uid()),'server_seed_hash',r.server_seed_hash);
END $$;

CREATE OR REPLACE FUNCTION public.choose_pet_hilo(_game_id uuid,_choice text,_expected_step integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; c public.pet_arcade_game_configs; current integer; next_card integer; step integer; won boolean; mult numeric;
BEGIN
  IF _choice NOT IN('higher','lower') THEN RAISE EXCEPTION 'invalid_selection'; END IF;
  SELECT * INTO r FROM public.pet_arcade_rounds WHERE id=_game_id AND user_id=auth.uid() AND game_type='hilo' FOR UPDATE;
  IF r.id IS NULL OR r.status<>'active' THEN RAISE EXCEPTION 'round_not_found'; END IF;
  IF _expected_step IS NOT NULL AND _expected_step<>(r.metadata->>'step')::integer THEN RAISE EXCEPTION 'stale_action'; END IF;
  SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='hilo'; current:=(r.metadata->>'current_card')::integer; step:=(r.metadata->>'step')::integer+1;
  next_card:=1+floor(public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,step)*13)::integer;
  won:=CASE WHEN _choice='higher' THEN next_card>current ELSE next_card<current END;
  IF NOT won THEN RETURN public._pet_arcade_finish(r.id,'lost',r.current_multiplier,jsonb_build_object('previous_card',current,'next_card',next_card,'choice',_choice,'step',step),1,NULL); END IF;
  mult:=LEAST(c.max_multiplier,round(r.current_multiplier*COALESCE((c.difficulty_config->>'step_multiplier')::numeric,1.45),2));
  UPDATE public.pet_arcade_rounds SET metadata=jsonb_build_object('current_card',next_card,'step',step),current_multiplier=mult,updated_at=now() WHERE id=r.id;
  PERFORM public._pet_arcade_add_event(r.id,'choice',jsonb_build_object('previous_card',current,'next_card',next_card,'choice',_choice,'won',true));
  IF step>=COALESCE((c.difficulty_config->>'max_sequence')::integer,10) THEN RETURN public._pet_arcade_finish(r.id,'collected',mult,jsonb_build_object('current_card',next_card,'step',step,'completed',true),5,NULL); END IF;
  RETURN jsonb_build_object('game_id',r.id,'status','active','previous_card',current,'current_card',next_card,'step',step,'choice',_choice,'won',true,'multiplier',mult);
END $$;
CREATE OR REPLACE FUNCTION public.cashout_pet_hilo(_game_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; BEGIN SELECT * INTO r FROM public.pet_arcade_rounds WHERE id=_game_id AND user_id=auth.uid() AND game_type='hilo' FOR UPDATE;
IF r.id IS NULL OR r.status<>'active' THEN RAISE EXCEPTION 'round_not_found'; END IF; IF (r.metadata->>'step')::integer<1 THEN RAISE EXCEPTION 'nothing_to_collect'; END IF;
RETURN public._pet_arcade_finish(r.id,'collected',r.current_multiplier,jsonb_build_object('current_card',(r.metadata->>'current_card')::integer,'step',(r.metadata->>'step')::integer),3,NULL); END $$;

CREATE OR REPLACE FUNCTION public.start_pet_towers(_entry_coins integer,_difficulty text,_client_seed text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; c public.pet_arcade_game_configs; cfg jsonb;
BEGIN SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='towers'; cfg:=c.difficulty_config->_difficulty; IF cfg IS NULL THEN RAISE EXCEPTION 'invalid_difficulty'; END IF;
r:=public._pet_arcade_begin('towers',_entry_coins,_difficulty,_client_seed,jsonb_build_object('floor',0));
RETURN jsonb_build_object('game_id',r.id,'round_id',r.id,'status','active','floor',0,'floors',(cfg->>'floors')::integer,'options',(cfg->>'options')::integer,'multiplier',1,'new_balance',(SELECT balance FROM public.user_coins WHERE user_id=auth.uid()),'server_seed_hash',r.server_seed_hash); END $$;

CREATE OR REPLACE FUNCTION public.choose_pet_tower_tile(_game_id uuid,_tile integer,_expected_floor integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; c public.pet_arcade_game_configs; cfg jsonb; floor_no integer; options integer; safe_count integer; safe integer[]:='{}'; p integer; counter integer:=0; mult numeric; won boolean;
BEGIN SELECT * INTO r FROM public.pet_arcade_rounds WHERE id=_game_id AND user_id=auth.uid() AND game_type='towers' FOR UPDATE; IF r.id IS NULL OR r.status<>'active' THEN RAISE EXCEPTION 'round_not_found'; END IF;
IF _expected_floor IS NOT NULL AND _expected_floor<>(r.metadata->>'floor')::integer THEN RAISE EXCEPTION 'stale_action'; END IF;
SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='towers'; cfg:=c.difficulty_config->r.difficulty; floor_no:=(r.metadata->>'floor')::integer+1; options:=(cfg->>'options')::integer; safe_count:=(cfg->>'safe')::integer;
IF _tile<0 OR _tile>=options THEN RAISE EXCEPTION 'invalid_selection'; END IF;
WHILE cardinality(safe)<safe_count LOOP p:=floor(public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,floor_no*20+counter)*options)::integer; IF NOT(p=ANY(safe)) THEN safe:=array_append(safe,p); END IF; counter:=counter+1; END LOOP;
won:=_tile=ANY(safe); IF NOT won THEN RETURN public._pet_arcade_finish(r.id,'lost',r.current_multiplier,jsonb_build_object('floor',floor_no,'chosen_tile',_tile,'safe_tiles',to_jsonb(safe)),1,NULL); END IF;
mult:=LEAST(c.max_multiplier,round(r.current_multiplier*COALESCE((cfg->>'step_multiplier')::numeric,1.5),2));
UPDATE public.pet_arcade_rounds SET metadata=jsonb_build_object('floor',floor_no),current_multiplier=mult,updated_at=now() WHERE id=r.id;
PERFORM public._pet_arcade_add_event(r.id,'floor',jsonb_build_object('floor',floor_no,'chosen_tile',_tile,'safe_tiles',to_jsonb(safe)));
IF floor_no>=(cfg->>'floors')::integer THEN RETURN public._pet_arcade_finish(r.id,'collected',mult,jsonb_build_object('floor',floor_no,'safe_tiles',to_jsonb(safe),'completed',true),6,NULL); END IF;
RETURN jsonb_build_object('game_id',r.id,'status','active','floor',floor_no,'floors',(cfg->>'floors')::integer,'options',options,'chosen_tile',_tile,'safe_tiles',to_jsonb(safe),'multiplier',mult); END $$;
CREATE OR REPLACE FUNCTION public.cashout_pet_towers(_game_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; BEGIN SELECT * INTO r FROM public.pet_arcade_rounds WHERE id=_game_id AND user_id=auth.uid() AND game_type='towers' FOR UPDATE;
IF r.id IS NULL OR r.status<>'active' THEN RAISE EXCEPTION 'round_not_found'; END IF; IF (r.metadata->>'floor')::integer<1 THEN RAISE EXCEPTION 'nothing_to_collect'; END IF;
RETURN public._pet_arcade_finish(r.id,'collected',r.current_multiplier,jsonb_build_object('floor',(r.metadata->>'floor')::integer),4,NULL); END $$;

-- Corrida --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_pet_race(_entry_coins integer,_client_seed text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; c public.pet_arcade_game_configs; pet record; stage_kind text; care numeric:=75; lvl integer:=1; user_weight numeric;
  pool jsonb:='[]'::jsonb; racers jsonb:='[]'::jsonb; ranked jsonb; i integer; idx integer; item jsonb; key numeric; user_rank integer; coins integer; xp integer; duration integer;
BEGIN
  r:=public._pet_arcade_begin('race',_entry_coins,'padrao',_client_seed,'{}'); SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='race';
  SELECT up.*,ls.kind,COALESCE(CASE WHEN ls.kind='adult' THEN pv.image_url_adult ELSE pv.image_url_baby END,pv.image_url,
    CASE WHEN ls.kind='adult' THEN ps.image_url_adult ELSE ps.image_url_baby END,ps.image_url,pc.image_url) image_url
  INTO pet FROM public.user_pets_v2 up JOIN public.pet_life_stages ls ON ls.id=up.life_stage_id
    LEFT JOIN public.pet_variants pv ON pv.id=up.variant_id LEFT JOIN public.pet_species ps ON ps.id=up.species_id LEFT JOIN public.pet_categories pc ON pc.id=up.category_id
  WHERE up.id=r.user_pet_id; stage_kind:=COALESCE(pet.kind,'baby');
  SELECT COALESCE(avg(value_at_anchor),75) INTO care FROM public.pet_care_state WHERE user_pet_id=r.user_pet_id;
  SELECT COALESCE(level,1) INTO lvl FROM public.user_xp WHERE user_id=r.user_id;
  care:=LEAST(100,GREATEST(10,care*0.85+LEAST(lvl,50)*0.3)); user_weight:=35+care*0.65;
  SELECT COALESCE(jsonb_agg(x),'[]'::jsonb) INTO pool FROM (
    SELECT jsonb_build_object('id',id,'name',name,'image_url',image_url) x FROM (
      SELECT id,name,COALESCE(CASE WHEN stage_kind='adult' THEN image_url_adult ELSE image_url_baby END,image_url) image_url FROM public.pet_variants WHERE active=true
      UNION ALL SELECT id,name,COALESCE(CASE WHEN stage_kind='adult' THEN image_url_adult ELSE image_url_baby END,image_url) FROM public.pet_species WHERE active=true
    ) q WHERE image_url IS NOT NULL LIMIT 60
  ) p;
  IF jsonb_array_length(pool)<5 THEN RAISE EXCEPTION 'insufficient_pet_images'; END IF;
  key:=-ln(GREATEST(public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,100),0.000001))/user_weight;
  racers:=racers||jsonb_build_array(jsonb_build_object('id',pet.id,'name',pet.custom_name,'image_url',pet.image_url,'is_user',true,'care_score',round(care,0),'rank_key',key));
  FOR i IN 1..5 LOOP idx:=floor(public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,i)*jsonb_array_length(pool))::integer; item:=pool->idx;
    WHILE EXISTS(SELECT 1 FROM jsonb_array_elements(racers)e WHERE e->>'id'=item->>'id') LOOP idx:=(idx+1)%jsonb_array_length(pool); item:=pool->idx; END LOOP;
    key:=-ln(GREATEST(public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,100+i),0.000001))/55;
    racers:=racers||jsonb_build_array(item||jsonb_build_object('is_user',false,'care_score',null,'rank_key',key));
  END LOOP;
  SELECT jsonb_agg(e-'rank_key' ORDER BY (e->>'rank_key')::numeric) INTO ranked FROM jsonb_array_elements(racers)e;
  SELECT ordinality INTO user_rank FROM jsonb_array_elements(ranked) WITH ORDINALITY t(e,ordinality) WHERE (e->>'is_user')::boolean LIMIT 1;
  coins:=COALESCE((c.reward_config->'coins'->>user_rank::text)::integer,0); xp:=COALESCE((c.reward_config->'xp'->>'participation')::integer,10)+COALESCE((c.reward_config->'xp'->>user_rank::text)::integer,0);
  duration:=COALESCE((c.difficulty_config->>'duration_seconds')::integer,10);
  RETURN public._pet_arcade_finish(r.id,'collected',1,jsonb_build_object('racers',ranked,'user_position',user_rank,'care_score',round(care,0),'duration_seconds',duration),xp,coins);
END $$;
CREATE OR REPLACE FUNCTION public.finish_pet_race(_game_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public._pet_arcade_result(_game_id); $$;

-- Memoria --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_pet_memory(_entry_coins integer,_difficulty text,_client_seed text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; c public.pet_arcade_game_configs; cfg jsonb; pairs integer; images jsonb; order_arr integer[]; i integer; j integer; tmp integer; board jsonb:='[]'::jsonb;
BEGIN SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='memory'; cfg:=c.difficulty_config->_difficulty; IF cfg IS NULL THEN RAISE EXCEPTION 'invalid_difficulty'; END IF; pairs:=(cfg->>'pairs')::integer;
SELECT COALESCE(jsonb_agg(x),'[]'::jsonb) INTO images FROM (SELECT jsonb_build_object('id',id,'name',name,'image_url',COALESCE(image_url_baby,image_url)) x FROM public.pet_variants WHERE active=true AND COALESCE(image_url_baby,image_url) IS NOT NULL LIMIT pairs)q;
IF jsonb_array_length(images)<pairs THEN RAISE EXCEPTION 'insufficient_pet_images'; END IF;
r:=public._pet_arcade_begin('memory',_entry_coins,_difficulty,_client_seed,'{}'); order_arr:=ARRAY(SELECT generate_series(0,pairs*2-1));
FOR i IN REVERSE pairs*2-1..1 LOOP j:=floor(public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,i)* (i+1))::integer; tmp:=order_arr[i+1]; order_arr[i+1]:=order_arr[j+1]; order_arr[j+1]:=tmp; END LOOP;
FOR i IN 1..pairs*2 LOOP board:=board||jsonb_build_array((images->(order_arr[i]%pairs))||jsonb_build_object('pair_id',order_arr[i]%pairs)); END LOOP;
UPDATE public.pet_arcade_rounds SET metadata=jsonb_build_object('board',board,'matched','[]'::jsonb,'pending',null,'attempts',0,'pairs',pairs,'time_limit',(cfg->>'time_limit')::integer) WHERE id=r.id;
RETURN jsonb_build_object('game_id',r.id,'round_id',r.id,'status','active','card_count',pairs*2,'pairs',pairs,'matched','[]'::jsonb,'attempts',0,'time_limit',(cfg->>'time_limit')::integer,'started_at',r.started_at,'new_balance',(SELECT balance FROM public.user_coins WHERE user_id=auth.uid()),'server_seed_hash',r.server_seed_hash); END $$;

CREATE OR REPLACE FUNCTION public.reveal_pet_memory_card(_game_id uuid,_position integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; board jsonb; matched jsonb; pending integer; attempts integer; card jsonb; first_card jsonb; is_match boolean:=false; c public.pet_arcade_game_configs; base_reward integer; xp integer; elapsed integer; perf numeric; time_factor numeric; result jsonb;
BEGIN SELECT * INTO r FROM public.pet_arcade_rounds WHERE id=_game_id AND user_id=auth.uid() AND game_type='memory' FOR UPDATE; IF r.id IS NULL OR r.status<>'active' THEN RAISE EXCEPTION 'round_not_found'; END IF;
board:=r.metadata->'board'; matched:=r.metadata->'matched'; pending:=(r.metadata->>'pending')::integer; attempts:=COALESCE((r.metadata->>'attempts')::integer,0);
IF _position<0 OR _position>=jsonb_array_length(board) OR matched@>to_jsonb(ARRAY[_position]) THEN RAISE EXCEPTION 'invalid_selection'; END IF; card:=board->_position;
IF pending IS NULL THEN UPDATE public.pet_arcade_rounds SET metadata=jsonb_set(metadata,'{pending}',to_jsonb(_position)) WHERE id=r.id;
  RETURN jsonb_build_object('game_id',r.id,'status','active','position',_position,'card',card-'pair_id','pending_position',_position,'matched',matched,'attempts',attempts); END IF;
IF pending=_position THEN RAISE EXCEPTION 'invalid_selection'; END IF; first_card:=board->pending; attempts:=attempts+1; is_match=(first_card->>'pair_id')=(card->>'pair_id');
IF is_match THEN matched:=matched||to_jsonb(ARRAY[pending,_position]); END IF;
UPDATE public.pet_arcade_rounds SET metadata=jsonb_set(jsonb_set(jsonb_set(metadata,'{matched}',matched),'{pending}','null'::jsonb),'{attempts}',to_jsonb(attempts)),updated_at=now() WHERE id=r.id;
IF jsonb_array_length(matched)=jsonb_array_length(board) THEN SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='memory'; elapsed:=extract(epoch FROM(now()-r.started_at))::integer;
  base_reward:=COALESCE((c.reward_config->'coins'->>r.difficulty)::integer,30); xp:=COALESCE((c.reward_config->'xp'->>r.difficulty)::integer,10);
  time_factor:=GREATEST(0.7,LEAST(1.2,1.2-(elapsed::numeric/GREATEST((r.metadata->>'time_limit')::numeric,1))*0.5));
  perf:=GREATEST(0.5,LEAST(1.25,((r.metadata->>'pairs')::numeric/GREATEST(attempts,1)+0.5)*time_factor)); result:=public._pet_arcade_finish(r.id,'collected',1,
    jsonb_build_object('matched',matched,'attempts',attempts,'elapsed_seconds',elapsed,'completed',true),xp,round(base_reward*perf)::integer);
  RETURN result||jsonb_build_object('first_position',pending,'first_card',first_card-'pair_id','position',_position,'card',card-'pair_id','is_match',true); END IF;
RETURN jsonb_build_object('game_id',r.id,'status','active','first_position',pending,'first_card',first_card-'pair_id','position',_position,'card',card-'pair_id','is_match',is_match,'matched',matched,'attempts',attempts); END $$;
CREATE OR REPLACE FUNCTION public.finish_pet_memory(_game_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; BEGIN SELECT * INTO r FROM public.pet_arcade_rounds WHERE id=_game_id AND user_id=auth.uid() AND game_type='memory'; IF r.id IS NULL THEN RAISE EXCEPTION 'round_not_found'; END IF;
IF r.status='active' THEN RAISE EXCEPTION 'memory_not_complete'; END IF; RETURN public._pet_arcade_result(_game_id); END $$;

-- Cofrinho -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_pet_piggybank(_deposit integer,_hours integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.pet_arcade_game_configs; r public.pet_arcade_rounds; cfg jsonb; hours integer; unlock_at timestamptz;
BEGIN SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='piggybank'; cfg:=c.difficulty_config; hours:=COALESCE(_hours,(cfg->>'default_hours')::integer);
IF _deposit<c.min_entry OR _deposit>c.max_entry OR hours<(cfg->>'min_hours')::integer OR hours>(cfg->>'max_hours')::integer THEN RAISE EXCEPTION 'invalid_entry'; END IF;
r:=public._pet_arcade_begin('piggybank',_deposit,'cuidado',NULL,'{}'); unlock_at:=now()+make_interval(hours=>hours);
UPDATE public.pet_arcade_rounds SET metadata=jsonb_build_object('unlock_at',unlock_at,'hours',hours,'bonus_percent',(cfg->>'bonus_percent')::numeric) WHERE id=r.id;
RETURN jsonb_build_object('game_id',r.id,'round_id',r.id,'status','active','deposit',_deposit,'unlock_at',unlock_at,'hours',hours,'bonus_percent',(cfg->>'bonus_percent')::numeric,'new_balance',(SELECT balance FROM public.user_coins WHERE user_id=auth.uid())); END $$;

CREATE OR REPLACE FUNCTION public.claim_pet_piggybank(_game_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; c public.pet_arcade_game_configs; wallet public.user_coins; bonus integer; reward integer; v_balance integer; xp integer; xp_result jsonb;
BEGIN SELECT * INTO r FROM public.pet_arcade_rounds WHERE id=_game_id AND user_id=auth.uid() AND game_type='piggybank' FOR UPDATE; IF r.id IS NULL OR r.status<>'active' THEN RAISE EXCEPTION 'round_not_found'; END IF;
IF now()<(r.metadata->>'unlock_at')::timestamptz THEN RAISE EXCEPTION 'piggybank_not_ready'; END IF; SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='piggybank';
SELECT * INTO wallet FROM public.user_coins WHERE user_id=auth.uid() FOR UPDATE; bonus:=floor(r.entry_coins*(r.metadata->>'bonus_percent')::numeric/100)::integer; reward:=LEAST(r.entry_coins+bonus,500-wallet.balance); v_balance:=wallet.balance+reward; xp:=COALESCE((c.reward_config->>'xp')::integer,15);
BEGIN xp_result:=public.award_xp('pet_arcade',xp,NULL,jsonb_build_object('game_id',r.id,'game_type','piggybank')); xp:=COALESCE((xp_result->>'granted')::integer,0); EXCEPTION WHEN OTHERS THEN xp:=0; END;
UPDATE public.user_coins SET balance=v_balance,updated_at=now() WHERE user_id=auth.uid(); UPDATE public.pet_arcade_rounds SET status='collected',reward_coins=reward,xp_reward=xp,current_multiplier=1+(r.metadata->>'bonus_percent')::numeric/100,final_multiplier=1+(r.metadata->>'bonus_percent')::numeric/100,result_summary=jsonb_build_object('deposit',r.entry_coins,'bonus',GREATEST(0,reward-r.entry_coins),'unlock_at',r.metadata->>'unlock_at'),ended_at=now(),updated_at=now() WHERE id=r.id;
PERFORM public.log_coin_tx(auth.uid(),'pet_arcade_piggybank','in',reward,v_balance,'Cofrinho do Pet aberto',NULL,r.id,NULL);
RETURN public._pet_arcade_result(r.id)||jsonb_build_object('new_balance',v_balance); END $$;

CREATE OR REPLACE FUNCTION public.cancel_pet_piggybank(_game_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; c public.pet_arcade_game_configs; wallet public.user_coins; penalty integer; refund integer; v_balance integer;
BEGIN SELECT * INTO r FROM public.pet_arcade_rounds WHERE id=_game_id AND user_id=auth.uid() AND game_type='piggybank' FOR UPDATE; IF r.id IS NULL OR r.status<>'active' THEN RAISE EXCEPTION 'round_not_found'; END IF;
SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='piggybank'; IF NOT COALESCE((c.difficulty_config->>'allow_cancel')::boolean,false) THEN RAISE EXCEPTION 'cancel_not_allowed'; END IF;
penalty:=floor(r.entry_coins*COALESCE((c.difficulty_config->>'cancel_penalty_percent')::numeric,0)/100)::integer; refund:=GREATEST(0,r.entry_coins-penalty); SELECT * INTO wallet FROM public.user_coins WHERE user_id=auth.uid() FOR UPDATE; refund:=LEAST(refund,500-wallet.balance); v_balance:=wallet.balance+refund;
UPDATE public.user_coins SET balance=v_balance,updated_at=now() WHERE user_id=auth.uid(); UPDATE public.pet_arcade_rounds SET status='cancelled',reward_coins=refund,result_summary=jsonb_build_object('deposit',r.entry_coins,'refund',refund,'penalty',penalty),ended_at=now(),updated_at=now() WHERE id=r.id;
IF refund>0 THEN PERFORM public.log_coin_tx(auth.uid(),'pet_arcade_piggybank_refund','in',refund,v_balance,'Cofrinho do Pet encerrado',NULL,r.id,NULL); END IF;
RETURN public._pet_arcade_result(r.id)||jsonb_build_object('new_balance',v_balance); END $$;

-- Estado seguro para retomar jogos sequenciais.
CREATE OR REPLACE FUNCTION public.resume_pet_arcade_game(_game_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; m jsonb; board jsonb; visible jsonb:='[]'::jsonb; pos integer;
BEGIN SELECT * INTO r FROM public.pet_arcade_rounds WHERE id=_game_id AND user_id=auth.uid(); IF r.id IS NULL OR r.status<>'active' THEN RAISE EXCEPTION 'round_not_found'; END IF; m:=r.metadata;
IF r.game_type='hilo' THEN RETURN jsonb_build_object('game_id',r.id,'status','active','current_card',(m->>'current_card')::integer,'step',(m->>'step')::integer,'multiplier',r.current_multiplier); END IF;
IF r.game_type='towers' THEN RETURN jsonb_build_object('game_id',r.id,'status','active','floor',(m->>'floor')::integer,'multiplier',r.current_multiplier,'difficulty',r.difficulty); END IF;
IF r.game_type='memory' THEN board:=m->'board'; FOR pos IN SELECT value::integer FROM jsonb_array_elements_text(m->'matched') LOOP visible:=visible||jsonb_build_array(jsonb_build_object('position',pos,'card',(board->pos)-'pair_id')); END LOOP;
  RETURN jsonb_build_object('game_id',r.id,'status','active','card_count',jsonb_array_length(board),'pairs',(m->>'pairs')::integer,'matched',m->'matched','visible_cards',visible,'attempts',(m->>'attempts')::integer,'time_limit',(m->>'time_limit')::integer,'started_at',r.started_at); END IF;
IF r.game_type='piggybank' THEN RETURN jsonb_build_object('game_id',r.id,'status','active','deposit',r.entry_coins,'unlock_at',m->>'unlock_at','hours',(m->>'hours')::integer,'bonus_percent',(m->>'bonus_percent')::numeric); END IF;
RETURN jsonb_build_object('game_id',r.id,'status','active','game_type',r.game_type,'multiplier',r.current_multiplier); END $$;

-- Admin ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pet_arcade_admin_update_settings(_patch jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE row_data public.pet_arcade_settings; BEGIN IF NOT(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN RAISE EXCEPTION 'forbidden'; END IF;
UPDATE public.pet_arcade_settings SET is_enabled=COALESCE((_patch->>'is_enabled')::boolean,is_enabled),daily_play_limit=COALESCE((_patch->>'daily_play_limit')::integer,daily_play_limit),daily_win_limit=COALESCE((_patch->>'daily_win_limit')::integer,daily_win_limit),global_min_entry=COALESCE((_patch->>'global_min_entry')::integer,global_min_entry),global_max_entry=COALESCE((_patch->>'global_max_entry')::integer,global_max_entry),maintenance_message=COALESCE(_patch->>'maintenance_message',maintenance_message),healthy_play_message=COALESCE(_patch->>'healthy_play_message',healthy_play_message),updated_at=now() WHERE id=1 RETURNING * INTO row_data; RETURN to_jsonb(row_data); END $$;

CREATE OR REPLACE FUNCTION public.pet_arcade_admin_update_game_config(_game_type text,_patch jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE row_data public.pet_arcade_game_configs; BEGIN IF NOT(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN RAISE EXCEPTION 'forbidden'; END IF;
UPDATE public.pet_arcade_game_configs SET display_name=COALESCE(_patch->>'display_name',display_name),description=COALESCE(_patch->>'description',description),is_enabled=COALESCE((_patch->>'is_enabled')::boolean,is_enabled),min_entry=COALESCE((_patch->>'min_entry')::integer,min_entry),max_entry=COALESCE((_patch->>'max_entry')::integer,max_entry),daily_play_limit=COALESCE((_patch->>'daily_play_limit')::integer,daily_play_limit),daily_win_limit=COALESCE((_patch->>'daily_win_limit')::integer,daily_win_limit),cooldown_seconds=COALESCE((_patch->>'cooldown_seconds')::integer,cooldown_seconds),max_multiplier=COALESCE((_patch->>'max_multiplier')::numeric,max_multiplier),difficulty_config=COALESCE(_patch->'difficulty_config',difficulty_config),reward_config=COALESCE(_patch->'reward_config',reward_config),visual_config=COALESCE(_patch->'visual_config',visual_config),sort_order=COALESCE((_patch->>'sort_order')::integer,sort_order),updated_at=now() WHERE game_type=_game_type RETURNING * INTO row_data; IF row_data.id IS NULL THEN RAISE EXCEPTION 'game_not_found'; END IF; RETURN to_jsonb(row_data); END $$;

CREATE OR REPLACE FUNCTION public.pet_arcade_admin_metrics()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NOT(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN RAISE EXCEPTION 'forbidden'; END IF;
RETURN (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.game_type),'[]'::jsonb) FROM (SELECT game_type,count(*) rounds,COALESCE(sum(entry_coins),0) total_entries,COALESCE(sum(reward_coins),0) total_rewards,COALESCE(sum(entry_coins)-sum(reward_coins),0) net_coins FROM public.pet_arcade_rounds GROUP BY game_type)x); END $$;

-- Protecao das funcoes internas e permissoes das RPCs publicas.
REVOKE ALL ON FUNCTION public._pet_arcade_add_event(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public._pet_arcade_begin(text,integer,text,text,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public._pet_arcade_finish(uuid,text,numeric,jsonb,integer,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public._pet_arcade_result(uuid) FROM PUBLIC,anon,authenticated;

REVOKE ALL ON FUNCTION public.get_pet_arcade_catalog() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.get_pet_arcade_history_v2(integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.start_pet_plinko(integer,text,text),public.finish_pet_plinko(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.start_pet_keno(integer,integer[],text),public.finish_pet_keno(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.start_pet_wheel(integer,text,text),public.finish_pet_wheel(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.start_pet_hilo(integer,text),public.choose_pet_hilo(uuid,text,integer),public.cashout_pet_hilo(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.start_pet_towers(integer,text,text),public.choose_pet_tower_tile(uuid,integer,integer),public.cashout_pet_towers(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.start_pet_coinflip(integer,text,text),public.finish_pet_coinflip(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.start_pet_race(integer,text),public.finish_pet_race(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.start_pet_memory(integer,text,text),public.reveal_pet_memory_card(uuid,integer),public.finish_pet_memory(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.start_pet_piggybank(integer,integer),public.claim_pet_piggybank(uuid),public.cancel_pet_piggybank(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.start_pet_dice(integer,text,integer,text),public.finish_pet_dice(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.resume_pet_arcade_game(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.pet_arcade_admin_update_settings(jsonb),public.pet_arcade_admin_update_game_config(text,jsonb),public.pet_arcade_admin_metrics() FROM PUBLIC,anon;

GRANT EXECUTE ON FUNCTION public.get_pet_arcade_catalog() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pet_arcade_history_v2(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_pet_plinko(integer,text,text),public.finish_pet_plinko(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_pet_keno(integer,integer[],text),public.finish_pet_keno(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_pet_wheel(integer,text,text),public.finish_pet_wheel(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_pet_hilo(integer,text),public.choose_pet_hilo(uuid,text,integer),public.cashout_pet_hilo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_pet_towers(integer,text,text),public.choose_pet_tower_tile(uuid,integer,integer),public.cashout_pet_towers(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_pet_coinflip(integer,text,text),public.finish_pet_coinflip(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_pet_race(integer,text),public.finish_pet_race(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_pet_memory(integer,text,text),public.reveal_pet_memory_card(uuid,integer),public.finish_pet_memory(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_pet_piggybank(integer,integer),public.claim_pet_piggybank(uuid),public.cancel_pet_piggybank(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_pet_dice(integer,text,integer,text),public.finish_pet_dice(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_pet_arcade_game(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pet_arcade_admin_update_settings(jsonb),public.pet_arcade_admin_update_game_config(text,jsonb),public.pet_arcade_admin_metrics() TO authenticated;
