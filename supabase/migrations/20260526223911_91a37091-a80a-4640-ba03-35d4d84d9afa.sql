
-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.anonymous_message_status AS ENUM (
    'pending','hint_requested','hint_sent','replied','reveal_requested',
    'revealed','ignored','reported','expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.anonymous_hint_category AS ENUM (
    'idade','regiao','personalidade','fe','compatibilidade'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- anonymous_hint_options
CREATE TABLE IF NOT EXISTS public.anonymous_hint_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.anonymous_hint_category NOT NULL,
  text text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.anonymous_hint_options TO authenticated;
GRANT ALL ON public.anonymous_hint_options TO service_role;
ALTER TABLE public.anonymous_hint_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read hint options" ON public.anonymous_hint_options;
CREATE POLICY "auth read hint options" ON public.anonymous_hint_options FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin manage hint options" ON public.anonymous_hint_options;
CREATE POLICY "admin manage hint options" ON public.anonymous_hint_options FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

INSERT INTO public.anonymous_hint_options (category, text)
SELECT * FROM (VALUES
  ('idade'::public.anonymous_hint_category,'Tenho entre 20 e 30 anos'),
  ('idade','Estou na faixa dos 30+'),
  ('idade','Tenho idade próxima da sua'),
  ('regiao','Moro na região sudeste'),
  ('regiao','Moro na região sul'),
  ('regiao','Moro na região nordeste'),
  ('regiao','Moro na região norte'),
  ('regiao','Moro na região centro-oeste'),
  ('regiao','Sou do litoral'),
  ('regiao','Sou do interior'),
  ('regiao','Moro relativamente perto de você'),
  ('personalidade','Sou mais introvertido(a)'),
  ('personalidade','Sou mais extrovertido(a)'),
  ('personalidade','Gosto de conversas profundas'),
  ('personalidade','Sou alguém tranquilo(a)'),
  ('personalidade','Sou bem-humorado(a)'),
  ('fe','Participo ativamente da igreja'),
  ('fe','Sirvo em um ministério'),
  ('fe','Minha fé é muito importante pra mim'),
  ('fe','Tenho uma vida de oração constante'),
  ('compatibilidade','Temos valores parecidos'),
  ('compatibilidade','Nossa compatibilidade parece alta'),
  ('compatibilidade','Temos objetivos semelhantes')
) AS v(category, text)
WHERE NOT EXISTS (SELECT 1 FROM public.anonymous_hint_options);

-- settings
CREATE TABLE IF NOT EXISTS public.anonymous_message_settings (
  user_id uuid PRIMARY KEY,
  accept_anonymous boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.anonymous_message_settings TO authenticated;
GRANT ALL ON public.anonymous_message_settings TO service_role;
ALTER TABLE public.anonymous_message_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner manage settings" ON public.anonymous_message_settings;
CREATE POLICY "owner manage settings" ON public.anonymous_message_settings FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "auth read settings" ON public.anonymous_message_settings;
CREATE POLICY "auth read settings" ON public.anonymous_message_settings FOR SELECT TO authenticated USING (true);

-- anonymous_messages
CREATE TABLE IF NOT EXISTS public.anonymous_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 280),
  status public.anonymous_message_status NOT NULL DEFAULT 'pending',
  reply_text text,
  replied_at timestamptz,
  sender_reveal_requested_at timestamptz,
  receiver_reveal_requested_at timestamptz,
  revealed_at timestamptz,
  match_id uuid,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 days'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> receiver_id)
);
CREATE INDEX IF NOT EXISTS idx_anon_msg_receiver ON public.anonymous_messages(receiver_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anon_msg_sender ON public.anonymous_messages(sender_id, created_at DESC);
GRANT SELECT ON public.anonymous_messages TO authenticated;
GRANT ALL ON public.anonymous_messages TO service_role;
ALTER TABLE public.anonymous_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sender reads own" ON public.anonymous_messages;
CREATE POLICY "sender reads own" ON public.anonymous_messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() AND status <> 'reported');
DROP POLICY IF EXISTS "receiver reads incoming" ON public.anonymous_messages;
CREATE POLICY "receiver reads incoming" ON public.anonymous_messages FOR SELECT TO authenticated
  USING (receiver_id = auth.uid());
DROP POLICY IF EXISTS "admin reads all" ON public.anonymous_messages;
CREATE POLICY "admin reads all" ON public.anonymous_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'moderador'));

