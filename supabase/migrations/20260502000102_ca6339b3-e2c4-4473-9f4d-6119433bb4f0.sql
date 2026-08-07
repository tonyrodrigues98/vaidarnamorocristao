ALTER TABLE public.global_messages ADD COLUMN IF NOT EXISTS pinned_at timestamptz;

CREATE INDEX IF NOT EXISTS global_messages_pinned_idx ON public.global_messages (pinned_at) WHERE pinned_at IS NOT NULL;

CREATE POLICY "admins pin global messages"
ON public.global_messages
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));