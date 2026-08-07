
-- Block destructive admin actions against super_admins
CREATE OR REPLACE FUNCTION public.admin_ban_user(_user_id uuid, _reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _reason IS NULL OR length(trim(_reason)) = 0 THEN
    RAISE EXCEPTION 'reason required';
  END IF;
  IF public.has_role(_user_id,'super_admin') THEN
    RAISE EXCEPTION 'super_admin cannot be banned';
  END IF;
  UPDATE public.profiles
    SET status = 'banned',
        banned_at = now(),
        banned_reason = _reason,
        banned_by = auth.uid(),
        updated_at = now()
  WHERE id = _user_id;
  PERFORM public.create_notification(
    _user_id, 'ban',
    'Sua conta foi suspensa',
    LEFT(_reason, 200),
    '/inicio', auth.uid(), _user_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_hard_delete_user(_user_id uuid, _reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;
  IF public.has_role(_user_id,'super_admin') THEN
    RAISE EXCEPTION 'super_admin cannot be deleted';
  END IF;

  DELETE FROM public.messages WHERE sender_id = _user_id;
  DELETE FROM public.matches WHERE user_a = _user_id OR user_b = _user_id;
  DELETE FROM public.interests WHERE sender_id = _user_id OR receiver_id = _user_id;
  DELETE FROM public.blocks WHERE blocker_id = _user_id OR blocked_id = _user_id;
  DELETE FROM public.profile_views WHERE viewer_id = _user_id OR viewed_id = _user_id;
  DELETE FROM public.profile_photos WHERE user_id = _user_id;
  DELETE FROM public.profile_advanced WHERE user_id = _user_id;
  DELETE FROM public.profile_preferences WHERE user_id = _user_id;
  DELETE FROM public.devotional_comment_likes WHERE user_id = _user_id;
  DELETE FROM public.devotional_comment_reports WHERE reporter_id = _user_id;
  DELETE FROM public.devotional_comments WHERE user_id = _user_id;
  DELETE FROM public.devotional_prayed WHERE user_id = _user_id;
  DELETE FROM public.devotional_reactions WHERE user_id = _user_id;
  DELETE FROM public.prayer_request_prayed WHERE user_id = _user_id;
  DELETE FROM public.prayer_request_reports WHERE reporter_id = _user_id;
  DELETE FROM public.prayer_requests WHERE user_id = _user_id;
  DELETE FROM public.global_messages WHERE sender_id = _user_id;
  DELETE FROM public.message_flags WHERE flagged_by = _user_id;
  DELETE FROM public.notifications WHERE user_id = _user_id;
  DELETE FROM public.reactivation_reminders WHERE user_id = _user_id;
  DELETE FROM public.reports WHERE reporter_id = _user_id OR reported_id = _user_id;
  DELETE FROM public.user_admin_requests WHERE user_id = _user_id;
  DELETE FROM public.user_admin_warnings WHERE user_id = _user_id;
  DELETE FROM public.user_ban_appeals WHERE user_id = _user_id;
  DELETE FROM public.photo_moderation_log WHERE user_id = _user_id;
  DELETE FROM public.photo_moderation_queue WHERE user_id = _user_id;
  DELETE FROM public.terms_acceptances WHERE user_id = _user_id;
  DELETE FROM public.user_badges WHERE user_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
  -- Also remove auth user so the session is invalidated and they are signed out
  DELETE FROM auth.users WHERE id = _user_id;
END;
$function$;

-- Trigger: block status -> banned/rejected on super_admin profiles (covers UI direct updates)
CREATE OR REPLACE FUNCTION public.protect_super_admin_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status::text IN ('banned','rejected')
     AND (OLD.status IS NULL OR OLD.status::text IS DISTINCT FROM NEW.status::text)
     AND public.has_role(NEW.id,'super_admin') THEN
    RAISE EXCEPTION 'super_admin cannot be banned or rejected';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS protect_super_admin_status_trg ON public.profiles;
CREATE TRIGGER protect_super_admin_status_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_status();
