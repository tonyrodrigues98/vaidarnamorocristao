-- V2-020: notification preferences, trust boundaries and support context.
-- Additive only. The implementation task does not apply this migration.
BEGIN;

DO $$
DECLARE
  _required regclass;
BEGIN
  FOREACH _required IN ARRAY ARRAY[
    to_regclass('public.profiles'),
    to_regclass('public.notifications'),
    to_regclass('public.push_queue'),
    to_regclass('public.blocks'),
    to_regclass('public.reports'),
    to_regclass('public.support_tickets'),
    to_regclass('public.support_messages'),
    to_regclass('public.cinema_sessions_v2'),
    to_regclass('public.cinema_media_v2')
  ]
  LOOP
    IF _required IS NULL THEN
      RAISE EXCEPTION 'V2-020 preflight failed: required relation is missing';
    END IF;
  END LOOP;
  IF to_regprocedure('public.v2_community_users_blocked(uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION 'V2-020 preflight failed: global block authority is missing';
  END IF;
END;
$$;

CREATE TABLE public.notification_preferences_v2 (
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  category text NOT NULL CHECK (
    category IN (
      'community', 'conversations', 'dating', 'purpose', 'content',
      'cinema', 'pets', 'economy', 'security', 'support'
    )
  ),
  inbox_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT true,
  digest_enabled boolean NOT NULL DEFAULT false,
  sound_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category),
  CHECK (category <> 'security' OR inbox_enabled)
);

CREATE TABLE public.notification_domain_events_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id),
  domain text NOT NULL CHECK (
    domain IN (
      'community', 'conversations', 'dating', 'purpose', 'content',
      'cinema', 'pets', 'economy', 'security', 'support'
    )
  ),
  event_type text NOT NULL CHECK (char_length(event_type) BETWEEN 1 AND 100),
  dedupe_key text NOT NULL CHECK (char_length(dedupe_key) BETWEEN 8 AND 180),
  entity_ref text,
  essential boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recipient_id, domain, dedupe_key)
);

CREATE TABLE public.notification_delivery_attempts_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.notification_domain_events_v2(id),
  notification_id uuid REFERENCES public.notifications(id),
  channel text NOT NULL CHECK (channel IN ('inbox', 'push', 'digest')),
  state text NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending', 'claimed', 'delivered', 'failed', 'expired', 'cancelled')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  delivered_at timestamptz,
  provider_reference text,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, channel)
);

CREATE INDEX notification_delivery_attempts_v2_dispatch_idx
  ON public.notification_delivery_attempts_v2 (next_attempt_at, created_at)
  WHERE state IN ('pending', 'failed');

CREATE TABLE public.user_mutes_v2 (
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  target_kind text NOT NULL CHECK (target_kind IN ('person', 'space', 'thread', 'category')),
  target_ref text NOT NULL CHECK (char_length(target_ref) BETWEEN 1 AND 180),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, target_kind, target_ref)
);

CREATE TABLE public.moderation_cases_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_report_id uuid REFERENCES public.reports(id),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id),
  subject_type text NOT NULL CHECK (
    subject_type IN (
      'profile', 'photo', 'post', 'status', 'comment', 'message', 'space',
      'event', 'gift', 'cinema', 'game', 'economy', 'christian-content'
    )
  ),
  subject_ref text NOT NULL,
  reason_code text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  state text NOT NULL DEFAULT 'open'
    CHECK (state IN ('open', 'triage', 'reviewing', 'actioned', 'dismissed', 'appealed', 'closed')),
  evidence_reference text,
  decision_code text,
  decided_by uuid REFERENCES public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (legacy_report_id)
);

CREATE TABLE public.support_ticket_context_v2 (
  ticket_id uuid PRIMARY KEY REFERENCES public.support_tickets(id),
  source_domain text NOT NULL,
  source_reference text,
  diagnostic_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_domain_events_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_attempts_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mutes_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_cases_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_context_v2 ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.notification_preferences_v2,
  public.notification_domain_events_v2,
  public.notification_delivery_attempts_v2,
  public.user_mutes_v2,
  public.moderation_cases_v2,
  public.support_ticket_context_v2
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.notification_preferences_v2,
  public.notification_domain_events_v2,
  public.notification_delivery_attempts_v2,
  public.user_mutes_v2,
  public.moderation_cases_v2,
  public.support_ticket_context_v2
TO authenticated;

GRANT ALL ON TABLE
  public.notification_preferences_v2,
  public.notification_domain_events_v2,
  public.notification_delivery_attempts_v2,
  public.user_mutes_v2,
  public.moderation_cases_v2,
  public.support_ticket_context_v2
TO service_role;

CREATE POLICY "owner reads notification preferences"
  ON public.notification_preferences_v2 FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "recipient reads notification events"
  ON public.notification_domain_events_v2 FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());
