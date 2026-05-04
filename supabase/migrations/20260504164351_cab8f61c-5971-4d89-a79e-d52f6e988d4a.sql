CREATE TABLE IF NOT EXISTS public.profile_advanced (
  user_id uuid PRIMARY KEY,
  life_verse text,
  faith_moment text,
  testimony text,
  participates text[] DEFAULT '{}',
  spiritual_routine text[] DEFAULT '{}',
  church_frequency text,
  ministry text,
  ministry_other text,
  has_calling text,
  calling_description text,
  seeking text,
  pace text,
  love_language text,
  wants_marriage text,
  wants_children text,
  children_count int,
  living_place text,
  life_goals text[] DEFAULT '{}',
  introversion text,
  energy text,
  communication text,
  style text,
  hobbies text,
  favorite_worships text,
  worship_style text,
  free_time text,
  routine text,
  available_time text,
  in_relationship_iam text,
  essential_quality text,
  non_negotiable text,
  willing_to_build text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_advanced ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner manage advanced" ON public.profile_advanced;
CREATE POLICY "owner manage advanced"
  ON public.profile_advanced FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "auth read advanced of approved" ON public.profile_advanced;
CREATE POLICY "auth read advanced of approved"
  ON public.profile_advanced FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_advanced.user_id AND (p.status = 'approved'::profile_status OR p.id = auth.uid()))
    OR public.has_role(auth.uid(),'admin')
  );

