
-- Helper: is the current user a participant of a match?
CREATE OR REPLACE FUNCTION public.is_match_participant(_match_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = _match_id
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_match_participant(uuid) TO authenticated;

-- Helper: can current user access a support ticket (owner, assignee, or admin)
CREATE OR REPLACE FUNCTION public.can_access_support_ticket(_ticket_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = _ticket_id
      AND (t.user_id = auth.uid()
           OR t.assigned_to = auth.uid()
           OR public.has_role(auth.uid(), 'admin'::app_role))
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_access_support_ticket(uuid) TO authenticated;

-- Replace permissive realtime.messages policies with strict allowlist
DROP POLICY IF EXISTS "Authenticated realtime access with per-user topic scoping" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can publish to realtime" ON realtime.messages;

CREATE POLICY "Realtime subscribe: scoped allowlist"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    -- Per-user owner-scoped channels
    WHEN realtime.topic() ~ '^(notif|recados|badges)-[0-9a-fA-F-]{36}$'
      THEN right(realtime.topic(), 36)::uuid = auth.uid()
    WHEN realtime.topic() ~ '^profile-self-delete-[0-9a-fA-F-]{36}$'
      THEN right(realtime.topic(), 36)::uuid = auth.uid()
    WHEN realtime.topic() ~ '^notifications-[0-9a-fA-F-]{36}-.+$'
      THEN substring(realtime.topic() from '^notifications-([0-9a-fA-F-]{36})-')::uuid = auth.uid()
    -- Per-match chat channels: only participants
    WHEN realtime.topic() ~ '^chat-[0-9a-fA-F-]{36}$'
      THEN public.is_match_participant(right(realtime.topic(), 36)::uuid)
    -- Per-ticket support channels: only owner/assignee/admin
    WHEN realtime.topic() ~ '^support_ticket_[0-9a-fA-F-]{36}$'
      THEN public.can_access_support_ticket(right(realtime.topic(), 36)::uuid)
    -- Public app-wide channels (broadcast/presence/shared feeds)
    WHEN realtime.topic() IN (
      'devocional-live',
      'message-flags',
      'global-chat',
      'global-chat-typing',
      'global-presence',
      'daily-posts',
      'conv-list',
      'matches-list',
      'support_tickets_list',
      'prayer-requests-live',
      'restricted-words',
      'interests-page',
      'hdr-counters'
    ) THEN true
    ELSE false
  END
);

CREATE POLICY "Realtime publish: scoped allowlist"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN realtime.topic() ~ '^(notif|recados|badges)-[0-9a-fA-F-]{36}$'
      THEN right(realtime.topic(), 36)::uuid = auth.uid()
    WHEN realtime.topic() ~ '^profile-self-delete-[0-9a-fA-F-]{36}$'
      THEN right(realtime.topic(), 36)::uuid = auth.uid()
    WHEN realtime.topic() ~ '^notifications-[0-9a-fA-F-]{36}-.+$'
      THEN substring(realtime.topic() from '^notifications-([0-9a-fA-F-]{36})-')::uuid = auth.uid()
    WHEN realtime.topic() ~ '^chat-[0-9a-fA-F-]{36}$'
      THEN public.is_match_participant(right(realtime.topic(), 36)::uuid)
    WHEN realtime.topic() ~ '^support_ticket_[0-9a-fA-F-]{36}$'
      THEN public.can_access_support_ticket(right(realtime.topic(), 36)::uuid)
    WHEN realtime.topic() IN (
      'devocional-live',
      'message-flags',
      'global-chat',
      'global-chat-typing',
      'global-presence',
      'daily-posts',
      'conv-list',
      'matches-list',
      'support_tickets_list',
      'prayer-requests-live',
      'restricted-words',
      'interests-page',
      'hdr-counters'
    ) THEN true
    ELSE false
  END
);