CREATE POLICY "recipient reads delivery attempts"
  ON public.notification_delivery_attempts_v2 FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.notification_domain_events_v2 event
      WHERE event.id = notification_delivery_attempts_v2.event_id
        AND event.recipient_id = auth.uid()
    )
  );
CREATE POLICY "owner reads mutes"
  ON public.user_mutes_v2 FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "reporter or moderator reads cases"
  ON public.moderation_cases_v2 FOR SELECT TO authenticated
  USING (
    reporter_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'moderador')
  );
CREATE POLICY "ticket participants read support context"
  ON public.support_ticket_context_v2 FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets ticket
      WHERE ticket.id = support_ticket_context_v2.ticket_id
        AND (
          ticket.user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'super_admin')
        )
    )
  );

-- Existing inbox rows from a blocked actor are hidden consistently. Evidence
-- remains in the restricted source table and is not physically deleted.
CREATE POLICY "global block restricts notification visibility"
  ON public.notifications AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    actor_id IS NULL
    OR NOT public.v2_community_users_blocked(auth.uid(), actor_id)
  );

-- Cinema is a shared domain: a block between viewer and host prevents session,
-- media and participant visibility without deleting history.
CREATE POLICY "global block restricts cinema sessions"
  ON public.cinema_sessions_v2 AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    host_id = auth.uid()
    OR NOT public.v2_community_users_blocked(auth.uid(), host_id)
  );
CREATE POLICY "global block restricts cinema media"
  ON public.cinema_media_v2 AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR NOT public.v2_community_users_blocked(auth.uid(), owner_id)
  );

