-- restricted_words: permitir moderador e apresentador
DROP POLICY IF EXISTS "admins insert restricted words" ON public.restricted_words;
DROP POLICY IF EXISTS "admins update restricted words" ON public.restricted_words;
DROP POLICY IF EXISTS "admins delete restricted words" ON public.restricted_words;

CREATE POLICY "staff insert restricted words"
ON public.restricted_words FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'moderador'::app_role)
  OR public.has_role(auth.uid(), 'apresentador'::app_role)
);

CREATE POLICY "staff update restricted words"
ON public.restricted_words FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'moderador'::app_role)
  OR public.has_role(auth.uid(), 'apresentador'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'moderador'::app_role)
  OR public.has_role(auth.uid(), 'apresentador'::app_role)
);

CREATE POLICY "staff delete restricted words"
ON public.restricted_words FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'moderador'::app_role)
  OR public.has_role(auth.uid(), 'apresentador'::app_role)
);

-- reports: permitir moderador e apresentador ver e gerenciar
DROP POLICY IF EXISTS "see own or admin reports" ON public.reports;
DROP POLICY IF EXISTS "admin manage reports" ON public.reports;

CREATE POLICY "see own or staff reports"
ON public.reports FOR SELECT TO authenticated
USING (
  auth.uid() = reporter_id
  OR public.is_staff(auth.uid())
);

CREATE POLICY "staff manage reports"
ON public.reports FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- daily_posts: permitir moderador e apresentador
DROP POLICY IF EXISTS "admins insert daily posts" ON public.daily_posts;
DROP POLICY IF EXISTS "admins update daily posts" ON public.daily_posts;
DROP POLICY IF EXISTS "admins delete daily posts" ON public.daily_posts;
DROP POLICY IF EXISTS "auth users read published daily posts" ON public.daily_posts;

CREATE POLICY "staff insert daily posts"
ON public.daily_posts FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = author_id);

CREATE POLICY "staff update daily posts"
ON public.daily_posts FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff delete daily posts"
ON public.daily_posts FOR DELETE TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "auth users read daily posts"
ON public.daily_posts FOR SELECT TO authenticated
USING (published = true OR public.is_staff(auth.uid()));

-- message_flags: ampliar acesso de leitura para todos os staff
DROP POLICY IF EXISTS "staff manage own flags select" ON public.message_flags;

CREATE POLICY "staff read flags"
ON public.message_flags FOR SELECT TO authenticated
USING (
  auth.uid() = flagged_by
  OR public.is_staff(auth.uid())
);
