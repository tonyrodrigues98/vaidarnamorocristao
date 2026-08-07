
-- Helper trigger fn for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ========== INTERESTS ==========
CREATE TABLE public.interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sender_id, receiver_id),
  CHECK (sender_id <> receiver_id)
);
CREATE INDEX idx_interests_receiver ON public.interests(receiver_id);
CREATE INDEX idx_interests_sender ON public.interests(sender_id);
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "see own interests" ON public.interests FOR SELECT TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "send interest" ON public.interests FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved')
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = receiver_id AND status = 'approved')
);

CREATE POLICY "remove own interest" ON public.interests FOR DELETE TO authenticated
USING (auth.uid() = sender_id);

-- ========== MATCHES ==========
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);
CREATE INDEX idx_matches_a ON public.matches(user_a);
CREATE INDEX idx_matches_b ON public.matches(user_b);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "see own matches" ON public.matches FOR SELECT TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.create_match_on_reciprocal()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE reciprocal_exists boolean; a uuid; b uuid;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.interests WHERE sender_id = NEW.receiver_id AND receiver_id = NEW.sender_id)
    INTO reciprocal_exists;
  IF reciprocal_exists THEN
    IF NEW.sender_id < NEW.receiver_id THEN a := NEW.sender_id; b := NEW.receiver_id;
    ELSE a := NEW.receiver_id; b := NEW.sender_id; END IF;
    INSERT INTO public.matches (user_a, user_b) VALUES (a, b) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_match_reciprocal
AFTER INSERT ON public.interests
FOR EACH ROW EXECUTE FUNCTION public.create_match_on_reciprocal();

-- ========== MESSAGES ==========
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_match ON public.messages(match_id, created_at);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "see match messages" ON public.messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND (auth.uid() = m.user_a OR auth.uid() = m.user_b)));

CREATE POLICY "send match messages" ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND (auth.uid() = m.user_a OR auth.uid() = m.user_b))
);

CREATE POLICY "update match messages read" ON public.messages FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND (auth.uid() = m.user_a OR auth.uid() = m.user_b)));

-- ========== BLOCKS ==========
CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "see own blocks" ON public.blocks FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY "create own blocks" ON public.blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "delete own blocks" ON public.blocks FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- ========== REPORTS ==========
CREATE TYPE public.report_status AS ENUM ('open','reviewed','dismissed');

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_id uuid NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 1000),
  status public.report_status NOT NULL DEFAULT 'open',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reporter_id <> reported_id)
);
CREATE INDEX idx_reports_status ON public.reports(status);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "see own or admin reports" ON public.reports FOR SELECT TO authenticated
USING (auth.uid() = reporter_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "create own reports" ON public.reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "admin manage reports" ON public.reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_reports_updated
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== REALTIME ==========
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.interests REPLICA IDENTITY FULL;
ALTER TABLE public.matches REPLICA IDENTITY FULL;
