
-- 1) Coluna is_support_agent em user_roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS is_support_agent boolean NOT NULL DEFAULT false;

-- Garantir consistência: só faz sentido para moderador/apresentador (admin/super_admin já têm acesso),
-- mas não restringimos via constraint para flexibilidade futura.

-- 2) Função: is_support_staff
CREATE OR REPLACE FUNCTION public.is_support_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role IN ('admin'::app_role, 'super_admin'::app_role)
        OR (role IN ('moderador'::app_role, 'apresentador'::app_role) AND is_support_agent = true)
      )
  );
$$;

-- 3) RLS support_tickets: substitui "admins manage tickets" por uma versão que inclui agentes habilitados
DROP POLICY IF EXISTS "admins manage tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "users see own tickets, staff sees all" ON public.support_tickets;

CREATE POLICY "support staff manage tickets"
ON public.support_tickets
FOR ALL
TO authenticated
USING (public.is_support_staff(auth.uid()))
WITH CHECK (public.is_support_staff(auth.uid()));

CREATE POLICY "users see own tickets, support staff sees all"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_support_staff(auth.uid()));

-- 4) Função protect_support_ticket_fields: permitir agentes de suporte
CREATE OR REPLACE FUNCTION public.protect_support_ticket_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_support_staff(auth.uid()) THEN
    NEW.status := OLD.status;
    NEW.priority := OLD.priority;
    NEW.assigned_to := OLD.assigned_to;
    NEW.category := OLD.category;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END$function$;

-- 5) Função handle_new_support_message: marcar is_staff para agentes de suporte
CREATE OR REPLACE FUNCTION public.handle_new_support_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.is_staff := public.is_support_staff(NEW.sender_id);
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
END$function$;

-- 6) RLS support_messages: incluir agentes de suporte
DROP POLICY IF EXISTS "see ticket messages" ON public.support_messages;
DROP POLICY IF EXISTS "send ticket messages" ON public.support_messages;

CREATE POLICY "see ticket messages"
ON public.support_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id
      AND (t.user_id = auth.uid() OR public.is_support_staff(auth.uid()))
  )
);

CREATE POLICY "send ticket messages"
ON public.support_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id
      AND (t.user_id = auth.uid() OR public.is_support_staff(auth.uid()))
      AND t.status <> 'closed'::public.support_status
  )
);

-- 7) RLS support_articles já permitem admin; manter.

-- 8) RLS restricted_words: permitir admin além de super_admin
DROP POLICY IF EXISTS "super_admin insert restricted words" ON public.restricted_words;
DROP POLICY IF EXISTS "super_admin update restricted words" ON public.restricted_words;
DROP POLICY IF EXISTS "super_admin delete restricted words" ON public.restricted_words;

CREATE POLICY "admins insert restricted words"
ON public.restricted_words
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "admins update restricted words"
ON public.restricted_words
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "admins delete restricted words"
ON public.restricted_words
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);
