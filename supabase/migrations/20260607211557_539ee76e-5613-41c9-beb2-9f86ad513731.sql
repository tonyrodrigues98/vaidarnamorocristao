
DROP POLICY IF EXISTS "Realtime publish: scoped allowlist" ON realtime.messages;
DROP POLICY IF EXISTS "Realtime subscribe: scoped allowlist" ON realtime.messages;

CREATE POLICY "Realtime publish: scoped allowlist"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN (realtime.topic() ~ '^(notif|recados|badges)-[0-9a-fA-F-]{36}$') THEN ((right(realtime.topic(), 36))::uuid = auth.uid())
    WHEN (realtime.topic() ~ '^profile-self-delete-[0-9a-fA-F-]{36}$') THEN ((right(realtime.topic(), 36))::uuid = auth.uid())
    WHEN (realtime.topic() ~ '^notifications-[0-9a-fA-F-]{36}-.+$') THEN ((substring(realtime.topic(), '^notifications-([0-9a-fA-F-]{36})-'))::uuid = auth.uid())
    WHEN (realtime.topic() ~ '^chat-[0-9a-fA-F-]{36}$') THEN is_match_participant((right(realtime.topic(), 36))::uuid)
    WHEN (realtime.topic() ~ '^support_ticket_[0-9a-fA-F-]{36}$') THEN can_access_support_ticket((right(realtime.topic(), 36))::uuid)
    WHEN (realtime.topic() = ANY (ARRAY['devocional-live','global-chat','global-chat-typing','global-presence','daily-posts','prayer-requests-live'])) THEN true
    ELSE false
  END
);

CREATE POLICY "Realtime subscribe: scoped allowlist"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN (realtime.topic() ~ '^(notif|recados|badges)-[0-9a-fA-F-]{36}$') THEN ((right(realtime.topic(), 36))::uuid = auth.uid())
    WHEN (realtime.topic() ~ '^profile-self-delete-[0-9a-fA-F-]{36}$') THEN ((right(realtime.topic(), 36))::uuid = auth.uid())
    WHEN (realtime.topic() ~ '^notifications-[0-9a-fA-F-]{36}-.+$') THEN ((substring(realtime.topic(), '^notifications-([0-9a-fA-F-]{36})-'))::uuid = auth.uid())
    WHEN (realtime.topic() ~ '^chat-[0-9a-fA-F-]{36}$') THEN is_match_participant((right(realtime.topic(), 36))::uuid)
    WHEN (realtime.topic() ~ '^support_ticket_[0-9a-fA-F-]{36}$') THEN can_access_support_ticket((right(realtime.topic(), 36))::uuid)
    WHEN (realtime.topic() = ANY (ARRAY['devocional-live','global-chat','global-chat-typing','global-presence','daily-posts','prayer-requests-live'])) THEN true
    ELSE false
  END
);

COMMENT ON TABLE public.push_queue IS 'Server-only queue. RLS enabled with no policies by design; only SECURITY DEFINER triggers and service_role may read/write.';