-- views (security_invoker so RLS applies)
CREATE OR REPLACE VIEW public.anonymous_messages_inbox
WITH (security_invoker = true) AS
SELECT
  m.id, m.receiver_id,
  CASE WHEN m.status = 'revealed' THEN m.sender_id ELSE NULL END AS sender_id,
  m.content, m.status, m.reply_text, m.replied_at,
  m.sender_reveal_requested_at, m.receiver_reveal_requested_at,
  m.revealed_at, m.match_id, m.created_at, m.expires_at
FROM public.anonymous_messages m
WHERE m.receiver_id = auth.uid()
  AND m.status NOT IN ('expired','ignored','reported');
GRANT SELECT ON public.anonymous_messages_inbox TO authenticated;

CREATE OR REPLACE VIEW public.anonymous_messages_outbox
WITH (security_invoker = true) AS
SELECT
  m.id, m.sender_id,
  CASE WHEN m.status = 'revealed' THEN m.receiver_id ELSE NULL END AS receiver_id_revealed,
  m.content, m.status, m.reply_text, m.replied_at,
  m.sender_reveal_requested_at, m.receiver_reveal_requested_at,
  m.revealed_at, m.match_id, m.created_at, m.expires_at
FROM public.anonymous_messages m
WHERE m.sender_id = auth.uid();
GRANT SELECT ON public.anonymous_messages_outbox TO authenticated;

-- hints
CREATE TABLE IF NOT EXISTS public.anonymous_message_hints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.anonymous_messages(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  category public.anonymous_hint_category,
  hint_text text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_anon_hints_msg ON public.anonymous_message_hints(message_id);
GRANT SELECT ON public.anonymous_message_hints TO authenticated;
GRANT ALL ON public.anonymous_message_hints TO service_role;
ALTER TABLE public.anonymous_message_hints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "participants read hints" ON public.anonymous_message_hints;
CREATE POLICY "participants read hints" ON public.anonymous_message_hints FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.anonymous_messages m
    WHERE m.id = anonymous_message_hints.message_id
      AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid()
           OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))));

-- reports
CREATE TABLE IF NOT EXISTS public.anonymous_message_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.anonymous_messages(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.anonymous_message_reports TO authenticated;
GRANT ALL ON public.anonymous_message_reports TO service_role;
ALTER TABLE public.anonymous_message_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin read reports" ON public.anonymous_message_reports;
CREATE POLICY "admin read reports" ON public.anonymous_message_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'moderador'));

