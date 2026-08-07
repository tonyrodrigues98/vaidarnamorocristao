-- Pet Arcade: raspadinha, ovo surpresa, album, maquina de bolinha e missoes.

ALTER TABLE public.pet_arcade_rounds DROP CONSTRAINT IF EXISTS pet_arcade_rounds_game_type_check;
ALTER TABLE public.pet_arcade_rounds ADD CONSTRAINT pet_arcade_rounds_game_type_check CHECK (game_type IN (
  'treasure','flight','plinko','keno','wheel','hilo','towers','coinflip','race','memory','piggybank','dice',
  'scratch','egg','album','capsule','missions'
));

ALTER TABLE public.pet_arcade_game_configs DROP CONSTRAINT IF EXISTS pet_arcade_game_configs_game_type_check;
ALTER TABLE public.pet_arcade_game_configs ADD CONSTRAINT pet_arcade_game_configs_game_type_check CHECK (game_type IN (
  'treasure','flight','plinko','keno','wheel','hilo','towers','coinflip','race','memory','piggybank','dice',
  'scratch','egg','album','capsule','missions'
));

INSERT INTO public.pet_arcade_game_configs
  (game_type,display_name,description,category,min_entry,max_entry,daily_play_limit,daily_win_limit,cooldown_seconds,max_multiplier,difficulty_config,reward_config,visual_config,sort_order)
VALUES
  ('scratch','Raspadinha do Pet','Revele uma grade de pets e descubra combinacoes especiais.','luck',25,25,10,1000,8,8,
   '{"grid_size":9,"match_count":3,"rarity_weights":{"common":60,"uncommon":25,"rare":10,"epic":4,"legendary":1}}',
   '{"match_multiplier":2,"rare_multiplier":4,"epic_multiplier":6,"legendary_multiplier":8,"xp_participation":2,"xp_win":8}',
   '{"accent":"silver"}',13),
  ('egg','Ovo Surpresa','Incube uma descoberta e abra quando ela estiver pronta.','care',40,40,3,1000,0,5,
   '{"incubation_minutes":60,"max_active":1,"instant_open_enabled":false,"instant_open_cost":20}',
   '{"coins":[20,40,80,120],"xp":[5,10,20],"care_item_weight":25}',
   '{"accent":"gold"}',14),
  ('album','Album de Figurinhas','Colecione pets reais, abra pacotes e complete paginas.','care',15,100,10,1500,2,1,
   '{"pack_prices":{"3":15,"5":25,"10":45},"duplicate_fragments":2}',
   '{"page_coins":75,"page_xp":25,"category_coins":150,"album_coins":500}',
   '{"accent":"indigo"}',15),
  ('capsule','Maquina de Bolinha','Receba itens reais de cuidado para o seu pet.','quick',20,20,10,500,5,1,
   '{"special_weight":5}', '{"quantity":1,"xp":2}', '{"accent":"coral"}',16),
  ('missions','Missoes Diarias','Complete objetivos reais no Arcade e cuide do seu pet.','care',0,0,20,1000,0,1,
   '{"reset_timezone":"America/Sao_Paulo","daily_count":5}', '{}', '{"accent":"emerald"}',17)
ON CONFLICT (game_type) DO UPDATE SET
  display_name=EXCLUDED.display_name, description=EXCLUDED.description, category=EXCLUDED.category, sort_order=EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS public.pet_album_stickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_type text NOT NULL CHECK (catalog_type IN ('variant','species')),
  catalog_id uuid NOT NULL,
  category_id uuid REFERENCES public.pet_categories(id) ON DELETE SET NULL,
  category_name text NOT NULL,
  name text NOT NULL,
  image_path text NOT NULL,
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','uncommon','rare','epic','legendary')),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(catalog_type,catalog_id)
);

CREATE TABLE IF NOT EXISTS public.user_pet_album_stickers (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sticker_id uuid NOT NULL REFERENCES public.pet_album_stickers(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  first_collected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,sticker_id)
);

