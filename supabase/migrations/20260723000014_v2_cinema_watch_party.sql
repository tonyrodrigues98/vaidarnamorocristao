-- V2-019: additive, fail-closed watch-party domain.
-- This migration is intentionally NOT applied by the implementation task.
BEGIN;

DO $$
DECLARE
  _required regclass;
BEGIN
  FOREACH _required IN ARRAY ARRAY[
    to_regclass('public.profiles'),
    to_regclass('public.conversation_threads_v2')
  ]
  LOOP
    IF _required IS NULL THEN
      RAISE EXCEPTION 'V2-019 preflight failed: required relation is missing';
    END IF;
  END LOOP;
END;
$$;

CREATE TABLE public.cinema_operation_gates_v2 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  upload_enabled boolean NOT NULL DEFAULT false,
  public_playback_enabled boolean NOT NULL DEFAULT false,
  legal_approval_recorded boolean NOT NULL DEFAULT false,
  retention_policy_approved boolean NOT NULL DEFAULT false,
  cost_limit_approved boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.cinema_operation_gates_v2 (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE public.cinema_media_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 4000),
  status text NOT NULL DEFAULT 'uploading'
    CHECK (status IN ('uploading', 'processing', 'ready', 'failed', 'quarantined', 'removed')),
  visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'unlisted', 'community')),
  rights_status text NOT NULL DEFAULT 'pending'
    CHECK (rights_status IN ('pending', 'approved', 'rejected')),
  moderation_status text NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  source_bucket text NOT NULL,
  source_path text NOT NULL,
  playback_manifest_path text,
  thumbnail_path text,
  captions_available boolean NOT NULL DEFAULT false,
  duration_ms bigint NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  size_bytes bigint NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  media_version integer NOT NULL DEFAULT 1 CHECK (media_version > 0),
  retention_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_bucket, source_path)
);

CREATE TABLE public.cinema_media_processing_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.cinema_media_v2(id),
  attempt integer NOT NULL CHECK (attempt > 0),
  status text NOT NULL CHECK (status IN ('queued', 'processing', 'ready', 'failed', 'cancelled')),
  processor_ref text,
  error_code text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (media_id, attempt)
);

CREATE TABLE public.cinema_sessions_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.cinema_media_v2(id),
  host_id uuid NOT NULL REFERENCES public.profiles(id),
  conversation_thread_id uuid REFERENCES public.conversation_threads_v2(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  state text NOT NULL DEFAULT 'draft'
    CHECK (state IN ('draft', 'scheduled', 'lobby', 'live', 'paused', 'ended', 'cancelled')),
  mode text NOT NULL DEFAULT 'community' CHECK (mode IN ('community', 'couple', 'private')),
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  playback_position_ms bigint NOT NULL DEFAULT 0 CHECK (playback_position_ms >= 0),
  playback_playing boolean NOT NULL DEFAULT false,
  playback_rate numeric(4,2) NOT NULL DEFAULT 1 CHECK (playback_rate BETWEEN 0.5 AND 2),
  playback_sequence bigint NOT NULL DEFAULT 0 CHECK (playback_sequence >= 0),
  playback_server_at timestamptz NOT NULL DEFAULT now(),
  last_control_action text CHECK (last_control_action IN ('play', 'pause', 'seek', 'end')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cinema_sessions_v2_state_schedule_idx
  ON public.cinema_sessions_v2 (state, scheduled_at);

CREATE TABLE public.cinema_participants_v2 (
  session_id uuid NOT NULL REFERENCES public.cinema_sessions_v2(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  role text NOT NULL DEFAULT 'participant'
    CHECK (role IN ('host', 'cohost', 'moderator', 'participant', 'viewer')),
  status text NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'joined', 'left', 'removed', 'declined')),
  joined_at timestamptz,
  left_at timestamptz,
  last_seen_at timestamptz,
  PRIMARY KEY (session_id, user_id)
);

CREATE TABLE public.cinema_control_events_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.cinema_sessions_v2(id),
  actor_id uuid NOT NULL REFERENCES public.profiles(id),
  action text NOT NULL CHECK (action IN ('play', 'pause', 'seek', 'end')),
  sequence bigint NOT NULL CHECK (sequence > 0),
  position_ms bigint NOT NULL CHECK (position_ms >= 0),
  idempotency_key uuid NOT NULL,
  server_timestamp timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, sequence),
  UNIQUE (session_id, idempotency_key)
);

