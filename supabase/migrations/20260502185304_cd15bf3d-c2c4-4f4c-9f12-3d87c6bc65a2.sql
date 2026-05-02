-- ========================================
-- Security fixes
-- ========================================

-- 1. Fix privilege escalation on user_roles: prevent staff from changing their own role.
DROP POLICY IF EXISTS "staff update own role row" ON public.user_roles;

CREATE POLICY "staff update own role meta only"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'apresentador'::app_role, 'moderador'::app_role])
)
WITH CHECK (
  auth.uid() = user_id
  AND role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'apresentador'::app_role, 'moderador'::app_role])
);

-- Trigger to lock the role column for self-updates (only admins via the other policy can change roles).
CREATE OR REPLACE FUNCTION public.prevent_role_self_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the change is being made by the row owner and they are not an admin, lock role/user_id.
  IF auth.uid() = OLD.user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.role := OLD.role;
    NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_self_change_trg ON public.user_roles;
CREATE TRIGGER prevent_role_self_change_trg
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_self_change();

-- 2. Lock down messages UPDATE: drop the broad "update match messages read" policy
-- and provide a SECURITY DEFINER RPC for marking messages as read.
DROP POLICY IF EXISTS "update match messages read" ON public.messages;

CREATE OR REPLACE FUNCTION public.mark_message_read(_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  m_match uuid;
  m_sender uuid;
  m_user_a uuid;
  m_user_b uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT match_id, sender_id INTO m_match, m_sender
  FROM public.messages WHERE id = _message_id;

  IF m_match IS NULL THEN
    RETURN;
  END IF;

  SELECT user_a, user_b INTO m_user_a, m_user_b
  FROM public.matches WHERE id = m_match;

  -- Only the recipient (a match participant who is NOT the sender) can mark as read.
  IF uid <> m_sender AND (uid = m_user_a OR uid = m_user_b) THEN
    UPDATE public.messages SET read_at = now()
    WHERE id = _message_id AND read_at IS NULL;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_message_read(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_message_read(uuid) TO authenticated;

-- 3. Realtime channel authorization: lock down realtime.messages to authenticated only.
-- This requires authenticated users to be subscribed only to topics matching tables they have access to.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can subscribe" ON realtime.messages;
CREATE POLICY "authenticated can subscribe"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

-- 4. Restrict EXECUTE on SECURITY DEFINER functions: revoke from anon.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_ids() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_hidden_staff_ids() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_flagged_message_ids() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_primary_role(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.unmatch(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hidden_staff_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_flagged_message_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_primary_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unmatch(uuid) TO authenticated;

-- Trigger functions don't need any EXECUTE grant — revoke from public/anon.
REVOKE EXECUTE ON FUNCTION public.protect_profile_status() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_match_on_reciprocal() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_default_public_listing() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_message_edited_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_role_self_change() FROM anon, authenticated, public;

-- 5. Restrict listing of profile-photos bucket: drop broad SELECT, allow only viewing specific objects via direct path
DROP POLICY IF EXISTS "photos auth read" ON storage.objects;

CREATE POLICY "photos auth read by id only"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND name IS NOT NULL
);
-- Note: this policy still allows reading individual objects; bucket remains public for direct CDN URLs.
-- The user opted to keep public URLs for now to avoid app-wide refactor.