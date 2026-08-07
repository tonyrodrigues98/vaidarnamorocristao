CREATE OR REPLACE FUNCTION public.unignore_anonymous_message(_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  m public.anonymous_messages;
  new_status public.anonymous_message_status;
  has_sent_hint boolean;
  has_requested_hint boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO m FROM public.anonymous_messages WHERE id = _message_id;
  IF NOT FOUND OR m.receiver_id <> uid THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF m.status <> 'ignored' THEN RAISE EXCEPTION 'message is not ignored'; END IF;

  -- Recompute the most appropriate status from existing data.
  IF m.revealed_at IS NOT NULL THEN
    new_status := 'revealed';
  ELSIF m.sender_reveal_requested_at IS NOT NULL OR m.receiver_reveal_requested_at IS NOT NULL THEN
    new_status := 'reveal_requested';
  ELSIF m.reply_text IS NOT NULL THEN
    new_status := 'replied';
  ELSE
    SELECT
      bool_or(sent_at IS NOT NULL),
      bool_or(sent_at IS NULL)
    INTO has_sent_hint, has_requested_hint
    FROM public.anonymous_message_hints
    WHERE message_id = _message_id;

    IF COALESCE(has_sent_hint, false) THEN
      new_status := 'hint_sent';
    ELSIF COALESCE(has_requested_hint, false) THEN
      new_status := 'hint_requested';
    ELSE
      new_status := 'pending';
    END IF;
  END IF;

  UPDATE public.anonymous_messages
    SET status = new_status,
        closed_at = NULL,
        updated_at = now()
   WHERE id = _message_id;
END $$;

GRANT EXECUTE ON FUNCTION public.unignore_anonymous_message(uuid) TO authenticated;