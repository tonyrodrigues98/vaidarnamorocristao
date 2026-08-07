
-- Track sent reactivation reminders to avoid duplicates
CREATE TABLE IF NOT EXISTS public.reactivation_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier int NOT NULL, -- 1, 3, 7, 15
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tier)
);

ALTER TABLE public.reactivation_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own reminders"
  ON public.reactivation_reminders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users delete own reminders"
  ON public.reactivation_reminders FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reactivation_reminders_user ON public.reactivation_reminders(user_id);

-- Function: scan inactive users and create reactivation notifications
CREATE OR REPLACE FUNCTION public.run_reactivation_reminders()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  count_created int := 0;
  v_title text;
  v_body text;
  v_tier int;
  v_days int;
BEGIN
  FOR rec IN
    SELECT p.id AS user_id, COALESCE(pls.last_seen_at, p.created_at) AS last_active
    FROM public.profiles p
    LEFT JOIN public.presence_last_seen pls ON pls.user_id = p.id
    WHERE p.status = 'approved'
      AND p.deactivated_at IS NULL
      AND p.deletion_requested_at IS NULL
      AND p.is_anonymized = false
  LOOP
    v_days := EXTRACT(DAY FROM (now() - rec.last_active))::int;

    -- pick highest tier matching
    IF v_days >= 15 THEN v_tier := 15;
    ELSIF v_days >= 7 THEN v_tier := 7;
    ELSIF v_days >= 3 THEN v_tier := 3;
    ELSIF v_days >= 1 THEN v_tier := 1;
    ELSE CONTINUE;
    END IF;

    -- skip if already sent this tier
    IF EXISTS (SELECT 1 FROM public.reactivation_reminders WHERE user_id = rec.user_id AND tier = v_tier) THEN
      CONTINUE;
    END IF;

    CASE v_tier
      WHEN 1 THEN
        v_title := 'Sentimos sua falta';
        v_body := 'Que tal dar uma olhadinha em quem está esperando por você?';
      WHEN 3 THEN
        v_title := 'Novos pretendentes podem estar te procurando';
        v_body := 'Volte e veja quem demonstrou interesse em te conhecer.';
      WHEN 7 THEN
        v_title := 'Deus pode estar preparando alguém especial';
        v_body := 'Sua jornada importa. Volte e descubra quem combina com você.';
      WHEN 15 THEN
        v_title := '✨ Seu perfil ganhou destaque!';
        v_body := 'Voltamos a destacar seu perfil. Aproveite esse impulso para conhecer pessoas novas.';
    END CASE;

    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (rec.user_id, 'reactivation', v_title, v_body, '/pretendentes');

    INSERT INTO public.reactivation_reminders (user_id, tier) VALUES (rec.user_id, v_tier);

    count_created := count_created + 1;
  END LOOP;

  -- Reset reminders for users who came back (active < 24h)
  DELETE FROM public.reactivation_reminders rr
  USING public.presence_last_seen pls
  WHERE rr.user_id = pls.user_id
    AND pls.last_seen_at > now() - interval '1 day';

  RETURN count_created;
END;
$$;

-- Schedule the job daily at 12:00 UTC (≈ 9am BR)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reactivation-reminders-daily') THEN
    PERFORM cron.unschedule('reactivation-reminders-daily');
  END IF;
  PERFORM cron.schedule(
    'reactivation-reminders-daily',
    '0 12 * * *',
    $cron$ SELECT public.run_reactivation_reminders(); $cron$
  );
END $$;
