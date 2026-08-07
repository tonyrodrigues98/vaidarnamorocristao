CREATE OR REPLACE FUNCTION public.grab_rarity_rank(_r text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $function$
  SELECT CASE lower(COALESCE(_r,'common'))
    WHEN 'legendary' THEN 4
    WHEN 'epic' THEN 3
    WHEN 'rare' THEN 2
    ELSE 1 END
$function$;