CREATE TABLE IF NOT EXISTS public.pet_album_pack_openings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL UNIQUE REFERENCES public.pet_arcade_rounds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_size integer NOT NULL CHECK (pack_size IN (3,5,10)),
  cost integer NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pet_album_rewards_claimed (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_key text NOT NULL,
  reward_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,reward_key)
);

CREATE TABLE IF NOT EXISTS public.pet_arcade_surprise_eggs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL UNIQUE REFERENCES public.pet_arcade_rounds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.user_pets_v2(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','ready','opened','cancelled')),
  cost_amount integer NOT NULL,
  open_after timestamptz NOT NULL,
  opened_at timestamptz,
  reward_type text NOT NULL CHECK (reward_type IN ('coins','xp','care_item')),
  reward_amount integer NOT NULL DEFAULT 0,
  reward_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  rarity text NOT NULL DEFAULT 'common',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pet_arcade_daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  event_key text NOT NULL,
  target_value integer NOT NULL CHECK (target_value > 0),
  reward_config jsonb NOT NULL DEFAULT '{"coins":10,"xp":5}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_pet_arcade_daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.user_pets_v2(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.pet_arcade_daily_missions(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  target_value integer NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','claimed','expired')),
  assigned_date date NOT NULL,
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,mission_id,assigned_date)
);

INSERT INTO public.pet_album_stickers(catalog_type,catalog_id,category_id,category_name,name,image_path,rarity,sort_order)
SELECT 'variant',v.id,v.category_id,COALESCE(c.name,'Pets'),v.name,
       COALESCE(v.image_url_adult,v.image_url_baby,v.image_url),
       CASE WHEN row_number() OVER (ORDER BY v.sort_order,v.name)%25=0 THEN 'legendary'
            WHEN row_number() OVER (ORDER BY v.sort_order,v.name)%10=0 THEN 'epic'
            WHEN row_number() OVER (ORDER BY v.sort_order,v.name)%5=0 THEN 'rare'
            WHEN row_number() OVER (ORDER BY v.sort_order,v.name)%3=0 THEN 'uncommon' ELSE 'common' END,
       v.sort_order
FROM public.pet_variants v LEFT JOIN public.pet_categories c ON c.id=v.category_id
WHERE v.active=true AND COALESCE(v.image_url_adult,v.image_url_baby,v.image_url) IS NOT NULL
ON CONFLICT(catalog_type,catalog_id) DO UPDATE SET image_path=EXCLUDED.image_path,name=EXCLUDED.name,category_name=EXCLUDED.category_name;

CREATE OR REPLACE FUNCTION public.sync_pet_variant_album_sticker()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE category_label text; resolved_image text;
BEGIN
  SELECT name INTO category_label FROM public.pet_categories WHERE id=NEW.category_id;
  resolved_image:=COALESCE(NEW.image_url_adult,NEW.image_url_baby,NEW.image_url);
  IF resolved_image IS NULL THEN
    UPDATE public.pet_album_stickers SET is_active=false WHERE catalog_type='variant' AND catalog_id=NEW.id;
    RETURN NEW;
  END IF;
  INSERT INTO public.pet_album_stickers(catalog_type,catalog_id,category_id,category_name,name,image_path,rarity,sort_order,is_active)
  VALUES('variant',NEW.id,NEW.category_id,COALESCE(category_label,'Pets'),NEW.name,resolved_image,'common',NEW.sort_order,NEW.active)
  ON CONFLICT(catalog_type,catalog_id) DO UPDATE SET
    category_id=EXCLUDED.category_id,category_name=EXCLUDED.category_name,name=EXCLUDED.name,image_path=EXCLUDED.image_path,
    sort_order=EXCLUDED.sort_order,is_active=EXCLUDED.is_active;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS sync_pet_variant_album_sticker_trg ON public.pet_variants;
CREATE TRIGGER sync_pet_variant_album_sticker_trg AFTER INSERT OR UPDATE OF name,category_id,image_url,image_url_baby,image_url_adult,active,sort_order
ON public.pet_variants FOR EACH ROW EXECUTE FUNCTION public.sync_pet_variant_album_sticker();

INSERT INTO public.pet_arcade_daily_missions(mission_key,title,description,event_key,target_value,reward_config,sort_order)
VALUES
 ('play_one','Primeira aventura','Jogue uma aventura no Pet Arcade.','play_any',1,'{"coins":10,"xp":5}',1),
 ('play_three','Companhia de aventuras','Jogue 3 aventuras no Pet Arcade.','play_any',3,'{"coins":20,"xp":10}',2),
 ('scratch_one','Descoberta prateada','Abra uma Raspadinha do Pet.','scratch_play',1,'{"coins":15,"xp":8}',3),
 ('album_pack','Colecionador do dia','Abra um pacote de figurinhas.','album_pack',1,'{"coins":15,"xp":10}',4),
 ('capsule_one','Cuidado surpresa','Use a Maquina de Bolinha.','capsule_play',1,'{"coins":10,"xp":8}',5),
 ('race_one','Pet na pista','Complete uma Corrida dos Pets.','race_play',1,'{"coins":15,"xp":8}',6)
ON CONFLICT(mission_key) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,event_key=EXCLUDED.event_key;

ALTER TABLE public.pet_album_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pet_album_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_album_pack_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_album_rewards_claimed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_arcade_surprise_eggs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_arcade_daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pet_arcade_daily_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY pet_album_catalog_read ON public.pet_album_stickers FOR SELECT TO authenticated USING(is_active OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY pet_album_owned_read ON public.user_pet_album_stickers FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY pet_album_openings_read ON public.pet_album_pack_openings FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY pet_album_claims_read ON public.pet_album_rewards_claimed FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY pet_eggs_read ON public.pet_arcade_surprise_eggs FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY pet_missions_catalog_read ON public.pet_arcade_daily_missions FOR SELECT TO authenticated USING(is_active OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY pet_missions_owned_read ON public.user_pet_arcade_daily_missions FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY pet_missions_admin ON public.pet_arcade_daily_missions FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

GRANT SELECT ON public.pet_album_stickers,public.user_pet_album_stickers,public.pet_album_pack_openings,public.pet_album_rewards_claimed,public.pet_arcade_surprise_eggs,public.pet_arcade_daily_missions,public.user_pet_arcade_daily_missions TO authenticated;

CREATE OR REPLACE FUNCTION public._pet_arcade_progress_event(_event_key text,_amount integer DEFAULT 1)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); pet_id uuid; today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  SELECT id INTO pet_id FROM public.user_pets_v2 WHERE user_id=uid AND is_equipped=true LIMIT 1;
  IF pet_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_pet_arcade_daily_missions(user_id,pet_id,mission_id,target_value,assigned_date)
  SELECT uid,pet_id,m.id,m.target_value,today FROM public.pet_arcade_daily_missions m WHERE m.is_active
  ON CONFLICT(user_id,mission_id,assigned_date) DO NOTHING;
  UPDATE public.user_pet_arcade_daily_missions u SET
    target_value=m.target_value,
    progress=LEAST(m.target_value,u.progress+GREATEST(_amount,0)),
    status=CASE WHEN u.progress+GREATEST(_amount,0)>=m.target_value THEN 'completed' ELSE 'active' END,
    completed_at=CASE WHEN u.progress+GREATEST(_amount,0)>=m.target_value THEN COALESCE(u.completed_at,now()) ELSE NULL END
  FROM public.pet_arcade_daily_missions m
  WHERE u.mission_id=m.id AND u.user_id=uid AND u.assigned_date=today AND u.status IN ('active','completed') AND m.event_key=_event_key;
END $$;

CREATE OR REPLACE FUNCTION public.get_pet_arcade_daily_missions()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); pet_id uuid; today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  SELECT id INTO pet_id FROM public.user_pets_v2 WHERE user_id=uid AND is_equipped=true LIMIT 1;
  IF pet_id IS NULL THEN RAISE EXCEPTION 'pet_required'; END IF;
  INSERT INTO public.user_pet_arcade_daily_missions(user_id,pet_id,mission_id,target_value,assigned_date)
  SELECT uid,pet_id,m.id,m.target_value,today FROM public.pet_arcade_daily_missions m WHERE m.is_active
  ON CONFLICT(user_id,mission_id,assigned_date) DO NOTHING;
  UPDATE public.user_pet_arcade_daily_missions u SET target_value=m.target_value,
    progress=LEAST(u.progress,m.target_value),
    status=CASE WHEN u.status='claimed' THEN 'claimed' WHEN u.progress>=m.target_value THEN 'completed' ELSE 'active' END
  FROM public.pet_arcade_daily_missions m WHERE u.mission_id=m.id AND u.user_id=uid AND u.assigned_date=today;
  RETURN (SELECT COALESCE(jsonb_agg(jsonb_build_object('id',u.id,'mission_id',m.id,'title',m.title,'description',m.description,'progress',u.progress,'target_value',u.target_value,'status',u.status,'reward_config',m.reward_config) ORDER BY m.sort_order),'[]'::jsonb)
    FROM public.user_pet_arcade_daily_missions u JOIN public.pet_arcade_daily_missions m ON m.id=u.mission_id WHERE u.user_id=uid AND u.assigned_date=today);
