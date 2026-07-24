BEGIN;

ALTER TABLE public.relationship_commitments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS ended_by uuid,
  ADD COLUMN IF NOT EXISTS end_reason text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS request_idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS relationship_commitments_request_key_v2
  ON public.relationship_commitments (requested_by, request_idempotency_key)
  WHERE request_idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS relationship_commitments_participants_state_v2
  ON public.relationship_commitments (status, user_a, user_b, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.relationship_commitment_events_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  event_type text NOT NULL
    CHECK (event_type IN ('requested', 'accepted', 'rejected', 'cancelled', 'ended', 'archived')),
  from_state text,
  to_state text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS relationship_commitment_events_v2_commitment_idx
  ON public.relationship_commitment_events_v2 (commitment_id, created_at);
ALTER TABLE public.relationship_commitment_events_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.relationship_commitment_events_v2 FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.relationship_commitment_events_v2 TO service_role;

CREATE POLICY "purpose participants read events"
  ON public.relationship_commitment_events_v2
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.relationship_commitments commitment
      WHERE commitment.id = relationship_commitment_events_v2.commitment_id
        AND auth.uid() IN (commitment.user_a, commitment.user_b)
    )
  );

ALTER TABLE public.gift_transactions
  ADD COLUMN IF NOT EXISTS context text,
  ADD COLUMN IF NOT EXISTS context_ref_id uuid,
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

ALTER TABLE public.gift_transactions
  ADD CONSTRAINT gift_transactions_context_v2
    CHECK (context IS NULL OR context IN ('social', 'romantic', 'purpose'));

CREATE UNIQUE INDEX IF NOT EXISTS gift_transactions_sender_idempotency_v2
  ON public.gift_transactions (sender_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS gift_transactions_context_v2_idx
  ON public.gift_transactions (context, context_ref_id, created_at DESC)
  WHERE context IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.contextual_gift_commands_v2 (
  sender_id uuid NOT NULL,
  idempotency_key uuid NOT NULL,
  receiver_id uuid NOT NULL,
  gift_id uuid NOT NULL,
  context text NOT NULL CHECK (context IN ('social', 'romantic', 'purpose')),
  context_ref_id uuid,
  transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sender_id, idempotency_key)
);

ALTER TABLE public.contextual_gift_commands_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.contextual_gift_commands_v2 FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.contextual_gift_commands_v2 TO service_role;

ALTER TABLE public.anonymous_message_settings
  ALTER COLUMN accept_anonymous SET DEFAULT false;

