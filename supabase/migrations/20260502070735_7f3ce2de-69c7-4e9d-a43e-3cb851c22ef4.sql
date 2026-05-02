CREATE OR REPLACE FUNCTION public.get_hidden_staff_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked_roles AS (
    SELECT
      user_id,
      public_listing,
      row_number() OVER (
        PARTITION BY user_id
        ORDER BY CASE role
          WHEN 'super_admin'::app_role THEN 1
          WHEN 'admin'::app_role THEN 2
          WHEN 'apresentador'::app_role THEN 3
          WHEN 'moderador'::app_role THEN 4
          WHEN 'user'::app_role THEN 5
        END
      ) AS rn
    FROM public.user_roles
    WHERE role IN ('super_admin'::app_role, 'admin'::app_role, 'apresentador'::app_role, 'moderador'::app_role)
  )
  SELECT user_id
  FROM ranked_roles
  WHERE rn = 1
    AND public_listing = false;
$$;