ALTER TABLE public.cinema_operation_gates_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_media_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_media_processing_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_sessions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_participants_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_control_events_v2 ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.cinema_operation_gates_v2,
  public.cinema_media_v2,
  public.cinema_media_processing_v2,
  public.cinema_sessions_v2,
  public.cinema_participants_v2,
  public.cinema_control_events_v2
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.cinema_operation_gates_v2,
  public.cinema_media_v2,
  public.cinema_sessions_v2,
  public.cinema_participants_v2,
  public.cinema_control_events_v2
TO authenticated;

GRANT ALL ON TABLE
  public.cinema_operation_gates_v2,
  public.cinema_media_v2,
  public.cinema_media_processing_v2,
  public.cinema_sessions_v2,
  public.cinema_participants_v2,
  public.cinema_control_events_v2
TO service_role;

CREATE POLICY "authenticated reads cinema gates"
  ON public.cinema_operation_gates_v2 FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "owner or participant reads cinema media"
  ON public.cinema_media_v2 FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR (
      status = 'ready'
      AND rights_status = 'approved'
      AND moderation_status = 'approved'
      AND EXISTS (
        SELECT 1
        FROM public.cinema_sessions_v2 session
        JOIN public.cinema_participants_v2 participant ON participant.session_id = session.id
        WHERE session.media_id = cinema_media_v2.id
          AND participant.user_id = auth.uid()
          AND participant.status IN ('invited', 'joined')
      )
    )
  );

CREATE POLICY "participant reads cinema session"
  ON public.cinema_sessions_v2 FOR SELECT TO authenticated
  USING (
    host_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.cinema_participants_v2 participant
      WHERE participant.session_id = cinema_sessions_v2.id
        AND participant.user_id = auth.uid()
        AND participant.status IN ('invited', 'joined')
    )
  );

CREATE POLICY "session members read participants"
  ON public.cinema_participants_v2 FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "session members read control history"
  ON public.cinema_control_events_v2 FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.cinema_participants_v2 participant
      WHERE participant.session_id = cinema_control_events_v2.session_id
        AND participant.user_id = auth.uid()
        AND participant.status IN ('invited', 'joined')
    )
  );