CREATE OR REPLACE FUNCTION public.v2_purpose_state(
  _status text,
  _end_reason text,
  _archived_at timestamptz DEFAULT NULL
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _archived_at IS NOT NULL THEN 'archived'
    WHEN _status = 'pending' THEN 'requested'
    WHEN _status = 'active' THEN 'active'
    WHEN _end_reason = 'rejected' THEN 'rejected'
    WHEN _end_reason = 'cancelled' THEN 'cancelled'
    ELSE 'ended'
  END;
$$;

CREATE OR REPLACE FUNCTION public.request_relationship_purpose_v2(
  _match_id uuid,
  _idempotency_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _match public.matches;
  _partner uuid;
  _commitment_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF _match_id IS NULL OR _idempotency_key IS NULL THEN
    RAISE EXCEPTION 'invalid_purpose_request' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO _match FROM public.matches WHERE id = _match_id;
  IF NOT FOUND OR _uid NOT IN (_match.user_a, _match.user_b) THEN
    RAISE EXCEPTION 'match_not_available' USING ERRCODE = '42501';
  END IF;
  _partner := CASE WHEN _match.user_a = _uid THEN _match.user_b ELSE _match.user_a END;

  PERFORM pg_advisory_xact_lock(
    hashtext(least(_uid::text, _partner::text)),
    hashtext(greatest(_uid::text, _partner::text))
  );

  SELECT id INTO _commitment_id
  FROM public.relationship_commitments
  WHERE requested_by = _uid
    AND request_idempotency_key = _idempotency_key;
  IF _commitment_id IS NOT NULL THEN
    RETURN _commitment_id;
  END IF;

  IF NOT public.v2_dating_users_eligible(_uid, _partner) THEN
    RAISE EXCEPTION 'purpose_participants_not_eligible' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.relationship_commitments commitment
    WHERE commitment.status IN ('pending', 'active')
      AND (
        _uid IN (commitment.user_a, commitment.user_b)
        OR _partner IN (commitment.user_a, commitment.user_b)
      )
  ) THEN
    RAISE EXCEPTION 'purpose_already_exists' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.relationship_commitments (
    match_id,
    user_a,
    user_b,
    requested_by,
    status,
    request_idempotency_key,
    updated_at
  )
  VALUES (
    _match_id,
    least(_match.user_a, _match.user_b),
    greatest(_match.user_a, _match.user_b),
    _uid,
    'pending',
    _idempotency_key,
    now()
  )
  RETURNING id INTO _commitment_id;

  INSERT INTO public.relationship_commitment_events_v2 (
    commitment_id, actor_id, event_type, from_state, to_state
  )
  VALUES (_commitment_id, _uid, 'requested', NULL, 'requested');

  RETURN _commitment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.transition_relationship_purpose_v2(
  _commitment_id uuid,
  _action text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _commitment public.relationship_commitments;
  _from text;
  _to text;
  _event_type text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF _action NOT IN ('accept', 'reject', 'cancel', 'end', 'archive') THEN
    RAISE EXCEPTION 'invalid_purpose_action' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO _commitment
  FROM public.relationship_commitments
  WHERE id = _commitment_id
  FOR UPDATE;
  IF NOT FOUND OR _uid NOT IN (_commitment.user_a, _commitment.user_b) THEN
    RAISE EXCEPTION 'purpose_not_available' USING ERRCODE = '42501';
  END IF;

  _from := public.v2_purpose_state(
    _commitment.status,
    _commitment.end_reason,
    _commitment.archived_at
  );
  IF (_action = 'accept' AND _from = 'active')
     OR (_action = 'reject' AND _from = 'rejected')
     OR (_action = 'cancel' AND _from = 'cancelled')
     OR (_action = 'end' AND _from = 'ended')
     OR (_action = 'archive' AND _from = 'archived') THEN
    RETURN _from;
  END IF;

  IF _action = 'accept' THEN
    IF _commitment.status <> 'pending' OR _commitment.requested_by = _uid THEN
      RAISE EXCEPTION 'purpose_transition_not_allowed' USING ERRCODE = '42501';
    END IF;
    IF NOT public.v2_dating_users_eligible(_commitment.user_a, _commitment.user_b)
       OR NOT public.v2_dating_users_eligible(_commitment.user_b, _commitment.user_a) THEN
      RAISE EXCEPTION 'purpose_participants_not_eligible' USING ERRCODE = '42501';
    END IF;

    UPDATE public.relationship_commitments
    SET status = 'active',
        accepted_at = coalesce(accepted_at, now()),
        updated_at = now()
    WHERE id = _commitment_id;

    UPDATE public.dating_memberships
    SET status = 'paused_by_commitment',
        paused_at = now(),
        updated_at = now()
    WHERE user_id IN (_commitment.user_a, _commitment.user_b)
      AND status = 'active';
    _to := 'active';
    _event_type := 'accepted';
  ELSIF _action IN ('reject', 'cancel') THEN
    IF _commitment.status <> 'pending'
       OR (_action = 'reject' AND _commitment.requested_by = _uid)
       OR (_action = 'cancel' AND _commitment.requested_by <> _uid) THEN
      RAISE EXCEPTION 'purpose_transition_not_allowed' USING ERRCODE = '42501';
    END IF;
    _to := CASE WHEN _action = 'reject' THEN 'rejected' ELSE 'cancelled' END;
    UPDATE public.relationship_commitments
    SET status = 'ended',
        ended_at = now(),
        ended_by = _uid,
        end_reason = _to,
        updated_at = now()
    WHERE id = _commitment_id;
    _event_type := CASE WHEN _action = 'reject' THEN 'rejected' ELSE 'cancelled' END;
  ELSIF _action = 'end' THEN
    IF _commitment.status <> 'active' THEN
      RAISE EXCEPTION 'purpose_transition_not_allowed' USING ERRCODE = '42501';
    END IF;
    _to := 'ended';
    UPDATE public.relationship_commitments
    SET status = 'ended',
        ended_at = now(),
        ended_by = _uid,
        end_reason = 'ended',
        updated_at = now()
    WHERE id = _commitment_id;
    -- Deliberately do not reactivate dating_memberships.
    _event_type := 'ended';
  ELSE
    IF _commitment.status <> 'ended' OR _commitment.archived_at IS NOT NULL THEN
      RAISE EXCEPTION 'purpose_transition_not_allowed' USING ERRCODE = '42501';
    END IF;
    _to := 'archived';
    UPDATE public.relationship_commitments
    SET archived_at = now(),
        updated_at = now()
    WHERE id = _commitment_id;
    _event_type := 'archived';
  END IF;

  INSERT INTO public.relationship_commitment_events_v2 (
    commitment_id, actor_id, event_type, from_state, to_state
  )
  VALUES (_commitment_id, _uid, _event_type, _from, _to);

  RETURN _to;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_relationship_purpose_hub_v2()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _current public.relationship_commitments;
  _partner uuid;
  _current_json jsonb;
  _history jsonb;
  _eligible jsonb;
  _gifts jsonb := '[]'::jsonb;
  _timeline jsonb := '[]'::jsonb;
  _capsules jsonb := '[]'::jsonb;
  _catalog jsonb;
  _message_count integer := 0;
  _capsule_count integer := 0;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO _current
  FROM public.relationship_commitments
  WHERE _uid IN (user_a, user_b)
    AND status IN ('pending', 'active')
  ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, requested_at DESC
  LIMIT 1;

  IF _current.id IS NOT NULL THEN
    _partner := CASE WHEN _current.user_a = _uid THEN _current.user_b ELSE _current.user_a END;
    SELECT jsonb_build_object(
      'id', _current.id,
      'match_id', _current.match_id,
      'state', public.v2_purpose_state(
        _current.status,
        _current.end_reason,
        _current.archived_at
      ),
      'requested_by_me', _current.requested_by = _uid,
      'requested_at', _current.requested_at,
      'accepted_at', _current.accepted_at,
      'ended_at', _current.ended_at,
      'end_reason', _current.end_reason,
      'partner', jsonb_build_object(
        'id', profile.id,
        'display_name', profile.full_name,
        'photo_url', profile.photo_url
      )
    )
    INTO _current_json
    FROM public.profiles profile
    WHERE profile.id = _partner;

    IF _current.status = 'active' THEN
      SELECT count(*) INTO _message_count
      FROM public.messages message
      WHERE message.match_id = _current.match_id;
      SELECT count(*) INTO _capsule_count
      FROM public.couple_time_capsules capsule
      WHERE capsule.match_id = _current.match_id;
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', gift.id,
        'name', catalog.name,
        'image_url', catalog.image_url,
        'price', gift.price_paid,
        'category', catalog.category,
        'sent_at', gift.created_at,
        'sender_name', sender.full_name
      ) ORDER BY gift.created_at DESC), '[]'::jsonb)
      INTO _gifts
      FROM public.gift_transactions gift
      JOIN public.virtual_gifts catalog ON catalog.id = gift.gift_id
      LEFT JOIN public.profiles sender ON sender.id = gift.sender_id
      WHERE gift.context = 'purpose'
        AND gift.context_ref_id = _current.id
        AND _uid IN (gift.sender_id, gift.receiver_id);

      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', event.id,
        'type', event.event_type,
        'from_state', event.from_state,
        'to_state', event.to_state,
        'actor_is_me', event.actor_id = _uid,
        'created_at', event.created_at
      ) ORDER BY event.created_at, event.id), '[]'::jsonb)
      INTO _timeline
      FROM public.relationship_commitment_events_v2 event
      WHERE event.commitment_id = _current.id;

      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', capsule.id,
        'message', CASE
          WHEN capsule.opened_at IS NOT NULL OR capsule.unlock_at <= now()
            THEN capsule.message
          ELSE ''
        END,
        'unlock_at', capsule.unlock_at,
        'opened_at', capsule.opened_at,
        'created_at', capsule.created_at,
        'author_is_me', capsule.author_id = _uid,
        'locked', capsule.opened_at IS NULL AND capsule.unlock_at > now()
      ) ORDER BY capsule.unlock_at, capsule.id), '[]'::jsonb)
      INTO _capsules
      FROM public.couple_time_capsules capsule
      WHERE capsule.match_id = _current.match_id;
    END IF;
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', commitment.id,
    'match_id', commitment.match_id,
    'state', public.v2_purpose_state(
      commitment.status,
      commitment.end_reason,
      commitment.archived_at
    ),
    'requested_by_me', commitment.requested_by = _uid,
    'requested_at', commitment.requested_at,
    'accepted_at', commitment.accepted_at,
    'ended_at', commitment.ended_at,
    'end_reason', commitment.end_reason,
    'partner', jsonb_build_object(
      'id', profile.id,
      'display_name', profile.full_name,
      'photo_url', profile.photo_url
    )
  ) ORDER BY coalesce(commitment.ended_at, commitment.created_at) DESC), '[]'::jsonb)
  INTO _history
  FROM public.relationship_commitments commitment
  JOIN public.profiles profile
    ON profile.id = CASE WHEN commitment.user_a = _uid THEN commitment.user_b ELSE commitment.user_a END
  WHERE _uid IN (commitment.user_a, commitment.user_b)
    AND commitment.status = 'ended';

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'match_id', match.id,
    'partner', jsonb_build_object(
      'id', profile.id,
      'display_name', profile.full_name,
      'photo_url', profile.photo_url
    )
  ) ORDER BY match.created_at DESC), '[]'::jsonb)
  INTO _eligible
  FROM public.matches match
  JOIN public.profiles profile
    ON profile.id = CASE WHEN match.user_a = _uid THEN match.user_b ELSE match.user_a END
  WHERE _uid IN (match.user_a, match.user_b)
    AND public.v2_dating_users_eligible(_uid, profile.id)
    AND NOT EXISTS (
      SELECT 1
      FROM public.relationship_commitments existing
      WHERE existing.match_id = match.id
        AND existing.status IN ('pending', 'active')
    );

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', gift.id,
    'name', gift.name,
    'image_url', gift.image_url,
    'price', gift.price_coins,
    'category', gift.category
  ) ORDER BY gift.sort_order, gift.id), '[]'::jsonb)
  INTO _catalog
  FROM public.virtual_gifts gift
  WHERE gift.active;

  RETURN jsonb_build_object(
    'current', _current_json,
    'history', _history,
    'eligible_matches', _eligible,
    'gifts', _gifts,
    'catalog', _catalog,
    'timeline', _timeline,
    'capsules', _capsules,
    'message_count', _message_count,
    'capsule_count', _capsule_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_anonymous_opt_in_v2(_accept boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _status text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  SELECT status INTO _status FROM public.dating_memberships WHERE user_id = _uid FOR UPDATE;
  IF _status IS NULL OR (_accept AND _status <> 'active') THEN
    RAISE EXCEPTION 'dating_membership_not_active' USING ERRCODE = '42501';
  END IF;

  UPDATE public.dating_memberships
  SET receive_anonymous = _accept,
      updated_at = now()
  WHERE user_id = _uid;
  INSERT INTO public.anonymous_message_settings (user_id, accept_anonymous, updated_at)
  VALUES (_uid, _accept, now())
  ON CONFLICT (user_id) DO UPDATE
    SET accept_anonymous = EXCLUDED.accept_anonymous,
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.send_anonymous_message_v2(
  _receiver_id uuid,
  _content text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _result uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT public.v2_dating_users_eligible(_uid, _receiver_id) THEN
    RAISE EXCEPTION 'anonymous_recipient_not_eligible' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.dating_memberships membership
    JOIN public.anonymous_message_settings setting ON setting.user_id = membership.user_id
    WHERE membership.user_id = _receiver_id
      AND membership.status = 'active'
      AND membership.receive_anonymous
      AND setting.accept_anonymous
  ) THEN
    RAISE EXCEPTION 'anonymous_recipient_opted_out' USING ERRCODE = '42501';
  END IF;

  SELECT public.send_anonymous_message(_receiver_id, _content) INTO _result;
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_anonymous_center_v2()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _notes jsonb;
  _recipients jsonb;
  _accepting boolean := false;
  _daily_used integer := 0;
  _extras integer := 0;
BEGIN
  IF _uid IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.dating_memberships
    WHERE user_id = _uid AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'dating_membership_not_active' USING ERRCODE = '42501';
  END IF;

  SELECT membership.receive_anonymous AND coalesce(setting.accept_anonymous, false),
         coalesce(setting.extras_balance, 0)
  INTO _accepting, _extras
  FROM public.dating_memberships membership
  LEFT JOIN public.anonymous_message_settings setting ON setting.user_id = membership.user_id
  WHERE membership.user_id = _uid;

  SELECT count(*) INTO _daily_used
  FROM public.anonymous_messages message
  WHERE message.sender_id = _uid
    AND message.created_at >= now() - interval '24 hours';

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', message.id,
    'direction', CASE WHEN message.sender_id = _uid THEN 'outgoing' ELSE 'incoming' END,
    'content', message.content,
    'reply', message.reply_text,
    'state', CASE
      WHEN message.expires_at <= now()
       AND message.status NOT IN ('revealed', 'ignored', 'reported') THEN 'expired'
      ELSE message.status::text
    END,
    'created_at', message.created_at,
    'expires_at', message.expires_at,
    'hint_count', (SELECT count(*) FROM public.anonymous_message_hints hint WHERE hint.message_id = message.id),
    'reveal_requested_by_me', CASE
      WHEN message.sender_id = _uid THEN message.sender_reveal_requested_at IS NOT NULL
      ELSE message.receiver_reveal_requested_at IS NOT NULL
    END,
    'reveal_requested_by_other', CASE
      WHEN message.sender_id = _uid THEN message.receiver_reveal_requested_at IS NOT NULL
      ELSE message.sender_reveal_requested_at IS NOT NULL
    END,
    'match_id', message.match_id
  ) ORDER BY message.created_at DESC), '[]'::jsonb)
  INTO _notes
  FROM public.anonymous_messages message
  WHERE _uid IN (message.sender_id, message.receiver_id)
    AND (message.sender_id = _uid OR message.status <> 'reported');

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', profile.id,
    'display_name', profile.full_name
  ) ORDER BY profile.full_name, profile.id), '[]'::jsonb)
  INTO _recipients
  FROM public.profiles profile
  JOIN public.dating_memberships membership ON membership.user_id = profile.id
  JOIN public.anonymous_message_settings setting ON setting.user_id = profile.id
  WHERE membership.status = 'active'
    AND membership.receive_anonymous
    AND setting.accept_anonymous
    AND public.v2_dating_users_eligible(_uid, profile.id);

  RETURN jsonb_build_object(
    'accepting', coalesce(_accepting, false),
    'notes', _notes,
    'recipients', _recipients,
    'daily_used', _daily_used,
    'daily_free', 3,
    'extras', _extras
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reply_anonymous_message_v2(_message_id uuid, _reply text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.reply_anonymous_message(_message_id, _reply);
END;
$$;
CREATE OR REPLACE FUNCTION public.request_anonymous_hint_v2(_message_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.request_anonymous_hint(_message_id);
END;
$$;
CREATE OR REPLACE FUNCTION public.send_anonymous_hint_v2(
  _message_id uuid, _category text, _hint text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF _category NOT IN ('idade', 'regiao', 'personalidade', 'fe', 'compatibilidade')
     OR length(trim(coalesce(_hint, ''))) < 3
     OR length(_hint) > 120 THEN
    RAISE EXCEPTION 'invalid_anonymous_hint' USING ERRCODE = '22023';
  END IF;
  PERFORM public.send_anonymous_hint_text(
    _message_id,
    _category::public.anonymous_hint_category,
    _hint
  );
END;
$$;
CREATE OR REPLACE FUNCTION public.request_anonymous_reveal_v2(_message_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  _uid uuid := auth.uid();
  _message public.anonymous_messages;
BEGIN
  SELECT * INTO _message FROM public.anonymous_messages WHERE id = _message_id;
  IF NOT FOUND OR _uid NOT IN (_message.sender_id, _message.receiver_id)
     OR NOT public.v2_dating_users_eligible(_message.sender_id, _message.receiver_id)
     OR NOT public.v2_dating_users_eligible(_message.receiver_id, _message.sender_id) THEN
    RAISE EXCEPTION 'anonymous_reveal_not_eligible' USING ERRCODE = '42501';
  END IF;
  RETURN public.request_anonymous_reveal(_message_id);
END;
$$;
CREATE OR REPLACE FUNCTION public.ignore_anonymous_message_v2(_message_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.ignore_anonymous_message(_message_id);
END;
$$;
CREATE OR REPLACE FUNCTION public.report_anonymous_message_v2(_message_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF _reason NOT IN ('inappropriate_content', 'harassment', 'false_identity', 'other') THEN
    RAISE EXCEPTION 'invalid_report_reason' USING ERRCODE = '22023';
  END IF;
  PERFORM public.report_anonymous_message(_message_id, _reason);
END;
$$;

CREATE OR REPLACE FUNCTION public.send_contextual_gift_v2(
  _receiver_id uuid,
  _gift_id uuid,
  _message text,
  _context text,
  _context_ref_id uuid,
  _idempotency_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _transaction_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF _receiver_id IS NULL OR _receiver_id = _uid OR _gift_id IS NULL
     OR _idempotency_key IS NULL OR _context NOT IN ('social', 'romantic', 'purpose') THEN
    RAISE EXCEPTION 'invalid_contextual_gift' USING ERRCODE = '22023';
  END IF;
  IF _message IS NOT NULL THEN
    PERFORM public.anon_check_restricted(_message);
  END IF;
  IF public.v2_community_users_blocked(_uid, _receiver_id) THEN
    RAISE EXCEPTION 'gift_blocked' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.contextual_gift_commands_v2 (
    sender_id, idempotency_key, receiver_id, gift_id, context, context_ref_id
  )
  VALUES (_uid, _idempotency_key, _receiver_id, _gift_id, _context, _context_ref_id)
  ON CONFLICT (sender_id, idempotency_key) DO NOTHING;

  SELECT transaction_id INTO _transaction_id
  FROM public.contextual_gift_commands_v2
  WHERE sender_id = _uid AND idempotency_key = _idempotency_key
  FOR UPDATE;
  IF _transaction_id IS NOT NULL THEN
    RETURN _transaction_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.contextual_gift_commands_v2 command
    WHERE command.sender_id = _uid
      AND command.idempotency_key = _idempotency_key
      AND command.receiver_id = _receiver_id
      AND command.gift_id = _gift_id
      AND command.context = _context
      AND command.context_ref_id IS NOT DISTINCT FROM _context_ref_id
  ) THEN
    RAISE EXCEPTION 'idempotency_key_reused' USING ERRCODE = '22023';
  END IF;

  IF _context = 'social' THEN
    IF NOT public.v2_community_user_is_approved(_uid)
       OR NOT public.v2_community_user_is_approved(_receiver_id) THEN
      RAISE EXCEPTION 'social_gift_not_allowed' USING ERRCODE = '42501';
    END IF;
  ELSIF _context = 'romantic' THEN
    IF NOT public.v2_dating_users_eligible(_uid, _receiver_id)
       OR NOT public.v2_dating_users_eligible(_receiver_id, _uid) THEN
      RAISE EXCEPTION 'romantic_gift_not_allowed' USING ERRCODE = '42501';
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM public.relationship_commitments commitment
      WHERE commitment.id = _context_ref_id
        AND commitment.status = 'active'
        AND _uid IN (commitment.user_a, commitment.user_b)
        AND _receiver_id IN (commitment.user_a, commitment.user_b)
    ) THEN
      RAISE EXCEPTION 'purpose_gift_not_allowed' USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT public.send_virtual_gift(_receiver_id, _gift_id, _message) INTO _transaction_id;
  UPDATE public.gift_transactions
  SET context = _context,
      context_ref_id = _context_ref_id,
      idempotency_key = _idempotency_key
  WHERE id = _transaction_id
    AND sender_id = _uid;
  UPDATE public.contextual_gift_commands_v2
  SET transaction_id = _transaction_id
  WHERE sender_id = _uid AND idempotency_key = _idempotency_key;

  RETURN _transaction_id;
END;
$$;

REVOKE ALL ON FUNCTION public.v2_purpose_state(text, text, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_relationship_purpose_v2(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.transition_relationship_purpose_v2(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_relationship_purpose_hub_v2() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_anonymous_opt_in_v2(boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_anonymous_message_v2(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_anonymous_center_v2() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reply_anonymous_message_v2(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_anonymous_hint_v2(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_anonymous_hint_v2(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_anonymous_reveal_v2(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ignore_anonymous_message_v2(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_anonymous_message_v2(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_contextual_gift_v2(uuid, uuid, text, text, uuid, uuid)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.request_relationship_purpose_v2(uuid, uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.transition_relationship_purpose_v2(uuid, text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_relationship_purpose_hub_v2()
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_anonymous_opt_in_v2(boolean)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_anonymous_message_v2(uuid, text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_anonymous_center_v2()
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reply_anonymous_message_v2(uuid, text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.request_anonymous_hint_v2(uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_anonymous_hint_v2(uuid, text, text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.request_anonymous_reveal_v2(uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ignore_anonymous_message_v2(uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.report_anonymous_message_v2(uuid, text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_contextual_gift_v2(uuid, uuid, text, text, uuid, uuid)
  TO authenticated, service_role;

COMMENT ON TABLE public.relationship_commitment_events_v2 IS
  'Append-only V2 state transition evidence. Legacy commitment rows are never deleted.';
COMMENT ON FUNCTION public.transition_relationship_purpose_v2(uuid, text) IS
  'Concurrency-safe purpose state machine; ending never reactivates dating.';
COMMENT ON FUNCTION public.send_anonymous_message_v2(uuid, text) IS
  'Strict dating opt-in wrapper over the preserved anonymous-note economy and history.';
COMMENT ON FUNCTION public.send_contextual_gift_v2(uuid, uuid, text, text, uuid, uuid) IS
  'Idempotent context envelope around the existing atomic gift economy.';

COMMIT;
