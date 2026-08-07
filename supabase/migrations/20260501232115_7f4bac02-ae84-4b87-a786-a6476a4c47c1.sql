-- Private messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid NULL
  REFERENCES public.messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id
  ON public.messages(reply_to_id);

-- Global community messages
ALTER TABLE public.global_messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid NULL
  REFERENCES public.global_messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_global_messages_reply_to_id
  ON public.global_messages(reply_to_id);