CREATE OR REPLACE FUNCTION public.get_next_pet_confession()
 RETURNS TABLE(id uuid, text text, category text, effect_kind text, effect_delta integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _row record;
BEGIN
  IF _uid IS NOT NULL THEN
    SELECT * INTO _row FROM public.pet_confessions
     WHERE active
       AND id NOT IN (
         SELECT confession_id FROM public.user_pet_confession_log
         WHERE user_id = _uid ORDER BY shown_at DESC LIMIT 50
       )
     ORDER BY random() LIMIT 1;
  END IF;

  IF _row IS NULL THEN
    SELECT * INTO _row FROM public.pet_confessions WHERE active ORDER BY random() LIMIT 1;
    IF _row IS NULL THEN RETURN; END IF;
  END IF;

  IF _uid IS NOT NULL THEN
    INSERT INTO public.user_pet_confession_log (user_id, confession_id)
    VALUES (_uid, _row.id);
  END IF;

  RETURN QUERY SELECT _row.id, _row.text, _row.category, _row.effect_kind, _row.effect_delta;
END $function$;