
-- ============= TABELAS =============
CREATE TABLE public.pet_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'Target',
  category text NOT NULL,
  action_key text NOT NULL,
  target integer NOT NULL DEFAULT 1,
  difficulty text NOT NULL DEFAULT 'easy',
  xp_reward integer NOT NULL DEFAULT 20,
  coin_reward integer NOT NULL DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pet_missions TO authenticated;
GRANT ALL ON public.pet_missions TO service_role;
ALTER TABLE public.pet_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pet_missions_read_auth" ON public.pet_missions FOR SELECT TO authenticated USING (active);

CREATE TABLE public.user_daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.pet_missions(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date),
  progress integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, day, mission_id)
);
CREATE INDEX user_daily_missions_user_day_idx ON public.user_daily_missions(user_id, day);

GRANT SELECT, INSERT, UPDATE ON public.user_daily_missions TO authenticated;
GRANT ALL ON public.user_daily_missions TO service_role;
ALTER TABLE public.user_daily_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "udm_read_own" ON public.user_daily_missions FOR SELECT TO authenticated USING (user_id = auth.uid());
-- writes só via SECURITY DEFINER (roll/progress) — bloqueia cliente fora dessas RPCs

-- ============= ROLL DIÁRIO =============
CREATE OR REPLACE FUNCTION public.roll_daily_missions()
RETURNS SETOF public.user_daily_missions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _day date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _have int;
  _rec record;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT count(*) INTO _have FROM public.user_daily_missions WHERE user_id = _uid AND day = _day;
  IF _have = 0 THEN
    -- Sorteia 3 missões de categorias distintas, ativas
    FOR _rec IN
      WITH picks AS (
        SELECT DISTINCT ON (category) id, category
        FROM public.pet_missions
        WHERE active
        ORDER BY category, random()
      )
      SELECT id FROM picks ORDER BY random() LIMIT 3
    LOOP
      INSERT INTO public.user_daily_missions (user_id, mission_id, day)
      VALUES (_uid, _rec.id, _day)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN QUERY SELECT * FROM public.user_daily_missions WHERE user_id = _uid AND day = _day;
END $$;

