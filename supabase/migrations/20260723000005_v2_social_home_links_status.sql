BEGIN;

-- V2-010 is additive. Nothing below is applied automatically by the client.
-- The migration must be exercised in a disposable Supabase project before any
-- rollout flag is enabled.

CREATE TABLE IF NOT EXISTS public.community_privacy_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discovery_visibility text NOT NULL DEFAULT 'community'
    CHECK (discovery_visibility IN ('community', 'connections', 'hidden')),
  messages_from text NOT NULL DEFAULT 'connections'
    CHECK (messages_from IN ('community', 'followers', 'connections', 'nobody')),
  default_post_audience text NOT NULL DEFAULT 'community'
    CHECK (default_post_audience IN ('community', 'followers', 'connections', 'private')),
  default_status_audience text NOT NULL DEFAULT 'connections'
    CHECK (default_status_audience IN ('community', 'followers', 'connections', 'private')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('follow', 'connection')),
  status text NOT NULL CHECK (status IN ('pending', 'active', 'declined', 'cancelled')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT social_relationships_distinct_users CHECK (source_user_id <> target_user_id),
  CONSTRAINT social_relationships_direction_unique
    UNIQUE (source_user_id, target_user_id, kind)
);

CREATE INDEX IF NOT EXISTS social_relationships_target_status_idx
  ON public.social_relationships (target_user_id, kind, status, requested_at DESC);
CREATE INDEX IF NOT EXISTS social_relationships_source_status_idx
  ON public.social_relationships (source_user_id, kind, status, requested_at DESC);

CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 3000),
  audience text NOT NULL DEFAULT 'community'
    CHECK (audience IN ('community', 'followers', 'connections', 'private')),
  moderation_status text NOT NULL DEFAULT 'visible'
    CHECK (moderation_status IN ('visible', 'hidden', 'removed', 'pending_review')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_posts_feed_idx
  ON public.community_posts (created_at DESC, id DESC)
  WHERE moderation_status = 'visible';

CREATE TABLE IF NOT EXISTS public.community_post_reactions (
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction text NOT NULL DEFAULT 'amen'
    CHECK (reaction IN ('amen', 'apoio', 'gratidão')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.community_post_comments(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 1200),
  moderation_status text NOT NULL DEFAULT 'visible'
    CHECK (moderation_status IN ('visible', 'hidden', 'removed', 'pending_review')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_post_comments_post_idx
  ON public.community_post_comments (post_id, created_at ASC, id ASC);

CREATE TABLE IF NOT EXISTS public.community_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption text CHECK (caption IS NULL OR length(btrim(caption)) BETWEEN 1 AND 500),
  media_path text,
  media_type text CHECK (media_type IS NULL OR media_type IN ('image')),
  upload_pending boolean NOT NULL DEFAULT false,
  audience text NOT NULL DEFAULT 'connections'
    CHECK (audience IN ('community', 'followers', 'connections', 'private')),
  moderation_status text NOT NULL DEFAULT 'visible'
    CHECK (moderation_status IN ('visible', 'hidden', 'removed', 'pending_review')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  deleted_at timestamptz,
  CONSTRAINT community_status_has_content
    CHECK (caption IS NOT NULL OR media_path IS NOT NULL OR upload_pending),
  CONSTRAINT community_status_ttl CHECK (
    expires_at > created_at AND expires_at <= created_at + interval '24 hours'
  )
);

CREATE INDEX IF NOT EXISTS community_statuses_active_idx
  ON public.community_statuses (expires_at, created_at DESC)
  WHERE deleted_at IS NULL AND upload_pending = false AND moderation_status = 'visible';

CREATE TABLE IF NOT EXISTS public.community_status_views (
  status_id uuid NOT NULL REFERENCES public.community_statuses(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (status_id, viewer_id)
);

ALTER TABLE public.community_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_status_views ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.community_privacy_settings FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.social_relationships FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.community_posts FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.community_post_reactions FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.community_post_comments FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.community_statuses FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.community_status_views FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE ON TABLE public.community_privacy_settings TO authenticated;
GRANT SELECT ON TABLE public.social_relationships TO authenticated;
GRANT SELECT ON TABLE public.community_posts TO authenticated;
GRANT SELECT ON TABLE public.community_post_reactions TO authenticated;
GRANT SELECT ON TABLE public.community_post_comments TO authenticated;
GRANT SELECT ON TABLE public.community_statuses TO authenticated;
GRANT SELECT ON TABLE public.community_status_views TO authenticated;

GRANT ALL ON TABLE public.community_privacy_settings TO service_role;
GRANT ALL ON TABLE public.social_relationships TO service_role;
GRANT ALL ON TABLE public.community_posts TO service_role;
GRANT ALL ON TABLE public.community_post_reactions TO service_role;
GRANT ALL ON TABLE public.community_post_comments TO service_role;
GRANT ALL ON TABLE public.community_statuses TO service_role;
GRANT ALL ON TABLE public.community_status_views TO service_role;

CREATE OR REPLACE FUNCTION public.v2_community_user_is_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _user_id
      AND p.status = 'approved'
      AND p.deactivated_at IS NULL
      AND p.deletion_requested_at IS NULL
      AND coalesce(p.is_anonymized, false) = false
  );
$$;

CREATE OR REPLACE FUNCTION public.v2_community_users_blocked(_left uuid, _right uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blocks b
    WHERE (b.blocker_id = _left AND b.blocked_id = _right)
       OR (b.blocker_id = _right AND b.blocked_id = _left)
  );
$$;

CREATE OR REPLACE FUNCTION public.v2_community_are_connected(_left uuid, _right uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.social_relationships r
    WHERE r.kind = 'connection'
      AND r.status = 'active'
      AND (
        (r.source_user_id = _left AND r.target_user_id = _right)
        OR (r.source_user_id = _right AND r.target_user_id = _left)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.v2_can_view_community_audience(
  _owner_id uuid,
  _audience text,
  _viewer_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF _viewer_id IS NULL OR NOT public.v2_community_user_is_approved(_viewer_id) THEN
    RETURN false;
  END IF;
  IF _owner_id = _viewer_id THEN
    RETURN true;
  END IF;
  IF public.v2_community_users_blocked(_owner_id, _viewer_id) THEN
    RETURN false;
  END IF;
  IF _audience = 'community' THEN
    RETURN true;
  END IF;
  IF _audience = 'connections' THEN
    RETURN public.v2_community_are_connected(_owner_id, _viewer_id);
  END IF;
  IF _audience = 'followers' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.social_relationships r
      WHERE r.kind = 'follow'
        AND r.status = 'active'
        AND r.source_user_id = _viewer_id
        AND r.target_user_id = _owner_id
    );
  END IF;
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.v2_community_user_is_approved(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.v2_community_users_blocked(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.v2_community_are_connected(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.v2_can_view_community_audience(uuid, text, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.v2_community_user_is_approved(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.v2_community_users_blocked(uuid, uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.v2_community_are_connected(uuid, uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.v2_can_view_community_audience(uuid, text, uuid)
  TO authenticated, service_role;

CREATE POLICY "community privacy owner read"
  ON public.community_privacy_settings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "community privacy owner insert"
  ON public.community_privacy_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community privacy owner update"
  ON public.community_privacy_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "social relationships participants read"
  ON public.social_relationships
  FOR SELECT TO authenticated
  USING (auth.uid() = source_user_id OR auth.uid() = target_user_id);

CREATE POLICY "community posts audience read"
  ON public.community_posts
  FOR SELECT TO authenticated
  USING (
    moderation_status = 'visible'
    AND public.v2_can_view_community_audience(author_id, audience, auth.uid())
  );

CREATE POLICY "community post reactions audience read"
  ON public.community_post_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.community_posts p
      WHERE p.id = post_id
        AND p.moderation_status = 'visible'
        AND public.v2_can_view_community_audience(p.author_id, p.audience, auth.uid())
    )
  );

CREATE POLICY "community post comments audience read"
  ON public.community_post_comments
  FOR SELECT TO authenticated
  USING (
    moderation_status = 'visible'
    AND EXISTS (
      SELECT 1
      FROM public.community_posts p
      WHERE p.id = post_id
        AND p.moderation_status = 'visible'
        AND public.v2_can_view_community_audience(p.author_id, p.audience, auth.uid())
    )
  );

CREATE POLICY "community statuses audience read"
  ON public.community_statuses
  FOR SELECT TO authenticated
  USING (
    moderation_status = 'visible'
    AND upload_pending = false
    AND deleted_at IS NULL
    AND expires_at > now()
    AND public.v2_can_view_community_audience(author_id, audience, auth.uid())
  );

CREATE POLICY "community status views owner or viewer read"
  ON public.community_status_views
  FOR SELECT TO authenticated
  USING (
    auth.uid() = viewer_id
    OR EXISTS (
      SELECT 1
      FROM public.community_statuses s
      WHERE s.id = status_id AND s.author_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.request_social_relationship(
  _target_user_id uuid,
  _kind text
)
RETURNS public.social_relationships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _existing public.social_relationships;
  _result public.social_relationships;
  _daily_count integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF _kind NOT IN ('follow', 'connection') THEN
    RAISE EXCEPTION 'invalid_relationship_kind' USING ERRCODE = '22023';
  END IF;
  IF _target_user_id IS NULL OR _target_user_id = _uid THEN
    RAISE EXCEPTION 'invalid_relationship_target' USING ERRCODE = '22023';
  END IF;
  IF NOT public.v2_community_user_is_approved(_uid)
     OR NOT public.v2_community_user_is_approved(_target_user_id) THEN
    RAISE EXCEPTION 'profile_not_available' USING ERRCODE = '42501';
  END IF;
  IF public.v2_community_users_blocked(_uid, _target_user_id) THEN
    RAISE EXCEPTION 'relationship_blocked' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO _daily_count
  FROM public.social_relationships
  WHERE source_user_id = _uid
    AND requested_at >= now() - interval '24 hours';
  IF _daily_count >= 20 THEN
    RAISE EXCEPTION 'relationship_rate_limited' USING ERRCODE = 'P0001';
  END IF;

  IF _kind = 'connection' THEN
    SELECT * INTO _existing
    FROM public.social_relationships
    WHERE kind = 'connection'
      AND source_user_id = _target_user_id
      AND target_user_id = _uid
      AND status = 'pending'
    FOR UPDATE;
    IF FOUND THEN
      UPDATE public.social_relationships
      SET status = 'active', responded_at = now(), updated_at = now()
      WHERE id = _existing.id
      RETURNING * INTO _result;
      RETURN _result;
    END IF;
  END IF;

  INSERT INTO public.social_relationships (
    source_user_id,
    target_user_id,
    kind,
    status
  )
  VALUES (
    _uid,
    _target_user_id,
    _kind,
    CASE WHEN _kind = 'follow' THEN 'active' ELSE 'pending' END
  )
  ON CONFLICT (source_user_id, target_user_id, kind)
  DO UPDATE SET
    status = CASE
      WHEN EXCLUDED.kind = 'follow' THEN 'active'
      ELSE 'pending'
    END,
    requested_at = now(),
    responded_at = CASE WHEN EXCLUDED.kind = 'follow' THEN now() ELSE NULL END,
    updated_at = now()
  RETURNING * INTO _result;
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_social_connection(
  _relationship_id uuid,
  _accept boolean
)
RETURNS public.social_relationships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _result public.social_relationships;
BEGIN
  UPDATE public.social_relationships
  SET
    status = CASE WHEN _accept THEN 'active' ELSE 'declined' END,
    responded_at = now(),
    updated_at = now()
  WHERE id = _relationship_id
    AND kind = 'connection'
    AND status = 'pending'
    AND target_user_id = _uid
  RETURNING * INTO _result;
  IF _result.id IS NULL THEN
    RAISE EXCEPTION 'connection_request_not_available' USING ERRCODE = '42501';
  END IF;
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_social_relationship(_relationship_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _deleted integer;
BEGIN
  DELETE FROM public.social_relationships
  WHERE id = _relationship_id
    AND (
      source_user_id = _uid
      OR (kind = 'connection' AND target_user_id = _uid)
    );
  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_community_post(
  _body text,
  _audience text DEFAULT 'community'
)
RETURNS public.community_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _result public.community_posts;
BEGIN
  IF NOT public.v2_community_user_is_approved(_uid) THEN
    RAISE EXCEPTION 'profile_not_approved' USING ERRCODE = '42501';
  END IF;
  IF length(btrim(coalesce(_body, ''))) NOT BETWEEN 1 AND 3000 THEN
    RAISE EXCEPTION 'invalid_post_body' USING ERRCODE = '22023';
  END IF;
  IF _audience NOT IN ('community', 'followers', 'connections', 'private') THEN
    RAISE EXCEPTION 'invalid_audience' USING ERRCODE = '22023';
  END IF;
  IF public.check_text_restricted(_body) IS NOT NULL THEN
    RAISE EXCEPTION 'restricted_content' USING ERRCODE = '23514';
  END IF;
  INSERT INTO public.community_posts (author_id, body, audience)
  VALUES (_uid, btrim(_body), _audience)
  RETURNING * INTO _result;
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_community_post_reaction(
  _post_id uuid,
  _reaction text DEFAULT 'amen'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _reaction NOT IN ('amen', 'apoio', 'gratidão') THEN
    RAISE EXCEPTION 'invalid_reaction' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.community_posts p
    WHERE p.id = _post_id
      AND p.moderation_status = 'visible'
      AND public.v2_can_view_community_audience(p.author_id, p.audience, _uid)
  ) THEN
    RAISE EXCEPTION 'post_not_available' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.community_post_reactions
    WHERE post_id = _post_id AND user_id = _uid
  ) THEN
    DELETE FROM public.community_post_reactions
    WHERE post_id = _post_id AND user_id = _uid;
    RETURN false;
  END IF;
  INSERT INTO public.community_post_reactions (post_id, user_id, reaction)
  VALUES (_post_id, _uid, _reaction);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_community_post_comment(
  _post_id uuid,
  _body text,
  _parent_id uuid DEFAULT NULL
)
RETURNS public.community_post_comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _result public.community_post_comments;
BEGIN
  IF length(btrim(coalesce(_body, ''))) NOT BETWEEN 1 AND 1200 THEN
    RAISE EXCEPTION 'invalid_comment_body' USING ERRCODE = '22023';
  END IF;
  IF public.check_text_restricted(_body) IS NOT NULL THEN
    RAISE EXCEPTION 'restricted_content' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.community_posts p
    WHERE p.id = _post_id
      AND p.moderation_status = 'visible'
      AND public.v2_can_view_community_audience(p.author_id, p.audience, _uid)
  ) THEN
    RAISE EXCEPTION 'post_not_available' USING ERRCODE = '42501';
  END IF;
  IF _parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.community_post_comments
    WHERE id = _parent_id AND post_id = _post_id
  ) THEN
    RAISE EXCEPTION 'parent_comment_not_available' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.community_post_comments (post_id, author_id, parent_id, body)
  VALUES (_post_id, _uid, _parent_id, btrim(_body))
  RETURNING * INTO _result;
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_community_status(
  _caption text,
  _audience text DEFAULT 'connections',
  _has_media boolean DEFAULT false
)
RETURNS public.community_statuses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _result public.community_statuses;
  _caption_clean text := nullif(btrim(coalesce(_caption, '')), '');
BEGIN
  IF NOT public.v2_community_user_is_approved(_uid) THEN
    RAISE EXCEPTION 'profile_not_approved' USING ERRCODE = '42501';
  END IF;
  IF _caption_clean IS NULL AND NOT _has_media THEN
    RAISE EXCEPTION 'status_content_required' USING ERRCODE = '22023';
  END IF;
  IF _caption_clean IS NOT NULL AND length(_caption_clean) > 500 THEN
    RAISE EXCEPTION 'status_caption_too_long' USING ERRCODE = '22023';
  END IF;
  IF _caption_clean IS NOT NULL AND public.check_text_restricted(_caption_clean) IS NOT NULL THEN
    RAISE EXCEPTION 'restricted_content' USING ERRCODE = '23514';
  END IF;
  IF _audience NOT IN ('community', 'followers', 'connections', 'private') THEN
    RAISE EXCEPTION 'invalid_audience' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.community_statuses (
    author_id,
    caption,
    audience,
    media_type,
    upload_pending
  )
  VALUES (
    _uid,
    _caption_clean,
    _audience,
    CASE WHEN _has_media THEN 'image' ELSE NULL END,
    _has_media
  )
  RETURNING * INTO _result;
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.attach_community_status_media(
  _status_id uuid,
  _media_path text
)
RETURNS public.community_statuses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _result public.community_statuses;
BEGIN
  IF _media_path !~ ('^' || _uid::text || '/' || _status_id::text || '\\.[a-z0-9]+$') THEN
    RAISE EXCEPTION 'invalid_media_path' USING ERRCODE = '22023';
  END IF;
  UPDATE public.community_statuses
  SET media_path = _media_path, media_type = 'image', upload_pending = false
  WHERE id = _status_id
    AND author_id = _uid
    AND deleted_at IS NULL
    AND expires_at > now()
  RETURNING * INTO _result;
  IF _result.id IS NULL THEN
    RAISE EXCEPTION 'status_not_available' USING ERRCODE = '42501';
  END IF;
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_community_status(_status_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _updated integer;
BEGIN
  UPDATE public.community_statuses
  SET deleted_at = now()
  WHERE id = _status_id
    AND author_id = auth.uid()
    AND deleted_at IS NULL;
  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_community_status_view(_status_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.community_statuses s
    WHERE s.id = _status_id
      AND s.author_id <> _uid
      AND s.deleted_at IS NULL
      AND s.expires_at > now()
      AND s.moderation_status = 'visible'
      AND s.upload_pending = false
      AND public.v2_can_view_community_audience(s.author_id, s.audience, _uid)
  ) THEN
    RETURN false;
  END IF;
  INSERT INTO public.community_status_views (status_id, viewer_id)
  VALUES (_status_id, _uid)
  ON CONFLICT (status_id, viewer_id)
  DO UPDATE SET viewed_at = LEAST(
    public.community_status_views.viewed_at,
    EXCLUDED.viewed_at
  );
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_community_home_v2(
  _cursor_created_at timestamptz DEFAULT NULL,
  _cursor_id uuid DEFAULT NULL,
  _limit integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _page_size integer := greatest(1, least(coalesce(_limit, 20), 30));
  _result jsonb;
BEGIN
  IF NOT public.v2_community_user_is_approved(_uid) THEN
    RAISE EXCEPTION 'profile_not_approved' USING ERRCODE = '42501';
  END IF;

  WITH visible_posts AS (
    SELECT
      p.id,
      p.author_id,
      pr.full_name AS author_name,
      pr.photo_url AS author_photo_url,
      p.body,
      p.audience,
      p.created_at,
      (
        SELECT count(*)::integer
        FROM public.community_post_reactions r
        WHERE r.post_id = p.id
      ) AS reaction_count,
      (
        SELECT count(*)::integer
        FROM public.community_post_comments c
        WHERE c.post_id = p.id AND c.moderation_status = 'visible'
      ) AS comment_count,
      EXISTS (
        SELECT 1
        FROM public.community_post_reactions r
        WHERE r.post_id = p.id AND r.user_id = _uid
      ) AS viewer_reacted
    FROM public.community_posts p
    JOIN public.profiles pr ON pr.id = p.author_id
    WHERE p.moderation_status = 'visible'
      AND public.v2_can_view_community_audience(p.author_id, p.audience, _uid)
      AND (
        _cursor_created_at IS NULL
        OR (p.created_at, p.id) < (_cursor_created_at, _cursor_id)
      )
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT _page_size + 1
  ),
  page_posts AS (
    SELECT * FROM visible_posts
    ORDER BY created_at DESC, id DESC
    LIMIT _page_size
  ),
  active_statuses AS (
    SELECT
      s.id,
      s.author_id,
      pr.full_name AS author_name,
      pr.photo_url AS author_photo_url,
      s.caption,
      s.media_path,
      s.audience,
      s.created_at,
      s.expires_at,
      EXISTS (
        SELECT 1
        FROM public.community_status_views v
        WHERE v.status_id = s.id AND v.viewer_id = _uid
      ) AS viewed
    FROM public.community_statuses s
    JOIN public.profiles pr ON pr.id = s.author_id
    WHERE s.deleted_at IS NULL
      AND s.expires_at > now()
      AND s.moderation_status = 'visible'
      AND s.upload_pending = false
      AND public.v2_can_view_community_audience(s.author_id, s.audience, _uid)
    ORDER BY (s.author_id = _uid) DESC, viewed ASC, s.created_at DESC
    LIMIT 40
  ),
  suggestions AS (
    SELECT
      p.id,
      p.full_name,
      p.photo_url,
      p.city,
      p.state
    FROM public.profiles p
    LEFT JOIN public.community_privacy_settings privacy ON privacy.user_id = p.id
    WHERE p.id <> _uid
      AND public.v2_community_user_is_approved(p.id)
      AND coalesce(privacy.discovery_visibility, 'community') = 'community'
      AND NOT public.v2_community_users_blocked(_uid, p.id)
      AND NOT EXISTS (
        SELECT 1
        FROM public.social_relationships r
        WHERE (
          r.source_user_id = _uid AND r.target_user_id = p.id
        ) OR (
          r.source_user_id = p.id AND r.target_user_id = _uid
        )
      )
    ORDER BY p.created_at DESC, p.id
    LIMIT 6
  )
  SELECT jsonb_build_object(
    'posts', coalesce((SELECT jsonb_agg(to_jsonb(pp) ORDER BY pp.created_at DESC, pp.id DESC)
      FROM page_posts pp), '[]'::jsonb),
    'hasMorePosts', (SELECT count(*) > _page_size FROM visible_posts),
    'nextCursor', (
      SELECT jsonb_build_object('createdAt', pp.created_at, 'id', pp.id)
      FROM page_posts pp
      ORDER BY pp.created_at ASC, pp.id ASC
      LIMIT 1
    ),
    'statuses', coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.created_at DESC)
      FROM active_statuses s), '[]'::jsonb),
    'daily', coalesce((
      SELECT jsonb_agg(to_jsonb(d) ORDER BY d.published_at DESC)
      FROM (
        SELECT id, title, content, bible_reference, published_at, kind
        FROM public.daily_posts
        WHERE published = true
        ORDER BY published_at DESC
        LIMIT 3
      ) d
    ), '[]'::jsonb),
    'suggestions', coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM suggestions s), '[]'::jsonb),
    'relationshipSummary', jsonb_build_object(
      'connections', (
        SELECT count(*)::integer
        FROM public.social_relationships r
        WHERE r.kind = 'connection'
          AND r.status = 'active'
          AND (_uid = r.source_user_id OR _uid = r.target_user_id)
      ),
      'following', (
        SELECT count(*)::integer
        FROM public.social_relationships r
        WHERE r.kind = 'follow'
          AND r.status = 'active'
          AND _uid = r.source_user_id
      ),
      'pending', (
        SELECT count(*)::integer
        FROM public.social_relationships r
        WHERE r.kind = 'connection'
          AND r.status = 'pending'
          AND _uid = r.target_user_id
      )
    )
  ) INTO _result;
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_community_people_v2(_limit integer DEFAULT 30)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(jsonb_agg(to_jsonb(candidate)), '[]'::jsonb)
  FROM (
    SELECT
      p.id,
      p.full_name,
      p.photo_url,
      p.city,
      p.state,
      p.church,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM public.social_relationships r
          WHERE r.kind = 'connection'
            AND r.status = 'active'
            AND (
              (r.source_user_id = auth.uid() AND r.target_user_id = p.id)
              OR (r.source_user_id = p.id AND r.target_user_id = auth.uid())
            )
        ) THEN 'connected'
        WHEN EXISTS (
          SELECT 1 FROM public.social_relationships r
          WHERE r.kind = 'connection'
            AND r.status = 'pending'
            AND r.source_user_id = auth.uid()
            AND r.target_user_id = p.id
        ) THEN 'request_sent'
        WHEN EXISTS (
          SELECT 1 FROM public.social_relationships r
          WHERE r.kind = 'follow'
            AND r.status = 'active'
            AND r.source_user_id = auth.uid()
            AND r.target_user_id = p.id
        ) THEN 'following'
        ELSE 'none'
      END AS relationship_state
    FROM public.profiles p
    LEFT JOIN public.community_privacy_settings privacy ON privacy.user_id = p.id
    WHERE p.id <> auth.uid()
      AND public.v2_community_user_is_approved(auth.uid())
      AND public.v2_community_user_is_approved(p.id)
      AND coalesce(privacy.discovery_visibility, 'community') = 'community'
      AND NOT public.v2_community_users_blocked(auth.uid(), p.id)
    ORDER BY p.created_at DESC, p.id
    LIMIT greatest(1, least(coalesce(_limit, 30), 50))
  ) candidate;
$$;

REVOKE ALL ON FUNCTION public.request_social_relationship(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_social_connection(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_social_relationship(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.publish_community_post(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.toggle_community_post_reaction(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_community_post_comment(uuid, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.publish_community_status(text, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.attach_community_status_media(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_community_status(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_community_status_view(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_community_home_v2(timestamptz, uuid, integer)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_community_people_v2(integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.request_social_relationship(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_social_connection(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_social_relationship(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_community_post(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_community_post_reaction(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_community_post_comment(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_community_status(text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.attach_community_status_media(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_community_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_community_status_view(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_home_v2(timestamptz, uuid, integer)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_community_people_v2(integer) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-status-media',
  'community-status-media',
  false,
  6291456,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "community status media owner insert"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-status-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "community status media owner update"
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'community-status-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'community-status-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "community status media owner delete"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-status-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "community status media audience read"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'community-status-media'
    AND EXISTS (
      SELECT 1
      FROM public.community_statuses s
      WHERE s.media_path = name
        AND s.deleted_at IS NULL
        AND s.expires_at > now()
        AND s.moderation_status = 'visible'
        AND s.upload_pending = false
        AND public.v2_can_view_community_audience(s.author_id, s.audience, auth.uid())
    )
  );

COMMENT ON TABLE public.social_relationships IS
  'Non-romantic follows and bilateral connections. This table never uses matches.';
COMMENT ON TABLE public.community_statuses IS
  'Community Status with a maximum lifetime of 24 hours and audience-aware media access.';
COMMENT ON FUNCTION public.get_community_home_v2(timestamptz, uuid, integer) IS
  'Budgeted chronological V2 home aggregator with deterministic created_at/id pagination.';

COMMIT;
