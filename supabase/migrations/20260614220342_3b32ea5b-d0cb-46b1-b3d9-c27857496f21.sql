
-- 1. nocturnal flag em pet_species
ALTER TABLE public.pet_species ADD COLUMN IF NOT EXISTS nocturnal boolean NOT NULL DEFAULT false;

-- 2. Trigger: push + XP quando alguém ora por um pedido
CREATE OR REPLACE FUNCTION public.tg_prayer_prayed_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner_id uuid;
  _orador_name text;
  _req_title text;
BEGIN
  SELECT user_id, title INTO _owner_id, _req_title
    FROM public.prayer_requests WHERE id = NEW.request_id;

  IF _owner_id IS NULL THEN RETURN NEW; END IF;

  -- XP para o orador (cap 5/dia), só se não é o próprio dono
  IF _owner_id <> NEW.user_id THEN
    BEGIN
      PERFORM public.award_xp('prayed_for', 5, 5, jsonb_build_object('request_id', NEW.request_id));
    EXCEPTION WHEN OTHERS THEN
      NULL; -- não bloqueia o insert
    END;

    SELECT COALESCE(NULLIF(full_name, ''), 'Alguém') INTO _orador_name
      FROM public.profiles WHERE id = NEW.user_id;
    IF _orador_name IS NULL THEN _orador_name := 'Alguém'; END IF;

    INSERT INTO public.push_queue (user_id, title, body, url)
    VALUES (
      _owner_id,
      'Alguém orou por você',
      _orador_name || ' orou pelo seu pedido' ||
        CASE WHEN _req_title IS NOT NULL AND length(_req_title) > 0
             THEN ': ' || left(_req_title, 60) ELSE '' END,
      '/oracoes'
    );
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS prayer_prayed_notify ON public.prayer_request_prayed;
CREATE TRIGGER prayer_prayed_notify
  AFTER INSERT ON public.prayer_request_prayed
  FOR EACH ROW EXECUTE FUNCTION public.tg_prayer_prayed_notify();
