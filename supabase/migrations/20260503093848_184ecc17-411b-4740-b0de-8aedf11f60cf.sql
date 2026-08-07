
-- 1. Remove the overly broad SELECT policy on messages that allowed any authenticated user
-- to receive realtime change events for ALL messages (private chats leaked).
DROP POLICY IF EXISTS "authenticated can subscribe" ON public.messages;

-- 2. Tighten profiles UPDATE: prevent users from self-approving by changing status.
-- The existing protect_profile_status trigger already resets status/rejection_reason
-- for non-admins, but the RLS policy still allowed the UPDATE through. We replace
-- the UPDATE policy with a column-aware version using a WITH CHECK that disallows
-- changing status/rejection_reason unless admin. The trigger remains as defense in depth.
DROP POLICY IF EXISTS "update own profile fields" ON public.profiles;
CREATE POLICY "update own profile fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      status = (SELECT p.status FROM public.profiles p WHERE p.id = profiles.id)
      AND rejection_reason IS NOT DISTINCT FROM (SELECT p.rejection_reason FROM public.profiles p WHERE p.id = profiles.id)
    )
  )
);

-- 3. Remove tables from realtime publication that should not broadcast to all subscribers.
-- message_flags: moderation data; profile_views: privacy-sensitive viewer info.
ALTER PUBLICATION supabase_realtime DROP TABLE public.message_flags;
ALTER PUBLICATION supabase_realtime DROP TABLE public.profile_views;

-- 4. Revoke anon execute on the SECURITY DEFINER RPC; only authenticated users should mark reads.
REVOKE EXECUTE ON FUNCTION public.mark_message_read(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.mark_message_read(uuid) TO authenticated;