END $$;

CREATE OR REPLACE FUNCTION public.claim_pet_arcade_mission(_assignment_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); a public.user_pet_arcade_daily_missions; m public.pet_arcade_daily_missions; wallet public.user_coins; coins integer; xp integer; item_qty integer; item record; xp_result jsonb;
BEGIN
  SELECT * INTO a FROM public.user_pet_arcade_daily_missions WHERE id=_assignment_id AND user_id=uid FOR UPDATE;
  IF a.id IS NULL OR a.status<>'completed' THEN RAISE EXCEPTION 'mission_not_claimable'; END IF;
  SELECT * INTO m FROM public.pet_arcade_daily_missions WHERE id=a.mission_id;
  coins:=COALESCE((m.reward_config->>'coins')::integer,0); xp:=COALESCE((m.reward_config->>'xp')::integer,0); item_qty:=COALESCE((m.reward_config->>'care_item_quantity')::integer,0);
  INSERT INTO public.user_coins(user_id,balance) VALUES(uid,100) ON CONFLICT(user_id) DO NOTHING;
  SELECT * INTO wallet FROM public.user_coins WHERE user_id=uid FOR UPDATE;
  UPDATE public.user_coins SET balance=balance+coins,updated_at=now() WHERE user_id=uid;
  IF coins>0 THEN PERFORM public.log_coin_tx(uid,'pet_arcade_mission','in',coins,wallet.balance+coins,m.title,NULL,a.id,NULL); END IF;
  IF item_qty>0 THEN
    SELECT id,name INTO item FROM public.pet_care_items WHERE active ORDER BY random() LIMIT 1;
    IF item.id IS NOT NULL THEN
      INSERT INTO public.user_grab_inventory(user_id,prize_kind,prize_ref_id,quantity) VALUES(uid,'care_item',item.id,item_qty)
      ON CONFLICT(user_id,prize_kind,prize_ref_id) DO UPDATE SET quantity=public.user_grab_inventory.quantity+item_qty,updated_at=now();
    END IF;
  END IF;
  BEGIN xp_result:=public.award_xp('pet_arcade_mission',xp,NULL,jsonb_build_object('mission_id',m.id)); xp:=COALESCE((xp_result->>'granted')::integer,0); EXCEPTION WHEN OTHERS THEN xp:=0; END;
  UPDATE public.user_pet_arcade_daily_missions SET status='claimed',claimed_at=now() WHERE id=a.id;
  RETURN jsonb_build_object('coins',coins,'xp',xp,'care_item_quantity',item_qty,'care_item_name',item.name,'new_balance',wallet.balance+coins);
END $$;

