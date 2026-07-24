BEGIN;

-- V2-012 is additive and preserves messages/global_messages in place.
-- It must be validated against a disposable snapshot before any rollout.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS client_message_id uuid;
ALTER TABLE public.global_messages
  ADD COLUMN IF NOT EXISTS client_message_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS messages_sender_client_message_unique
  ON public.messages (sender_id, client_message_id)
  WHERE client_message_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS global_messages_sender_client_message_unique
  ON public.global_messages (sender_id, client_message_id)
  WHERE client_message_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.conversation_threads_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context text NOT NULL CHECK (context IN (
    'social', 'space', 'cinema', 'support'
  )),
  source_domain text NOT NULL CHECK (source_domain IN (
    'community_relationship', 'community_space', 'cinema_session', 'support'
  )),
  source_key text NOT NULL,
  state text NOT NULL DEFAULT 'request'
    CHECK (state IN ('request', 'active', 'closed')),
  title text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_domain, source_key)
);

CREATE TABLE IF NOT EXISTS public.conversation_participants_v2 (
  thread_id uuid NOT NULL REFERENCES public.conversation_threads_v2(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'moderator', 'member')),
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'active', 'blocked', 'left', 'removed')),
  joined_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.conversation_messages_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.conversation_threads_v2(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  client_message_id uuid NOT NULL,
  content text NOT NULL CHECK (length(btrim(content)) BETWEEN 1 AND 4000),
  reply_to_id uuid REFERENCES public.conversation_messages_v2(id) ON DELETE SET NULL,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sender_id, client_message_id)
);

