CREATE POLICY "bqq_authenticated_read_active" ON public.bible_quiz_questions FOR SELECT TO authenticated USING (active = true);

DROP POLICY IF EXISTS "users see own equipped" ON public.user_avatar_equipped;