CREATE OR REPLACE FUNCTION public.start_pet_scratch(_entry_coins integer,_client_seed text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; c public.pet_arcade_game_configs; stickers jsonb; items jsonb:='[]'::jsonb; i integer; idx integer; max_count integer; mult numeric; xp integer; result jsonb;
BEGIN
  r:=public._pet_arcade_begin('scratch',_entry_coins,'padrao',_client_seed,'{}');
  SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='scratch';
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'name',name,'image_path',image_path,'rarity',rarity,'category',category_name)),'[]'::jsonb) INTO stickers FROM public.pet_album_stickers WHERE is_active;
  IF jsonb_array_length(stickers)<3 THEN RAISE EXCEPTION 'insufficient_pet_images'; END IF;
  FOR i IN 0..8 LOOP idx:=floor(public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,i)*jsonb_array_length(stickers))::integer; items:=items||jsonb_build_array(stickers->idx); END LOOP;
  SELECT COALESCE(max(n),0) INTO max_count FROM (SELECT count(*) n FROM jsonb_array_elements(items)e GROUP BY e->>'id')x;
  mult:=CASE WHEN max_count>=3 THEN COALESCE((c.reward_config->>'match_multiplier')::numeric,2) ELSE 0 END;
  xp:=COALESCE((c.reward_config->>'xp_participation')::integer,2)+CASE WHEN mult>0 THEN COALESCE((c.reward_config->>'xp_win')::integer,8) ELSE 0 END;
  result:=public._pet_arcade_finish(r.id,CASE WHEN mult>0 THEN 'collected' ELSE 'lost' END,mult,jsonb_build_object('tiles',items,'max_match',max_count),xp,NULL);
  PERFORM public._pet_arcade_progress_event('scratch_play',1); RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.start_pet_surprise_egg(_entry_coins integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; c public.pet_arcade_game_configs; minutes integer; egg_id uuid; unit numeric; reward_type text; reward_amount integer; rarity text;
BEGIN
  IF EXISTS(SELECT 1 FROM public.pet_arcade_surprise_eggs WHERE user_id=auth.uid() AND status IN('waiting','ready')) THEN RAISE EXCEPTION 'egg_already_active'; END IF;
  r:=public._pet_arcade_begin('egg',_entry_coins,'cuidado',NULL,'{}'); SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='egg';
  minutes:=COALESCE((c.difficulty_config->>'incubation_minutes')::integer,60); unit:=public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,0);
  reward_type:=CASE WHEN unit<0.65 THEN 'coins' WHEN unit<0.9 THEN 'xp' ELSE 'care_item' END;
  reward_amount:=CASE reward_type WHEN 'coins' THEN 20+floor(unit*100)::integer WHEN 'xp' THEN 10+floor(unit*20)::integer ELSE 1 END;
  rarity:=CASE WHEN unit>0.97 THEN 'legendary' WHEN unit>0.9 THEN 'epic' WHEN unit>0.75 THEN 'rare' ELSE 'common' END;
  INSERT INTO public.pet_arcade_surprise_eggs(game_id,user_id,pet_id,cost_amount,open_after,reward_type,reward_amount,rarity)
  VALUES(r.id,auth.uid(),r.user_pet_id,_entry_coins,now()+make_interval(mins=>minutes),reward_type,reward_amount,rarity) RETURNING id INTO egg_id;
  RETURN jsonb_build_object('id',egg_id,'game_id',r.id,'status','waiting','open_after',now()+make_interval(mins=>minutes),'rarity',rarity,'new_balance',(SELECT balance FROM public.user_coins WHERE user_id=auth.uid()));
END $$;

