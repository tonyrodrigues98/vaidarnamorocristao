
-- 1. Update track_achievement to accept optional action and filter slug-specific care achievements
CREATE OR REPLACE FUNCTION public.track_achievement(_user_id uuid, _category text, _inc integer DEFAULT 1, _action text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _ach record;
  _prog int;
  _new_prog int;
  _already_unlocked timestamptz;
  _cur_balance int;
  _new_balance int;
  _pet_image text;
  _action_slug text;
BEGIN
  IF _user_id IS NULL OR _category IS NULL THEN RETURN; END IF;

  _action_slug := CASE _action
    WHEN 'feed' THEN 'feed-25'
    WHEN 'hygiene' THEN 'hygiene-25'
    WHEN 'play' THEN 'play-25'
    WHEN 'affection' THEN 'affection-25'
    WHEN 'sleep' THEN 'sleep-25'
    ELSE NULL
  END;

  FOR _ach IN
    SELECT id, slug, name, goal, xp_reward, coin_reward, icon
    FROM public.pet_achievements
    WHERE active = true
      AND category = _category
      AND (
        -- if no action provided, increment all in category
        _action IS NULL
        -- generic care achievements: always increment
        OR slug NOT IN ('feed-25','hygiene-25','play-25','affection-25','sleep-25')
        -- action-specific: only the matching one
        OR slug = _action_slug
      )
  LOOP
    INSERT INTO public.user_achievements (user_id, achievement_id, progress)
    VALUES (_user_id, _ach.id, 0)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;

    SELECT progress, unlocked_at INTO _prog, _already_unlocked
    FROM public.user_achievements
    WHERE user_id = _user_id AND achievement_id = _ach.id
    FOR UPDATE;

    IF _already_unlocked IS NOT NULL THEN CONTINUE; END IF;

    _new_prog := LEAST(_ach.goal, COALESCE(_prog, 0) + _inc);

    UPDATE public.user_achievements
       SET progress = _new_prog,
           unlocked_at = CASE WHEN _new_prog >= _ach.goal THEN now() ELSE NULL END
     WHERE user_id = _user_id AND achievement_id = _ach.id;

    IF _new_prog >= _ach.goal THEN
      IF _ach.xp_reward > 0 THEN
        BEGIN PERFORM public.award_xp('achievement_unlock', _ach.xp_reward, NULL,
          jsonb_build_object('achievement', _ach.slug));
        EXCEPTION WHEN OTHERS THEN NULL; END;
      END IF;

      IF _ach.coin_reward > 0 THEN
        INSERT INTO public.user_coins (user_id, balance) VALUES (_user_id, 0)
        ON CONFLICT (user_id) DO NOTHING;
        SELECT balance INTO _cur_balance FROM public.user_coins WHERE user_id = _user_id FOR UPDATE;
        _new_balance := LEAST(500, _cur_balance + _ach.coin_reward);
        UPDATE public.user_coins SET balance = _new_balance, updated_at = now() WHERE user_id = _user_id;

        _pet_image := public.get_user_equipped_pet_image(_user_id);

        BEGIN PERFORM public.log_coin_tx(
          _user_id, 'achievement_unlock', 'in', _ach.coin_reward, _new_balance,
          'Conquista: ' || _ach.name,
          CASE WHEN _new_balance < _cur_balance + _ach.coin_reward
               THEN 'Recompensa registrada (limite de moedas atingido)'
               ELSE 'Recompensa de conquista desbloqueada' END,
          NULL, _pet_image);
        EXCEPTION WHEN OTHERS THEN NULL; END;
      END IF;

      BEGIN INSERT INTO public.notifications (user_id, type, title, body, data)
        VALUES (_user_id, 'achievement_unlock', 'Conquista desbloqueada!', _ach.name,
                jsonb_build_object('achievement', _ach.slug));
      EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
  END LOOP;
END $function$;

-- 2. Update tg_achievement_care_event to pass kind as action
CREATE OR REPLACE FUNCTION public.tg_achievement_care_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.track_achievement(NEW.user_id, 'care', 1, NEW.kind);
  RETURN NEW;
END $function$;

-- 3. Attach trigger to pet_care_events
DROP TRIGGER IF EXISTS trg_achievement_care_event ON public.pet_care_events;
CREATE TRIGGER trg_achievement_care_event
AFTER INSERT ON public.pet_care_events
FOR EACH ROW
EXECUTE FUNCTION public.tg_achievement_care_event();

-- 4. Also attach mission trigger if missing
DROP TRIGGER IF EXISTS trg_mission_care_event ON public.pet_care_events;
CREATE TRIGGER trg_mission_care_event
AFTER INSERT ON public.pet_care_events
FOR EACH ROW
EXECUTE FUNCTION public.tg_mission_care_event();

-- 5. Backfill care achievements from existing pet_care_events
DO $$
DECLARE
  _ach record;
  _u record;
  _count int;
  _new_unlock boolean;
BEGIN
  -- Generic care achievements (count all care events)
  FOR _ach IN SELECT id, slug, goal, xp_reward, coin_reward, name FROM public.pet_achievements
              WHERE category='care' AND slug NOT IN ('feed-25','hygiene-25','play-25','affection-25','sleep-25')
  LOOP
    FOR _u IN SELECT user_id, count(*) AS c FROM public.pet_care_events GROUP BY user_id LOOP
      INSERT INTO public.user_achievements (user_id, achievement_id, progress, unlocked_at)
      VALUES (_u.user_id, _ach.id, LEAST(_ach.goal, _u.c),
              CASE WHEN _u.c >= _ach.goal THEN now() ELSE NULL END)
      ON CONFLICT (user_id, achievement_id) DO UPDATE
        SET progress = GREATEST(public.user_achievements.progress, LEAST(_ach.goal, _u.c)),
            unlocked_at = COALESCE(public.user_achievements.unlocked_at,
                                   CASE WHEN _u.c >= _ach.goal THEN now() ELSE NULL END);
    END LOOP;
  END LOOP;

  -- Action-specific care achievements
  FOR _ach IN SELECT id, slug, goal FROM public.pet_achievements
              WHERE category='care' AND slug IN ('feed-25','hygiene-25','play-25','affection-25','sleep-25')
  LOOP
    FOR _u IN SELECT user_id, count(*) AS c FROM public.pet_care_events
              WHERE kind = CASE _ach.slug
                WHEN 'feed-25' THEN 'feed'
                WHEN 'hygiene-25' THEN 'hygiene'
                WHEN 'play-25' THEN 'play'
                WHEN 'affection-25' THEN 'affection'
                WHEN 'sleep-25' THEN 'sleep' END
              GROUP BY user_id
    LOOP
      INSERT INTO public.user_achievements (user_id, achievement_id, progress, unlocked_at)
      VALUES (_u.user_id, _ach.id, LEAST(_ach.goal, _u.c),
              CASE WHEN _u.c >= _ach.goal THEN now() ELSE NULL END)
      ON CONFLICT (user_id, achievement_id) DO UPDATE
        SET progress = GREATEST(public.user_achievements.progress, LEAST(_ach.goal, _u.c)),
            unlocked_at = COALESCE(public.user_achievements.unlocked_at,
                                   CASE WHEN _u.c >= _ach.goal THEN now() ELSE NULL END);
    END LOOP;
  END LOOP;
END $$;