CREATE OR REPLACE FUNCTION public.get_today_missions()
RETURNS TABLE (
  id uuid,
  mission_id uuid,
  slug text,
  title text,
  description text,
  icon text,
  category text,
  action_key text,
  target int,
  difficulty text,
  xp_reward int,
  coin_reward int,
  progress int,
  completed_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT u.id, m.id, m.slug, m.title, m.description, m.icon, m.category, m.action_key,
         m.target, m.difficulty, m.xp_reward, m.coin_reward, u.progress, u.completed_at
  FROM public.user_daily_missions u
  JOIN public.pet_missions m ON m.id = u.mission_id
  WHERE u.user_id = auth.uid()
    AND u.day = (now() AT TIME ZONE 'America/Sao_Paulo')::date
  ORDER BY m.sort_order, m.title;
$$;

-- ============= PROGRESSO =============
CREATE OR REPLACE FUNCTION public.progress_mission_action(_user_id uuid, _action_key text, _inc int DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _day date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _row record;
  _new int;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;

  FOR _row IN
    SELECT u.id AS udm_id, u.progress, u.completed_at, m.target, m.xp_reward, m.coin_reward, m.slug
    FROM public.user_daily_missions u
    JOIN public.pet_missions m ON m.id = u.mission_id
    WHERE u.user_id = _user_id
      AND u.day = _day
      AND m.action_key = _action_key
      AND u.completed_at IS NULL
  LOOP
    _new := LEAST(_row.target, _row.progress + _inc);
    UPDATE public.user_daily_missions
       SET progress = _new,
           completed_at = CASE WHEN _new >= _row.target THEN now() ELSE NULL END
     WHERE id = _row.udm_id;

    IF _new >= _row.target THEN
      BEGIN
        PERFORM public.award_xp('mission_done', _row.xp_reward, NULL,
          jsonb_build_object('mission', _row.slug));
      EXCEPTION WHEN OTHERS THEN NULL; END;
      IF _row.coin_reward > 0 THEN
        BEGIN
          INSERT INTO public.coin_transactions (user_id, amount, kind, source, description)
          VALUES (_user_id, _row.coin_reward, 'credit', 'mission', 'Missão diária: ' || _row.slug);
          INSERT INTO public.user_coins (user_id, balance)
          VALUES (_user_id, _row.coin_reward)
          ON CONFLICT (user_id) DO UPDATE SET balance = public.user_coins.balance + EXCLUDED.balance;
        EXCEPTION WHEN OTHERS THEN NULL; END;
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============= TRIGGERS POR FONTE DE AÇÃO =============
CREATE OR REPLACE FUNCTION public.tg_mission_care_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM public.progress_mission_action(NEW.user_id, 'care_action', 1); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS mission_care_event ON public.pet_care_events;
CREATE TRIGGER mission_care_event AFTER INSERT ON public.pet_care_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_mission_care_event();

CREATE OR REPLACE FUNCTION public.tg_mission_prayer_prayed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM public.progress_mission_action(NEW.user_id, 'prayed_for_request', 1); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS mission_prayer_prayed ON public.prayer_request_prayed;
CREATE TRIGGER mission_prayer_prayed AFTER INSERT ON public.prayer_request_prayed
  FOR EACH ROW EXECUTE FUNCTION public.tg_mission_prayer_prayed();

CREATE OR REPLACE FUNCTION public.tg_mission_devotional_prayed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM public.progress_mission_action(NEW.user_id, 'devotional_prayed', 1); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS mission_devotional_prayed ON public.devotional_prayed;
CREATE TRIGGER mission_devotional_prayed AFTER INSERT ON public.devotional_prayed
  FOR EACH ROW EXECUTE FUNCTION public.tg_mission_devotional_prayed();

CREATE OR REPLACE FUNCTION public.tg_mission_profile_view() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.viewer_id IS NOT NULL AND NEW.viewer_id <> NEW.viewed_id THEN
    PERFORM public.progress_mission_action(NEW.viewer_id, 'profile_view', 1);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS mission_profile_view ON public.profile_views;
CREATE TRIGGER mission_profile_view AFTER INSERT ON public.profile_views
  FOR EACH ROW EXECUTE FUNCTION public.tg_mission_profile_view();

CREATE OR REPLACE FUNCTION public.tg_mission_interest() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM public.progress_mission_action(NEW.sender_id, 'add_interest', 1); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS mission_interest ON public.interests;
CREATE TRIGGER mission_interest AFTER INSERT ON public.interests
  FOR EACH ROW EXECUTE FUNCTION public.tg_mission_interest();

CREATE OR REPLACE FUNCTION public.tg_mission_message() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM public.progress_mission_action(NEW.sender_id, 'chat_message', 1); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS mission_message ON public.messages;
CREATE TRIGGER mission_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.tg_mission_message();

CREATE OR REPLACE FUNCTION public.tg_mission_photo() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM public.progress_mission_action(NEW.user_id, 'add_photo', 1); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS mission_photo ON public.profile_photos;
CREATE TRIGGER mission_photo AFTER INSERT ON public.profile_photos
  FOR EACH ROW EXECUTE FUNCTION public.tg_mission_photo();

-- ============= SEED 100 MISSÕES =============
INSERT INTO public.pet_missions (slug, title, description, icon, category, action_key, target, difficulty, xp_reward, coin_reward, sort_order) VALUES
-- PET (care_action) — 20 variações
('pet_care_1','Cuide do seu pet','Use 1 item de cuidado','Heart','pet','care_action',1,'easy',20,10,10),
('pet_care_2','Mimar o pet','Use 2 itens de cuidado hoje','Heart','pet','care_action',2,'easy',25,12,11),
('pet_care_3','Tutor presente','Use 3 itens de cuidado','HeartHandshake','pet','care_action',3,'med',35,20,12),
('pet_care_4','Pet feliz','Use 4 itens de cuidado','Smile','pet','care_action',4,'med',40,25,13),
('pet_care_5','Maratona de carinho','Use 5 itens de cuidado','Sparkles','pet','care_action',5,'hard',60,40,14),
('pet_care_6','Hora do banho','Faça 1 cuidado pelo seu pet','Droplets','pet','care_action',1,'easy',20,10,15),
('pet_care_7','Dia caprichado','Cuide do seu pet 2 vezes','Brush','pet','care_action',2,'easy',25,12,16),
('pet_care_8','Pet em dia','3 cuidados no dia','CheckCircle','pet','care_action',3,'med',35,20,17),
('pet_care_9','Atenção total','4 cuidados no dia','Eye','pet','care_action',4,'med',40,25,18),
('pet_care_10','Tutor 5 estrelas','5 cuidados no dia','Star','pet','care_action',5,'hard',60,40,19),
('pet_care_11','Quem ama, cuida','1 cuidado','Heart','pet','care_action',1,'easy',20,10,20),
('pet_care_12','Companheiro fiel','2 cuidados','Dog','pet','care_action',2,'easy',25,12,21),
('pet_care_13','Tarde de mimos','3 cuidados','Cat','pet','care_action',3,'med',35,20,22),
('pet_care_14','Noite cuidadosa','2 cuidados','Moon','pet','care_action',2,'easy',25,12,23),
('pet_care_15','Manhã pet','1 cuidado','Sun','pet','care_action',1,'easy',20,10,24),
('pet_care_16','Rotina perfeita','3 cuidados','Calendar','pet','care_action',3,'med',35,20,25),
('pet_care_17','Pet príncipe','4 cuidados','Crown','pet','care_action',4,'med',40,25,26),
('pet_care_18','Lendário do dia','5 cuidados','Trophy','pet','care_action',5,'hard',60,40,27),
('pet_care_19','Mini ritual','2 cuidados','Flower','pet','care_action',2,'easy',25,12,28),
('pet_care_20','Sessão love','3 cuidados','Heart','pet','care_action',3,'med',35,20,29),
-- ORACAO (prayed_for_request) — 15
('orar_1','Interceda por alguém','Ore por 1 pedido','Hand','oracao','prayed_for_request',1,'easy',20,10,30),
('orar_2','Intercessor do dia','Ore por 2 pedidos','HandHeart','oracao','prayed_for_request',2,'easy',30,15,31),
('orar_3','Coração de oração','Ore por 3 pedidos','Heart','oracao','prayed_for_request',3,'med',45,25,32),
('orar_4','Guerreiro de oração','Ore por 5 pedidos','Shield','oracao','prayed_for_request',5,'hard',70,45,33),
('orar_5','Eu oro por você','Ore por 1 pedido','HandHeart','oracao','prayed_for_request',1,'easy',20,10,34),
('orar_6','Manhã de oração','Ore por 2 pedidos','Sunrise','oracao','prayed_for_request',2,'easy',30,15,35),
('orar_7','Tarde de intercessão','Ore por 3 pedidos','Sun','oracao','prayed_for_request',3,'med',45,25,36),
('orar_8','Noite de oração','Ore por 2 pedidos','Moon','oracao','prayed_for_request',2,'easy',30,15,37),
('orar_9','Mãos que oram','Ore por 4 pedidos','Hand','oracao','prayed_for_request',4,'med',55,35,38),
('orar_10','Cuido em oração','Ore por 1 pedido','Heart','oracao','prayed_for_request',1,'easy',20,10,39),
('orar_11','Carregue alguém','Ore por 2 pedidos','HeartHandshake','oracao','prayed_for_request',2,'easy',30,15,40),
('orar_12','Comunhão','Ore por 3 pedidos','Users','oracao','prayed_for_request',3,'med',45,25,41),
('orar_13','Faça diferença','Ore por 5 pedidos','Sparkles','oracao','prayed_for_request',5,'hard',70,45,42),
('orar_14','Amor em oração','Ore por 2 pedidos','Heart','oracao','prayed_for_request',2,'easy',30,15,43),
('orar_15','Ore por 3','3 pedidos','HandHeart','oracao','prayed_for_request',3,'med',45,25,44),
-- DEVOCIONAL (devotional_prayed) — 8
('devo_1','Devocional do dia','Marque o devocional de hoje','BookOpen','devocional','devotional_prayed',1,'easy',25,15,50),
('devo_2','Tempo com Deus','Faça o devocional','Book','devocional','devotional_prayed',1,'easy',25,15,51),
('devo_3','Palavra do dia','Marque o devocional','BookText','devocional','devotional_prayed',1,'easy',25,15,52),
('devo_4','Renove a mente','Faça o devocional','Sparkles','devocional','devotional_prayed',1,'easy',25,15,53),
('devo_5','Comunhão diária','Marque o devocional','Heart','devocional','devotional_prayed',1,'easy',25,15,54),
('devo_6','Encha-se da Palavra','Faça o devocional','BookOpen','devocional','devotional_prayed',1,'easy',25,15,55),
('devo_7','Pão diário','Marque o devocional','BookHeart','devocional','devotional_prayed',1,'easy',25,15,56),
('devo_8','Devocional cumprido','Faça o devocional','CheckCircle','devocional','devotional_prayed',1,'easy',25,15,57),
-- PERFIL (profile_view) — 15
('exp_1','Conheça gente nova','Visite 3 perfis','Eye','social','profile_view',3,'easy',20,10,60),
('exp_2','Explore a comunidade','Visite 5 perfis','Users','social','profile_view',5,'easy',25,15,61),
('exp_3','Curioso do dia','Visite 8 perfis','Search','social','profile_view',8,'med',35,25,62),
('exp_4','Estilo aberto','Visite 10 perfis','Sparkles','social','profile_view',10,'med',45,30,63),
('exp_5','Mapa de gente','Visite 15 perfis','Map','social','profile_view',15,'hard',70,45,64),
('exp_6','Olhar atento','3 perfis','Eye','social','profile_view',3,'easy',20,10,65),
('exp_7','Aventura social','5 perfis','Compass','social','profile_view',5,'easy',25,15,66),
('exp_8','Descobrindo','8 perfis','Telescope','social','profile_view',8,'med',35,25,67),
('exp_9','Pretendentes','10 perfis','Heart','social','profile_view',10,'med',45,30,68),
('exp_10','Tour completo','15 perfis','MapPin','social','profile_view',15,'hard',70,45,69),
('exp_11','Visite 4','4 perfis','Eye','social','profile_view',4,'easy',22,12,70),
('exp_12','Visite 6','6 perfis','Users','social','profile_view',6,'easy',28,18,71),
('exp_13','Visite 7','7 perfis','Search','social','profile_view',7,'med',32,22,72),
('exp_14','Visite 12','12 perfis','Compass','social','profile_view',12,'med',50,32,73),
('exp_15','Visite 20','20 perfis','MapPin','social','profile_view',20,'hard',80,55,74),
-- INTERESSE (add_interest) — 12
('int_1','Demonstre interesse','Mande 1 interesse','HeartHandshake','interest','add_interest',1,'easy',20,10,80),
('int_2','Coração aberto','Mande 2 interesses','Heart','interest','add_interest',2,'easy',30,15,81),
('int_3','Conexões','Mande 3 interesses','Users','interest','add_interest',3,'med',40,25,82),
('int_4','Sem timidez','Mande 4 interesses','Sparkles','interest','add_interest',4,'med',50,30,83),
('int_5','Faça acontecer','Mande 5 interesses','Star','interest','add_interest',5,'hard',65,40,84),
('int_6','Olha quem chegou','1 interesse','HeartHandshake','interest','add_interest',1,'easy',20,10,85),
('int_7','Doce coragem','2 interesses','Heart','interest','add_interest',2,'easy',30,15,86),
('int_8','Mande 3','3 interesses','Send','interest','add_interest',3,'med',40,25,87),
('int_9','Mande 4','4 interesses','Send','interest','add_interest',4,'med',50,30,88),
('int_10','Mande 6','6 interesses','Send','interest','add_interest',6,'hard',70,45,89),
('int_11','Curtir gente','1 interesse','Heart','interest','add_interest',1,'easy',20,10,90),
('int_12','Brilhe','3 interesses','Sparkles','interest','add_interest',3,'med',40,25,91),
-- CHAT (chat_message) — 15
('chat_1','Bom papo','Envie 3 mensagens','MessageCircle','chat','chat_message',3,'easy',20,10,100),
('chat_2','Conversa boa','Envie 5 mensagens','MessageSquare','chat','chat_message',5,'easy',25,15,101),
('chat_3','Trocando ideia','Envie 8 mensagens','MessagesSquare','chat','chat_message',8,'med',35,25,102),
('chat_4','Conexão verdadeira','Envie 10 mensagens','Heart','chat','chat_message',10,'med',45,30,103),
('chat_5','Tarde de papo','Envie 15 mensagens','Coffee','chat','chat_message',15,'hard',70,45,104),
('chat_6','Mande 4','4 mensagens','MessageCircle','chat','chat_message',4,'easy',22,12,105),
('chat_7','Mande 6','6 mensagens','MessageSquare','chat','chat_message',6,'easy',28,18,106),
('chat_8','Mande 7','7 mensagens','MessagesSquare','chat','chat_message',7,'med',32,22,107),
('chat_9','Mande 12','12 mensagens','MessageCircle','chat','chat_message',12,'med',50,32,108),
('chat_10','Mande 20','20 mensagens','MessagesSquare','chat','chat_message',20,'hard',80,55,109),
('chat_11','Diálogo','5 mensagens','MessageSquare','chat','chat_message',5,'easy',25,15,110),
('chat_12','Bate-papo','3 mensagens','MessageCircle','chat','chat_message',3,'easy',20,10,111),
('chat_13','Conversa fluida','8 mensagens','MessagesSquare','chat','chat_message',8,'med',35,25,112),
('chat_14','Mensageiro','10 mensagens','Send','chat','chat_message',10,'med',45,30,113),
('chat_15','Maratona de chat','15 mensagens','MessagesSquare','chat','chat_message',15,'hard',70,45,114),
-- FOTO (add_photo) — 5
('foto_1','Mostre seu sorriso','Adicione 1 foto','Camera','perfil','add_photo',1,'med',40,25,120),
('foto_2','Capriche no perfil','Adicione 1 foto','Image','perfil','add_photo',1,'med',40,25,121),
('foto_3','Nova foto','Adicione 1 foto','ImagePlus','perfil','add_photo',1,'med',40,25,122),
('foto_4','Atualize sua imagem','Adicione 1 foto','Camera','perfil','add_photo',1,'med',40,25,123),
('foto_5','Faça boa impressão','Adicione 1 foto','Image','perfil','add_photo',1,'med',40,25,124),
-- VARIAÇÕES PET extras (10 pra totalizar 100)
('pet_extra_1','Manhã com o pet','1 cuidado pela manhã','Sunrise','pet','care_action',1,'easy',20,10,130),
('pet_extra_2','Tarde com o pet','2 cuidados','Sun','pet','care_action',2,'easy',25,12,131),
('pet_extra_3','Noite com o pet','1 cuidado','Moon','pet','care_action',1,'easy',20,10,132),
('pet_extra_4','Fim de semana pet','3 cuidados','Calendar','pet','care_action',3,'med',35,20,133),
('pet_extra_5','Pet em casa','2 cuidados','Home','pet','care_action',2,'easy',25,12,134),
('pet_extra_6','Cuidador zeloso','4 cuidados','HeartHandshake','pet','care_action',4,'med',40,25,135),
('pet_extra_7','Time pet','5 cuidados','Users','pet','care_action',5,'hard',60,40,136),
('pet_extra_8','Ritual completo','3 cuidados','CheckCheck','pet','care_action',3,'med',35,20,137),
('pet_extra_9','Cuide com amor','2 cuidados','Heart','pet','care_action',2,'easy',25,12,138),
('pet_extra_10','Pet em festa','4 cuidados','Sparkles','pet','care_action',4,'med',40,25,139);
