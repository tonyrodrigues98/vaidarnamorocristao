CREATE OR REPLACE FUNCTION public.admin_search_users(_q text DEFAULT ''::text, _limit integer DEFAULT 20)
RETURNS TABLE(user_id uuid, full_name text, photo_url text, balance integer, claim_streak integer, top_role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller uuid := auth.uid();
  q text := COALESCE(NULLIF(trim(_q), ''), '');
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF NOT (public.has_role(caller,'admin') OR public.has_role(caller,'super_admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH excluded AS (
    SELECT ur.user_id AS uid FROM public.user_roles ur WHERE ur.role = 'super_admin'
  ),
  roles_agg AS (
    SELECT ur.user_id AS uid,
           string_agg(ur.role::text, ',' ORDER BY ur.role::text) AS roles
    FROM public.user_roles ur
    GROUP BY ur.user_id
  )
  SELECT p.id,
         p.full_name,
         p.photo_url,
         COALESCE(uc.balance, 0)::int,
         COALESCE(uc.claim_streak, 0)::int,
         COALESCE(ra.roles, 'user')
  FROM public.profiles p
  LEFT JOIN public.user_coins uc ON uc.user_id = p.id
  LEFT JOIN roles_agg ra ON ra.uid = p.id
  WHERE p.id NOT IN (SELECT e.uid FROM excluded e)
    AND (
      q = '' OR
      p.full_name ILIKE '%' || q || '%' OR
      p.city ILIKE '%' || q || '%' OR
      p.id::text = q
    )
  ORDER BY (CASE WHEN q = '' THEN COALESCE(uc.updated_at, p.created_at) END) DESC NULLS LAST,
           p.full_name ASC
  LIMIT GREATEST(1, LEAST(_limit, 50));
END;
$function$;