CREATE INDEX IF NOT EXISTS conversation_messages_v2_cursor_idx
  ON public.conversation_messages_v2 (thread_id, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS public.conversation_receipts_v2 (
  message_id uuid NOT NULL REFERENCES public.conversation_messages_v2(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delivered_at timestamptz,
  read_at timestamptz,
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.conversation_preferences_v2 (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  thread_key text NOT NULL,
  muted boolean NOT NULL DEFAULT false,
  pinned boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, thread_key),
  CHECK (
    thread_key ~ '^(thread|legacy-match|global|space|cinema):[A-Za-z0-9_-]+$'
  )
);

CREATE TABLE IF NOT EXISTS public.conversation_attachments_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.conversation_messages_v2(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  storage_path text NOT NULL UNIQUE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'audio', 'document')),
  mime_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size BETWEEN 1 AND 15728640),
  original_name text NOT NULL CHECK (length(original_name) BETWEEN 1 AND 180),
  status text NOT NULL DEFAULT 'ready'
    CHECK (status IN ('pending', 'ready', 'quarantined', 'removed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_threads_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_receipts_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_preferences_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_attachments_v2 ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.conversation_threads_v2 FROM anon, authenticated;
REVOKE ALL ON TABLE public.conversation_participants_v2 FROM anon, authenticated;
REVOKE ALL ON TABLE public.conversation_messages_v2 FROM anon, authenticated;
REVOKE ALL ON TABLE public.conversation_receipts_v2 FROM anon, authenticated;
REVOKE ALL ON TABLE public.conversation_preferences_v2 FROM anon, authenticated;
REVOKE ALL ON TABLE public.conversation_attachments_v2 FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.v2_is_conversation_participant(
  _thread_id uuid,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants_v2 participant
    JOIN public.conversation_threads_v2 thread ON thread.id = participant.thread_id
    WHERE participant.thread_id = _thread_id
      AND participant.user_id = _user_id
      AND participant.status = 'active'
      AND thread.state = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.v2_dating_messages_enabled(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.dating_memberships membership
    WHERE membership.user_id = _user_id
      AND membership.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.v2_can_access_legacy_match(
  _match_id uuid,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.matches match
    JOIN public.dating_memberships membership ON membership.user_id = _user_id
    WHERE match.id = _match_id
      AND (_user_id = match.user_a OR _user_id = match.user_b)
      AND (
        membership.status = 'active'
        OR (
          membership.status = 'paused_by_commitment'
          AND EXISTS (
            SELECT 1
            FROM public.relationship_commitments commitment
            WHERE commitment.match_id = match.id
              AND commitment.status = 'active'
              AND (_user_id = commitment.user_a OR _user_id = commitment.user_b)
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.v2_is_conversation_participant(uuid, uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.v2_dating_messages_enabled(uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.v2_can_access_legacy_match(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.v2_is_conversation_participant(uuid, uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.v2_dating_messages_enabled(uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.v2_can_access_legacy_match(uuid, uuid)
  TO authenticated, service_role;

CREATE POLICY "conversation threads participants read"
  ON public.conversation_threads_v2 FOR SELECT TO authenticated
  USING (public.v2_is_conversation_participant(id, auth.uid()));

CREATE POLICY "conversation participants same thread read"
  ON public.conversation_participants_v2 FOR SELECT TO authenticated
  USING (public.v2_is_conversation_participant(thread_id, auth.uid()));

CREATE POLICY "conversation messages participants read"
  ON public.conversation_messages_v2 FOR SELECT TO authenticated
  USING (public.v2_is_conversation_participant(thread_id, auth.uid()));

CREATE POLICY "conversation receipts participant read"
  ON public.conversation_receipts_v2 FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.conversation_messages_v2 message
      WHERE message.id = message_id
        AND message.sender_id = auth.uid()
    )
  );

CREATE POLICY "conversation preferences owner read"
  ON public.conversation_preferences_v2 FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "conversation attachments participants read"
  ON public.conversation_attachments_v2 FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversation_messages_v2 message
      WHERE message.id = message_id
        AND public.v2_is_conversation_participant(message.thread_id, auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.create_social_conversation_request_v2(
  _target_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _source_key text;
  _thread_id uuid;
  _messages_from text;
  _connected boolean;
  _allowed boolean;
BEGIN
  IF _target_user_id IS NULL
     OR _target_user_id = _uid
     OR NOT public.v2_community_user_is_approved(_uid)
     OR NOT public.v2_community_user_is_approved(_target_user_id)
     OR public.v2_community_users_blocked(_uid, _target_user_id) THEN
    RAISE EXCEPTION 'conversation_request_not_available' USING ERRCODE = '42501';
  END IF;

  SELECT coalesce(settings.messages_from, 'connections')
  INTO _messages_from
  FROM (SELECT 1) singleton
  LEFT JOIN public.community_privacy_settings settings
    ON settings.user_id = _target_user_id;

  SELECT EXISTS (
    SELECT 1
    FROM public.social_relationships relationship
    WHERE relationship.kind = 'connection'
      AND relationship.status = 'active'
      AND (
        (relationship.source_user_id = _uid
          AND relationship.target_user_id = _target_user_id)
        OR
        (relationship.source_user_id = _target_user_id
          AND relationship.target_user_id = _uid)
      )
  ) INTO _connected;

  _allowed := _messages_from = 'community'
    OR (_messages_from = 'connections' AND _connected)
    OR (
      _messages_from = 'followers'
      AND EXISTS (
        SELECT 1
        FROM public.social_relationships relationship
        WHERE relationship.kind = 'follow'
          AND relationship.status = 'active'
          AND relationship.source_user_id = _uid
          AND relationship.target_user_id = _target_user_id
      )
    );
  IF NOT _allowed THEN
    RAISE EXCEPTION 'conversation_request_not_available' USING ERRCODE = '42501';
  END IF;

  _source_key := least(_uid::text, _target_user_id::text)
    || ':' || greatest(_uid::text, _target_user_id::text);
  INSERT INTO public.conversation_threads_v2 (
    context, source_domain, source_key, state, created_by
  )
  VALUES (
    'social',
    'community_relationship',
    _source_key,
    CASE WHEN _connected THEN 'active' ELSE 'request' END,
    _uid
  )
  ON CONFLICT (source_domain, source_key)
  DO UPDATE SET
    state = CASE
      WHEN public.conversation_threads_v2.state = 'closed' THEN EXCLUDED.state
      ELSE public.conversation_threads_v2.state
    END,
    created_by = CASE
      WHEN public.conversation_threads_v2.state = 'closed' THEN EXCLUDED.created_by
      ELSE public.conversation_threads_v2.created_by
    END,
    updated_at = now()
  RETURNING id INTO _thread_id;

  INSERT INTO public.conversation_participants_v2 (
    thread_id, user_id, role, status, joined_at
  )
  VALUES
    (_thread_id, _uid, 'member', 'active', now()),
    (
      _thread_id,
      _target_user_id,
      'member',
      CASE WHEN _connected THEN 'active' ELSE 'requested' END,
      CASE WHEN _connected THEN now() ELSE NULL END
    )
  ON CONFLICT (thread_id, user_id)
  DO UPDATE SET
    status = CASE
      WHEN public.conversation_participants_v2.status IN ('left', 'removed')
        THEN EXCLUDED.status
      ELSE public.conversation_participants_v2.status
    END,
    joined_at = coalesce(public.conversation_participants_v2.joined_at, EXCLUDED.joined_at),
    updated_at = now();

  RETURN _thread_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_conversation_request_v2(
  _thread_id uuid,
  _accept boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _updated integer;
BEGIN
  UPDATE public.conversation_participants_v2 participant
  SET
    status = CASE WHEN _accept THEN 'active' ELSE 'removed' END,
    joined_at = CASE WHEN _accept THEN now() ELSE participant.joined_at END,
    updated_at = now()
  FROM public.conversation_threads_v2 thread
  WHERE participant.thread_id = _thread_id
    AND participant.user_id = _uid
    AND participant.status = 'requested'
    AND thread.id = participant.thread_id
    AND thread.context = 'social'
    AND thread.state = 'request';
  GET DIAGNOSTICS _updated = ROW_COUNT;
  IF _updated <> 1 THEN
    RAISE EXCEPTION 'conversation_request_not_available' USING ERRCODE = '42501';
  END IF;

  UPDATE public.conversation_threads_v2
  SET state = CASE WHEN _accept THEN 'active' ELSE 'closed' END,
      updated_at = now()
  WHERE id = _thread_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_conversation_inbox_v2()
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

  WITH canonical_threads AS (
    SELECT
      'thread:' || thread.id::text AS thread_key,
      thread.context,
      coalesce(thread.title, other_profile.full_name, 'Conversa') AS title,
      other_profile.photo_url AS avatar_url,
      coalesce(last_message.content, '') AS preview,
      coalesce(last_message.created_at, thread.updated_at) AS updated_at,
      (
        SELECT count(*)::integer
        FROM public.conversation_messages_v2 unread_message
        LEFT JOIN public.conversation_receipts_v2 receipt
          ON receipt.message_id = unread_message.id AND receipt.user_id = _uid
        WHERE unread_message.thread_id = thread.id
          AND unread_message.sender_id <> _uid
          AND unread_message.deleted_at IS NULL
          AND receipt.read_at IS NULL
      ) AS unread_count,
      CASE WHEN thread.state = 'request' THEN 'request' ELSE 'active' END AS thread_state,
      CASE
        WHEN thread.state <> 'request' THEN NULL::text
        WHEN participant.status = 'requested' THEN 'incoming'::text
        ELSE 'outgoing'::text
      END AS request_direction,
      coalesce(preference.muted, false) AS muted,
      coalesce(preference.pinned, false) AS pinned,
      coalesce(preference.archived, false) AS archived
    FROM public.conversation_threads_v2 thread
    JOIN public.conversation_participants_v2 participant
      ON participant.thread_id = thread.id
      AND participant.user_id = _uid
      AND participant.status IN ('active', 'requested')
    LEFT JOIN LATERAL (
      SELECT profile.full_name, profile.photo_url
      FROM public.conversation_participants_v2 other_participant
      JOIN public.profiles profile ON profile.id = other_participant.user_id
      WHERE other_participant.thread_id = thread.id
        AND other_participant.user_id <> _uid
      ORDER BY other_participant.joined_at NULLS LAST, other_participant.user_id
      LIMIT 1
    ) other_profile ON true
    LEFT JOIN public.conversation_preferences_v2 preference
      ON preference.user_id = _uid
      AND preference.thread_key = 'thread:' || thread.id::text
    LEFT JOIN LATERAL (
      SELECT message.content, message.created_at
      FROM public.conversation_messages_v2 message
      WHERE message.thread_id = thread.id
        AND message.deleted_at IS NULL
      ORDER BY message.created_at DESC, message.id DESC
      LIMIT 1
    ) last_message ON true
    WHERE thread.state IN ('request', 'active')
  ),
  legacy_romantic AS (
    SELECT
      'legacy-match:' || match.id::text AS thread_key,
      CASE WHEN EXISTS (
        SELECT 1
        FROM public.relationship_commitments commitment
        WHERE commitment.match_id = match.id
          AND commitment.status = 'active'
      ) THEN 'purpose'::text ELSE 'romantic'::text END AS context,
      coalesce(other_profile.full_name, 'Conversa') AS title,
      other_profile.photo_url AS avatar_url,
      coalesce(last_message.content, '') AS preview,
      coalesce(last_message.created_at, match.created_at) AS updated_at,
      (
        SELECT count(*)::integer
        FROM public.messages unread_message
        WHERE unread_message.match_id = match.id
          AND unread_message.sender_id <> _uid
          AND unread_message.read_at IS NULL
      ) AS unread_count,
      'active'::text AS thread_state,
      NULL::text AS request_direction,
      coalesce(preference.muted, false) AS muted,
      coalesce(preference.pinned, false) AS pinned,
      coalesce(preference.archived, false) AS archived
    FROM public.matches match
    JOIN public.profiles other_profile
      ON other_profile.id = CASE
        WHEN match.user_a = _uid THEN match.user_b
        ELSE match.user_a
      END
    LEFT JOIN public.conversation_preferences_v2 preference
      ON preference.user_id = _uid
      AND preference.thread_key = 'legacy-match:' || match.id::text
    LEFT JOIN LATERAL (
      SELECT message.content, message.created_at
      FROM public.messages message
      WHERE message.match_id = match.id
      ORDER BY message.created_at DESC, message.id DESC
      LIMIT 1
    ) last_message ON true
    WHERE public.v2_can_access_legacy_match(match.id, _uid)
      AND NOT public.v2_community_users_blocked(_uid, other_profile.id)
  ),
  global_thread AS (
    SELECT
      'global:community'::text AS thread_key,
      'global'::text AS context,
      'Comunidade'::text AS title,
      NULL::text AS avatar_url,
      coalesce(last_message.content, '') AS preview,
      coalesce(last_message.created_at, now()) AS updated_at,
      0::integer AS unread_count,
      'active'::text AS thread_state,
      NULL::text AS request_direction,
      coalesce(preference.muted, false) AS muted,
      coalesce(preference.pinned, false) AS pinned,
      coalesce(preference.archived, false) AS archived
    FROM (SELECT 1) singleton
    LEFT JOIN public.conversation_preferences_v2 preference
      ON preference.user_id = _uid
      AND preference.thread_key = 'global:community'
    LEFT JOIN LATERAL (
      SELECT message.content, message.created_at
      FROM public.global_messages message
      WHERE NOT public.v2_community_users_blocked(message.sender_id, _uid)
      ORDER BY message.created_at DESC, message.id DESC
      LIMIT 1
    ) last_message ON true
  ),
  all_threads AS (
    SELECT * FROM canonical_threads
    UNION ALL
    SELECT * FROM legacy_romantic
    UNION ALL
    SELECT * FROM global_thread
  )
  SELECT coalesce(
    jsonb_agg(
      to_jsonb(inbox_row) - 'archived'
      ORDER BY inbox_row.pinned DESC, inbox_row.updated_at DESC, inbox_row.thread_key
    ) FILTER (WHERE inbox_row.archived = false),
    '[]'::jsonb
  )
  INTO _result
  FROM all_threads inbox_row;

  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_conversation_messages_v2(
  _thread_key text,
  _cursor_created_at timestamptz DEFAULT NULL,
  _cursor_id uuid DEFAULT NULL,
  _limit integer DEFAULT 40
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _thread_id uuid;
  _match_id uuid;
  _page_size integer := greatest(1, least(coalesce(_limit, 40), 80));
  _result jsonb;
BEGIN
  IF NOT public.v2_community_user_is_approved(_uid) THEN
    RAISE EXCEPTION 'profile_not_approved' USING ERRCODE = '42501';
  END IF;

  IF _thread_key = 'global:community' THEN
    WITH page AS (
      SELECT
        message.id,
        message.client_message_id,
        message.sender_id,
        profile.full_name AS sender_name,
        message.content,
        message.created_at,
        message.edited_at,
        message.reply_to_id,
        CASE WHEN message.sender_id = _uid THEN 'sent' ELSE 'delivered' END AS delivery_state
      FROM public.global_messages message
      JOIN public.profiles profile ON profile.id = message.sender_id
      WHERE NOT public.v2_community_users_blocked(message.sender_id, _uid)
        AND (
          _cursor_created_at IS NULL
          OR (message.created_at, message.id) < (_cursor_created_at, _cursor_id)
        )
      ORDER BY message.created_at DESC, message.id DESC
      LIMIT _page_size + 1
    ),
    visible AS (
      SELECT * FROM page ORDER BY created_at DESC, id DESC LIMIT _page_size
    )
    SELECT jsonb_build_object(
      'items', coalesce((
        SELECT jsonb_agg(to_jsonb(item) ORDER BY item.created_at, item.id) FROM visible item
      ), '[]'::jsonb),
      'hasMore', (SELECT count(*) > _page_size FROM page),
      'nextCursor', (
        SELECT jsonb_build_object('createdAt', item.created_at, 'id', item.id)
        FROM visible item ORDER BY item.created_at, item.id LIMIT 1
      )
    ) INTO _result;
    RETURN _result;
  END IF;

  IF _thread_key LIKE 'legacy-match:%' THEN
    _match_id := substring(_thread_key FROM 14)::uuid;
    IF NOT public.v2_can_access_legacy_match(_match_id, _uid) THEN
      RAISE EXCEPTION 'thread_not_available' USING ERRCODE = '42501';
    END IF;
    WITH page AS (
      SELECT
        message.id,
        message.client_message_id,
        message.sender_id,
        profile.full_name AS sender_name,
        message.content,
        message.created_at,
        message.edited_at,
        message.reply_to_id,
        CASE
          WHEN message.sender_id <> _uid THEN 'delivered'
          WHEN message.read_at IS NOT NULL THEN 'read'
          ELSE 'sent'
        END AS delivery_state
      FROM public.messages message
      JOIN public.profiles profile ON profile.id = message.sender_id
      WHERE message.match_id = _match_id
        AND (
          _cursor_created_at IS NULL
          OR (message.created_at, message.id) < (_cursor_created_at, _cursor_id)
        )
      ORDER BY message.created_at DESC, message.id DESC
      LIMIT _page_size + 1
    ),
    visible AS (
      SELECT * FROM page ORDER BY created_at DESC, id DESC LIMIT _page_size
    )
    SELECT jsonb_build_object(
      'items', coalesce((
        SELECT jsonb_agg(to_jsonb(item) ORDER BY item.created_at, item.id) FROM visible item
      ), '[]'::jsonb),
      'hasMore', (SELECT count(*) > _page_size FROM page),
      'nextCursor', (
        SELECT jsonb_build_object('createdAt', item.created_at, 'id', item.id)
        FROM visible item ORDER BY item.created_at, item.id LIMIT 1
      )
    ) INTO _result;
    RETURN _result;
  END IF;

  IF _thread_key LIKE 'thread:%' THEN
    _thread_id := substring(_thread_key FROM 8)::uuid;
    IF NOT public.v2_is_conversation_participant(_thread_id, _uid) THEN
      RAISE EXCEPTION 'thread_not_available' USING ERRCODE = '42501';
    END IF;
    WITH page AS (
      SELECT
        message.id,
        message.client_message_id,
        message.sender_id,
        profile.full_name AS sender_name,
        message.content,
        message.created_at,
        message.edited_at,
        message.reply_to_id,
        CASE
          WHEN message.sender_id <> _uid THEN 'delivered'
          WHEN EXISTS (
            SELECT 1 FROM public.conversation_receipts_v2 receipt
            WHERE receipt.message_id = message.id AND receipt.read_at IS NOT NULL
          ) THEN 'read'
          WHEN EXISTS (
            SELECT 1 FROM public.conversation_receipts_v2 receipt
            WHERE receipt.message_id = message.id AND receipt.delivered_at IS NOT NULL
          ) THEN 'delivered'
          ELSE 'sent'
        END AS delivery_state
      FROM public.conversation_messages_v2 message
      JOIN public.profiles profile ON profile.id = message.sender_id
      WHERE message.thread_id = _thread_id
        AND message.deleted_at IS NULL
        AND (
          _cursor_created_at IS NULL
          OR (message.created_at, message.id) < (_cursor_created_at, _cursor_id)
        )
      ORDER BY message.created_at DESC, message.id DESC
      LIMIT _page_size + 1
    ),
    visible AS (
      SELECT * FROM page ORDER BY created_at DESC, id DESC LIMIT _page_size
    )
    SELECT jsonb_build_object(
      'items', coalesce((
        SELECT jsonb_agg(to_jsonb(item) ORDER BY item.created_at, item.id) FROM visible item
      ), '[]'::jsonb),
      'hasMore', (SELECT count(*) > _page_size FROM page),
      'nextCursor', (
        SELECT jsonb_build_object('createdAt', item.created_at, 'id', item.id)
        FROM visible item ORDER BY item.created_at, item.id LIMIT 1
      )
    ) INTO _result;
    RETURN _result;
  END IF;

  RAISE EXCEPTION 'thread_not_available' USING ERRCODE = '42501';
END;
$$;

CREATE OR REPLACE FUNCTION public.send_conversation_message_v2(
  _thread_key text,
  _client_message_id uuid,
  _content text,
  _reply_to_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _thread_id uuid;
  _match_id uuid;
  _clean text := btrim(coalesce(_content, ''));
  _result jsonb;
  _recent_count integer;
BEGIN
  IF _client_message_id IS NULL
     OR length(_clean) NOT BETWEEN 1 AND 4000
     OR public.check_text_restricted(_clean) IS NOT NULL THEN
    RAISE EXCEPTION 'invalid_message' USING ERRCODE = '22023';
  END IF;

  IF _thread_key = 'global:community' THEN
    SELECT to_jsonb(message_row) INTO _result
    FROM (
      SELECT
        message.id,
        message.client_message_id,
        message.sender_id,
        profile.full_name AS sender_name,
        message.content,
        message.created_at,
        message.edited_at,
        message.reply_to_id,
        'sent'::text AS delivery_state
      FROM public.global_messages message
      JOIN public.profiles profile ON profile.id = message.sender_id
      WHERE message.sender_id = _uid AND message.client_message_id = _client_message_id
    ) message_row;
    IF _result IS NOT NULL THEN
      RETURN _result;
    END IF;
    IF NOT public.v2_community_user_is_approved(_uid)
       OR length(_clean) > 1000 THEN
      RAISE EXCEPTION 'message_not_available' USING ERRCODE = '42501';
    END IF;
    SELECT count(*) INTO _recent_count
    FROM public.global_messages
    WHERE sender_id = _uid
      AND created_at >= now() - interval '1 minute';
    IF _recent_count >= 8 THEN
      RAISE EXCEPTION 'message_rate_limited' USING ERRCODE = 'P0001';
    END IF;
    INSERT INTO public.global_messages (sender_id, content, reply_to_id, client_message_id)
    VALUES (_uid, _clean, _reply_to_id, _client_message_id)
    ON CONFLICT (sender_id, client_message_id)
      WHERE client_message_id IS NOT NULL
    DO NOTHING;
    SELECT to_jsonb(message_row) INTO _result
    FROM (
      SELECT
        message.id,
        message.client_message_id,
        message.sender_id,
        profile.full_name AS sender_name,
        message.content,
        message.created_at,
        message.edited_at,
        message.reply_to_id,
        'sent'::text AS delivery_state
      FROM public.global_messages message
      JOIN public.profiles profile ON profile.id = message.sender_id
      WHERE message.sender_id = _uid AND message.client_message_id = _client_message_id
    ) message_row;
    RETURN _result;
  END IF;

  IF _thread_key LIKE 'legacy-match:%' THEN
    _match_id := substring(_thread_key FROM 14)::uuid;
    IF NOT public.v2_can_access_legacy_match(_match_id, _uid) THEN
      RAISE EXCEPTION 'thread_not_available' USING ERRCODE = '42501';
    END IF;
    INSERT INTO public.messages (
      match_id, sender_id, content, reply_to_id, client_message_id
    )
    VALUES (_match_id, _uid, _clean, _reply_to_id, _client_message_id)
    ON CONFLICT (sender_id, client_message_id)
      WHERE client_message_id IS NOT NULL
    DO UPDATE SET client_message_id = EXCLUDED.client_message_id;
    SELECT to_jsonb(message_row) INTO _result
    FROM (
      SELECT
        message.id,
        message.client_message_id,
        message.sender_id,
        profile.full_name AS sender_name,
        message.content,
        message.created_at,
        message.edited_at,
        message.reply_to_id,
        CASE WHEN message.read_at IS NULL THEN 'sent' ELSE 'read' END AS delivery_state
      FROM public.messages message
      JOIN public.profiles profile ON profile.id = message.sender_id
      WHERE message.sender_id = _uid AND message.client_message_id = _client_message_id
    ) message_row;
    RETURN _result;
  END IF;

  IF _thread_key LIKE 'thread:%' THEN
    _thread_id := substring(_thread_key FROM 8)::uuid;
    IF NOT public.v2_is_conversation_participant(_thread_id, _uid) THEN
      RAISE EXCEPTION 'thread_not_available' USING ERRCODE = '42501';
    END IF;
    IF _reply_to_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.conversation_messages_v2
      WHERE id = _reply_to_id AND thread_id = _thread_id
    ) THEN
      RAISE EXCEPTION 'reply_not_available' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.conversation_messages_v2 (
      thread_id, sender_id, client_message_id, content, reply_to_id
    )
    VALUES (_thread_id, _uid, _client_message_id, _clean, _reply_to_id)
    ON CONFLICT (sender_id, client_message_id)
    DO UPDATE SET client_message_id = EXCLUDED.client_message_id;
    SELECT to_jsonb(message_row) INTO _result
    FROM (
      SELECT
        message.id,
        message.client_message_id,
        message.sender_id,
        profile.full_name AS sender_name,
        message.content,
        message.created_at,
        message.edited_at,
        message.reply_to_id,
        'sent'::text AS delivery_state
      FROM public.conversation_messages_v2 message
      JOIN public.profiles profile ON profile.id = message.sender_id
      WHERE message.sender_id = _uid AND message.client_message_id = _client_message_id
    ) message_row;
    RETURN _result;
  END IF;

  RAISE EXCEPTION 'thread_not_available' USING ERRCODE = '42501';
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_conversation_read_v2(
  _thread_key text,
  _through_created_at timestamptz,
  _through_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _thread_id uuid;
  _match_id uuid;
BEGIN
  IF _thread_key = 'global:community' THEN
    RETURN true;
  END IF;
  IF _thread_key LIKE 'legacy-match:%' THEN
    _match_id := substring(_thread_key FROM 14)::uuid;
    IF NOT public.v2_can_access_legacy_match(_match_id, _uid) THEN
      RETURN false;
    END IF;
    UPDATE public.messages
    SET read_at = coalesce(read_at, now())
    WHERE match_id = _match_id
      AND sender_id <> _uid
      AND (created_at, id) <= (_through_created_at, _through_id);
    RETURN true;
  END IF;
  IF _thread_key LIKE 'thread:%' THEN
    _thread_id := substring(_thread_key FROM 8)::uuid;
    IF NOT public.v2_is_conversation_participant(_thread_id, _uid) THEN
      RETURN false;
    END IF;
    INSERT INTO public.conversation_receipts_v2 (
      message_id, user_id, delivered_at, read_at
    )
    SELECT message.id, _uid, now(), now()
    FROM public.conversation_messages_v2 message
    WHERE message.thread_id = _thread_id
      AND message.sender_id <> _uid
      AND (message.created_at, message.id) <= (_through_created_at, _through_id)
    ON CONFLICT (message_id, user_id)
    DO UPDATE SET
      delivered_at = coalesce(public.conversation_receipts_v2.delivered_at, now()),
      read_at = coalesce(public.conversation_receipts_v2.read_at, now());
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_conversation_preference_v2(
  _thread_key text,
  _preference text,
  _enabled boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _thread_key !~ '^(thread|legacy-match|global|space|cinema):[A-Za-z0-9_-]+$'
     OR _preference NOT IN ('muted', 'pinned', 'archived') THEN
    RAISE EXCEPTION 'invalid_preference' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.conversation_preferences_v2 (
    user_id, thread_key, muted, pinned, archived
  )
  VALUES (
    _uid,
    _thread_key,
    CASE WHEN _preference = 'muted' THEN _enabled ELSE false END,
    CASE WHEN _preference = 'pinned' THEN _enabled ELSE false END,
    CASE WHEN _preference = 'archived' THEN _enabled ELSE false END
  )
  ON CONFLICT (user_id, thread_key)
  DO UPDATE SET
    muted = CASE
      WHEN _preference = 'muted' THEN _enabled
      ELSE public.conversation_preferences_v2.muted
    END,
    pinned = CASE
      WHEN _preference = 'pinned' THEN _enabled
      ELSE public.conversation_preferences_v2.pinned
    END,
    archived = CASE
      WHEN _preference = 'archived' THEN _enabled
      ELSE public.conversation_preferences_v2.archived
    END,
    updated_at = now();
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.get_conversation_inbox_v2() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_social_conversation_request_v2(uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_conversation_request_v2(uuid, boolean)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_conversation_messages_v2(
  text, timestamptz, uuid, integer
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_conversation_message_v2(text, uuid, text, uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_conversation_read_v2(text, timestamptz, uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_conversation_preference_v2(text, text, boolean)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_conversation_inbox_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_social_conversation_request_v2(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_conversation_request_v2(uuid, boolean)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_messages_v2(
  text, timestamptz, uuid, integer
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_conversation_message_v2(text, uuid, text, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read_v2(text, timestamptz, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_conversation_preference_v2(text, text, boolean)
  TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'conversation-attachments',
  'conversation-attachments',
  false,
  15728640,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp',
    'audio/mpeg', 'audio/ogg', 'audio/webm',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "conversation attachments owner upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'conversation-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "conversation attachments participant read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'conversation-attachments'
    AND EXISTS (
      SELECT 1
      FROM public.conversation_attachments_v2 attachment
      JOIN public.conversation_messages_v2 message ON message.id = attachment.message_id
      WHERE attachment.storage_path = name
        AND attachment.status = 'ready'
        AND public.v2_is_conversation_participant(message.thread_id, auth.uid())
    )
  );

CREATE POLICY "conversation attachments owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'conversation-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

COMMENT ON TABLE public.conversation_threads_v2 IS
  'Canonical additive threads for social, spaces and future Cinema; legacy romantic/global messages stay in place.';
COMMENT ON COLUMN public.conversation_messages_v2.client_message_id IS
  'Client-generated idempotency identity; unique per sender.';
COMMENT ON FUNCTION public.get_conversation_inbox_v2() IS
  'Contextual inbox adapter; romantic threads are absent unless dating membership is active.';

COMMIT;
