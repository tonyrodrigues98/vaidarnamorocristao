
-- ============================================================
-- 1. PROFILES: ban metadata
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS banned_reason text,
  ADD COLUMN IF NOT EXISTS banned_by uuid;

-- ============================================================
-- 2. USER_ADMIN_REQUESTS — admin pede ao usuário alterar algo
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_admin_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_by uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('photo','bio','behavior','other')),
  message text NOT NULL CHECK (length(trim(message)) > 0 AND length(message) <= 1000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz
);

ALTER TABLE public.user_admin_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user reads own admin requests" ON public.user_admin_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "admin creates admin requests" ON public.user_admin_requests
  FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
    AND created_by = auth.uid());

CREATE POLICY "user acknowledges own admin request" ON public.user_admin_requests
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "admin deletes admin requests" ON public.user_admin_requests
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE INDEX IF NOT EXISTS user_admin_requests_user_idx
  ON public.user_admin_requests(user_id, status, created_at DESC);

-- ============================================================
-- 3. USER_ADMIN_WARNINGS — destaque maior no perfil
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_admin_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_by uuid NOT NULL,
  message text NOT NULL CHECK (length(trim(message)) > 0 AND length(message) <= 1000),
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('warning','severe')),
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_admin_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user reads own warnings" ON public.user_admin_warnings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "admin creates warnings" ON public.user_admin_warnings
  FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
    AND created_by = auth.uid());

CREATE POLICY "user acknowledges own warning" ON public.user_admin_warnings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "admin deletes warnings" ON public.user_admin_warnings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE INDEX IF NOT EXISTS user_admin_warnings_user_idx
  ON public.user_admin_warnings(user_id, created_at DESC);