CREATE OR REPLACE FUNCTION public.save_notification_preference_v2(
  _category text,
  _inbox_enabled boolean,
  _push_enabled boolean,
  _digest_enabled boolean,
  _sound_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF _category NOT IN (
    'community', 'conversations', 'dating', 'purpose', 'content',
    'cinema', 'pets', 'economy', 'security', 'support'
  ) THEN
    RAISE EXCEPTION 'invalid_notification_category' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.notification_preferences_v2 (
    user_id, category, inbox_enabled, push_enabled, digest_enabled, sound_enabled, updated_at
  )
  VALUES (
    _uid,
    _category,
    CASE WHEN _category = 'security' THEN true ELSE _inbox_enabled END,
    _push_enabled,
    _digest_enabled,
    _sound_enabled,
    now()
  )
  ON CONFLICT (user_id, category) DO UPDATE SET
    inbox_enabled = CASE
      WHEN EXCLUDED.category = 'security' THEN true
      ELSE EXCLUDED.inbox_enabled
    END,
    push_enabled = EXCLUDED.push_enabled,
    digest_enabled = EXCLUDED.digest_enabled,
    sound_enabled = EXCLUDED.sound_enabled,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_read_v2(_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  UPDATE public.notifications
  SET read_at = coalesce(read_at, now())
  WHERE id = _notification_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'notification_not_found' USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_notification_domain_event_v2(
  _recipient_id uuid,
  _domain text,
  _event_type text,
  _dedupe_key text,
  _entity_ref text DEFAULT NULL,
  _essential boolean DEFAULT false,
  _expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _event_id uuid;
BEGIN
  IF _domain NOT IN (
    'community', 'conversations', 'dating', 'purpose', 'content',
    'cinema', 'pets', 'economy', 'security', 'support'
  ) THEN
    RAISE EXCEPTION 'invalid_notification_domain' USING ERRCODE = '22023';
  END IF;
  IF _domain = 'security' THEN
    _essential := true;
  END IF;

  INSERT INTO public.notification_domain_events_v2 (
    recipient_id, domain, event_type, dedupe_key, entity_ref, essential, expires_at
  )
  VALUES (
    _recipient_id, _domain, _event_type, _dedupe_key, _entity_ref, _essential, _expires_at
  )
  ON CONFLICT (recipient_id, domain, dedupe_key) DO UPDATE SET
    expires_at = greatest(notification_domain_events_v2.expires_at, EXCLUDED.expires_at)
  RETURNING id INTO _event_id;
  RETURN _event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_trust_center_v2()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _verified boolean;
  _avatar_verified boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT verified, avatar_ai_verified
  INTO _verified, _avatar_verified
  FROM public.profiles
  WHERE id = _uid;

  RETURN jsonb_build_object(
    'notifications', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', notification.id,
        'type', notification.type,
        'title', notification.title,
        'body', CASE
          WHEN notification.type ~ '^(interest|match|anonymous|purpose|message)'
            THEN 'Abra para ver esta atualização com segurança.'
          ELSE coalesce(notification.body, '')
        END,
        'link', CASE
          WHEN notification.link IS NOT NULL
            AND left(notification.link, 1) = '/'
            AND left(notification.link, 2) <> '//'
            AND notification.link !~ '^/(auth|logout|reset)'
            THEN notification.link
          ELSE NULL
        END,
        'read_at', notification.read_at,
        'created_at', notification.created_at,
        'sensitive', notification.type ~ '^(interest|match|anonymous|purpose|message)'
      ) ORDER BY notification.created_at DESC)
      FROM (
        SELECT *
        FROM public.notifications candidate
        WHERE candidate.user_id = _uid
          AND (
            candidate.actor_id IS NULL
            OR NOT public.v2_community_users_blocked(_uid, candidate.actor_id)
          )
        ORDER BY candidate.created_at DESC
        LIMIT 100
      ) notification
    ), '[]'::jsonb),
    'unread_count', (
      SELECT count(*) FROM public.notifications notification
      WHERE notification.user_id = _uid
        AND notification.read_at IS NULL
        AND (
          notification.actor_id IS NULL
          OR NOT public.v2_community_users_blocked(_uid, notification.actor_id)
        )
    ),
    'preferences', (
      SELECT jsonb_agg(jsonb_build_object(
        'category', category.name,
        'inbox_enabled', CASE
          WHEN category.name = 'security' THEN true
          ELSE coalesce(preference.inbox_enabled, true)
        END,
        'push_enabled', coalesce(preference.push_enabled, true),
        'digest_enabled', coalesce(preference.digest_enabled, false),
        'sound_enabled', coalesce(preference.sound_enabled, false),
        'essential', category.name = 'security'
      ) ORDER BY category.ordinality)
      FROM unnest(ARRAY[
        'community', 'conversations', 'dating', 'purpose', 'content',
        'cinema', 'pets', 'economy', 'security', 'support'
      ]::text[]) WITH ORDINALITY category(name, ordinality)
      LEFT JOIN public.notification_preferences_v2 preference
        ON preference.user_id = _uid AND preference.category = category.name
    ),
    'blocked_count', (
      SELECT count(*) FROM public.blocks block WHERE block.blocker_id = _uid
    ),
    'muted_count', (
      SELECT count(*) FROM public.user_mutes_v2 mute
      WHERE mute.user_id = _uid
        AND (mute.expires_at IS NULL OR mute.expires_at > now())
    ),
    'photo_verification', CASE
      WHEN _verified AND _avatar_verified THEN 'approved'
      WHEN _avatar_verified THEN 'pending'
      WHEN _verified THEN 'action-required'
      ELSE 'not-started'
    END,
    'support_tickets', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ticket.id,
        'title', ticket.title,
        'category', ticket.category,
        'status', ticket.status,
        'last_message_at', ticket.last_message_at
      ) ORDER BY ticket.last_message_at DESC)
      FROM (
        SELECT * FROM public.support_tickets
        WHERE user_id = _uid
        ORDER BY last_message_at DESC
        LIMIT 20
      ) ticket
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_notification_preference_v2(text, boolean, boolean, boolean, boolean)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_notification_read_v2(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_notification_domain_event_v2(
  uuid, text, text, text, text, boolean, timestamptz
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_trust_center_v2() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.save_notification_preference_v2(
  text, boolean, boolean, boolean, boolean
) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_notification_read_v2(uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_notification_domain_event_v2(
  uuid, text, text, text, text, boolean, timestamptz
) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_trust_center_v2() TO authenticated, service_role;

COMMENT ON TABLE public.notification_domain_events_v2 IS
  'Business facts are separate from inbox registration, queueing and channel delivery.';
COMMENT ON TABLE public.user_mutes_v2 IS
  'Mute reduces content or notification delivery and never substitutes the global blocks table.';
COMMENT ON TABLE public.moderation_cases_v2 IS
  'Contextual case envelope; evidence references remain restricted and legacy reports are preserved.';
COMMENT ON TABLE public.support_ticket_context_v2 IS
  'Optional context for preserved support tickets without copying messages or attachments.';

COMMIT;
