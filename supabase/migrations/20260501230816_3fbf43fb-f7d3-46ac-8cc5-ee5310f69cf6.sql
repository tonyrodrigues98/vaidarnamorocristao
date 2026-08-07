-- Add edited_at columns
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;
ALTER TABLE public.global_messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- Allow senders to update only the content of their own messages
DROP POLICY IF EXISTS "update own messages content" ON public.messages;
CREATE POLICY "update own messages content"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "update own global message" ON public.global_messages;
CREATE POLICY "update own global message"
ON public.global_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Trigger to set edited_at automatically when content changes
CREATE OR REPLACE FUNCTION public.set_message_edited_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.edited_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_edited_at ON public.messages;
CREATE TRIGGER trg_messages_edited_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.set_message_edited_at();

DROP TRIGGER IF EXISTS trg_global_messages_edited_at ON public.global_messages;
CREATE TRIGGER trg_global_messages_edited_at
BEFORE UPDATE ON public.global_messages
FOR EACH ROW
EXECUTE FUNCTION public.set_message_edited_at();