CREATE OR REPLACE FUNCTION public.get_cinema_session_v2(_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _result jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'id', session.id,
    'title', session.title,
    'state', session.state,
    'scheduled_at', session.scheduled_at,
    'host_display_name', coalesce(nullif(host.display_name, ''), 'Anfitrião'),
    'participant_count', (
      SELECT count(*) FROM public.cinema_participants_v2 participant
      WHERE participant.session_id = session.id AND participant.status = 'joined'
    ),
    'viewer_role', coalesce(viewer.role, CASE WHEN session.host_id = _uid THEN 'host' ELSE 'viewer' END),
    'conversation_thread_id', session.conversation_thread_id,
    'media', jsonb_build_object(
      'id', media.id,
      'title', media.title,
      'duration_ms', media.duration_ms,
      'status', media.status,
      'visibility', media.visibility,
      'thumbnail_url', NULL,
      'captions_available', media.captions_available,
      'rights_status', media.rights_status,
      'moderation_status', media.moderation_status
    ),
    'playback', jsonb_build_object(
      'media_id', media.id,
      'media_version', media.media_version,
      'position_ms', session.playback_position_ms,
      'playing', session.playback_playing,
      'playback_rate', session.playback_rate,
      'sequence', session.playback_sequence,
      'server_timestamp', session.playback_server_at,
      'last_action', session.last_control_action
    )
  )
  INTO _result
  FROM public.cinema_sessions_v2 session
  JOIN public.cinema_media_v2 media ON media.id = session.media_id
  JOIN public.profiles host ON host.id = session.host_id
  LEFT JOIN public.cinema_participants_v2 viewer
    ON viewer.session_id = session.id AND viewer.user_id = _uid
  WHERE session.id = _session_id
    AND (
      session.host_id = _uid
      OR public.has_role(_uid, 'admin')
      OR viewer.status IN ('invited', 'joined')
    )
    AND media.status = 'ready'
    AND media.rights_status = 'approved'
    AND media.moderation_status = 'approved';

  IF _result IS NULL THEN
    RAISE EXCEPTION 'cinema_session_unavailable' USING ERRCODE = '42501';
  END IF;
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_cinema_hub_v2()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _gates public.cinema_operation_gates_v2%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO _gates FROM public.cinema_operation_gates_v2 WHERE singleton;

  RETURN jsonb_build_object(
    'server_now', now(),
    'featured', coalesce((
      SELECT jsonb_agg(public.get_cinema_session_v2(session.id) ORDER BY session.started_at DESC)
      FROM public.cinema_sessions_v2 session
      WHERE session.state IN ('lobby', 'live', 'paused')
        AND EXISTS (
          SELECT 1 FROM public.cinema_participants_v2 participant
          WHERE participant.session_id = session.id
            AND participant.user_id = _uid
            AND participant.status IN ('invited', 'joined')
        )
    ), '[]'::jsonb),
    'upcoming', coalesce((
      SELECT jsonb_agg(public.get_cinema_session_v2(session.id) ORDER BY session.scheduled_at)
      FROM public.cinema_sessions_v2 session
      WHERE session.state = 'scheduled'
        AND EXISTS (
          SELECT 1 FROM public.cinema_participants_v2 participant
          WHERE participant.session_id = session.id
            AND participant.user_id = _uid
            AND participant.status IN ('invited', 'joined')
        )
    ), '[]'::jsonb),
    'history', coalesce((
      SELECT jsonb_agg(public.get_cinema_session_v2(session.id) ORDER BY session.ended_at DESC)
      FROM public.cinema_sessions_v2 session
      WHERE session.state = 'ended'
        AND EXISTS (
          SELECT 1 FROM public.cinema_participants_v2 participant
          WHERE participant.session_id = session.id
            AND participant.user_id = _uid
        )
      LIMIT 20
    ), '[]'::jsonb),
    'gates', jsonb_build_object(
      'upload_enabled', coalesce(_gates.upload_enabled, false),
      'public_playback_enabled', coalesce(_gates.public_playback_enabled, false),
      'legal_approval_recorded', coalesce(_gates.legal_approval_recorded, false)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_cinema_control_v2(
  _session_id uuid,
  _expected_sequence bigint,
  _action text,
  _position_ms bigint,
  _idempotency_key uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _session public.cinema_sessions_v2%ROWTYPE;
  _role text;
  _duration_ms bigint;
  _existing public.cinema_control_events_v2%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF _action NOT IN ('play', 'pause', 'seek', 'end') OR _position_ms < 0 THEN
    RAISE EXCEPTION 'invalid_cinema_control' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO _existing
  FROM public.cinema_control_events_v2
  WHERE session_id = _session_id AND idempotency_key = _idempotency_key;

  SELECT session.*
  INTO _session
  FROM public.cinema_sessions_v2 session
  WHERE session.id = _session_id
  FOR UPDATE OF session;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'cinema_session_not_found' USING ERRCODE = '22023';
  END IF;

  SELECT media.duration_ms
  INTO _duration_ms
  FROM public.cinema_media_v2 media
  WHERE media.id = _session.media_id;

  IF _existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'session_id', _session.id,
      'idempotency_key', _idempotency_key,
      'playback', jsonb_build_object(
        'media_id', _session.media_id,
        'media_version', (SELECT media_version FROM public.cinema_media_v2 WHERE id = _session.media_id),
        'position_ms', _session.playback_position_ms,
        'playing', _session.playback_playing,
        'playback_rate', _session.playback_rate,
        'sequence', _session.playback_sequence,
        'server_timestamp', _session.playback_server_at,
        'last_action', _session.last_control_action
      )
    );
  END IF;

  SELECT CASE WHEN _session.host_id = _uid THEN 'host' ELSE participant.role END
  INTO _role
  FROM public.cinema_participants_v2 participant
  WHERE participant.session_id = _session_id
    AND participant.user_id = _uid
    AND participant.status = 'joined';

  IF _session.host_id = _uid THEN
    _role := 'host';
  END IF;
  IF _role NOT IN ('host', 'cohost') AND NOT (_role = 'moderator' AND _action = 'end') THEN
    RAISE EXCEPTION 'cinema_control_forbidden' USING ERRCODE = '42501';
  END IF;
  IF _session.state NOT IN ('live', 'paused') THEN
    RAISE EXCEPTION 'cinema_session_not_controllable' USING ERRCODE = '55000';
  END IF;
  IF _session.playback_sequence <> _expected_sequence THEN
    RAISE EXCEPTION 'cinema_sequence_conflict' USING ERRCODE = '40001';
  END IF;

  UPDATE public.cinema_sessions_v2
  SET
    playback_position_ms = least(_position_ms, _duration_ms),
    playback_playing = CASE
      WHEN _action = 'play' THEN true
      WHEN _action IN ('pause', 'end') THEN false
      ELSE playback_playing
    END,
    state = CASE
      WHEN _action = 'end' THEN 'ended'
      WHEN _action = 'play' THEN 'live'
      WHEN _action = 'pause' THEN 'paused'
      ELSE state
    END,
    ended_at = CASE WHEN _action = 'end' THEN now() ELSE ended_at END,
    playback_sequence = playback_sequence + 1,
    playback_server_at = now(),
    last_control_action = _action,
    updated_at = now()
  WHERE id = _session_id
  RETURNING * INTO _session;

  INSERT INTO public.cinema_control_events_v2 (
    session_id, actor_id, action, sequence, position_ms, idempotency_key, server_timestamp
  )
  VALUES (
    _session_id, _uid, _action, _session.playback_sequence,
    _session.playback_position_ms, _idempotency_key, _session.playback_server_at
  );

  RETURN jsonb_build_object(
    'session_id', _session.id,
    'idempotency_key', _idempotency_key,
    'playback', jsonb_build_object(
      'media_id', _session.media_id,
      'media_version', (SELECT media_version FROM public.cinema_media_v2 WHERE id = _session.media_id),
      'position_ms', _session.playback_position_ms,
      'playing', _session.playback_playing,
      'playback_rate', _session.playback_rate,
      'sequence', _session.playback_sequence,
      'server_timestamp', _session.playback_server_at,
      'last_action', _session.last_control_action
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_cinema_hub_v2() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_cinema_session_v2(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.apply_cinema_control_v2(uuid, bigint, text, bigint, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cinema_hub_v2() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_cinema_session_v2(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.apply_cinema_control_v2(uuid, bigint, text, bigint, uuid)
  TO authenticated, service_role;

COMMENT ON TABLE public.cinema_media_v2 IS
  'Storage references and editorial state only. Video bytes must never be committed to Git.';
COMMENT ON TABLE public.cinema_control_events_v2 IS
  'Server-sequenced playback controls without chat or participant PII payloads.';
COMMENT ON COLUMN public.cinema_sessions_v2.conversation_thread_id IS
  'Reuses the V2 Conversations core; Cinema must not create a parallel chat implementation.';

COMMIT;
