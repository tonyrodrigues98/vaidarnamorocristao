
-- 1) Recriar has_accepted_current_terms como SECURITY INVOKER (mais seguro)
--    A função apenas lê terms_acceptances, que possui RLS própria; não precisa de DEFINER.
CREATE OR REPLACE FUNCTION public.has_accepted_current_terms(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.terms_acceptances
    WHERE user_id = _user_id
      AND version = public.current_terms_version()
  );
$$;

-- 2) Endpoint server-side para checar status do aceite do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_my_terms_status()
RETURNS TABLE (
  current_version text,
  accepted boolean,
  accepted_version text,
  accepted_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  RETURN QUERY
  SELECT
    public.current_terms_version() AS current_version,
    EXISTS (
      SELECT 1 FROM public.terms_acceptances ta
      WHERE ta.user_id = uid AND ta.version = public.current_terms_version()
    ) AS accepted,
    (SELECT ta.version FROM public.terms_acceptances ta
       WHERE ta.user_id = uid
       ORDER BY ta.accepted_at DESC LIMIT 1) AS accepted_version,
    (SELECT ta.accepted_at FROM public.terms_acceptances ta
       WHERE ta.user_id = uid AND ta.version = public.current_terms_version()
       ORDER BY ta.accepted_at DESC LIMIT 1) AS accepted_at;
END;
$$;

-- 3) Travar EXECUTE: revogar de PUBLIC/anon e conceder apenas a authenticated
--    para todas as funções sensíveis SECURITY DEFINER e helpers relacionados.

REVOKE ALL ON FUNCTION public.get_my_terms_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_terms_status() TO authenticated;

REVOKE ALL ON FUNCTION public.has_accepted_current_terms(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_accepted_current_terms(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.current_terms_version() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_terms_version() TO authenticated;

REVOKE ALL ON FUNCTION public.mark_message_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_message_read(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.unmatch(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unmatch(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_primary_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_primary_role(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_admin_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_ids() TO authenticated;

REVOKE ALL ON FUNCTION public.get_hidden_staff_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_hidden_staff_ids() TO authenticated;

REVOKE ALL ON FUNCTION public.get_flagged_message_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_flagged_message_ids() TO authenticated;