CREATE OR REPLACE FUNCTION public.claim_pet_surprise_egg(_egg_id uuid,_instant boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE e public.pet_arcade_surprise_eggs; c public.pet_arcade_game_configs; wallet public.user_coins; instant_cost integer; item record; result jsonb;
BEGIN
  SELECT * INTO e FROM public.pet_arcade_surprise_eggs WHERE id=_egg_id AND user_id=auth.uid() FOR UPDATE;
  IF e.id IS NULL OR e.status='opened' THEN RAISE EXCEPTION 'egg_not_available'; END IF;
  IF now()<e.open_after THEN
    SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='egg';
    IF NOT _instant OR NOT COALESCE((c.difficulty_config->>'instant_open_enabled')::boolean,false) THEN RAISE EXCEPTION 'egg_not_ready'; END IF;
    instant_cost:=COALESCE((c.difficulty_config->>'instant_open_cost')::integer,0);
    INSERT INTO public.user_coins(user_id,balance) VALUES(auth.uid(),100) ON CONFLICT(user_id) DO NOTHING;
    SELECT * INTO wallet FROM public.user_coins WHERE user_id=auth.uid() FOR UPDATE;
    IF wallet.balance<instant_cost THEN RAISE EXCEPTION 'insufficient_coins'; END IF;
    UPDATE public.user_coins SET balance=balance-instant_cost,updated_at=now() WHERE user_id=auth.uid();
    IF instant_cost>0 THEN PERFORM public.log_coin_tx(auth.uid(),'pet_arcade_egg_instant','out',instant_cost,wallet.balance-instant_cost,'Abertura antecipada do Ovo Surpresa',NULL,e.game_id,NULL); END IF;
  END IF;
  IF e.reward_type='care_item' THEN
    SELECT id,name,image_url INTO item FROM public.pet_care_items WHERE active ORDER BY random() LIMIT 1;
    INSERT INTO public.user_grab_inventory(user_id,prize_kind,prize_ref_id,quantity) VALUES(auth.uid(),'care_item',item.id,1)
    ON CONFLICT(user_id,prize_kind,prize_ref_id) DO UPDATE SET quantity=public.user_grab_inventory.quantity+1,updated_at=now();
    result:=public._pet_arcade_finish(e.game_id,'collected',1,jsonb_build_object('reward_type','care_item','item_id',item.id,'name',item.name,'image_path',item.image_url,'rarity',e.rarity),0,0);
  ELSIF e.reward_type='xp' THEN result:=public._pet_arcade_finish(e.game_id,'collected',1,jsonb_build_object('reward_type','xp','amount',e.reward_amount,'rarity',e.rarity),e.reward_amount,0);
  ELSE result:=public._pet_arcade_finish(e.game_id,'collected',1,jsonb_build_object('reward_type','coins','amount',e.reward_amount,'rarity',e.rarity),0,e.reward_amount); END IF;
  UPDATE public.pet_arcade_surprise_eggs SET status='opened',opened_at=now(),reward_payload=result->'result' WHERE id=e.id;
  PERFORM public._pet_arcade_progress_event('egg_open',1); RETURN result||jsonb_build_object('egg_id',e.id);
END $$;

CREATE OR REPLACE FUNCTION public.open_pet_album_pack(_pack_size integer,_client_seed text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.pet_arcade_game_configs; r public.pet_arcade_rounds; price integer; pool jsonb; items jsonb:='[]'::jsonb; i integer; idx integer; s jsonb; was_new boolean; fragments integer:=0; result jsonb;
BEGIN
  IF _pack_size NOT IN(3,5,10) THEN RAISE EXCEPTION 'invalid_selection'; END IF;
  SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='album'; price:=COALESCE((c.difficulty_config->'pack_prices'->>_pack_size::text)::integer,c.min_entry);
  r:=public._pet_arcade_begin('album',price,'pack',_client_seed,jsonb_build_object('pack_size',_pack_size));
  SELECT COALESCE(jsonb_agg(to_jsonb(x)),'[]'::jsonb) INTO pool FROM (SELECT id,name,image_path,rarity,category_name FROM public.pet_album_stickers WHERE is_active ORDER BY sort_order)x;
  IF jsonb_array_length(pool)=0 THEN RAISE EXCEPTION 'insufficient_pet_images'; END IF;
  FOR i IN 0.._pack_size-1 LOOP
    idx:=floor(public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,i)*jsonb_array_length(pool))::integer; s:=pool->idx;
    was_new:=NOT EXISTS(SELECT 1 FROM public.user_pet_album_stickers WHERE user_id=auth.uid() AND sticker_id=(s->>'id')::uuid);
    INSERT INTO public.user_pet_album_stickers(user_id,sticker_id,quantity) VALUES(auth.uid(),(s->>'id')::uuid,1)
    ON CONFLICT(user_id,sticker_id) DO UPDATE SET quantity=public.user_pet_album_stickers.quantity+1,updated_at=now();
    IF NOT was_new THEN fragments:=fragments+COALESCE((c.difficulty_config->>'duplicate_fragments')::integer,2); END IF;
    items:=items||jsonb_build_array(s||jsonb_build_object('is_new',was_new));
  END LOOP;
  INSERT INTO public.pet_album_pack_openings(game_id,user_id,pack_size,cost,results) VALUES(r.id,auth.uid(),_pack_size,price,items);
  result:=public._pet_arcade_finish(r.id,'collected',1,jsonb_build_object('stickers',items,'fragments',fragments,'pack_size',_pack_size),fragments,0);
  PERFORM public._pet_arcade_progress_event('album_pack',1);
  PERFORM public._pet_arcade_progress_event('album_sticker',_pack_size);
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.get_pet_album_state()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object(
  'stickers',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'image_path',s.image_path,'rarity',s.rarity,'category',s.category_name,'quantity',COALESCE(u.quantity,0)) ORDER BY s.category_name,s.sort_order),'[]'::jsonb) FROM public.pet_album_stickers s LEFT JOIN public.user_pet_album_stickers u ON u.sticker_id=s.id AND u.user_id=auth.uid() WHERE s.is_active),
  'claimed',(SELECT COALESCE(jsonb_agg(reward_key),'[]'::jsonb) FROM public.pet_album_rewards_claimed WHERE user_id=auth.uid()),
  'egg',(SELECT to_jsonb(e) FROM public.pet_arcade_surprise_eggs e WHERE e.user_id=auth.uid() AND e.status IN('waiting','ready') ORDER BY created_at DESC LIMIT 1)
 );