DROP TRIGGER IF EXISTS trg_profile_advanced_updated ON public.profile_advanced;
CREATE TRIGGER trg_profile_advanced_updated
  BEFORE UPDATE ON public.profile_advanced
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.count_advanced_sections(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.profile_advanced; c int := 0;
BEGIN
  SELECT * INTO r FROM public.profile_advanced WHERE user_id = _user_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  IF (r.life_verse IS NOT NULL AND length(trim(r.life_verse))>0)
     OR r.faith_moment IS NOT NULL
     OR (r.testimony IS NOT NULL AND length(trim(r.testimony))>0) THEN c := c+1; END IF;
  IF coalesce(array_length(r.participates,1),0)>0
     OR coalesce(array_length(r.spiritual_routine,1),0)>0
     OR r.church_frequency IS NOT NULL THEN c := c+1; END IF;
  IF r.ministry IS NOT NULL OR r.has_calling IS NOT NULL THEN c := c+1; END IF;
  IF r.seeking IS NOT NULL OR r.pace IS NOT NULL OR r.love_language IS NOT NULL THEN c := c+1; END IF;
  IF r.wants_marriage IS NOT NULL OR r.wants_children IS NOT NULL OR r.living_place IS NOT NULL
     OR coalesce(array_length(r.life_goals,1),0)>0 THEN c := c+1; END IF;
  IF r.introversion IS NOT NULL OR r.energy IS NOT NULL OR r.communication IS NOT NULL OR r.style IS NOT NULL THEN c := c+1; END IF;
  IF (r.hobbies IS NOT NULL AND length(trim(r.hobbies))>0)
     OR (r.favorite_worships IS NOT NULL AND length(trim(r.favorite_worships))>0)
     OR r.worship_style IS NOT NULL
     OR (r.free_time IS NOT NULL AND length(trim(r.free_time))>0) THEN c := c+1; END IF;
  IF r.routine IS NOT NULL OR r.available_time IS NOT NULL THEN c := c+1; END IF;
  IF r.in_relationship_iam IS NOT NULL AND length(trim(r.in_relationship_iam))>0 THEN c := c+1; END IF;
  IF (r.essential_quality IS NOT NULL AND length(trim(r.essential_quality))>0)
     OR (r.non_negotiable IS NOT NULL AND length(trim(r.non_negotiable))>0)
     OR (r.willing_to_build IS NOT NULL AND length(trim(r.willing_to_build))>0) THEN c := c+1; END IF;
  RETURN c;
END $$;

INSERT INTO public.badges (code, name, description, color, kind, active)
VALUES ('advanced_profile', 'Perfil Avançado', 'Preencheu o perfil avançado com profundidade', '#a78bfa', 'auto', true)
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.recompute_user_badges(_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_created_at timestamptz;
  v_should_have boolean;
  v_last_pray date;
  v_devo_count int;
  v_last_devo timestamptz;
  v_badge_id uuid;
  v_adv_sections int;
BEGIN
  SELECT p.*, u.created_at AS auth_created_at INTO v_profile
  FROM public.profiles p LEFT JOIN auth.users u ON u.id = p.id WHERE p.id = _user_id;
  IF NOT FOUND THEN RETURN; END IF;
  v_created_at := COALESCE(v_profile.auth_created_at, v_profile.created_at);

  SELECT id INTO v_badge_id FROM public.badges WHERE code='new_member';
  v_should_have := (v_created_at >= now() - interval '7 days');
  IF v_should_have THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at, expires_at)
    VALUES (_user_id, v_badge_id, true, v_created_at, v_created_at + interval '7 days')
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  SELECT id INTO v_badge_id FROM public.badges WHERE code='prayer_active';
  SELECT max(day) INTO v_last_pray FROM public.devotional_prayed WHERE user_id = _user_id;
  v_should_have := (v_last_pray IS NOT NULL AND v_last_pray >= (CURRENT_DATE - 3));
  IF v_should_have THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at)
    VALUES (_user_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true, awarded_at = COALESCE(public.user_badges.awarded_at, now());
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  SELECT id INTO v_badge_id FROM public.badges WHERE code='profile_complete';
  v_should_have := (
    v_profile.full_name IS NOT NULL AND length(trim(v_profile.full_name))>0
    AND v_profile.age IS NOT NULL AND v_profile.height_cm IS NOT NULL
    AND v_profile.marital IS NOT NULL AND v_profile.sex IS NOT NULL
    AND v_profile.city IS NOT NULL AND length(trim(v_profile.city))>0
    AND v_profile.state IS NOT NULL AND length(trim(v_profile.state))>0
    AND v_profile.church IS NOT NULL AND length(trim(v_profile.church))>0
    AND v_profile.years_baptized IS NOT NULL
    AND v_profile.bio IS NOT NULL AND length(trim(v_profile.bio))>0
  );
  IF v_should_have THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at)
    VALUES (_user_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  SELECT id INTO v_badge_id FROM public.badges WHERE code='devotional_active';
  WITH inter AS (
    SELECT created_at FROM public.devotional_comments WHERE user_id=_user_id AND deleted_at IS NULL
    UNION ALL SELECT created_at FROM public.devotional_reactions WHERE user_id=_user_id
  )
  SELECT count(*), max(created_at) INTO v_devo_count, v_last_devo
  FROM inter WHERE created_at >= now() - interval '14 days';
  v_should_have := (v_devo_count >= 7 AND v_last_devo >= now() - interval '3 days');
  IF v_should_have THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at)
    VALUES (_user_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  SELECT id INTO v_badge_id FROM public.badges WHERE code='contributor';
  DELETE FROM public.user_badges
   WHERE user_id=_user_id AND badge_id=v_badge_id
     AND expires_at IS NOT NULL AND expires_at < now();

  SELECT id INTO v_badge_id FROM public.badges WHERE code='advanced_profile';
  v_adv_sections := public.count_advanced_sections(_user_id);
  IF v_adv_sections >= 8 THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at)
    VALUES (_user_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.get_my_missions();
CREATE OR REPLACE FUNCTION public.get_my_missions()
RETURNS TABLE(profile_complete boolean, prayer_count_7 integer, prayer_target integer, devotional_count_14 integer, devotional_target integer, has_first_match boolean, has_first_devotional boolean, active_streak integer, best_streak integer, advanced_sections integer, advanced_target integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_profile RECORD;
  v_pc boolean; v_p7 int; v_d14 int;
  v_first_match boolean; v_first_devo boolean;
  v_cs int; v_bs int; v_adv int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = uid;
  v_pc := (v_profile.full_name IS NOT NULL AND v_profile.age IS NOT NULL AND v_profile.height_cm IS NOT NULL
    AND v_profile.marital IS NOT NULL AND v_profile.sex IS NOT NULL
    AND v_profile.city IS NOT NULL AND v_profile.state IS NOT NULL
    AND v_profile.church IS NOT NULL AND v_profile.years_baptized IS NOT NULL
    AND v_profile.bio IS NOT NULL AND length(trim(v_profile.bio))>0);
  SELECT count(DISTINCT day) INTO v_p7 FROM public.devotional_prayed
   WHERE user_id=uid AND day >= CURRENT_DATE - 6;
  WITH inter AS (
    SELECT created_at FROM public.devotional_comments WHERE user_id=uid AND deleted_at IS NULL
    UNION ALL SELECT created_at FROM public.devotional_reactions WHERE user_id=uid
  )
  SELECT count(*) INTO v_d14 FROM inter WHERE created_at >= now() - interval '14 days';
  SELECT EXISTS(SELECT 1 FROM public.matches WHERE user_a=uid OR user_b=uid) INTO v_first_match;
  SELECT EXISTS(
    SELECT 1 FROM public.devotional_comments WHERE user_id=uid AND deleted_at IS NULL
    UNION ALL SELECT 1 FROM public.devotional_reactions WHERE user_id=uid
  ) INTO v_first_devo;
  SELECT s.current_streak, s.best_streak INTO v_cs, v_bs FROM public.get_active_streak(uid) s;
  v_adv := public.count_advanced_sections(uid);
  RETURN QUERY SELECT v_pc, v_p7, 7, v_d14, 7, v_first_match, v_first_devo, COALESCE(v_cs,0), COALESCE(v_bs,0), v_adv, 8;
END $$;
