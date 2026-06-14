
CREATE TABLE public.pet_confessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  category text NOT NULL DEFAULT 'fofo',
  effect_kind text,         -- feed | hygiene | play | affection | energy | null
  effect_delta integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pet_confessions TO authenticated;
GRANT ALL ON public.pet_confessions TO service_role;
ALTER TABLE public.pet_confessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "petconf_read" ON public.pet_confessions FOR SELECT TO authenticated USING (active);

CREATE TABLE public.user_pet_confession_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confession_id uuid NOT NULL REFERENCES public.pet_confessions(id) ON DELETE CASCADE,
  shown_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX upcl_user_shown_idx ON public.user_pet_confession_log(user_id, shown_at DESC);
GRANT SELECT, INSERT ON public.user_pet_confession_log TO authenticated;
GRANT ALL ON public.user_pet_confession_log TO service_role;
ALTER TABLE public.user_pet_confession_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upcl_read_own" ON public.user_pet_confession_log FOR SELECT TO authenticated USING (user_id = auth.uid());
-- inserts via RPC SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.get_next_pet_confession()
RETURNS TABLE (id uuid, text text, category text, effect_kind text, effect_delta integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row record;
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;

  SELECT * INTO _row FROM public.pet_confessions
   WHERE active
     AND id NOT IN (
       SELECT confession_id FROM public.user_pet_confession_log
       WHERE user_id = _uid ORDER BY shown_at DESC LIMIT 50
     )
   ORDER BY random() LIMIT 1;

  IF NOT FOUND THEN
    -- fallback: qualquer ativa
    SELECT * INTO _row FROM public.pet_confessions WHERE active ORDER BY random() LIMIT 1;
    IF NOT FOUND THEN RETURN; END IF;
  END IF;

  INSERT INTO public.user_pet_confession_log (user_id, confession_id)
  VALUES (_uid, _row.id);

  RETURN QUERY SELECT _row.id, _row.text, _row.category, _row.effect_kind, _row.effect_delta;
END $$;

-- Sonho com match: 1 pretendente do sexo oposto, faixa etária da preferência
CREATE OR REPLACE FUNCTION public.get_pet_dream_match()
RETURNS TABLE (id uuid, full_name text, photo_url text, city text, state text, age integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _uid uuid := auth.uid();
  _me record;
  _prefs record;
  _target_sex sex_type;
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;

  SELECT sex, age, state INTO _me FROM public.profiles WHERE id = _uid;
  IF _me.sex IS NULL THEN RETURN; END IF;
  _target_sex := CASE _me.sex WHEN 'male' THEN 'female'::sex_type ELSE 'male'::sex_type END;

  SELECT age_min, age_max INTO _prefs FROM public.profile_preferences WHERE user_id = _uid;

  RETURN QUERY
    SELECT p.id, p.full_name, p.photo_url, p.city, p.state, p.age
      FROM public.profiles p
     WHERE p.id <> _uid
       AND p.status = 'approved'
       AND p.deactivated_at IS NULL
       AND p.banned_at IS NULL
       AND p.sex = _target_sex
       AND (COALESCE(_prefs.age_min, 18) <= p.age)
       AND (COALESCE(_prefs.age_max, 99) >= p.age)
       AND NOT EXISTS (
         SELECT 1 FROM public.blocks b
          WHERE (b.blocker_id = _uid AND b.blocked_id = p.id)
             OR (b.blocker_id = p.id AND b.blocked_id = _uid)
       )
     ORDER BY random()
     LIMIT 1;
END $$;
