BEGIN;

-- V2-011: additive community spaces and events. This migration is versioned
-- only and must be validated in a disposable Supabase project before rollout.

CREATE TABLE IF NOT EXISTS public.community_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 64),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 3 AND 80),
  description text NOT NULL DEFAULT ''
    CHECK (length(description) <= 500),
  visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private', 'approval')),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_space_members (
  space_id uuid NOT NULL REFERENCES public.community_spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'moderator', 'member')),
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'invited', 'active', 'muted', 'banned', 'left', 'declined')),
  notification_level text NOT NULL DEFAULT 'important'
    CHECK (notification_level IN ('all', 'important', 'muted')),
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (space_id, user_id)
);

CREATE INDEX IF NOT EXISTS community_space_members_user_status_idx
  ON public.community_space_members (user_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES public.community_spaces(id) ON DELETE SET NULL,
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 3 AND 120),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  timezone text NOT NULL DEFAULT 'UTC' CHECK (length(timezone) BETWEEN 1 AND 64),
  capacity integer CHECK (capacity IS NULL OR capacity BETWEEN 1 AND 10000),
  audience text NOT NULL DEFAULT 'community'
    CHECK (audience IN ('community', 'space_members', 'invited')),
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  cinema_session_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_events_time_order
    CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS community_events_schedule_idx
  ON public.community_events (status, starts_at, id);

CREATE TABLE IF NOT EXISTS public.community_event_participants (
  event_id uuid NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'attending'
    CHECK (status IN ('invited', 'attending', 'declined', 'waitlist', 'cancelled')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_space_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  space_id uuid NOT NULL REFERENCES public.community_spaces(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  subject_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN (
    'space_created',
    'membership_requested',
    'membership_invited',
    'membership_accepted',
    'membership_declined',
    'membership_left',
    'membership_muted',
    'membership_banned',
    'role_changed',
    'event_created',
    'event_cancelled'
  )),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_space_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.community_spaces FROM anon, authenticated;
REVOKE ALL ON TABLE public.community_space_members FROM anon, authenticated;
REVOKE ALL ON TABLE public.community_events FROM anon, authenticated;
REVOKE ALL ON TABLE public.community_event_participants FROM anon, authenticated;
REVOKE ALL ON TABLE public.community_space_audit_log FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.v2_can_view_community_space(
  _space_id uuid,
  _viewer_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_spaces s
    WHERE s.id = _space_id
      AND s.status = 'active'
      AND NOT public.v2_community_users_blocked(s.owner_id, _viewer_id)
      AND (
        s.visibility = 'public'
        OR EXISTS (
          SELECT 1
          FROM public.community_space_members m
          WHERE m.space_id = s.id
            AND m.user_id = _viewer_id
            AND m.status IN ('active', 'muted')
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.v2_can_manage_community_space(
  _space_id uuid,
  _viewer_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_space_members m
    WHERE m.space_id = _space_id
      AND m.user_id = _viewer_id
      AND m.status = 'active'
      AND m.role IN ('owner', 'moderator')
  );
$$;

REVOKE ALL ON FUNCTION public.v2_can_view_community_space(uuid, uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.v2_can_manage_community_space(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.v2_can_view_community_space(uuid, uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.v2_can_manage_community_space(uuid, uuid)
  TO authenticated, service_role;

CREATE POLICY "community spaces visible to eligible members"
  ON public.community_spaces FOR SELECT TO authenticated
  USING (public.v2_can_view_community_space(id, auth.uid()));

CREATE POLICY "community memberships participant or manager read"
  ON public.community_space_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.v2_can_manage_community_space(space_id, auth.uid())
  );

CREATE POLICY "community events audience read"
  ON public.community_events FOR SELECT TO authenticated
  USING (
    status <> 'cancelled'
    AND (
      audience = 'community'
      OR (space_id IS NOT NULL AND public.v2_can_view_community_space(space_id, auth.uid()))
      OR EXISTS (
        SELECT 1
        FROM public.community_event_participants ep
        WHERE ep.event_id = id
          AND ep.user_id = auth.uid()
          AND ep.status IN ('invited', 'attending', 'waitlist')
      )
    )
  );

CREATE POLICY "community event participant read"
  ON public.community_event_participants FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.community_events e
      WHERE e.id = event_id
        AND (
          e.creator_id = auth.uid()
          OR (
            e.space_id IS NOT NULL
            AND public.v2_can_manage_community_space(e.space_id, auth.uid())
          )
        )
    )
  );

CREATE POLICY "community audit managers read"
  ON public.community_space_audit_log FOR SELECT TO authenticated
  USING (public.v2_can_manage_community_space(space_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.create_community_space(
  _slug text,
  _name text,
  _description text DEFAULT '',
  _visibility text DEFAULT 'public'
)
RETURNS public.community_spaces
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _result public.community_spaces;
BEGIN
  IF NOT public.v2_community_user_is_approved(_uid) THEN
    RAISE EXCEPTION 'profile_not_approved' USING ERRCODE = '42501';
  END IF;
  IF _slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     OR length(_slug) NOT BETWEEN 3 AND 64
     OR length(btrim(coalesce(_name, ''))) NOT BETWEEN 3 AND 80
     OR length(coalesce(_description, '')) > 500
     OR _visibility NOT IN ('public', 'private', 'approval') THEN
    RAISE EXCEPTION 'invalid_space' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.community_spaces (
    slug, name, description, visibility, owner_id
  )
  VALUES (
    lower(_slug), btrim(_name), btrim(coalesce(_description, '')), _visibility, _uid
  )
  RETURNING * INTO _result;
  INSERT INTO public.community_space_members (
    space_id, user_id, role, status, joined_at
  )
  VALUES (_result.id, _uid, 'owner', 'active', now());
  INSERT INTO public.community_space_audit_log (
    space_id, actor_id, subject_user_id, action
  )
  VALUES (_result.id, _uid, _uid, 'space_created');
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_community_space_membership(_space_id uuid)
RETURNS public.community_space_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _space public.community_spaces;
  _result public.community_space_members;
  _request_count integer;
BEGIN
  IF NOT public.v2_community_user_is_approved(_uid) THEN
    RAISE EXCEPTION 'profile_not_approved' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO _space
  FROM public.community_spaces
  WHERE id = _space_id AND status = 'active';
  IF _space.id IS NULL
     OR public.v2_community_users_blocked(_space.owner_id, _uid) THEN
    RAISE EXCEPTION 'space_not_available' USING ERRCODE = '42501';
  END IF;
  SELECT count(*) INTO _request_count
  FROM public.community_space_members
  WHERE user_id = _uid
    AND requested_at >= now() - interval '24 hours';
  IF _request_count >= 15 THEN
    RAISE EXCEPTION 'membership_rate_limited' USING ERRCODE = 'P0001';
  END IF;
  IF _space.visibility = 'private' AND NOT EXISTS (
    SELECT 1 FROM public.community_space_members
    WHERE space_id = _space_id
      AND user_id = _uid
      AND status = 'invited'
  ) THEN
    RAISE EXCEPTION 'invitation_required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.community_space_members (
    space_id,
    user_id,
    role,
    status,
    joined_at
  )
  VALUES (
    _space_id,
    _uid,
    'member',
    CASE WHEN _space.visibility = 'approval' THEN 'requested' ELSE 'active' END,
    CASE WHEN _space.visibility = 'approval' THEN NULL ELSE now() END
  )
  ON CONFLICT (space_id, user_id)
  DO UPDATE SET
    status = CASE
      WHEN public.community_space_members.status = 'banned' THEN 'banned'
      WHEN _space.visibility = 'approval' THEN 'requested'
      ELSE 'active'
    END,
    joined_at = CASE
      WHEN _space.visibility = 'approval' THEN public.community_space_members.joined_at
      ELSE coalesce(public.community_space_members.joined_at, now())
    END,
    updated_at = now()
  RETURNING * INTO _result;

  IF _result.status = 'banned' THEN
    RAISE EXCEPTION 'membership_banned' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.community_space_audit_log (
    space_id,
    actor_id,
    subject_user_id,
    action
  )
  VALUES (
    _space_id,
    _uid,
    _uid,
    CASE WHEN _result.status = 'requested'
      THEN 'membership_requested'
      ELSE 'membership_accepted'
    END
  );
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.invite_community_space_member(
  _space_id uuid,
  _member_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _actor uuid := auth.uid();
BEGIN
  IF NOT public.v2_can_manage_community_space(_space_id, _actor)
     OR NOT public.v2_community_user_is_approved(_member_id)
     OR public.v2_community_users_blocked(_actor, _member_id) THEN
    RAISE EXCEPTION 'space_permission_denied' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.community_space_members (
    space_id, user_id, role, status, invited_by
  )
  VALUES (_space_id, _member_id, 'member', 'invited', _actor)
  ON CONFLICT (space_id, user_id)
  DO UPDATE SET
    status = CASE
      WHEN public.community_space_members.status = 'banned' THEN 'banned'
      ELSE 'invited'
    END,
    invited_by = _actor,
    updated_at = now();
  IF EXISTS (
    SELECT 1 FROM public.community_space_members
    WHERE space_id = _space_id AND user_id = _member_id AND status = 'banned'
  ) THEN
    RAISE EXCEPTION 'membership_banned' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.community_space_audit_log (
    space_id, actor_id, subject_user_id, action
  )
  VALUES (_space_id, _actor, _member_id, 'membership_invited');
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_community_space_membership(
  _space_id uuid,
  _member_id uuid,
  _accept boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _actor uuid := auth.uid();
  _updated integer;
BEGIN
  IF NOT public.v2_can_manage_community_space(_space_id, _actor) THEN
    RAISE EXCEPTION 'space_permission_denied' USING ERRCODE = '42501';
  END IF;
  UPDATE public.community_space_members
  SET
    status = CASE WHEN _accept THEN 'active' ELSE 'declined' END,
    joined_at = CASE WHEN _accept THEN coalesce(joined_at, now()) ELSE joined_at END,
    updated_at = now()
  WHERE space_id = _space_id
    AND user_id = _member_id
    AND status IN ('requested', 'invited');
  GET DIAGNOSTICS _updated = ROW_COUNT;
  IF _updated <> 1 THEN
    RETURN false;
  END IF;
  INSERT INTO public.community_space_audit_log (
    space_id,
    actor_id,
    subject_user_id,
    action
  )
  VALUES (
    _space_id,
    _actor,
    _member_id,
    CASE WHEN _accept THEN 'membership_accepted' ELSE 'membership_declined' END
  );
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.moderate_community_space_member(
  _space_id uuid,
  _member_id uuid,
  _action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _actor uuid := auth.uid();
  _updated integer;
BEGIN
  IF NOT public.v2_can_manage_community_space(_space_id, _actor)
     OR _member_id = _actor
     OR _action NOT IN ('mute', 'unmute', 'ban') THEN
    RAISE EXCEPTION 'space_permission_denied' USING ERRCODE = '42501';
  END IF;
  UPDATE public.community_space_members
  SET
    status = CASE
      WHEN _action = 'mute' THEN 'muted'
      WHEN _action = 'unmute' THEN 'active'
      ELSE 'banned'
    END,
    updated_at = now()
  WHERE space_id = _space_id
    AND user_id = _member_id
    AND role = 'member'
    AND status IN ('active', 'muted');
  GET DIAGNOSTICS _updated = ROW_COUNT;
  IF _updated = 1 THEN
    INSERT INTO public.community_space_audit_log (
      space_id, actor_id, subject_user_id, action
    )
    VALUES (
      _space_id,
      _actor,
      _member_id,
      CASE
        WHEN _action = 'mute' THEN 'membership_muted'
        WHEN _action = 'ban' THEN 'membership_banned'
        ELSE 'membership_accepted'
      END
    );
  END IF;
  RETURN _updated = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_community_event(
  _space_id uuid,
  _title text,
  _description text,
  _starts_at timestamptz,
  _ends_at timestamptz,
  _timezone text,
  _capacity integer DEFAULT NULL,
  _audience text DEFAULT 'space_members'
)
RETURNS public.community_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _actor uuid := auth.uid();
  _result public.community_events;
BEGIN
  IF NOT public.v2_can_manage_community_space(_space_id, _actor) THEN
    RAISE EXCEPTION 'space_permission_denied' USING ERRCODE = '42501';
  END IF;
  IF length(btrim(coalesce(_title, ''))) NOT BETWEEN 3 AND 120
     OR length(coalesce(_description, '')) > 2000
     OR _starts_at <= now()
     OR (_ends_at IS NOT NULL AND _ends_at <= _starts_at)
     OR length(coalesce(_timezone, '')) NOT BETWEEN 1 AND 64
     OR (_capacity IS NOT NULL AND _capacity NOT BETWEEN 1 AND 10000)
     OR _audience NOT IN ('community', 'space_members', 'invited') THEN
    RAISE EXCEPTION 'invalid_event' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.community_events (
    space_id,
    creator_id,
    title,
    description,
    starts_at,
    ends_at,
    timezone,
    capacity,
    audience
  )
  VALUES (
    _space_id,
    _actor,
    btrim(_title),
    btrim(coalesce(_description, '')),
    _starts_at,
    _ends_at,
    _timezone,
    _capacity,
    _audience
  )
  RETURNING * INTO _result;
  INSERT INTO public.community_event_participants (event_id, user_id, status)
  VALUES (_result.id, _actor, 'attending');
  INSERT INTO public.community_space_audit_log (
    space_id, actor_id, subject_user_id, action, details
  )
  VALUES (
    _space_id, _actor, _actor, 'event_created', jsonb_build_object('eventId', _result.id)
  );
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_community_event(_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _actor uuid := auth.uid();
  _space_id uuid;
  _updated integer;
BEGIN
  SELECT space_id INTO _space_id
  FROM public.community_events
  WHERE id = _event_id;
  IF _space_id IS NULL
     OR NOT public.v2_can_manage_community_space(_space_id, _actor) THEN
    RAISE EXCEPTION 'space_permission_denied' USING ERRCODE = '42501';
  END IF;
  UPDATE public.community_events
  SET status = 'cancelled', updated_at = now()
  WHERE id = _event_id AND status = 'scheduled';
  GET DIAGNOSTICS _updated = ROW_COUNT;
  IF _updated = 1 THEN
    INSERT INTO public.community_space_audit_log (
      space_id, actor_id, subject_user_id, action, details
    )
    VALUES (
      _space_id, _actor, _actor, 'event_cancelled', jsonb_build_object('eventId', _event_id)
    );
  END IF;
  RETURN _updated = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_community_space(_space_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _updated integer;
BEGIN
  UPDATE public.community_space_members
  SET status = 'left', updated_at = now()
  WHERE space_id = _space_id
    AND user_id = _uid
    AND role <> 'owner'
    AND status IN ('active', 'muted', 'requested', 'invited');
  GET DIAGNOSTICS _updated = ROW_COUNT;
  IF _updated = 1 THEN
    INSERT INTO public.community_space_audit_log (
      space_id, actor_id, subject_user_id, action
    )
    VALUES (_space_id, _uid, _uid, 'membership_left');
  END IF;
  RETURN _updated = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_community_event_attendance(
  _event_id uuid,
  _attending boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _event public.community_events;
  _attending_count integer;
BEGIN
  IF NOT public.v2_community_user_is_approved(_uid) THEN
    RAISE EXCEPTION 'profile_not_approved' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO _event
  FROM public.community_events
  WHERE id = _event_id
    AND status = 'scheduled'
    AND starts_at > now();
  IF _event.id IS NULL THEN
    RAISE EXCEPTION 'event_not_available' USING ERRCODE = '42501';
  END IF;
  IF _event.space_id IS NOT NULL
     AND _event.audience <> 'community'
     AND NOT public.v2_can_view_community_space(_event.space_id, _uid) THEN
    RAISE EXCEPTION 'event_permission_denied' USING ERRCODE = '42501';
  END IF;
  IF _attending AND _event.capacity IS NOT NULL THEN
    SELECT count(*) INTO _attending_count
    FROM public.community_event_participants
    WHERE event_id = _event_id AND status = 'attending';
    IF _attending_count >= _event.capacity THEN
      INSERT INTO public.community_event_participants (event_id, user_id, status)
      VALUES (_event_id, _uid, 'waitlist')
      ON CONFLICT (event_id, user_id)
      DO UPDATE SET status = 'waitlist', updated_at = now();
      RETURN false;
    END IF;
  END IF;
  INSERT INTO public.community_event_participants (event_id, user_id, status)
  VALUES (_event_id, _uid, CASE WHEN _attending THEN 'attending' ELSE 'cancelled' END)
  ON CONFLICT (event_id, user_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = now();
  RETURN _attending;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_community_global_message_v2(_content text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _clean text := btrim(coalesce(_content, ''));
  _id uuid;
  _recent_count integer;
BEGIN
  IF NOT public.v2_community_user_is_approved(_uid) THEN
    RAISE EXCEPTION 'profile_not_approved' USING ERRCODE = '42501';
  END IF;
  IF length(_clean) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'invalid_message' USING ERRCODE = '22023';
  END IF;
  IF public.check_text_restricted(_clean) IS NOT NULL THEN
    RAISE EXCEPTION 'restricted_content' USING ERRCODE = '23514';
  END IF;
  SELECT count(*) INTO _recent_count
  FROM public.global_messages
  WHERE sender_id = _uid
    AND created_at >= now() - interval '1 minute';
  IF _recent_count >= 8 THEN
    RAISE EXCEPTION 'message_rate_limited' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.global_messages (sender_id, content)
  VALUES (_uid, _clean)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_community_hub_v2(_message_limit integer DEFAULT 30)
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
  IF NOT public.v2_community_user_is_approved(_uid) THEN
    RAISE EXCEPTION 'profile_not_approved' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'spaces',
    coalesce((
      SELECT jsonb_agg(to_jsonb(space_row) ORDER BY space_row.member_count DESC, space_row.name)
      FROM (
        SELECT
          s.id,
          s.slug,
          s.name,
          s.description,
          s.visibility,
          (
            SELECT count(*)::integer
            FROM public.community_space_members count_member
            WHERE count_member.space_id = s.id
              AND count_member.status IN ('active', 'muted')
          ) AS member_count,
          coalesce(my_member.status, 'none') AS membership_state,
          my_member.role AS member_role
        FROM public.community_spaces s
        LEFT JOIN public.community_space_members my_member
          ON my_member.space_id = s.id AND my_member.user_id = _uid
        WHERE s.status = 'active'
          AND (
            s.visibility IN ('public', 'approval')
            OR my_member.status IN ('active', 'muted', 'invited', 'requested')
          )
          AND NOT public.v2_community_users_blocked(s.owner_id, _uid)
        LIMIT 30
      ) space_row
    ), '[]'::jsonb),
    'events',
    coalesce((
      SELECT jsonb_agg(to_jsonb(event_row) ORDER BY event_row.starts_at, event_row.id)
      FROM (
        SELECT
          e.id,
          e.space_id,
          e.title,
          e.description,
          e.starts_at,
          e.ends_at,
          e.timezone,
          e.capacity,
          e.status,
          (
            SELECT count(*)::integer
            FROM public.community_event_participants count_participant
            WHERE count_participant.event_id = e.id
              AND count_participant.status = 'attending'
          ) AS participant_count,
          EXISTS (
            SELECT 1
            FROM public.community_event_participants mine
            WHERE mine.event_id = e.id
              AND mine.user_id = _uid
              AND mine.status = 'attending'
          ) AS attending
        FROM public.community_events e
        WHERE e.status = 'scheduled'
          AND e.starts_at >= now() - interval '2 hours'
          AND (
            e.audience = 'community'
            OR (
              e.space_id IS NOT NULL
              AND public.v2_can_view_community_space(e.space_id, _uid)
            )
            OR EXISTS (
              SELECT 1
              FROM public.community_event_participants invited
              WHERE invited.event_id = e.id
                AND invited.user_id = _uid
                AND invited.status IN ('invited', 'attending', 'waitlist')
            )
          )
        ORDER BY e.starts_at, e.id
        LIMIT 20
      ) event_row
    ), '[]'::jsonb),
    'messages',
    coalesce((
      SELECT jsonb_agg(to_jsonb(message_row) ORDER BY message_row.created_at)
      FROM (
        SELECT
          gm.id,
          gm.sender_id,
          p.full_name AS sender_name,
          p.photo_url AS sender_photo_url,
          gm.content,
          gm.created_at,
          gm.pinned_at
        FROM public.global_messages gm
        JOIN public.profiles p ON p.id = gm.sender_id
        WHERE NOT public.v2_community_users_blocked(gm.sender_id, _uid)
        ORDER BY gm.created_at DESC, gm.id DESC
        LIMIT greatest(1, least(coalesce(_message_limit, 30), 50))
      ) message_row
    ), '[]'::jsonb),
    'presence',
    coalesce((
      SELECT jsonb_agg(to_jsonb(presence_row) ORDER BY presence_row.state, presence_row.name)
      FROM (
        SELECT
          p.id AS user_id,
          p.full_name AS name,
          p.photo_url,
          CASE
            WHEN pls.last_seen_at >= now() - interval '5 minutes' THEN 'online'
            ELSE 'recent'
          END AS state
        FROM public.presence_last_seen pls
        JOIN public.profiles p ON p.id = pls.user_id
        LEFT JOIN public.community_privacy_settings privacy ON privacy.user_id = p.id
        WHERE pls.last_seen_at >= now() - interval '24 hours'
          AND p.id <> _uid
          AND coalesce(privacy.discovery_visibility, 'community') <> 'hidden'
          AND public.v2_community_user_is_approved(p.id)
          AND NOT public.v2_community_users_blocked(p.id, _uid)
        ORDER BY pls.last_seen_at DESC
        LIMIT 12
      ) presence_row
    ), '[]'::jsonb)
  ) INTO _result;
  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.request_community_space_membership(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_community_space(text, text, text, text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.invite_community_space_member(uuid, uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_community_space_membership(uuid, uuid, boolean)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leave_community_space(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.moderate_community_space_member(uuid, uuid, text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_community_event(
  uuid, text, text, timestamptz, timestamptz, text, integer, text
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_community_event(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_community_event_attendance(uuid, boolean)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_community_global_message_v2(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_community_hub_v2(integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.request_community_space_membership(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_community_space(text, text, text, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_community_space_member(uuid, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_community_space_membership(uuid, uuid, boolean)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_community_space(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_community_space_member(uuid, uuid, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_community_event(
  uuid, text, text, timestamptz, timestamptz, text, integer, text
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_community_event(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_community_event_attendance(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_community_global_message_v2(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_hub_v2(integer) TO authenticated;

COMMENT ON TABLE public.community_spaces IS
  'Non-romantic community spaces with local membership and moderation roles.';
COMMENT ON TABLE public.community_space_audit_log IS
  'Append-only audit trail for local community membership and moderation actions.';
COMMENT ON FUNCTION public.get_community_hub_v2(integer) IS
  'Community hub aggregator preserving global_messages and excluding dating state.';

COMMIT;
