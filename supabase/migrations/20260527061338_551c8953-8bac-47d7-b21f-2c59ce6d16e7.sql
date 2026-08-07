-- Enable RLS on realtime.messages to authorize channel subscriptions
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Anonymous users cannot subscribe to any realtime channel
-- Authenticated users can subscribe to channels, with per-user topics restricted to their owner.
-- Underlying postgres_changes payloads remain filtered by each source table's RLS.
CREATE POLICY "Authenticated realtime access with per-user topic scoping"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() ~ '^(notif|notifications|recados|badges|profile-self-delete)-[0-9a-fA-F-]{36}$'
      THEN split_part(realtime.topic(), '-', array_length(string_to_array(realtime.topic(), '-'), 1) - 4 + 1) IS NOT NULL
       AND right(realtime.topic(), 36)::uuid = auth.uid()
    ELSE true
  END
);

CREATE POLICY "Authenticated can publish to realtime"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN realtime.topic() ~ '^(notif|notifications|recados|badges|profile-self-delete)-[0-9a-fA-F-]{36}$'
      THEN right(realtime.topic(), 36)::uuid = auth.uid()
    ELSE true
  END
);