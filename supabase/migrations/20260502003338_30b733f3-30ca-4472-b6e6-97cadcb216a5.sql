CREATE OR REPLACE FUNCTION public.unmatch(_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m_user_a uuid;
  m_user_b uuid;
  uid uuid := auth.uid();
BEGIN
  SELECT user_a, user_b INTO m_user_a, m_user_b
  FROM public.matches WHERE id = _match_id;

  IF m_user_a IS NULL THEN
    RAISE EXCEPTION 'match not found';
  END IF;

  IF uid IS NULL OR (uid <> m_user_a AND uid <> m_user_b AND NOT public.has_role(uid, 'admin')) THEN
    RAISE EXCEPTION 'not authorized to unmatch';
  END IF;

  DELETE FROM public.messages WHERE match_id = _match_id;
  DELETE FROM public.interests
    WHERE (sender_id = m_user_a AND receiver_id = m_user_b)
       OR (sender_id = m_user_b AND receiver_id = m_user_a);
  DELETE FROM public.matches WHERE id = _match_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.unmatch(uuid) TO authenticated;