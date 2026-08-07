
CREATE TABLE public.push_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  url text,
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.push_queue TO service_role;

ALTER TABLE public.push_queue ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_push_queue_pending ON public.push_queue (created_at)
  WHERE processed_at IS NULL;

-- Enqueue push when new message is inserted (notify the partner)
CREATE OR REPLACE FUNCTION public.enqueue_push_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  partner_id uuid;
  sender_name text;
  preview text;
BEGIN
  SELECT CASE WHEN m.user_a = NEW.sender_id THEN m.user_b ELSE m.user_a END
    INTO partner_id
  FROM matches m WHERE m.id = NEW.match_id;

  IF partner_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(split_part(p.full_name, ' ', 1), 'Alguém')
    INTO sender_name
  FROM profiles p WHERE p.id = NEW.sender_id;

  preview := COALESCE(NEW.content, '');
  IF char_length(preview) > 140 THEN
    preview := substr(preview, 1, 140) || '…';
  END IF;

  INSERT INTO public.push_queue (user_id, title, body, url)
  VALUES (
    partner_id,
    COALESCE(sender_name, 'Nova mensagem') || ' enviou uma mensagem',
    preview,
    '/conversas/' || NEW.match_id::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_push_on_message ON public.messages;
CREATE TRIGGER trg_enqueue_push_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_push_on_message();

-- Enqueue push when a match is created (notify both users)
CREATE OR REPLACE FUNCTION public.enqueue_push_on_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  name_a text;
  name_b text;
BEGIN
  SELECT COALESCE(split_part(full_name, ' ', 1), 'Alguém') INTO name_a FROM profiles WHERE id = NEW.user_a;
  SELECT COALESCE(split_part(full_name, ' ', 1), 'Alguém') INTO name_b FROM profiles WHERE id = NEW.user_b;

  INSERT INTO public.push_queue (user_id, title, body, url) VALUES
    (NEW.user_a, 'Vocês deram match! 💛', 'Você e ' || COALESCE(name_b, 'alguém') || ' têm interesse mútuo. Comece a conversa!', '/conversas/' || NEW.id::text),
    (NEW.user_b, 'Vocês deram match! 💛', 'Você e ' || COALESCE(name_a, 'alguém') || ' têm interesse mútuo. Comece a conversa!', '/conversas/' || NEW.id::text);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_push_on_match ON public.matches;
CREATE TRIGGER trg_enqueue_push_on_match
  AFTER INSERT ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_push_on_match();