-- helper: restricted words
CREATE OR REPLACE FUNCTION public.anon_check_restricted(_text text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w TEXT; norm_content TEXT; norm_word TEXT;
BEGIN
  IF _text IS NULL OR length(trim(_text)) = 0 THEN RETURN; END IF;
  norm_content := lower(public.unaccent_safe(_text));
  FOR w IN SELECT word FROM public.restricted_words LOOP
    IF w IS NULL OR length(trim(w)) = 0 THEN CONTINUE; END IF;
    norm_word := lower(public.unaccent_safe(trim(w)));
    IF norm_content ~ ('(^|[^[:alpha:]])' || regexp_replace(norm_word,'([.*+?^${}()|\[\]\\])','\\\1','g') || '([^[:alpha:]]|$)') THEN
      RAISE EXCEPTION 'Conteúdo restrito detectado.' USING ERRCODE='check_violation';
    END IF;
  END LOOP;
END $$;

-- send_anonymous_message
CREATE OR REPLACE FUNCTION public.send_anonymous_message(_receiver_id uuid, _content text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  sender_sex text; receiver_sex text; receiver_status text;
  receiver_accepts boolean;
  active_count int; daily_count int;
  last_closed timestamptz; new_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF uid = _receiver_id THEN RAISE EXCEPTION 'cannot send to yourself'; END IF;
  IF _content IS NULL OR length(trim(_content)) = 0 THEN RAISE EXCEPTION 'message required'; END IF;
  IF length(_content) > 280 THEN RAISE EXCEPTION 'message too long'; END IF;
  PERFORM public.anon_check_restricted(_content);

  SELECT sex::text INTO sender_sex FROM public.profiles
   WHERE id = uid AND status='approved' AND deactivated_at IS NULL AND deletion_requested_at IS NULL AND is_anonymized=false;
  IF sender_sex IS NULL THEN RAISE EXCEPTION 'sender not approved'; END IF;

  SELECT sex::text, status::text INTO receiver_sex, receiver_status FROM public.profiles WHERE id = _receiver_id;
  IF receiver_status IS DISTINCT FROM 'approved' THEN RAISE EXCEPTION 'receiver not available'; END IF;
  IF receiver_sex IS NULL OR receiver_sex = sender_sex THEN RAISE EXCEPTION 'receiver must be opposite sex'; END IF;

  IF EXISTS (SELECT 1 FROM public.blocks WHERE (blocker_id=_receiver_id AND blocked_id=uid) OR (blocker_id=uid AND blocked_id=_receiver_id)) THEN
    RAISE EXCEPTION 'blocked';
  END IF;

  SELECT COALESCE(accept_anonymous, true) INTO receiver_accepts
    FROM public.anonymous_message_settings WHERE user_id=_receiver_id;
  IF receiver_accepts IS NULL THEN receiver_accepts := true; END IF;
  IF NOT receiver_accepts THEN RAISE EXCEPTION 'receiver opted out'; END IF;

  SELECT count(*) INTO active_count FROM public.anonymous_messages
    WHERE sender_id=uid AND receiver_id=_receiver_id
      AND status NOT IN ('revealed','ignored','reported','expired');
  IF active_count > 0 THEN RAISE EXCEPTION 'active message already exists with this user'; END IF;

  SELECT max(closed_at) INTO last_closed FROM public.anonymous_messages
    WHERE sender_id=uid AND receiver_id=_receiver_id
      AND status IN ('ignored','reported','expired') AND closed_at IS NOT NULL;
  IF last_closed IS NOT NULL AND last_closed > now() - interval '7 days' THEN
    RAISE EXCEPTION 'cooldown active' USING ERRCODE='check_violation';
  END IF;

  SELECT count(*) INTO daily_count FROM public.anonymous_messages
    WHERE sender_id=uid AND created_at >= (now() - interval '24 hours');
  IF daily_count >= 3 THEN RAISE EXCEPTION 'daily limit reached'; END IF;

  INSERT INTO public.anonymous_messages (sender_id, receiver_id, content)
  VALUES (uid, _receiver_id, _content) RETURNING id INTO new_id;

  PERFORM public.create_notification(
    _receiver_id, 'anonymous_message',
    'Você recebeu um recado anônimo 👀',
    'Alguém deixou um recado misterioso pra você.',
    '/recados', NULL, new_id);
  RETURN new_id;
END $$;

-- request_anonymous_hint
CREATE OR REPLACE FUNCTION public.request_anonymous_hint(_message_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); m public.anonymous_messages; hints_count int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO m FROM public.anonymous_messages WHERE id=_message_id;
  IF NOT FOUND OR m.receiver_id <> uid THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF m.status NOT IN ('pending','hint_sent') THEN RAISE EXCEPTION 'invalid state'; END IF;
  SELECT count(*) INTO hints_count FROM public.anonymous_message_hints WHERE message_id=_message_id;
  IF hints_count >= 2 THEN RAISE EXCEPTION 'hint limit reached'; END IF;

  INSERT INTO public.anonymous_message_hints (message_id) VALUES (_message_id);
  UPDATE public.anonymous_messages SET status='hint_requested', updated_at=now() WHERE id=_message_id;

  PERFORM public.create_notification(
    m.sender_id, 'anonymous_hint_requested',
    'Pediram uma dica sobre você 👀',
    'Escolha uma dica para enviar.',
    '/recados', NULL, _message_id);
END $$;

-- send_anonymous_hint
CREATE OR REPLACE FUNCTION public.send_anonymous_hint(_message_id uuid, _hint_option_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); m public.anonymous_messages; opt RECORD; pending_hint_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO m FROM public.anonymous_messages WHERE id=_message_id;
  IF NOT FOUND OR m.sender_id <> uid THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF m.status <> 'hint_requested' THEN RAISE EXCEPTION 'no hint requested'; END IF;

  SELECT * INTO opt FROM public.anonymous_hint_options WHERE id=_hint_option_id AND active=true;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid hint option'; END IF;

  SELECT id INTO pending_hint_id FROM public.anonymous_message_hints
    WHERE message_id=_message_id AND sent_at IS NULL ORDER BY requested_at DESC LIMIT 1;
  IF pending_hint_id IS NULL THEN RAISE EXCEPTION 'no pending hint'; END IF;

  UPDATE public.anonymous_message_hints
    SET category=opt.category, hint_text=opt.text, sent_at=now()
   WHERE id=pending_hint_id;
  UPDATE public.anonymous_messages SET status='hint_sent', updated_at=now() WHERE id=_message_id;

  PERFORM public.create_notification(
    m.receiver_id, 'anonymous_hint_sent',
    'Você recebeu uma dica ✨', opt.text,
    '/recados', NULL, _message_id);
END $$;

-- reply_anonymous_message
CREATE OR REPLACE FUNCTION public.reply_anonymous_message(_message_id uuid, _reply text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); m public.anonymous_messages;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _reply IS NULL OR length(trim(_reply))=0 THEN RAISE EXCEPTION 'reply required'; END IF;
  IF length(_reply) > 280 THEN RAISE EXCEPTION 'reply too long'; END IF;
  PERFORM public.anon_check_restricted(_reply);
  SELECT * INTO m FROM public.anonymous_messages WHERE id=_message_id;
  IF NOT FOUND OR m.receiver_id <> uid THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF m.status NOT IN ('pending','hint_sent') THEN RAISE EXCEPTION 'cannot reply now'; END IF;

  UPDATE public.anonymous_messages
    SET reply_text=_reply, replied_at=now(), status='replied', updated_at=now()
   WHERE id=_message_id;

  PERFORM public.create_notification(
    m.sender_id, 'anonymous_reply',
    'Seu recado teve resposta ❤️',
    'Veja a resposta no Mystery Match.',
    '/recados', NULL, _message_id);
END $$;

-- request_anonymous_reveal
CREATE OR REPLACE FUNCTION public.request_anonymous_reveal(_message_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); m public.anonymous_messages;
  is_sender boolean; is_receiver boolean; both_ready boolean;
  ua uuid; ub uuid; new_match_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO m FROM public.anonymous_messages WHERE id=_message_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;
  is_sender := (m.sender_id = uid);
  is_receiver := (m.receiver_id = uid);
  IF NOT (is_sender OR is_receiver) THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF m.status NOT IN ('replied','reveal_requested','hint_sent') THEN
    RAISE EXCEPTION 'cannot request reveal now';
  END IF;

  IF is_sender THEN
    UPDATE public.anonymous_messages
      SET sender_reveal_requested_at = COALESCE(sender_reveal_requested_at, now()),
          status = CASE WHEN receiver_reveal_requested_at IS NOT NULL THEN status ELSE 'reveal_requested' END,
          updated_at = now()
     WHERE id = _message_id;
  ELSE
    UPDATE public.anonymous_messages
      SET receiver_reveal_requested_at = COALESCE(receiver_reveal_requested_at, now()),
          status = CASE WHEN sender_reveal_requested_at IS NOT NULL THEN status ELSE 'reveal_requested' END,
          updated_at = now()
     WHERE id = _message_id;
  END IF;

  SELECT (sender_reveal_requested_at IS NOT NULL AND receiver_reveal_requested_at IS NOT NULL)
    INTO both_ready FROM public.anonymous_messages WHERE id=_message_id;

  IF both_ready THEN
    IF m.sender_id < m.receiver_id THEN ua:=m.sender_id; ub:=m.receiver_id;
    ELSE ua:=m.receiver_id; ub:=m.sender_id; END IF;
    SELECT id INTO new_match_id FROM public.matches WHERE user_a=ua AND user_b=ub;
    IF new_match_id IS NULL THEN
      INSERT INTO public.matches (user_a, user_b) VALUES (ua,ub) RETURNING id INTO new_match_id;
    END IF;
    UPDATE public.anonymous_messages
      SET status='revealed', revealed_at=now(), match_id=new_match_id,
          closed_at=now(), updated_at=now()
     WHERE id=_message_id;

    PERFORM public.create_notification(m.sender_id, 'anonymous_revealed',
      '✨ Vocês decidiram se conhecer',
      'A identidade foi revelada. Comece a conversar!',
      '/conversas', m.receiver_id, new_match_id);
    PERFORM public.create_notification(m.receiver_id, 'anonymous_revealed',
      '✨ Vocês decidiram se conhecer',
      'A identidade foi revelada. Comece a conversar!',
      '/conversas', m.sender_id, new_match_id);
    RETURN 'revealed';
  ELSE
    IF is_sender THEN
      PERFORM public.create_notification(m.receiver_id, 'anonymous_reveal_requested',
        '🔓 Pedido de revelação',
        'O remetente quer revelar a identidade. Aceite para se conhecerem.',
        '/recados', NULL, _message_id);
    ELSE
      PERFORM public.create_notification(m.sender_id, 'anonymous_reveal_requested',
        '🔓 Pedido de revelação',
        'O destinatário quer revelar a identidade. Aceite para se conhecerem.',
        '/recados', NULL, _message_id);
    END IF;
    RETURN 'pending';
  END IF;
END $$;

-- ignore
CREATE OR REPLACE FUNCTION public.ignore_anonymous_message(_message_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); m public.anonymous_messages;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO m FROM public.anonymous_messages WHERE id=_message_id;
  IF NOT FOUND OR m.receiver_id <> uid THEN RAISE EXCEPTION 'not allowed'; END IF;
  UPDATE public.anonymous_messages
    SET status='ignored', closed_at=now(), updated_at=now()
   WHERE id=_message_id;
END $$;

-- report
CREATE OR REPLACE FUNCTION public.report_anonymous_message(_message_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); m public.anonymous_messages;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _reason IS NULL OR length(trim(_reason))=0 THEN RAISE EXCEPTION 'reason required'; END IF;
  SELECT * INTO m FROM public.anonymous_messages WHERE id=_message_id;
  IF NOT FOUND OR m.receiver_id <> uid THEN RAISE EXCEPTION 'not allowed'; END IF;
  INSERT INTO public.anonymous_message_reports (message_id, reporter_id, sender_id, reason)
  VALUES (_message_id, uid, m.sender_id, trim(_reason));
  UPDATE public.anonymous_messages
    SET status='reported', closed_at=now(), updated_at=now()
   WHERE id=_message_id;
  INSERT INTO public.notifications (user_id, type, title, body, link, actor_id, entity_id)
  SELECT a, 'anonymous_report', 'Denúncia de recado anônimo',
         'Um recado anônimo foi denunciado.', '/admin', uid, _message_id
    FROM public.get_admin_ids() a;
END $$;

-- cooldown
CREATE OR REPLACE FUNCTION public.get_anonymous_cooldown(_receiver_id uuid)
RETURNS TABLE(can_send boolean, seconds_remaining int, reason text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
  last_closed timestamptz; active_count int;
  receiver_accepts boolean; daily_count int;
  sender_sex text; receiver_sex text;
BEGIN
  IF uid IS NULL THEN RETURN QUERY SELECT false, 0, 'not authenticated'; RETURN; END IF;
  SELECT sex::text INTO sender_sex FROM public.profiles WHERE id=uid AND status='approved';
  SELECT sex::text INTO receiver_sex FROM public.profiles WHERE id=_receiver_id AND status='approved';
  IF sender_sex IS NULL OR receiver_sex IS NULL OR sender_sex = receiver_sex THEN
    RETURN QUERY SELECT false, 0, 'incompatible'; RETURN;
  END IF;
  SELECT COALESCE(accept_anonymous, true) INTO receiver_accepts
    FROM public.anonymous_message_settings WHERE user_id=_receiver_id;
  IF receiver_accepts IS NULL THEN receiver_accepts := true; END IF;
  IF NOT receiver_accepts THEN RETURN QUERY SELECT false, 0, 'opted_out'; RETURN; END IF;

  SELECT count(*) INTO active_count FROM public.anonymous_messages
    WHERE sender_id=uid AND receiver_id=_receiver_id
      AND status NOT IN ('revealed','ignored','reported','expired');
  IF active_count > 0 THEN RETURN QUERY SELECT false, 0, 'active_exists'; RETURN; END IF;

  SELECT count(*) INTO daily_count FROM public.anonymous_messages
    WHERE sender_id=uid AND created_at >= (now() - interval '24 hours');
  IF daily_count >= 3 THEN RETURN QUERY SELECT false, 0, 'daily_limit'; RETURN; END IF;

  SELECT max(closed_at) INTO last_closed FROM public.anonymous_messages
    WHERE sender_id=uid AND receiver_id=_receiver_id
      AND status IN ('ignored','reported','expired') AND closed_at IS NOT NULL;
  IF last_closed IS NOT NULL AND last_closed > now() - interval '7 days' THEN
    RETURN QUERY SELECT false, EXTRACT(EPOCH FROM ((last_closed + interval '7 days') - now()))::int, 'cooldown'; RETURN;
  END IF;
  RETURN QUERY SELECT true, 0, 'ok';
END $$;

-- opt-out
CREATE OR REPLACE FUNCTION public.set_anonymous_optout(_accept boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.anonymous_message_settings (user_id, accept_anonymous)
  VALUES (uid, _accept)
  ON CONFLICT (user_id) DO UPDATE SET accept_anonymous=_accept, updated_at=now();
END $$;

-- expire
CREATE OR REPLACE FUNCTION public.expire_anonymous_messages()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  UPDATE public.anonymous_messages
     SET status='expired', closed_at=now(), updated_at=now()
   WHERE status NOT IN ('revealed','ignored','reported','expired')
     AND expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- realtime
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.anonymous_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.anonymous_message_hints;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT EXECUTE ON FUNCTION public.send_anonymous_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_anonymous_hint(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_anonymous_hint(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reply_anonymous_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_anonymous_reveal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ignore_anonymous_message(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_anonymous_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_anonymous_cooldown(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_anonymous_optout(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_anonymous_messages() TO authenticated;
