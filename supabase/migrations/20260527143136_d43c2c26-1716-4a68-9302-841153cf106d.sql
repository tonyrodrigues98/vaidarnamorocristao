
-- 1. Add extras_balance column
ALTER TABLE public.anonymous_message_settings
  ADD COLUMN IF NOT EXISTS extras_balance integer NOT NULL DEFAULT 0;

-- 2. Quota function (used by UI)
CREATE OR REPLACE FUNCTION public.get_anonymous_quota()
RETURNS TABLE(daily_free int, daily_used int, free_remaining int, extras int, total_remaining int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_used int := 0;
  v_extras int := 0;
  v_free int := 3;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT count(*) INTO v_used FROM public.anonymous_messages
    WHERE sender_id = uid AND created_at >= (now() - interval '24 hours');
  SELECT COALESCE(extras_balance, 0) INTO v_extras
    FROM public.anonymous_message_settings WHERE user_id = uid;
  IF v_extras IS NULL THEN v_extras := 0; END IF;
  RETURN QUERY SELECT
    v_free,
    v_used,
    GREATEST(0, v_free - v_used),
    v_extras,
    GREATEST(0, v_free - v_used) + v_extras;
END $$;

GRANT EXECUTE ON FUNCTION public.get_anonymous_quota() TO authenticated;

-- 3. Buy extra function (spends 10 coins, increments extras_balance)
CREATE OR REPLACE FUNCTION public.buy_anonymous_extra()
RETURNS TABLE(extras int, coin_balance int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_cost int := 10;
  v_coins int;
  v_extras int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  -- ensure rows exist
  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100)
    ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.anonymous_message_settings (user_id, accept_anonymous)
    VALUES (uid, true) ON CONFLICT (user_id) DO NOTHING;

  -- spend
  v_coins := public.spend_coin(v_cost);

  UPDATE public.anonymous_message_settings
     SET extras_balance = COALESCE(extras_balance, 0) + 1,
         updated_at = now()
   WHERE user_id = uid
  RETURNING extras_balance INTO v_extras;

  RETURN QUERY SELECT v_extras, v_coins;
END $$;

GRANT EXECUTE ON FUNCTION public.buy_anonymous_extra() TO authenticated;

-- 4. Update send_anonymous_message: consume extras after the 3 daily free
CREATE OR REPLACE FUNCTION public.send_anonymous_message(_receiver_id uuid, _content text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  sender_sex text; receiver_sex text; receiver_status text;
  receiver_accepts boolean;
  active_count int; daily_count int;
  last_closed timestamptz; new_id uuid;
  v_extras int := 0;
  v_use_extra boolean := false;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF uid = _receiver_id THEN RAISE EXCEPTION 'cannot send to yourself'; END IF;
  IF _content IS NULL OR length(trim(_content)) = 0 THEN RAISE EXCEPTION 'message required'; END IF;
  IF length(_content) > 280 THEN RAISE EXCEPTION 'message too long'; END IF;
  PERFORM public.anon_check_restricted(_content);

  SELECT sex::text INTO sender_sex FROM public.profiles
   WHERE id = uid AND status='approved' AND deactivated_at IS NULL AND deletion_requested_at IS NULL AND is_anonymized=false;
  IF sender_sex IS NULL THEN RAISE EXCEPTION 'sender not approved'; END IF;

  SELECT sex::text, status::text INTO receiver_sex, receiver_status FROM public.profiles WHERE id = _receiver_id;
  IF receiver_status IS DISTINCT FROM 'approved' THEN RAISE EXCEPTION 'receiver not available'; END IF;
  IF receiver_sex IS NULL OR receiver_sex = sender_sex THEN RAISE EXCEPTION 'receiver must be opposite sex'; END IF;

  IF EXISTS (SELECT 1 FROM public.blocks WHERE (blocker_id=_receiver_id AND blocked_id=uid) OR (blocker_id=uid AND blocked_id=_receiver_id)) THEN
    RAISE EXCEPTION 'blocked';
  END IF;

  SELECT COALESCE(accept_anonymous, true) INTO receiver_accepts
    FROM public.anonymous_message_settings WHERE user_id=_receiver_id;
  IF receiver_accepts IS NULL THEN receiver_accepts := true; END IF;
  IF NOT receiver_accepts THEN RAISE EXCEPTION 'receiver opted out'; END IF;

  SELECT count(*) INTO active_count FROM public.anonymous_messages
    WHERE sender_id=uid AND receiver_id=_receiver_id
      AND status NOT IN ('revealed','ignored','reported','expired');
  IF active_count > 0 THEN RAISE EXCEPTION 'active message already exists with this user'; END IF;

  SELECT max(closed_at) INTO last_closed FROM public.anonymous_messages
    WHERE sender_id=uid AND receiver_id=_receiver_id
      AND status IN ('ignored','reported','expired') AND closed_at IS NOT NULL;
  IF last_closed IS NOT NULL AND last_closed > now() - interval '7 days' THEN
    RAISE EXCEPTION 'cooldown active' USING ERRCODE='check_violation';
  END IF;

  SELECT count(*) INTO daily_count FROM public.anonymous_messages
    WHERE sender_id=uid AND created_at >= (now() - interval '24 hours');

  IF daily_count >= 3 THEN
    SELECT COALESCE(extras_balance, 0) INTO v_extras
      FROM public.anonymous_message_settings WHERE user_id = uid;
    IF v_extras IS NULL OR v_extras <= 0 THEN
      RAISE EXCEPTION 'daily limit reached';
    END IF;
    v_use_extra := true;
  END IF;

  INSERT INTO public.anonymous_messages (sender_id, receiver_id, content)
  VALUES (uid, _receiver_id, _content) RETURNING id INTO new_id;

  IF v_use_extra THEN
    UPDATE public.anonymous_message_settings
       SET extras_balance = GREATEST(0, COALESCE(extras_balance, 0) - 1),
           updated_at = now()
     WHERE user_id = uid;
  END IF;

  PERFORM public.create_notification(
    _receiver_id, 'anonymous_message',
    'Você recebeu um recado anônimo 👀',
    'Alguém deixou um recado misterioso pra você.',
    '/recados', NULL, new_id);
  RETURN new_id;
END $function$;

-- 5. Update get_anonymous_cooldown: don't return daily_limit if extras available
CREATE OR REPLACE FUNCTION public.get_anonymous_cooldown(_receiver_id uuid)
 RETURNS TABLE(can_send boolean, seconds_remaining integer, reason text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid();
  last_closed timestamptz; active_count int;
  receiver_accepts boolean; daily_count int;
  sender_sex text; receiver_sex text;
  v_extras int := 0;
BEGIN
  IF uid IS NULL THEN RETURN QUERY SELECT false, 0, 'not authenticated'; RETURN; END IF;
  SELECT sex::text INTO sender_sex FROM public.profiles WHERE id=uid AND status='approved';
  SELECT sex::text INTO receiver_sex FROM public.profiles WHERE id=_receiver_id AND status='approved';
  IF sender_sex IS NULL OR receiver_sex IS NULL OR sender_sex = receiver_sex THEN
    RETURN QUERY SELECT false, 0, 'incompatible'; RETURN;
  END IF;
  SELECT COALESCE(accept_anonymous, true) INTO receiver_accepts
    FROM public.anonymous_message_settings WHERE user_id=_receiver_id;
  IF receiver_accepts IS NULL THEN receiver_accepts := true; END IF;
  IF NOT receiver_accepts THEN RETURN QUERY SELECT false, 0, 'opted_out'; RETURN; END IF;

  SELECT count(*) INTO active_count FROM public.anonymous_messages
    WHERE sender_id=uid AND receiver_id=_receiver_id
      AND status NOT IN ('revealed','ignored','reported','expired');
  IF active_count > 0 THEN RETURN QUERY SELECT false, 0, 'active_exists'; RETURN; END IF;

  SELECT count(*) INTO daily_count FROM public.anonymous_messages
    WHERE sender_id=uid AND created_at >= (now() - interval '24 hours');

  IF daily_count >= 3 THEN
    SELECT COALESCE(extras_balance, 0) INTO v_extras
      FROM public.anonymous_message_settings WHERE user_id = uid;
    IF v_extras IS NULL OR v_extras <= 0 THEN
      RETURN QUERY SELECT false, 0, 'daily_limit'; RETURN;
    END IF;
  END IF;

  SELECT max(closed_at) INTO last_closed FROM public.anonymous_messages
    WHERE sender_id=uid AND receiver_id=_receiver_id
      AND status IN ('ignored','reported','expired') AND closed_at IS NOT NULL;
  IF last_closed IS NOT NULL AND last_closed > now() - interval '7 days' THEN
    RETURN QUERY SELECT false, EXTRACT(EPOCH FROM ((last_closed + interval '7 days') - now()))::int, 'cooldown'; RETURN;
  END IF;
  RETURN QUERY SELECT true, 0, 'ok';
END $function$;
