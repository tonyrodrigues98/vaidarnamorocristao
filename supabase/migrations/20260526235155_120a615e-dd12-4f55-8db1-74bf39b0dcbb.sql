CREATE OR REPLACE FUNCTION public.send_anonymous_hint_text(
  _message_id uuid,
  _category anonymous_hint_category,
  _text text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  m public.anonymous_messages;
  pending_hint_id uuid;
  clean_text text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  clean_text := btrim(coalesce(_text, ''));
  IF length(clean_text) < 4 OR length(clean_text) > 140 THEN
    RAISE EXCEPTION 'invalid hint text length';
  END IF;

  SELECT * INTO m FROM public.anonymous_messages WHERE id = _message_id;
  IF NOT FOUND OR m.sender_id <> uid THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF m.status <> 'hint_requested' THEN RAISE EXCEPTION 'no hint requested'; END IF;

  SELECT id INTO pending_hint_id FROM public.anonymous_message_hints
    WHERE message_id = _message_id AND sent_at IS NULL
    ORDER BY requested_at DESC LIMIT 1;
  IF pending_hint_id IS NULL THEN RAISE EXCEPTION 'no pending hint'; END IF;

  UPDATE public.anonymous_message_hints
    SET category = _category, hint_text = clean_text, sent_at = now()
   WHERE id = pending_hint_id;

  UPDATE public.anonymous_messages
    SET status = 'hint_sent', updated_at = now()
   WHERE id = _message_id;

  PERFORM public.create_notification(
    m.receiver_id, 'anonymous_hint_sent',
    'Você recebeu uma dica ✨', clean_text,
    '/recados', NULL, _message_id);
END
$function$;

GRANT EXECUTE ON FUNCTION public.send_anonymous_hint_text(uuid, anonymous_hint_category, text) TO authenticated;