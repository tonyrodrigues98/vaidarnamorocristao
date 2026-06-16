CREATE OR REPLACE FUNCTION public.medal_for_prestige(_level integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $function$
  SELECT CASE
    WHEN _level >= 10 THEN 'diamond'
    WHEN _level >= 5  THEN 'gold'
    WHEN _level >= 3  THEN 'silver'
    WHEN _level >= 1  THEN 'bronze'
    ELSE NULL
  END
$function$;