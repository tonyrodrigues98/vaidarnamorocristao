-- Reactions
CREATE TYPE public.devotional_reaction AS ENUM ('heart','prayed','edify');

CREATE TABLE public.devotional_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.daily_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction public.devotional_reaction NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, reaction)
);
CREATE INDEX idx_dev_reactions_post ON public.devotional_reactions(post_id);
ALTER TABLE public.devotional_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read reactions" ON public.devotional_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "user adds own reaction" ON public.devotional_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_accepted_current_terms(auth.uid()));
CREATE POLICY "user removes own reaction" ON public.devotional_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Prayed today (one per user per day per post optional; we use unique (user, day))
CREATE TABLE public.devotional_prayed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.daily_posts(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);
CREATE INDEX idx_dev_prayed_user_day ON public.devotional_prayed(user_id, day);
CREATE INDEX idx_dev_prayed_post ON public.devotional_prayed(post_id);
ALTER TABLE public.devotional_prayed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read prayed" ON public.devotional_prayed FOR SELECT TO authenticated USING (true);
CREATE POLICY "user adds own prayed" ON public.devotional_prayed FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_accepted_current_terms(auth.uid()));
CREATE POLICY "user removes own prayed" ON public.devotional_prayed FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Comments
CREATE TABLE public.devotional_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.daily_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.devotional_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  edited_at timestamptz,
  deleted_at timestamptz,
  pinned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dev_comments_post ON public.devotional_comments(post_id);
CREATE INDEX idx_dev_comments_parent ON public.devotional_comments(parent_id);
ALTER TABLE public.devotional_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read comments" ON public.devotional_comments FOR SELECT TO authenticated
  USING (public.has_accepted_current_terms(auth.uid()) OR public.is_staff(auth.uid()));
CREATE POLICY "user creates own comment" ON public.devotional_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_accepted_current_terms(auth.uid())
              AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved'::profile_status));
CREATE POLICY "user updates own comment" ON public.devotional_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "user deletes own comment" ON public.devotional_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'moderador'));

-- Lock pinned_at to admins
CREATE OR REPLACE FUNCTION public.protect_devotional_comment_pin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.pinned_at IS DISTINCT FROM OLD.pinned_at THEN
    IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
      NEW.pinned_at := OLD.pinned_at;
    END IF;
  END IF;
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.edited_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER trg_protect_devotional_comment_pin BEFORE UPDATE ON public.devotional_comments
  FOR EACH ROW EXECUTE FUNCTION public.protect_devotional_comment_pin();

-- Restricted words check on comment content
CREATE TRIGGER trg_devotional_comment_words BEFORE INSERT OR UPDATE ON public.devotional_comments
  FOR EACH ROW EXECUTE FUNCTION public.check_restricted_words();

-- Comment likes
CREATE TABLE public.devotional_comment_likes (
  comment_id uuid NOT NULL REFERENCES public.devotional_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);
ALTER TABLE public.devotional_comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read likes" ON public.devotional_comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "user adds own like" ON public.devotional_comment_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user removes own like" ON public.devotional_comment_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Comment reports
CREATE TABLE public.devotional_comment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.devotional_comments(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.devotional_comment_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user creates own report" ON public.devotional_comment_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "admin reads reports" ON public.devotional_comment_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR auth.uid() = reporter_id);
CREATE POLICY "admin deletes reports" ON public.devotional_comment_reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Streak helper
CREATE OR REPLACE FUNCTION public.get_prayer_streak(_user_id uuid)
RETURNS TABLE(current_streak int, best_streak int, last_day date)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_current int := 0;
  v_best int := 0;
  v_run int := 0;
  v_prev date;
  r record;
  v_last date;
BEGIN
  SELECT max(day) INTO v_last FROM public.devotional_prayed WHERE user_id = _user_id;
  IF v_last IS NULL THEN
    RETURN QUERY SELECT 0, 0, NULL::date; RETURN;
  END IF;

  -- Compute current streak ending today or yesterday
  IF v_last = CURRENT_DATE OR v_last = CURRENT_DATE - 1 THEN
    v_prev := v_last;
    v_current := 1;
    FOR r IN
      SELECT day FROM public.devotional_prayed
      WHERE user_id = _user_id AND day < v_last
      ORDER BY day DESC
    LOOP
      IF r.day = v_prev - 1 THEN
        v_current := v_current + 1;
        v_prev := r.day;
      ELSE
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- Best streak across history
  v_prev := NULL;
  v_run := 0;
  FOR r IN SELECT day FROM public.devotional_prayed WHERE user_id = _user_id ORDER BY day ASC LOOP
    IF v_prev IS NULL OR r.day = v_prev + 1 THEN
      v_run := v_run + 1;
    ELSE
      v_run := 1;
    END IF;
    IF v_run > v_best THEN v_best := v_run; END IF;
    v_prev := r.day;
  END LOOP;

  RETURN QUERY SELECT v_current, v_best, v_last;
END $$;
REVOKE EXECUTE ON FUNCTION public.get_prayer_streak(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_prayer_streak(uuid) TO authenticated;