$$;

CREATE OR REPLACE FUNCTION public.claim_pet_album_category(_category text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.pet_arcade_game_configs; missing integer; key text:='category:'||_category; coins integer; xp integer; wallet public.user_coins; xp_result jsonb;
BEGIN
  SELECT count(*) INTO missing FROM public.pet_album_stickers s WHERE s.is_active AND s.category_name=_category AND NOT EXISTS(SELECT 1 FROM public.user_pet_album_stickers u WHERE u.user_id=auth.uid() AND u.sticker_id=s.id);
  IF missing>0 OR NOT EXISTS(SELECT 1 FROM public.pet_album_stickers WHERE is_active AND category_name=_category) THEN RAISE EXCEPTION 'album_category_incomplete'; END IF;
  INSERT INTO public.pet_album_rewards_claimed(user_id,reward_key) VALUES(auth.uid(),key) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RAISE EXCEPTION 'reward_already_claimed'; END IF;
  SELECT * INTO c FROM public.pet_arcade_game_configs WHERE game_type='album'; coins:=COALESCE((c.reward_config->>'category_coins')::integer,150); xp:=COALESCE((c.reward_config->>'page_xp')::integer,25);
  INSERT INTO public.user_coins(user_id,balance) VALUES(auth.uid(),100) ON CONFLICT(user_id) DO NOTHING;
  SELECT * INTO wallet FROM public.user_coins WHERE user_id=auth.uid() FOR UPDATE; UPDATE public.user_coins SET balance=balance+coins,updated_at=now() WHERE user_id=auth.uid();
  PERFORM public.log_coin_tx(auth.uid(),'pet_album_reward','in',coins,wallet.balance+coins,'Categoria do album completa',_category,NULL,NULL);
  BEGIN xp_result:=public.award_xp('pet_album',xp,NULL,jsonb_build_object('category',_category)); xp:=COALESCE((xp_result->>'granted')::integer,0); EXCEPTION WHEN OTHERS THEN xp:=0; END;
  PERFORM public._pet_arcade_progress_event('album_category_complete',1);
  RETURN jsonb_build_object('coins',coins,'xp',xp,'new_balance',wallet.balance+coins);
END $$;

CREATE OR REPLACE FUNCTION public.start_pet_capsule(_entry_coins integer,_client_seed text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.pet_arcade_rounds; items jsonb; idx integer; item jsonb; result jsonb;
BEGIN
  r:=public._pet_arcade_begin('capsule',_entry_coins,'padrao',_client_seed,'{}');
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'name',name,'image_path',image_url,'kind',kind)),'[]'::jsonb) INTO items FROM public.pet_care_items WHERE active;
  IF jsonb_array_length(items)=0 THEN RAISE EXCEPTION 'no_care_items'; END IF;
  idx:=floor(public.pet_arcade_seed_unit(r.server_seed,r.client_seed,r.nonce,0)*jsonb_array_length(items))::integer; item:=items->idx;
  INSERT INTO public.user_grab_inventory(user_id,prize_kind,prize_ref_id,quantity) VALUES(auth.uid(),'care_item',(item->>'id')::uuid,1)
  ON CONFLICT(user_id,prize_kind,prize_ref_id) DO UPDATE SET quantity=public.user_grab_inventory.quantity+1,updated_at=now();
  result:=public._pet_arcade_finish(r.id,'collected',1,jsonb_build_object('item',item),2,0);
  PERFORM public._pet_arcade_progress_event('capsule_play',1); RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.pet_arcade_round_mission_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN PERFORM public._pet_arcade_progress_event('play_any',1); IF NEW.game_type='race' THEN PERFORM public._pet_arcade_progress_event('race_play',1); END IF; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS pet_arcade_round_mission_trg ON public.pet_arcade_rounds;
