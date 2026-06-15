
-- 1. Remove duplicate care trigger (kept trg_achievement_care_event)
DROP TRIGGER IF EXISTS achievement_care_event ON public.pet_care_events;

-- 2. Helper: unlock a specific achievement by slug (idempotent), pays coins+xp+log+notif
CREATE OR REPLACE FUNCTION public.bump_achievement_slug(_user_id uuid, _slug text, _inc integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _ach record;
  _prog int; _new_prog int; _already timestamptz;
  _cur int; _newbal int; _img text;
BEGIN
  IF _user_id IS NULL OR _slug IS NULL THEN RETURN; END IF;
  SELECT id, slug, name, goal, xp_reward, coin_reward INTO _ach
    FROM public.pet_achievements WHERE slug = _slug AND active = true;
  IF NOT FOUND THEN RETURN; END IF;

  INSERT INTO public.user_achievements (user_id, achievement_id, progress)
  VALUES (_user_id, _ach.id, 0)
  ON CONFLICT (user_id, achievement_id) DO NOTHING;

  SELECT progress, unlocked_at INTO _prog, _already
    FROM public.user_achievements
    WHERE user_id=_user_id AND achievement_id=_ach.id FOR UPDATE;
  IF _already IS NOT NULL THEN RETURN; END IF;

  _new_prog := LEAST(_ach.goal, COALESCE(_prog,0) + _inc);
  UPDATE public.user_achievements
     SET progress=_new_prog,
         unlocked_at = CASE WHEN _new_prog>=_ach.goal THEN now() ELSE NULL END
   WHERE user_id=_user_id AND achievement_id=_ach.id;

  IF _new_prog >= _ach.goal THEN
    IF _ach.xp_reward > 0 THEN
      BEGIN PERFORM public.award_xp('achievement_unlock', _ach.xp_reward, NULL,
        jsonb_build_object('achievement', _ach.slug));
      EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
    IF _ach.coin_reward > 0 THEN
      INSERT INTO public.user_coins (user_id, balance) VALUES (_user_id, 0)
      ON CONFLICT (user_id) DO NOTHING;
      SELECT balance INTO _cur FROM public.user_coins WHERE user_id=_user_id FOR UPDATE;
      _newbal := LEAST(500, _cur + _ach.coin_reward);
      UPDATE public.user_coins SET balance=_newbal, updated_at=now() WHERE user_id=_user_id;
      _img := public.get_user_equipped_pet_image(_user_id);
      BEGIN PERFORM public.log_coin_tx(_user_id,'achievement_unlock','in',_ach.coin_reward,_newbal,
        'Conquista: '||_ach.name,
        CASE WHEN _newbal < _cur + _ach.coin_reward
             THEN 'Recompensa registrada (limite de moedas atingido)'
             ELSE 'Recompensa de conquista desbloqueada' END,
        NULL,_img);
      EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
    BEGIN INSERT INTO public.notifications(user_id,type,title,body,data)
      VALUES (_user_id,'achievement_unlock','Conquista desbloqueada!',_ach.name,
              jsonb_build_object('achievement',_ach.slug));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

-- 3. Level achievements: set progress=current level and unlock those reached
CREATE OR REPLACE FUNCTION public.sync_level_achievements(_user_id uuid, _level integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _ach record; _already timestamptz; _cur int; _newbal int; _img text;
BEGIN
  IF _user_id IS NULL OR _level IS NULL THEN RETURN; END IF;
  FOR _ach IN
    SELECT id, slug, name, goal, xp_reward, coin_reward
    FROM public.pet_achievements WHERE active AND category='level'
  LOOP
    INSERT INTO public.user_achievements(user_id, achievement_id, progress)
    VALUES (_user_id, _ach.id, 0)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;

    SELECT unlocked_at INTO _already FROM public.user_achievements
     WHERE user_id=_user_id AND achievement_id=_ach.id FOR UPDATE;

    UPDATE public.user_achievements
       SET progress = LEAST(_ach.goal, _level),
           unlocked_at = CASE
             WHEN _already IS NOT NULL THEN _already
             WHEN _level >= _ach.goal THEN now()
             ELSE NULL END
     WHERE user_id=_user_id AND achievement_id=_ach.id;

    IF _already IS NULL AND _level >= _ach.goal THEN
      IF _ach.xp_reward > 0 THEN
        BEGIN PERFORM public.award_xp('achievement_unlock', _ach.xp_reward, NULL,
          jsonb_build_object('achievement',_ach.slug)); EXCEPTION WHEN OTHERS THEN NULL; END;
      END IF;
      IF _ach.coin_reward > 0 THEN
        INSERT INTO public.user_coins(user_id,balance) VALUES(_user_id,0)
        ON CONFLICT (user_id) DO NOTHING;
        SELECT balance INTO _cur FROM public.user_coins WHERE user_id=_user_id FOR UPDATE;
        _newbal := LEAST(500, _cur + _ach.coin_reward);
        UPDATE public.user_coins SET balance=_newbal, updated_at=now() WHERE user_id=_user_id;
        _img := public.get_user_equipped_pet_image(_user_id);
        BEGIN PERFORM public.log_coin_tx(_user_id,'achievement_unlock','in',_ach.coin_reward,_newbal,
          'Conquista: '||_ach.name,
          CASE WHEN _newbal < _cur + _ach.coin_reward
               THEN 'Recompensa registrada (limite de moedas atingido)'
               ELSE 'Recompensa de conquista desbloqueada' END,
          NULL,_img);
        EXCEPTION WHEN OTHERS THEN NULL; END;
      END IF;
      BEGIN INSERT INTO public.notifications(user_id,type,title,body,data)
        VALUES(_user_id,'achievement_unlock','Conquista desbloqueada!',_ach.name,
               jsonb_build_object('achievement',_ach.slug));
      EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
  END LOOP;
END $$;

-- 4. Trigger on user_xp updates → sync level achievements
CREATE OR REPLACE FUNCTION public.tg_achievement_level()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _lvl int;
BEGIN
  _lvl := public.level_from_xp(NEW.xp_total);
  PERFORM public.sync_level_achievements(NEW.user_id, _lvl);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_achievement_level ON public.user_xp;
CREATE TRIGGER trg_achievement_level
AFTER INSERT OR UPDATE OF xp_total ON public.user_xp
FOR EACH ROW EXECUTE FUNCTION public.tg_achievement_level();

-- 5. Devotional prayed → devo category
CREATE OR REPLACE FUNCTION public.tg_achievement_devo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN PERFORM public.track_achievement(NEW.user_id,'devo',1); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_achievement_devo ON public.devotional_prayed;
CREATE TRIGGER trg_achievement_devo
AFTER INSERT ON public.devotional_prayed
FOR EACH ROW EXECUTE FUNCTION public.tg_achievement_devo();

-- 6. Prayer prayed → prayer-10 specifically
CREATE OR REPLACE FUNCTION public.tg_achievement_prayer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN PERFORM public.bump_achievement_slug(NEW.user_id,'prayer-10',1); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_achievement_prayer ON public.prayer_request_prayed;
CREATE TRIGGER trg_achievement_prayer
AFTER INSERT ON public.prayer_request_prayed
FOR EACH ROW EXECUTE FUNCTION public.tg_achievement_prayer();

-- 7. Matches → first-match + matches-10 for both users
CREATE OR REPLACE FUNCTION public.tg_achievement_match()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.bump_achievement_slug(NEW.user_a,'first-match',1);
  PERFORM public.bump_achievement_slug(NEW.user_a,'matches-10',1);
  PERFORM public.bump_achievement_slug(NEW.user_b,'first-match',1);
  PERFORM public.bump_achievement_slug(NEW.user_b,'matches-10',1);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_achievement_match ON public.matches;
CREATE TRIGGER trg_achievement_match
AFTER INSERT ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.tg_achievement_match();

-- 8. Streak achievements (daily claim) — fires when claim_streak changes upward
CREATE OR REPLACE FUNCTION public.tg_achievement_streak()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _ach record; _already timestamptz; _cur int; _newbal int; _img text;
BEGIN
  IF NEW.claim_streak IS NULL THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND COALESCE(OLD.claim_streak,0) >= COALESCE(NEW.claim_streak,0) THEN
    RETURN NEW;
  END IF;
  FOR _ach IN
    SELECT id, slug, name, goal, xp_reward, coin_reward
    FROM public.pet_achievements WHERE active AND category='streak'
  LOOP
    INSERT INTO public.user_achievements(user_id, achievement_id, progress)
    VALUES (NEW.user_id, _ach.id, 0)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    SELECT unlocked_at INTO _already FROM public.user_achievements
     WHERE user_id=NEW.user_id AND achievement_id=_ach.id FOR UPDATE;
    UPDATE public.user_achievements
       SET progress = LEAST(_ach.goal, NEW.claim_streak),
           unlocked_at = CASE
             WHEN _already IS NOT NULL THEN _already
             WHEN NEW.claim_streak >= _ach.goal THEN now()
             ELSE NULL END
     WHERE user_id=NEW.user_id AND achievement_id=_ach.id;
    IF _already IS NULL AND NEW.claim_streak >= _ach.goal THEN
      IF _ach.xp_reward > 0 THEN
        BEGIN PERFORM public.award_xp('achievement_unlock', _ach.xp_reward, NULL,
          jsonb_build_object('achievement',_ach.slug)); EXCEPTION WHEN OTHERS THEN NULL; END;
      END IF;
      IF _ach.coin_reward > 0 THEN
        SELECT balance INTO _cur FROM public.user_coins WHERE user_id=NEW.user_id FOR UPDATE;
        _newbal := LEAST(500, _cur + _ach.coin_reward);
        UPDATE public.user_coins SET balance=_newbal, updated_at=now() WHERE user_id=NEW.user_id;
        _img := public.get_user_equipped_pet_image(NEW.user_id);
        BEGIN PERFORM public.log_coin_tx(NEW.user_id,'achievement_unlock','in',_ach.coin_reward,_newbal,
          'Conquista: '||_ach.name,
          CASE WHEN _newbal < _cur + _ach.coin_reward
               THEN 'Recompensa registrada (limite de moedas atingido)'
               ELSE 'Recompensa de conquista desbloqueada' END,
          NULL,_img);
        EXCEPTION WHEN OTHERS THEN NULL; END;
      END IF;
      BEGIN INSERT INTO public.notifications(user_id,type,title,body,data)
        VALUES(NEW.user_id,'achievement_unlock','Conquista desbloqueada!',_ach.name,
               jsonb_build_object('achievement',_ach.slug));
      EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_achievement_streak ON public.user_coins;
CREATE TRIGGER trg_achievement_streak
AFTER INSERT OR UPDATE OF claim_streak ON public.user_coins
FOR EACH ROW EXECUTE FUNCTION public.tg_achievement_streak();

-- 9. Profile complete trigger
CREATE OR REPLACE FUNCTION public.tg_achievement_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.full_name IS NOT NULL AND NEW.age IS NOT NULL AND NEW.height_cm IS NOT NULL
     AND NEW.marital IS NOT NULL AND NEW.sex IS NOT NULL
     AND NEW.city IS NOT NULL AND NEW.state IS NOT NULL
     AND NEW.church IS NOT NULL AND NEW.years_baptized IS NOT NULL
     AND NEW.bio IS NOT NULL AND length(trim(NEW.bio))>0 THEN
    PERFORM public.bump_achievement_slug(NEW.id, 'profile-complete', 1);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_achievement_profile ON public.profiles;
CREATE TRIGGER trg_achievement_profile
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_achievement_profile();

-- 10. RECONCILIATION: pay coins for already-unlocked achievements that never logged a coin_transaction
DO $$
DECLARE r record; _cur int; _newbal int; _img text;
BEGIN
  FOR r IN
    SELECT ua.user_id, a.id AS aid, a.slug, a.name, a.coin_reward, a.xp_reward
    FROM public.user_achievements ua
    JOIN public.pet_achievements a ON a.id = ua.achievement_id
    WHERE ua.unlocked_at IS NOT NULL
      AND a.coin_reward > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.coin_transactions ct
        WHERE ct.user_id = ua.user_id
          AND ct.kind = 'achievement_unlock'
          AND ct.title = 'Conquista: ' || a.name
      )
  LOOP
    INSERT INTO public.user_coins(user_id,balance) VALUES(r.user_id,0)
    ON CONFLICT (user_id) DO NOTHING;
    SELECT balance INTO _cur FROM public.user_coins WHERE user_id=r.user_id FOR UPDATE;
    _newbal := LEAST(500, _cur + r.coin_reward);
    UPDATE public.user_coins SET balance=_newbal, updated_at=now() WHERE user_id=r.user_id;
    _img := public.get_user_equipped_pet_image(r.user_id);
    BEGIN PERFORM public.log_coin_tx(r.user_id,'achievement_unlock','in',r.coin_reward,_newbal,
      'Conquista: '||r.name,
      CASE WHEN _newbal < _cur + r.coin_reward
           THEN 'Recompensa registrada (limite de moedas atingido) — reconciliação'
           ELSE 'Recompensa de conquista (reconciliação retroativa)' END,
      NULL,_img);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    IF r.xp_reward > 0 THEN
      BEGIN PERFORM public.award_xp('achievement_unlock', r.xp_reward, NULL,
        jsonb_build_object('achievement', r.slug, 'reconciliation', true));
      EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
    BEGIN INSERT INTO public.notifications(user_id,type,title,body,data)
      VALUES(r.user_id,'achievement_unlock','Conquista desbloqueada!',r.name,
             jsonb_build_object('achievement',r.slug,'reconciliation',true));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
END $$;
