
DROP POLICY IF EXISTS "auth users read restricted words" ON public.restricted_words;
CREATE POLICY "staff read restricted words"
  ON public.restricted_words FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'moderador'::app_role)
    OR has_role(auth.uid(), 'apresentador'::app_role)
  );

CREATE OR REPLACE FUNCTION public.check_text_restricted(_text text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  r record;
  v_w text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _text IS NULL OR length(_text) = 0 THEN
    RETURN NULL;
  END IF;
  v_norm := lower(public.unaccent_safe(_text));
  FOR r IN SELECT word FROM public.restricted_words LOOP
    v_w := lower(public.unaccent_safe(r.word));
    IF v_w IS NULL OR length(btrim(v_w)) = 0 THEN CONTINUE; END IF;
    IF v_norm ~ ('(^|[^[:alpha:]])' || regexp_replace(v_w, '([.*+?^${}()|[\]\\])', '\\\1', 'g') || '([^[:alpha:]]|$)') THEN
      RETURN r.word;
    END IF;
  END LOOP;
  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_text_restricted(text) TO authenticated;

DROP POLICY IF EXISTS "auth read presence" ON public.presence_last_seen;
CREATE POLICY "users read own presence or staff reads all"
  ON public.presence_last_seen FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_staff(auth.uid())
  );

DROP POLICY IF EXISTS "auth read photo settings" ON public.photo_moderation_settings;
CREATE POLICY "admins read photo settings"
  ON public.photo_moderation_settings FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );
