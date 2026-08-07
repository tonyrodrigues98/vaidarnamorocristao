
-- Enums
CREATE TYPE public.support_category AS ENUM ('account','payments','profile','matches','community','technical','security','other');
CREATE TYPE public.support_priority AS ENUM ('low','medium','high','urgent');
CREATE TYPE public.support_status AS ENUM ('open','in_review','awaiting_user','resolved','closed');

-- Tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  category public.support_category NOT NULL DEFAULT 'other',
  priority public.support_priority NOT NULL DEFAULT 'medium',
  status public.support_status NOT NULL DEFAULT 'open',
  assigned_to uuid,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_last_msg ON public.support_tickets(last_message_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own tickets, staff sees all"
ON public.support_tickets FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "users create own tickets"
ON public.support_tickets FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owners update own tickets limited"
ON public.support_tickets FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins manage tickets"
ON public.support_tickets FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Restringir mudança de status/priority/assigned para usuários comuns
CREATE OR REPLACE FUNCTION public.protect_support_ticket_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    NEW.status := OLD.status;
    NEW.priority := OLD.priority;
    NEW.assigned_to := OLD.assigned_to;
    NEW.category := OLD.category;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END$$;
CREATE TRIGGER trg_protect_support_ticket
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.protect_support_ticket_fields();

-- Mensagens
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_staff boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_messages_ticket ON public.support_messages(ticket_id, created_at);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "see ticket messages"
ON public.support_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id
      AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  )
);

CREATE POLICY "send ticket messages"
ON public.support_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id
      AND (
        t.user_id = auth.uid()
        OR public.has_role(auth.uid(),'admin')
        OR public.has_role(auth.uid(),'super_admin')
      )
      AND t.status <> 'closed'
  )
);

-- Atualiza last_message_at e is_staff automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_support_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  NEW.is_staff := public.has_role(NEW.sender_id,'admin') OR public.has_role(NEW.sender_id,'super_admin');
  UPDATE public.support_tickets
    SET last_message_at = now(),
        updated_at = now(),
        status = CASE
          WHEN NEW.is_staff AND status IN ('open','in_review') THEN 'awaiting_user'::public.support_status
          WHEN NOT NEW.is_staff AND status = 'awaiting_user' THEN 'in_review'::public.support_status
          ELSE status
        END
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END$$;
CREATE TRIGGER trg_new_support_message
BEFORE INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.handle_new_support_message();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;

-- Bucket de anexos
INSERT INTO storage.buckets (id, name, public) VALUES ('support-attachments','support-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "support upload own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'support-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "support read own"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin')
  )
);

CREATE POLICY "support delete own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(),'super_admin')
  )
);
