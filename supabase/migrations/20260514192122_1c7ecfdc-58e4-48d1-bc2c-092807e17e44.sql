-- 1. Severity: allow 'amber' in user_admin_warnings
UPDATE public.user_admin_warnings SET severity = 'amber' WHERE severity = 'warning';
ALTER TABLE public.user_admin_warnings DROP CONSTRAINT IF EXISTS user_admin_warnings_severity_check;
ALTER TABLE public.user_admin_warnings
  ADD CONSTRAINT user_admin_warnings_severity_check
  CHECK (severity IN ('amber', 'severe'));

-- 2. Appeals: add kind column ('ban' or 'rejection')
ALTER TABLE public.user_ban_appeals
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'ban';
ALTER TABLE public.user_ban_appeals DROP CONSTRAINT IF EXISTS user_ban_appeals_kind_check;
ALTER TABLE public.user_ban_appeals
  ADD CONSTRAINT user_ban_appeals_kind_check CHECK (kind IN ('ban', 'rejection'));

-- 3. Notify user when profile is rejected
CREATE OR REPLACE FUNCTION public.notify_on_rejection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status::text = 'rejected'
     AND (OLD.status IS NULL OR OLD.status::text IS DISTINCT FROM 'rejected') THEN
    PERFORM public.create_notification(
      NEW.id,
      'profile_rejected',
      'Sua conta foi negada',
      CASE
        WHEN NEW.rejection_reason IS NOT NULL AND length(trim(NEW.rejection_reason)) > 0
          THEN 'Motivo: ' || NEW.rejection_reason
        ELSE 'Revise seu perfil e clique em Verificar Novamente.'
      END,
      '/inicio',
      NULL,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_rejection ON public.profiles;
CREATE TRIGGER trg_notify_on_rejection
AFTER UPDATE OF status ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_on_rejection();

-- 4. Realtime publication
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.user_admin_warnings; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.user_ban_appeals; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.user_admin_requests; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 5. Replica identity full so UPDATE payloads include all columns
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.user_admin_warnings REPLICA IDENTITY FULL;
ALTER TABLE public.user_ban_appeals REPLICA IDENTITY FULL;
ALTER TABLE public.user_admin_requests REPLICA IDENTITY FULL;