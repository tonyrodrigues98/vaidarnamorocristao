
-- =========================================================
-- Lote 3 — Streak diário, Caixa semanal, Push de cuidado
-- =========================================================

-- ---------- 1) Streak diário de cuidado ----------
CREATE TABLE IF NOT EXISTS public.pet_care_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak int NOT NULL DEFAULT 0,
  best_streak int NOT NULL DEFAULT 0,
  last_care_date date,
  shield_count int NOT NULL DEFAULT 1,
  shield_week_start date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pet_care_streaks TO authenticated;
GRANT ALL ON public.pet_care_streaks TO service_role;

ALTER TABLE public.pet_care_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own streak"
  ON public.pet_care_streaks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ---------- 2) Caixa semanal ----------
CREATE TABLE IF NOT EXISTS public.user_pet_chest_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  coins_awarded int NOT NULL DEFAULT 0,
  xp_awarded int NOT NULL DEFAULT 0,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

GRANT SELECT ON public.user_pet_chest_claims TO authenticated;
GRANT ALL ON public.user_pet_chest_claims TO service_role;

ALTER TABLE public.user_pet_chest_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own chest claims"
  ON public.user_pet_chest_claims FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ---------- 3) Push de cuidado ----------
CREATE TABLE IF NOT EXISTS public.pet_care_push_log (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_push_kind text,
  last_push_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pet_care_push_log TO authenticated;
GRANT ALL ON public.pet_care_push_log TO service_role;

ALTER TABLE public.pet_care_push_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own push log"
  ON public.pet_care_push_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- =========================================================
-- Helpers
-- =========================================================

-- Reward directo (bypass cap de grant_coin_event)
CREATE OR REPLACE FUNCTION public._pet_streak_grant(
  _user uuid, _source text, _xp int, _coins int, _title text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cur int; v_new int; v_xp_new int;
BEGIN
  IF _xp > 0 THEN
    INSERT INTO public.xp_events (user_id, source, amount, meta)
    VALUES (_user, _source, _xp, jsonb_build_object('title', _title));
    INSERT INTO public.user_xp (user_id, xp_total, level)
    VALUES (_user, _xp, public.level_from_xp(_xp))
    ON CONFLICT (user_id) DO UPDATE
      SET xp_total = public.user_xp.xp_total + _xp,
          level = public.level_from_xp(public.user_xp.xp_total + _xp),
          updated_at = now();
  END IF;
  IF _coins > 0 THEN
    INSERT INTO public.user_coins (user_id, balance) VALUES (_user, 0)
    ON CONFLICT (user_id) DO NOTHING;
    SELECT balance INTO v_cur FROM public.user_coins WHERE user_id = _user FOR UPDATE;
    v_new := v_cur + _coins;
    UPDATE public.user_coins SET balance = v_new, updated_at = now() WHERE user_id = _user;
    PERFORM public.log_coin_tx(_user, _source, 'in', _coins, v_new, _title, NULL);
  END IF;
END;
$$;

-- Trigger: ao registrar um cuidado, atualiza streak e premia
CREATE OR REPLACE FUNCTION public.tg_pet_care_update_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_week_start date := date_trunc('week', v_today)::date;
  v_row public.pet_care_streaks;
  v_new_streak int;
  v_used_shield bool := false;
  v_marker_xp int := 0;
  v_marker_coins int := 0;
  v_marker_title text;
BEGIN
  -- Reset push reminder log
  DELETE FROM public.pet_care_push_log WHERE user_id = NEW.user_id;

  SELECT * INTO v_row FROM public.pet_care_streaks WHERE user_id = NEW.user_id FOR UPDATE;

  IF v_row IS NULL THEN
    INSERT INTO public.pet_care_streaks (user_id, current_streak, best_streak, last_care_date, shield_count, shield_week_start)
    VALUES (NEW.user_id, 1, 1, v_today, 1, v_week_start)
    RETURNING * INTO v_row;
    v_new_streak := 1;
  ELSE
    -- Recarrega escudo se virou semana
    IF v_row.shield_week_start IS NULL OR v_row.shield_week_start < v_week_start THEN
      v_row.shield_count := 1;
      v_row.shield_week_start := v_week_start;
    END IF;

    IF v_row.last_care_date = v_today THEN
      v_new_streak := v_row.current_streak; -- já cuidado hoje, sem reward
      UPDATE public.pet_care_streaks
      SET shield_count = v_row.shield_count, shield_week_start = v_row.shield_week_start, updated_at = now()
      WHERE user_id = NEW.user_id;
      RETURN NEW;
    ELSIF v_row.last_care_date = v_today - 1 THEN
      v_new_streak := v_row.current_streak + 1;
    ELSIF v_row.last_care_date = v_today - 2 AND v_row.shield_count > 0 THEN
      v_new_streak := v_row.current_streak + 1;
      v_used_shield := true;
      v_row.shield_count := v_row.shield_count - 1;
    ELSE
      v_new_streak := 1;
    END IF;

    UPDATE public.pet_care_streaks
    SET current_streak = v_new_streak,
        best_streak = GREATEST(best_streak, v_new_streak),
        last_care_date = v_today,
        shield_count = v_row.shield_count,
        shield_week_start = v_row.shield_week_start,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  -- Recompensa linear (1° cuidado do dia)
  PERFORM public._pet_streak_grant(NEW.user_id, 'pet_streak_daily', 10, 5, 'Streak diário');

  -- Marcos
  IF v_new_streak = 7 THEN v_marker_xp := 50; v_marker_coins := 25; v_marker_title := 'Marco: 7 dias';
  ELSIF v_new_streak = 14 THEN v_marker_xp := 100; v_marker_coins := 50; v_marker_title := 'Marco: 14 dias';
  ELSIF v_new_streak = 30 THEN v_marker_xp := 250; v_marker_coins := 100; v_marker_title := 'Marco: 30 dias';
  ELSIF v_new_streak = 60 THEN v_marker_xp := 500; v_marker_coins := 200; v_marker_title := 'Marco: 60 dias';
  ELSIF v_new_streak = 100 THEN v_marker_xp := 1000; v_marker_coins := 500; v_marker_title := 'Marco: 100 dias';
  END IF;

  IF v_marker_xp > 0 THEN
    PERFORM public._pet_streak_grant(NEW.user_id, 'pet_streak_marker', v_marker_xp, v_marker_coins, v_marker_title);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pet_care_events_streak ON public.pet_care_events;
CREATE TRIGGER pet_care_events_streak
AFTER INSERT ON public.pet_care_events
FOR EACH ROW EXECUTE FUNCTION public.tg_pet_care_update_streak();

-- Status do streak (RPC)
CREATE OR REPLACE FUNCTION public.get_pet_streak()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_row public.pet_care_streaks;
  v_current int := 0; v_best int := 0; v_shield int := 1; v_cared_today bool := false;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_row FROM public.pet_care_streaks WHERE user_id = v_uid;
  IF v_row IS NOT NULL THEN
    v_current := v_row.current_streak;
    v_best := v_row.best_streak;
    v_shield := v_row.shield_count;
    v_cared_today := (v_row.last_care_date = v_today);
    -- Se passou de 2 dias sem cuidar e sem escudo na semana, streak já é considerado quebrado
    IF v_row.last_care_date IS NOT NULL AND v_today - v_row.last_care_date > 2 THEN
      v_current := 0;
    ELSIF v_row.last_care_date IS NOT NULL AND v_today - v_row.last_care_date = 2 AND v_shield <= 0 THEN
      v_current := 0;
    END IF;
  END IF;
  RETURN jsonb_build_object(
    'current', v_current,
    'best', v_best,
    'shield', v_shield,
    'cared_today', v_cared_today,
    'last_care_date', v_row.last_care_date
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pet_streak() TO authenticated;

-- =========================================================
-- Caixa semanal
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_pet_weekly_chest()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_week_start date := date_trunc('week', v_today)::date;
  v_done int;
  v_target int := 7;
  v_claimed bool;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT count(*) INTO v_done
  FROM public.user_daily_missions
  WHERE user_id = v_uid
    AND completed_at IS NOT NULL
    AND day >= v_week_start
    AND day < v_week_start + 7;
  SELECT EXISTS (
    SELECT 1 FROM public.user_pet_chest_claims
    WHERE user_id = v_uid AND week_start = v_week_start
  ) INTO v_claimed;
  RETURN jsonb_build_object(
    'week_start', v_week_start,
    'done', v_done,
    'target', v_target,
    'claimed', v_claimed,
    'reward_coins', 60,
    'reward_xp', 120
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pet_weekly_chest() TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_pet_weekly_chest()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_week_start date := date_trunc('week', v_today)::date;
  v_done int;
  v_target int := 7;
  v_reward_coins int := 60;
  v_reward_xp int := 120;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT count(*) INTO v_done
  FROM public.user_daily_missions
  WHERE user_id = v_uid
    AND completed_at IS NOT NULL
    AND day >= v_week_start
    AND day < v_week_start + 7;

  IF v_done < v_target THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_enough', 'done', v_done, 'target', v_target);
  END IF;

  BEGIN
    INSERT INTO public.user_pet_chest_claims (user_id, week_start, coins_awarded, xp_awarded)
    VALUES (v_uid, v_week_start, v_reward_coins, v_reward_xp);
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END;

  PERFORM public._pet_streak_grant(v_uid, 'pet_weekly_chest', v_reward_xp, v_reward_coins, 'Caixa semanal');

  RETURN jsonb_build_object('ok', true, 'coins', v_reward_coins, 'xp', v_reward_xp);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_pet_weekly_chest() TO authenticated;

-- =========================================================
-- Push de cuidado — enfileira lembretes
-- =========================================================

CREATE OR REPLACE FUNCTION public.enqueue_pet_care_reminders()
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_count int := 0;
  v_rec RECORD;
  v_kind text;
  v_title text;
  v_body text;
BEGIN
  FOR v_rec IN
    SELECT p.user_id,
           MAX((e.created_at AT TIME ZONE 'America/Sao_Paulo')::date) AS last_care
    FROM public.user_pets_v2 p
    LEFT JOIN public.pet_care_events e ON e.user_id = p.user_id
    WHERE p.user_id IN (SELECT user_id FROM public.push_subscriptions)
    GROUP BY p.user_id
  LOOP
    IF v_rec.last_care IS NULL THEN CONTINUE; END IF;
    v_kind := NULL;
    IF v_today - v_rec.last_care = 1 THEN v_kind := 'd1';
    ELSIF v_today - v_rec.last_care = 3 THEN v_kind := 'd3';
    ELSIF v_today - v_rec.last_care = 7 THEN v_kind := 'd7';
    END IF;
    IF v_kind IS NULL THEN CONTINUE; END IF;

    -- Já enviou esse marco?
    IF EXISTS (SELECT 1 FROM public.pet_care_push_log WHERE user_id = v_rec.user_id AND last_push_kind = v_kind) THEN
      CONTINUE;
    END IF;

    IF v_kind = 'd1' THEN
      v_title := 'Seu pet sentiu sua falta';
      v_body := 'Que tal dar um carinho rapidinho?';
    ELSIF v_kind = 'd3' THEN
      v_title := 'Já são 3 dias…';
      v_body := 'Seu pet está esperando você voltar.';
    ELSE
      v_title := 'Uma semana sem cuidados';
      v_body := 'Volte e cuide do seu pet antes que ele perca tudo.';
    END IF;

    INSERT INTO public.push_queue (user_id, title, body, url)
    VALUES (v_rec.user_id, v_title, v_body, '/meu-pet');

    INSERT INTO public.pet_care_push_log (user_id, last_push_kind, last_push_at)
    VALUES (v_rec.user_id, v_kind, now())
    ON CONFLICT (user_id) DO UPDATE
      SET last_push_kind = EXCLUDED.last_push_kind,
          last_push_at = EXCLUDED.last_push_at,
          updated_at = now();
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- Cron diário (12:00 UTC = 09:00 SP)
SELECT cron.unschedule('pet-care-reminders-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'pet-care-reminders-daily');
SELECT cron.schedule('pet-care-reminders-daily', '0 12 * * *', $$ SELECT public.enqueue_pet_care_reminders(); $$);
