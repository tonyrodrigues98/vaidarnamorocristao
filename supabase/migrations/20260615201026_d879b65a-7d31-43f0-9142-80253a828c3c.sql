
-- Ajustes Lote 3: rewards do streak, meta da caixa, textos do push.

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
  v_marker_xp int := 0;
  v_marker_coins int := 0;
  v_marker_title text;
BEGIN
  DELETE FROM public.pet_care_push_log WHERE user_id = NEW.user_id;

  SELECT * INTO v_row FROM public.pet_care_streaks WHERE user_id = NEW.user_id FOR UPDATE;

  IF v_row IS NULL THEN
    INSERT INTO public.pet_care_streaks (user_id, current_streak, best_streak, last_care_date, shield_count, shield_week_start)
    VALUES (NEW.user_id, 1, 1, v_today, 1, v_week_start);
    v_new_streak := 1;
  ELSE
    IF v_row.shield_week_start IS NULL OR v_row.shield_week_start < v_week_start THEN
      v_row.shield_count := 1;
      v_row.shield_week_start := v_week_start;
    END IF;

    IF v_row.last_care_date = v_today THEN
      UPDATE public.pet_care_streaks
        SET shield_count = v_row.shield_count, shield_week_start = v_row.shield_week_start, updated_at = now()
        WHERE user_id = NEW.user_id;
      RETURN NEW;
    ELSIF v_row.last_care_date = v_today - 1 THEN
      v_new_streak := v_row.current_streak + 1;
    ELSIF v_row.last_care_date = v_today - 2 AND v_row.shield_count > 0 THEN
      v_new_streak := v_row.current_streak + 1;
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

  -- Linear diário
  PERFORM public._pet_streak_grant(NEW.user_id, 'pet_streak_daily', 10, 5, 'Streak diário');

  -- Marcos (nova escala — sentir cedo, suavizar topo)
  IF v_new_streak = 3 THEN v_marker_xp := 20; v_marker_coins := 10; v_marker_title := 'Marco: 3 dias';
  ELSIF v_new_streak = 7 THEN v_marker_xp := 60; v_marker_coins := 30; v_marker_title := 'Marco: 7 dias';
  ELSIF v_new_streak = 14 THEN v_marker_xp := 120; v_marker_coins := 60; v_marker_title := 'Marco: 14 dias';
  ELSIF v_new_streak = 30 THEN v_marker_xp := 300; v_marker_coins := 150; v_marker_title := 'Marco: 30 dias';
  ELSIF v_new_streak = 60 THEN v_marker_xp := 600; v_marker_coins := 300; v_marker_title := 'Marco: 60 dias';
  ELSIF v_new_streak = 100 THEN v_marker_xp := 1200; v_marker_coins := 600; v_marker_title := 'Marco: 100 dias';
  END IF;

  IF v_marker_xp > 0 THEN
    PERFORM public._pet_streak_grant(NEW.user_id, 'pet_streak_marker', v_marker_xp, v_marker_coins, v_marker_title);
  END IF;

  RETURN NEW;
END;
$$;

-- Caixa semanal: meta 5, reward +80 moedas / +180 XP
CREATE OR REPLACE FUNCTION public.get_pet_weekly_chest()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_week_start date := date_trunc('week', v_today)::date;
  v_done int;
  v_target int := 5;
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
    'reward_coins', 80,
    'reward_xp', 180
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_pet_weekly_chest()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_week_start date := date_trunc('week', v_today)::date;
  v_done int;
  v_target int := 5;
  v_reward_coins int := 80;
  v_reward_xp int := 180;
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

-- Push: copy mais humana
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

    IF EXISTS (SELECT 1 FROM public.pet_care_push_log WHERE user_id = v_rec.user_id AND last_push_kind = v_kind) THEN
      CONTINUE;
    END IF;

    IF v_kind = 'd1' THEN
      v_title := 'Um cafuné rápido?';
      v_body := 'Seu pet está te esperando. Leva menos de um minuto.';
    ELSIF v_kind = 'd3' THEN
      v_title := 'Que tal voltar?';
      v_body := 'Faz 3 dias sem aparecer. Seu pet sentiu sua falta.';
    ELSE
      v_title := 'Seu pet ainda está aí';
      v_body := 'Uma semana sem cuidado. Volte para retomar o ritmo.';
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
