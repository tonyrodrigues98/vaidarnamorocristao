-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  actor_id UUID,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "users update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID, _type TEXT, _title TEXT,
  _body TEXT DEFAULT NULL, _link TEXT DEFAULT NULL,
  _actor_id UUID DEFAULT NULL, _entity_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _id UUID;
BEGIN
  IF _user_id IS NULL THEN RETURN NULL; END IF;
  IF _actor_id IS NOT NULL AND _actor_id = _user_id THEN RETURN NULL; END IF;
  INSERT INTO public.notifications(user_id, type, title, body, link, actor_id, entity_id)
  VALUES (_user_id, _type, _title, _body, _link, _actor_id, _entity_id)
  RETURNING id INTO _id;
  RETURN _id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT, UUID, UUID) FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _n INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  UPDATE public.notifications SET read_at = now()
  WHERE user_id = auth.uid() AND read_at IS NULL;
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END; $$;

REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

-- Triggers
CREATE OR REPLACE FUNCTION public.notify_on_interest()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _name TEXT;
BEGIN
  SELECT full_name INTO _name FROM public.profiles WHERE id = NEW.sender_id;
  PERFORM public.create_notification(
    NEW.receiver_id, 'interest',
    COALESCE(_name, 'Alguém') || ' demonstrou interesse',
    'Veja o perfil e responda', '/interesses',
    NEW.sender_id, NEW.id
  );
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_on_interest ON public.interests;
CREATE TRIGGER trg_notify_on_interest
AFTER INSERT ON public.interests FOR EACH ROW EXECUTE FUNCTION public.notify_on_interest();

CREATE OR REPLACE FUNCTION public.notify_on_match()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _na TEXT; _nb TEXT;
BEGIN
  SELECT full_name INTO _na FROM public.profiles WHERE id = NEW.user_a;
  SELECT full_name INTO _nb FROM public.profiles WHERE id = NEW.user_b;
  PERFORM public.create_notification(NEW.user_a, 'match', 'Vocês deram match!', 'Comece a conversar com ' || COALESCE(_nb, 'seu match'), '/matches', NEW.user_b, NEW.id);
  PERFORM public.create_notification(NEW.user_b, 'match', 'Vocês deram match!', 'Comece a conversar com ' || COALESCE(_na, 'seu match'), '/matches', NEW.user_a, NEW.id);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_on_match ON public.matches;
CREATE TRIGGER trg_notify_on_match
AFTER INSERT ON public.matches FOR EACH ROW EXECUTE FUNCTION public.notify_on_match();

CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _ua UUID; _ub UUID; _r UUID; _name TEXT;
BEGIN
  SELECT user_a, user_b INTO _ua, _ub FROM public.matches WHERE id = NEW.match_id;
  IF _ua IS NULL THEN RETURN NEW; END IF;
  _r := CASE WHEN NEW.sender_id = _ua THEN _ub ELSE _ua END;
  SELECT full_name INTO _name FROM public.profiles WHERE id = NEW.sender_id;
  PERFORM public.create_notification(
    _r, 'message',
    'Nova mensagem de ' || COALESCE(_name, 'alguém'),
    LEFT(COALESCE(NEW.content, ''), 120),
    '/conversas', NEW.sender_id, NEW.match_id
  );
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_on_message ON public.messages;
CREATE TRIGGER trg_notify_on_message
AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- Profile status (approved/verified) — uses 'status' enum
CREATE OR REPLACE FUNCTION public.notify_on_profile_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status::text IS DISTINCT FROM OLD.status::text AND NEW.status::text = 'approved' THEN
    PERFORM public.create_notification(NEW.id, 'profile_approved', 'Seu perfil foi aprovado!', 'Já pode explorar pretendentes', '/pretendentes', NULL, NEW.id);
  END IF;
  IF NEW.verified IS DISTINCT FROM OLD.verified AND NEW.verified = true THEN
    PERFORM public.create_notification(NEW.id, 'profile_verified', 'Você foi verificado(a)!', 'Seu perfil agora exibe o selo de verificação', '/perfil', NULL, NEW.id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_on_profile_status ON public.profiles;
CREATE TRIGGER trg_notify_on_profile_status
AFTER UPDATE OF status, verified ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_on_profile_status();

-- Backfill (last 30 days)
INSERT INTO public.notifications(user_id, type, title, body, link, actor_id, entity_id, created_at)
SELECT i.receiver_id, 'interest',
  COALESCE(p.full_name, 'Alguém') || ' demonstrou interesse',
  'Veja o perfil e responda', '/interesses',
  i.sender_id, i.id, i.created_at
FROM public.interests i
LEFT JOIN public.profiles p ON p.id = i.sender_id
WHERE i.created_at > now() - interval '30 days' AND i.receiver_id <> i.sender_id;

INSERT INTO public.notifications(user_id, type, title, body, link, actor_id, entity_id, created_at)
SELECT m.user_a, 'match', 'Vocês deram match!', 'Comece a conversar', '/matches', m.user_b, m.id, m.created_at
FROM public.matches m WHERE m.created_at > now() - interval '30 days';

INSERT INTO public.notifications(user_id, type, title, body, link, actor_id, entity_id, created_at)
SELECT m.user_b, 'match', 'Vocês deram match!', 'Comece a conversar', '/matches', m.user_a, m.id, m.created_at
FROM public.matches m WHERE m.created_at > now() - interval '30 days';