-- ============================================================
-- 4. USER_BAN_APPEALS — apelações de contas banidas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_ban_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  appeal_text text NOT NULL CHECK (length(trim(appeal_text)) > 0 AND length(appeal_text) <= 2000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','answered','ignored')),
  response_text text,
  responded_by uuid,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_ban_appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user reads own appeals" ON public.user_ban_appeals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "user creates own appeal" ON public.user_ban_appeals
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin updates appeals" ON public.user_ban_appeals
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "admin deletes appeals" ON public.user_ban_appeals
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE INDEX IF NOT EXISTS user_ban_appeals_user_idx
  ON public.user_ban_appeals(user_id, created_at DESC);

-- ============================================================
-- 5. RPC admin_ban_user / admin_unban_user
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_ban_user(_user_id uuid, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _reason IS NULL OR length(trim(_reason)) = 0 THEN
    RAISE EXCEPTION 'reason required';
  END IF;
  UPDATE public.profiles
    SET status = 'banned',
        banned_at = now(),
        banned_reason = _reason,
        banned_by = auth.uid(),
        updated_at = now()
  WHERE id = _user_id;
  PERFORM public.create_notification(
    _user_id, 'ban',
    'Sua conta foi suspensa',
    LEFT(_reason, 200),
    '/inicio', auth.uid(), _user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unban_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.profiles
    SET status = 'approved',
        banned_at = NULL,
        banned_reason = NULL,
        banned_by = NULL,
        updated_at = now()
  WHERE id = _user_id;
  PERFORM public.create_notification(
    _user_id, 'unban',
    'Sua conta foi reativada',
    'Sua suspensão foi revogada e você pode usar a plataforma novamente.',
    '/inicio', auth.uid(), _user_id
  );
END;
$$;

-- ============================================================
-- 6. RPC admin_hard_delete_user — apaga dados publicos
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_hard_delete_user(_user_id uuid, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;

  -- Apaga dados em ordem segura
  DELETE FROM public.messages WHERE sender_id = _user_id;
  DELETE FROM public.matches WHERE user_a = _user_id OR user_b = _user_id;
  DELETE FROM public.interests WHERE sender_id = _user_id OR receiver_id = _user_id;
  DELETE FROM public.blocks WHERE blocker_id = _user_id OR blocked_id = _user_id;
  DELETE FROM public.profile_views WHERE viewer_id = _user_id OR viewed_id = _user_id;
  DELETE FROM public.profile_photos WHERE user_id = _user_id;
  DELETE FROM public.profile_advanced WHERE user_id = _user_id;
  DELETE FROM public.profile_preferences WHERE user_id = _user_id;
  DELETE FROM public.devotional_comment_likes WHERE user_id = _user_id;
  DELETE FROM public.devotional_comment_reports WHERE reporter_id = _user_id;
  DELETE FROM public.devotional_comments WHERE user_id = _user_id;
  DELETE FROM public.devotional_prayed WHERE user_id = _user_id;
  DELETE FROM public.devotional_reactions WHERE user_id = _user_id;
  DELETE FROM public.prayer_request_prayed WHERE user_id = _user_id;
  DELETE FROM public.prayer_request_reports WHERE reporter_id = _user_id;
  DELETE FROM public.prayer_requests WHERE user_id = _user_id;
  DELETE FROM public.global_messages WHERE sender_id = _user_id;
  DELETE FROM public.message_flags WHERE flagged_by = _user_id;
  DELETE FROM public.notifications WHERE user_id = _user_id;
  DELETE FROM public.reactivation_reminders WHERE user_id = _user_id;
  DELETE FROM public.reports WHERE reporter_id = _user_id OR reported_id = _user_id;
  DELETE FROM public.user_admin_requests WHERE user_id = _user_id;
  DELETE FROM public.user_admin_warnings WHERE user_id = _user_id;
  DELETE FROM public.user_ban_appeals WHERE user_id = _user_id;
  DELETE FROM public.photo_moderation_log WHERE user_id = _user_id;
  DELETE FROM public.photo_moderation_queue WHERE user_id = _user_id;
  DELETE FROM public.terms_acceptances WHERE user_id = _user_id;
  DELETE FROM public.user_badges WHERE user_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
  -- auth.users NÃO é apagado; permite recadastro com mesmo email
END;
$$;

-- ============================================================
-- 7. RPC admin_delete_user_photo — apaga foto manual + notifica
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_delete_user_photo(
  _user_id uuid,
  _photo_id uuid,
  _scope text,
  _photo_url text,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _reason IS NULL OR length(trim(_reason)) = 0 THEN
    RAISE EXCEPTION 'reason required';
  END IF;

  IF _scope = 'avatar' THEN
    UPDATE public.profiles
      SET photo_url = NULL,
          avatar_ai_verified = false,
          avatar_ai_confidence = NULL,
          avatar_ai_checked_at = NULL,
          updated_at = now()
    WHERE id = _user_id;
  ELSIF _photo_id IS NOT NULL THEN
    DELETE FROM public.profile_photos WHERE id = _photo_id AND user_id = _user_id;
  END IF;

  INSERT INTO public.photo_moderation_log
    (user_id, scope, photo_url, decision, confidence, reason, ai_result)
  VALUES (
    _user_id,
    COALESCE(_scope::photo_moderation_scope, 'avatar'::photo_moderation_scope),
    _photo_url,
    'admin_deleted',
    NULL,
    _reason,
    jsonb_build_object('admin_id', auth.uid(), 'reason', _reason)
  );

  PERFORM public.create_notification(
    _user_id,
    'photo_removed',
    'Sua foto foi removida pela moderação',
    'Motivo: ' || _reason,
    '/perfil',
    auth.uid(),
    _user_id
  );
END;
$$;

-- ============================================================
-- 8. SEED: 9 novas badges escolhidas pelo usuário
-- ============================================================
INSERT INTO public.badges (code, name, description, color, kind, active) VALUES
  ('faithful_heart',        'Coração Fiel',          'Login diário por 30 dias consecutivos',                'rose',   'auto', true),
  ('intercessor',           'Intercessor',           'Orou por 50 pedidos da comunidade',                    'salmon', 'auto', true),
  ('spiritual_mentor',      'Mentor Espiritual',     '25 comentários edificantes em devocionais',            'violet', 'auto', true),
  ('bridge_builder',        'Construtor de Pontes',  'Conquistou 5 matches mútuos',                          'pink',   'auto', true),
  ('open_heart',            'Coração Aberto',        'Demonstrou interesse em 10 perfis',                    'amber',  'auto', true),
  ('attentive_chatter',     'Conversador Atento',    'Conversa ativa por 14 dias seguidos',                  'blue',   'auto', true),
  ('magnetic_profile',      'Perfil Magnético',      '50 visualizações no perfil',                           'gold',   'auto', true),
  ('faith_ambassador',      'Embaixador da Fé',      'Compartilhou seu testemunho completo',                 'teal',   'auto', true),
  ('community_veteran',     'Veterano da Comunidade','6 meses como membro ativo',                            'emerald','auto', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 9. recompute_user_badges atualizado para as novas
-- ============================================================
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
  v_adv_sections int;
  v_pray_total int;
  v_comment_count int;
  v_match_count int;
  v_interest_count int;
  v_active_streak int;
  v_views int;
  v_has_testimony boolean;
  v_member_days int;
BEGIN
  SELECT p.*, u.created_at AS auth_created_at INTO v_profile
  FROM public.profiles p LEFT JOIN auth.users u ON u.id = p.id WHERE p.id = _user_id;
  IF NOT FOUND THEN RETURN; END IF;
  v_created_at := COALESCE(v_profile.auth_created_at, v_profile.created_at);

  -- new_member
  SELECT id INTO v_badge_id FROM public.badges WHERE code='new_member';
  v_should_have := (v_created_at >= now() - interval '7 days');
  IF v_should_have THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at, expires_at)
    VALUES (_user_id, v_badge_id, true, v_created_at, v_created_at + interval '7 days')
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  -- prayer_active
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

  -- profile_complete
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

  -- devotional_active
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

  -- contributor expira
  SELECT id INTO v_badge_id FROM public.badges WHERE code='contributor';
  DELETE FROM public.user_badges
   WHERE user_id=_user_id AND badge_id=v_badge_id
     AND expires_at IS NOT NULL AND expires_at < now();

  -- advanced_profile
  SELECT id INTO v_badge_id FROM public.badges WHERE code='advanced_profile';
  v_adv_sections := public.count_advanced_sections(_user_id);
  IF v_adv_sections >= 8 THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at)
    VALUES (_user_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  -- ============= NOVAS =============

  -- faithful_heart: streak >= 30
  SELECT id INTO v_badge_id FROM public.badges WHERE code='faithful_heart';
  SELECT s.current_streak INTO v_active_streak FROM public.get_active_streak(_user_id) s;
  IF v_active_streak >= 30 THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at)
    VALUES (_user_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  -- intercessor: 50 prayer_request_prayed
  SELECT id INTO v_badge_id FROM public.badges WHERE code='intercessor';
  SELECT count(*) INTO v_pray_total FROM public.prayer_request_prayed WHERE user_id=_user_id;
  IF v_pray_total >= 50 THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at)
    VALUES (_user_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  -- spiritual_mentor: 25 comentários em devocionais (não deletados)
  SELECT id INTO v_badge_id FROM public.badges WHERE code='spiritual_mentor';
  SELECT count(*) INTO v_comment_count FROM public.devotional_comments
    WHERE user_id=_user_id AND deleted_at IS NULL;
  IF v_comment_count >= 25 THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at)
    VALUES (_user_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  -- bridge_builder: 5 matches
  SELECT id INTO v_badge_id FROM public.badges WHERE code='bridge_builder';
  SELECT count(*) INTO v_match_count FROM public.matches
    WHERE user_a=_user_id OR user_b=_user_id;
  IF v_match_count >= 5 THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at)
    VALUES (_user_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  -- open_heart: 10 interests enviados
  SELECT id INTO v_badge_id FROM public.badges WHERE code='open_heart';
  SELECT count(*) INTO v_interest_count FROM public.interests WHERE sender_id=_user_id;
  IF v_interest_count >= 10 THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at)
    VALUES (_user_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  -- attentive_chatter: 14 dias seguidos enviando mensagens em algum match
  SELECT id INTO v_badge_id FROM public.badges WHERE code='attentive_chatter';
  WITH days AS (
    SELECT DISTINCT (created_at AT TIME ZONE 'UTC')::date AS d
    FROM public.messages WHERE sender_id=_user_id
  ),
  ordered AS (
    SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d))::int AS grp FROM days
  ),
  runs AS (
    SELECT count(*) AS run_len, max(d) AS last_d FROM ordered GROUP BY grp
  )
  SELECT COALESCE(max(run_len),0) INTO v_match_count
  FROM runs WHERE last_d >= CURRENT_DATE - 1;
  IF v_match_count >= 14 THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at)
    VALUES (_user_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  -- magnetic_profile: 50 visualizações
  SELECT id INTO v_badge_id FROM public.badges WHERE code='magnetic_profile';
  SELECT count(*) INTO v_views FROM public.profile_views WHERE viewed_id=_user_id;
  IF v_views >= 50 THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at)
    VALUES (_user_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  -- faith_ambassador: testimony preenchido + life_verse + faith_moment
  SELECT id INTO v_badge_id FROM public.badges WHERE code='faith_ambassador';
  SELECT (testimony IS NOT NULL AND length(trim(testimony)) >= 80
          AND life_verse IS NOT NULL AND length(trim(life_verse)) > 0
          AND faith_moment IS NOT NULL)
    INTO v_has_testimony
    FROM public.profile_advanced WHERE user_id=_user_id;
  IF COALESCE(v_has_testimony, false) THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at)
    VALUES (_user_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;

  -- community_veteran: >= 180 dias de membro
  SELECT id INTO v_badge_id FROM public.badges WHERE code='community_veteran';
  v_member_days := EXTRACT(DAY FROM (now() - v_created_at))::int;
  IF v_member_days >= 180 THEN
    INSERT INTO public.user_badges (user_id, badge_id, active, awarded_at)
    VALUES (_user_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE SET active = true;
  ELSE
    DELETE FROM public.user_badges WHERE user_id=_user_id AND badge_id=v_badge_id;
  END IF;
END;
$$;
