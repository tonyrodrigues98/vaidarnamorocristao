
-- ==== 1) Tighten EXECUTE on SECURITY DEFINER functions ====
-- Revoke from PUBLIC/anon on every public function, then re-grant to
-- authenticated only for functions intentionally called via RPC or RLS.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated',
                   r.proname, r.args);
  END LOOP;
END $$;

-- Re-grant EXECUTE to authenticated for functions actually used by
-- the app (RPC) or by RLS policies / inner SECURITY DEFINER chains.
GRANT EXECUTE ON FUNCTION public.admin_ban_user(uuid, text)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unban_user(uuid)                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hard_delete_user(uuid, text)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user_photo(uuid, uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_badge(uuid, text)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_contributor_badge(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion()                TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deactivation()           TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_reactivation()           TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deletion(text)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hidden_staff_ids()                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_missions()                        TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_terms_status()                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_prayer_streak(uuid)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_streak(uuid)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_article_views(text)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read()            TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_message_read(uuid)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_user_badges(uuid)              TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_my_activity()                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.unmatch(uuid)                            TO authenticated;
-- Helpers used inside RLS policies / other SECURITY DEFINER bodies
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role)                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid)                           TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_support_staff(uuid)                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_accepted_current_terms(uuid)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_terms_version()                  TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.unaccent_safe(text)                      TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.count_advanced_sections(uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_ids()                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_flagged_message_ids()                TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_primary_role(uuid)              TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, uuid, uuid) TO authenticated;

-- ==== 2) Extra super_admin protections ====

-- Block role downgrade of super_admin via direct UPDATE on user_roles
CREATE OR REPLACE FUNCTION public.protect_super_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'super_admin'::app_role THEN
      RAISE EXCEPTION 'super_admin role cannot be removed';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.role = 'super_admin'::app_role
     AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'super_admin role cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_super_admin_role ON public.user_roles;
CREATE TRIGGER trg_protect_super_admin_role
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_role();

-- Block hard DELETE of a super_admin profile (DB-level guarantee)
CREATE OR REPLACE FUNCTION public.protect_super_admin_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(OLD.id, 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'super_admin cannot be deleted';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_super_admin_delete ON public.profiles;
CREATE TRIGGER trg_protect_super_admin_delete
BEFORE DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_delete();

-- Tighten EXECUTE for the new triggers
REVOKE ALL ON FUNCTION public.protect_super_admin_role()   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_super_admin_delete() FROM PUBLIC, anon, authenticated;

-- ==== 3) "Verificar Novamente" RPC ====
-- Reseta o perfil do próprio usuário rejeitado para 'pending' e
-- registra o pedido em user_ban_appeals (kind='rejection') para
-- que o admin tenha contexto na aba Rejeitados.
CREATE OR REPLACE FUNCTION public.request_reverification(_message text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  v_status text;
  v_appeal_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _message IS NULL OR length(trim(_message)) < 10 THEN
    RAISE EXCEPTION 'message too short';
  END IF;

  SELECT status::text INTO v_status FROM public.profiles WHERE id = uid;
  IF v_status IS DISTINCT FROM 'rejected' THEN
    RAISE EXCEPTION 'profile is not rejected';
  END IF;

  -- Bypass protect_profile_status (que limita mudança de status a admins)
  -- usando UPDATE direto em SECURITY DEFINER.
  UPDATE public.profiles
     SET status = 'pending'::profile_status,
         rejection_reason = NULL,
         updated_at = now()
   WHERE id = uid;

  INSERT INTO public.user_ban_appeals (user_id, appeal_text, kind)
  VALUES (uid, trim(_message), 'rejection')
  RETURNING id INTO v_appeal_id;

  -- Notifica admins
  INSERT INTO public.notifications (user_id, type, title, body, link, actor_id, entity_id)
  SELECT a, 'reverification_request',
         'Pedido de nova análise',
         'Um usuário rejeitado pediu reanálise do perfil.',
         '/admin', uid, uid
    FROM public.get_admin_ids() a;

  RETURN v_appeal_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_reverification(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_reverification(text) TO authenticated;

-- O trigger protect_profile_status precisa permitir o caminho do
-- SECURITY DEFINER acima. Como ele só impede mudanças de status feitas
-- por não-admins (NEW.status := OLD.status), e o SECURITY DEFINER roda
-- como postgres, o has_role(auth.uid()) dentro dele continua falso. Por
-- isso ajustamos o trigger para também aceitar quando a sessão atual é
-- a função request_reverification (current_setting flag).
CREATE OR REPLACE FUNCTION public.protect_profile_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('app.allow_self_status_reset', true) = 'on' THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_reverification(_message text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  v_status text;
  v_appeal_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _message IS NULL OR length(trim(_message)) < 10 THEN
    RAISE EXCEPTION 'message too short';
  END IF;

  SELECT status::text INTO v_status FROM public.profiles WHERE id = uid;
  IF v_status IS DISTINCT FROM 'rejected' THEN
    RAISE EXCEPTION 'profile is not rejected';
  END IF;

  PERFORM set_config('app.allow_self_status_reset', 'on', true);
  UPDATE public.profiles
     SET status = 'pending'::profile_status,
         rejection_reason = NULL,
         updated_at = now()
   WHERE id = uid;
  PERFORM set_config('app.allow_self_status_reset', 'off', true);

  INSERT INTO public.user_ban_appeals (user_id, appeal_text, kind)
  VALUES (uid, trim(_message), 'rejection')
  RETURNING id INTO v_appeal_id;

  INSERT INTO public.notifications (user_id, type, title, body, link, actor_id, entity_id)
  SELECT a, 'reverification_request',
         'Pedido de nova análise',
         'Um usuário rejeitado pediu reanálise do perfil.',
         '/admin', uid, uid
    FROM public.get_admin_ids() a
   WHERE a <> uid;

  RETURN v_appeal_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_reverification(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_reverification(text) TO authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_status() FROM PUBLIC, anon, authenticated;
