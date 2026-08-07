
-- Constante de versão atual dos Termos
CREATE OR REPLACE FUNCTION public.current_terms_version()
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT '2026-05-03'::text;
$$;

-- Verifica se o usuário aceitou a versão atual
CREATE OR REPLACE FUNCTION public.has_accepted_current_terms(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.terms_acceptances
    WHERE user_id = _user_id
      AND version = public.current_terms_version()
  );
$$;

-- ============ messages ============
DROP POLICY IF EXISTS "send match messages" ON public.messages;
CREATE POLICY "send match messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.has_accepted_current_terms(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
        AND (auth.uid() = m.user_a OR auth.uid() = m.user_b)
    )
  );

DROP POLICY IF EXISTS "update own messages content" ON public.messages;
CREATE POLICY "update own messages content"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id AND public.has_accepted_current_terms(auth.uid()))
  WITH CHECK (auth.uid() = sender_id AND public.has_accepted_current_terms(auth.uid()));

DROP POLICY IF EXISTS "delete own messages" ON public.messages;
CREATE POLICY "delete own messages"
  ON public.messages FOR DELETE TO authenticated
  USING (auth.uid() = sender_id AND public.has_accepted_current_terms(auth.uid()));

DROP POLICY IF EXISTS "see match messages" ON public.messages;
CREATE POLICY "see match messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    (public.has_accepted_current_terms(auth.uid()) OR public.is_staff(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
        AND (auth.uid() = m.user_a OR auth.uid() = m.user_b)
    )
  );

-- ============ global_messages ============
DROP POLICY IF EXISTS "approved users send global messages" ON public.global_messages;
CREATE POLICY "approved users send global messages"
  ON public.global_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.has_accepted_current_terms(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.status = 'approved'::profile_status
    )
  );

DROP POLICY IF EXISTS "update own global message" ON public.global_messages;
CREATE POLICY "update own global message"
  ON public.global_messages FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id AND public.has_accepted_current_terms(auth.uid()))
  WITH CHECK (auth.uid() = sender_id AND public.has_accepted_current_terms(auth.uid()));

DROP POLICY IF EXISTS "auth users read global messages" ON public.global_messages;
CREATE POLICY "auth users read global messages"
  ON public.global_messages FOR SELECT TO authenticated
  USING (public.has_accepted_current_terms(auth.uid()) OR public.is_staff(auth.uid()));

-- ============ interests ============
DROP POLICY IF EXISTS "send interest" ON public.interests;
CREATE POLICY "send interest"
  ON public.interests FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.has_accepted_current_terms(auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.status = 'approved'::profile_status)
    AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = interests.receiver_id AND profiles.status = 'approved'::profile_status)
    AND ((NOT public.is_staff(receiver_id)) OR public.is_staff(auth.uid()))
  );

DROP POLICY IF EXISTS "remove own interest" ON public.interests;
CREATE POLICY "remove own interest"
  ON public.interests FOR DELETE TO authenticated
  USING (auth.uid() = sender_id AND public.has_accepted_current_terms(auth.uid()));

DROP POLICY IF EXISTS "see own interests" ON public.interests;
CREATE POLICY "see own interests"
  ON public.interests FOR SELECT TO authenticated
  USING (
    (public.has_accepted_current_terms(auth.uid()) AND (auth.uid() = sender_id OR auth.uid() = receiver_id))
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- ============ profile_views ============
DROP POLICY IF EXISTS "viewer registers own view" ON public.profile_views;
CREATE POLICY "viewer registers own view"
  ON public.profile_views FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = viewer_id
    AND viewer_id <> viewed_id
    AND public.has_accepted_current_terms(auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.status = 'approved'::profile_status)
  );

-- ============ blocks ============
DROP POLICY IF EXISTS "create own blocks" ON public.blocks;
CREATE POLICY "create own blocks"
  ON public.blocks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id AND public.has_accepted_current_terms(auth.uid()));

DROP POLICY IF EXISTS "delete own blocks" ON public.blocks;
CREATE POLICY "delete own blocks"
  ON public.blocks FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id AND public.has_accepted_current_terms(auth.uid()));

-- ============ profile_preferences ============
DROP POLICY IF EXISTS "own preferences insert" ON public.profile_preferences;
CREATE POLICY "own preferences insert"
  ON public.profile_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_accepted_current_terms(auth.uid()));

DROP POLICY IF EXISTS "own preferences update" ON public.profile_preferences;
CREATE POLICY "own preferences update"
  ON public.profile_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.has_accepted_current_terms(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.has_accepted_current_terms(auth.uid()));

-- ============ mark_message_read: bloqueia leitura sem aceite ============
CREATE OR REPLACE FUNCTION public.mark_message_read(_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  m_match uuid;
  m_sender uuid;
  m_user_a uuid;
  m_user_b uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT public.has_accepted_current_terms(uid) AND NOT public.is_staff(uid) THEN
    RAISE EXCEPTION 'terms acceptance required' USING ERRCODE = 'check_violation';
  END IF;

  SELECT match_id, sender_id INTO m_match, m_sender
  FROM public.messages WHERE id = _message_id;

  IF m_match IS NULL THEN
    RETURN;
  END IF;

  SELECT user_a, user_b INTO m_user_a, m_user_b
  FROM public.matches WHERE id = m_match;

  IF uid <> m_sender AND (uid = m_user_a OR uid = m_user_b) THEN
    UPDATE public.messages SET read_at = now()
    WHERE id = _message_id AND read_at IS NULL;
  END IF;
END;
$$;
