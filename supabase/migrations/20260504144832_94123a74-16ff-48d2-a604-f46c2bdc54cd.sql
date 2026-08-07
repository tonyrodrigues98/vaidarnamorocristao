
-- =====================================================
-- 1. CATÁLOGO DE BADGES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  color text NOT NULL,
  kind text NOT NULL DEFAULT 'auto' CHECK (kind IN ('auto','manual')),
  duration_days integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read badges" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage badges" ON public.badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- =====================================================
-- 2. USER BADGES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  granted_by uuid,
  UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id) WHERE active = true;

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read user_badges" ON public.user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage user_badges" ON public.user_badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- =====================================================
-- 3. DOAÇÕES (manual por admin)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric,
  note text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user sees own donations" ON public.user_donations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "admin manage donations" ON public.user_donations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- =====================================================
-- 4. ATIVIDADE DIÁRIA (para missão dias ativos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_activity (
  user_id uuid NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  PRIMARY KEY (user_id, day)
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user sees own activity" ON public.user_activity FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user inserts own activity" ON public.user_activity FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 5. PRESENÇA (last_seen) — fallback caso realtime caia
-- =====================================================
CREATE TABLE IF NOT EXISTS public.presence_last_seen (
  user_id uuid PRIMARY KEY,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.presence_last_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read presence" ON public.presence_last_seen FOR SELECT TO authenticated USING (true);
CREATE POLICY "user upserts own presence" ON public.presence_last_seen FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user updates own presence" ON public.presence_last_seen FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 6. SEED DAS BADGES PADRÃO
-- =====================================================
INSERT INTO public.badges (code, name, description, color, kind, duration_days) VALUES
  ('new_member',     'Novo na Comunidade', 'Usuário novo na comunidade',                 'teal',    'auto', NULL),
  ('prayer_active',  'Orador Ativo',       'Participa ativamente dos momentos de oração','salmon',  'auto', NULL),
  ('profile_complete','Perfil Completo',   'Perfil completo e bem apresentado',          'sky',     'auto', NULL),
  ('devotional_active','Devocional Ativo', 'Participa ativamente dos devocionais',       'pink',    'auto', NULL),
  ('contributor',    'Contribuidor',       'Apoia o crescimento da comunidade',          'emerald', 'manual', 30)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 7. FUNÇÃO: recomputar badges de um usuário
-- =====================================================
CREATE OR REPLACE FUNCTION public.recompute_user_badges(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_created_at timestamptz;
  v_should_have boolean;
  v_last_pray date;
  v_devo_count int;
  v_last_devo timestamptz;
  v_badge_id uuid;
BEGIN
  SELECT p.*, u.created_at AS auth_created_at INTO v_profile
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.id = _user_id;

  IF NOT FOUND THEN RETURN; END IF;
  v_created_at := COALESCE(v_profile.auth_created_at, v_profile.created_at);

  -- ===== 1. NEW MEMBER (≤ 7 dias) =====
  SELECT id INTO v_badge_id FROM public.badges WHERE code='new_member';
  v_should_have := (v_created_at >= now() - interval '7 days');
  IF v_should_have THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at, expires_at)
    VALUES (_user_id, v_badge_id, true, v_created_at, v_created_at + interval '7 days')
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  -- ===== 2. PRAYER ACTIVE (orou nos últimos 3 dias) =====
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

  -- ===== 3. PROFILE COMPLETE =====
  SELECT id INTO v_badge_id FROM public.badges WHERE code='profile_complete';
  v_should_have := (
    v_profile.full_name IS NOT NULL AND length(trim(v_profile.full_name))>0
    AND v_profile.age IS NOT NULL
    AND v_profile.height_cm IS NOT NULL
    AND v_profile.marital IS NOT NULL
    AND v_profile.sex IS NOT NULL
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

  -- ===== 4. DEVOTIONAL ACTIVE (≥7 interações nos últimos 14 dias E última nos últimos 3) =====
  SELECT id INTO v_badge_id FROM public.badges WHERE code='devotional_active';
  WITH inter AS (
    SELECT created_at FROM public.devotional_comments WHERE user_id=_user_id AND deleted_at IS NULL
    UNION ALL
    SELECT created_at FROM public.devotional_reactions WHERE user_id=_user_id
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

  -- ===== 5. CONTRIBUTOR (manual + 30 dias) =====
  SELECT id INTO v_badge_id FROM public.badges WHERE code='contributor';
  -- Remove se expirou
  DELETE FROM public.user_badges
  WHERE user_id=_user_id AND badge_id=v_badge_id
    AND expires_at IS NOT NULL AND expires_at < now();
END;
$$;

-- =====================================================
-- 8. RECOMPUTAR PARA TODOS (cron)
-- =====================================================
CREATE OR REPLACE FUNCTION public.recompute_all_badges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.recompute_user_badges(r.id);
  END LOOP;
END;
$$;

-- =====================================================
-- 9. AWARD CONTRIBUTOR (admin)
-- =====================================================
CREATE OR REPLACE FUNCTION public.award_contributor_badge(_user_id uuid, _amount numeric DEFAULT NULL, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_badge_id uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  INSERT INTO public.user_donations (user_id, amount, note, created_by)
  VALUES (_user_id, _amount, _note, auth.uid());

  SELECT id INTO v_badge_id FROM public.badges WHERE code='contributor';
  INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at, expires_at, granted_by)
  VALUES (_user_id, v_badge_id, true, now(), now() + interval '30 days', auth.uid())
  ON CONFLICT (user_id, badge_id) DO UPDATE SET
    active = true, awarded_at = now(), expires_at = now() + interval '30 days', granted_by = auth.uid();
END;
$$;

-- =====================================================
-- 10. REMOVE BADGE MANUAL (admin)
-- =====================================================
CREATE OR REPLACE FUNCTION public.admin_remove_badge(_user_id uuid, _code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.user_badges
  WHERE user_id=_user_id AND badge_id=(SELECT id FROM public.badges WHERE code=_code);
END;
$$;

-- =====================================================
-- 11. TOUCH ACTIVITY + presence
-- =====================================================
CREATE OR REPLACE FUNCTION public.touch_my_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_activity (user_id, day)
  VALUES (auth.uid(), (now() AT TIME ZONE 'UTC')::date)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.presence_last_seen (user_id, last_seen_at)
  VALUES (auth.uid(), now())
  ON CONFLICT (user_id) DO UPDATE SET last_seen_at = now();
END;
$$;

-- =====================================================
-- 12. STREAK DIAS ATIVOS (consecutivos)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_active_streak(_user_id uuid)
RETURNS TABLE(current_streak int, best_streak int, total_days int, last_day date)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_current int := 0; v_best int := 0; v_run int := 0;
  v_prev date; r RECORD; v_last date; v_total int;
BEGIN
  SELECT max(day), count(*) INTO v_last, v_total FROM public.user_activity WHERE user_id=_user_id;
  IF v_last IS NULL THEN
    RETURN QUERY SELECT 0,0,0,NULL::date; RETURN;
  END IF;
  IF v_last = CURRENT_DATE OR v_last = CURRENT_DATE - 1 THEN
    v_prev := v_last; v_current := 1;
    FOR r IN SELECT day FROM public.user_activity WHERE user_id=_user_id AND day < v_last ORDER BY day DESC LOOP
      IF r.day = v_prev - 1 THEN v_current := v_current+1; v_prev := r.day; ELSE EXIT; END IF;
    END LOOP;
  END IF;
  v_prev := NULL; v_run := 0;
  FOR r IN SELECT day FROM public.user_activity WHERE user_id=_user_id ORDER BY day ASC LOOP
    IF v_prev IS NULL OR r.day = v_prev + 1 THEN v_run := v_run + 1; ELSE v_run := 1; END IF;
    IF v_run > v_best THEN v_best := v_run; END IF;
    v_prev := r.day;
  END LOOP;
  RETURN QUERY SELECT v_current, v_best, v_total, v_last;
END $$;

-- =====================================================
-- 13. MISSÕES (resumo privado)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_my_missions()
RETURNS TABLE(
  profile_complete boolean,
  prayer_count_7 int,
  prayer_target int,
  devotional_count_14 int,
  devotional_target int,
  has_first_match boolean,
  has_first_devotional boolean,
  active_streak int,
  best_streak int
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_profile RECORD;
  v_pc boolean; v_p7 int; v_d14 int;
  v_first_match boolean; v_first_devo boolean;
  v_cs int; v_bs int;
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
    UNION ALL
    SELECT created_at FROM public.devotional_reactions WHERE user_id=uid
  )
  SELECT count(*) INTO v_d14 FROM inter WHERE created_at >= now() - interval '14 days';

  SELECT EXISTS(SELECT 1 FROM public.matches WHERE user_a=uid OR user_b=uid) INTO v_first_match;
  SELECT EXISTS(
    SELECT 1 FROM public.devotional_comments WHERE user_id=uid AND deleted_at IS NULL
    UNION ALL SELECT 1 FROM public.devotional_reactions WHERE user_id=uid
  ) INTO v_first_devo;

  SELECT s.current_streak, s.best_streak INTO v_cs, v_bs FROM public.get_active_streak(uid) s;

  RETURN QUERY SELECT v_pc, v_p7, 7, v_d14, 7, v_first_match, v_first_devo, COALESCE(v_cs,0), COALESCE(v_bs,0);
END $$;

-- =====================================================
-- 14. REALTIME para user_badges e presence
-- =====================================================
ALTER TABLE public.user_badges REPLICA IDENTITY FULL;
ALTER TABLE public.presence_last_seen REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.presence_last_seen; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