CREATE TRIGGER pet_arcade_round_mission_trg AFTER INSERT ON public.pet_arcade_rounds FOR EACH ROW EXECUTE FUNCTION public.pet_arcade_round_mission_trigger();

CREATE OR REPLACE FUNCTION public.pet_arcade_care_mission_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  INSERT INTO public.user_pet_arcade_daily_missions(user_id,pet_id,mission_id,target_value,assigned_date)
  SELECT NEW.user_id,NEW.user_pet_id,m.id,m.target_value,today FROM public.pet_arcade_daily_missions m WHERE m.is_active
  ON CONFLICT(user_id,mission_id,assigned_date) DO NOTHING;
  UPDATE public.user_pet_arcade_daily_missions u SET
    target_value=m.target_value,
    progress=LEAST(m.target_value,u.progress+1),
    status=CASE WHEN u.progress+1>=m.target_value THEN 'completed' ELSE 'active' END,
    completed_at=CASE WHEN u.progress+1>=m.target_value THEN COALESCE(u.completed_at,now()) ELSE NULL END
  FROM public.pet_arcade_daily_missions m
  WHERE u.mission_id=m.id AND u.user_id=NEW.user_id AND u.assigned_date=today AND u.status IN('active','completed') AND m.event_key='pet_care';
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS pet_arcade_care_mission_trg ON public.pet_care_events;
CREATE TRIGGER pet_arcade_care_mission_trg AFTER INSERT ON public.pet_care_events FOR EACH ROW EXECUTE FUNCTION public.pet_arcade_care_mission_trigger();

REVOKE ALL ON FUNCTION public._pet_arcade_progress_event(text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_pet_arcade_daily_missions(),public.claim_pet_arcade_mission(uuid),public.start_pet_scratch(integer,text),public.start_pet_surprise_egg(integer),public.claim_pet_surprise_egg(uuid,boolean),public.open_pet_album_pack(integer,text),public.get_pet_album_state(),public.claim_pet_album_category(text),public.start_pet_capsule(integer,text) TO authenticated;
