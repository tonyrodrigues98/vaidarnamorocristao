BEGIN;

-- Additive discovery history. It is intentionally independent from profile_views:
-- legacy analytics remain untouched and rollback only revokes the new entry points.
CREATE TABLE IF NOT EXISTS public.dating_discovery_impressions_v2 (
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  view_count integer NOT NULL DEFAULT 1 CHECK (view_count > 0),
  PRIMARY KEY (viewer_id, candidate_id),
  CHECK (viewer_id <> candidate_id)
);

CREATE INDEX IF NOT EXISTS dating_discovery_impressions_v2_viewer_seen_idx
  ON public.dating_discovery_impressions_v2 (viewer_id, last_seen_at DESC);

ALTER TABLE public.dating_discovery_impressions_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.dating_discovery_impressions_v2 FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.dating_discovery_impressions_v2 TO service_role;

CREATE POLICY "dating discovery impression owner read"
  ON public.dating_discovery_impressions_v2
  FOR SELECT TO authenticated
  USING (auth.uid() = viewer_id);

-- This helper freezes the legacy product rule as "opposite sex v1". A future
-- bilateral preference model requires an explicit product decision and a new
-- helper/version; it must not silently mutate this compatibility contract.
CREATE OR REPLACE FUNCTION public.v2_dating_users_eligible(
  _viewer_id uuid,
  _candidate_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    _viewer_id IS NOT NULL
    AND _candidate_id IS NOT NULL
    AND _viewer_id <> _candidate_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles viewer
      JOIN public.profiles candidate ON candidate.id = _candidate_id
      JOIN public.profile_preferences preference ON preference.user_id = viewer.id
      JOIN public.dating_memberships viewer_membership
        ON viewer_membership.user_id = viewer.id
       AND viewer_membership.status = 'active'
      JOIN public.dating_memberships candidate_membership
        ON candidate_membership.user_id = candidate.id
       AND candidate_membership.status = 'active'
      WHERE viewer.id = _viewer_id
        AND viewer.status = 'approved'
        AND candidate.status = 'approved'
        AND viewer.deactivated_at IS NULL
        AND candidate.deactivated_at IS NULL
        AND viewer.deletion_requested_at IS NULL
        AND candidate.deletion_requested_at IS NULL
        AND coalesce(viewer.is_anonymized, false) = false
        AND coalesce(candidate.is_anonymized, false) = false
        AND viewer.sex IS NOT NULL
        AND candidate.sex IS NOT NULL
        AND viewer.sex <> candidate.sex
        AND candidate.age BETWEEN preference.age_min AND preference.age_max
        AND (
          preference.location_scope = 'mundo'::public.location_scope
          OR preference.location_scope = 'brasil'::public.location_scope
          OR (
            preference.location_scope = 'regiao'::public.location_scope
            AND candidate.state = viewer.state
          )
          OR (
            preference.location_scope = 'personalizado'::public.location_scope
            AND candidate.state = ANY(coalesce(preference.custom_states, '{}'::text[]))
          )
        )
        AND NOT public.v2_community_users_blocked(_viewer_id, _candidate_id)
        AND NOT EXISTS (
          SELECT 1
          FROM public.relationship_commitments commitment
          WHERE commitment.status = 'active'
            AND (
              _viewer_id IN (commitment.user_a, commitment.user_b)
              OR _candidate_id IN (commitment.user_a, commitment.user_b)
            )
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.get_hidden_staff_ids() hidden(user_id)
          WHERE hidden.user_id = _candidate_id
        )
    );
$$;

REVOKE ALL ON FUNCTION public.v2_dating_users_eligible(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.v2_dating_users_eligible(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.get_dating_discovery_v2(
  _cursor_unseen integer DEFAULT NULL,
  _cursor_same_state integer DEFAULT NULL,
  _cursor_created_at timestamptz DEFAULT NULL,
  _cursor_id uuid DEFAULT NULL,
  _limit integer DEFAULT 18
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _items jsonb;
  _has_more boolean;
  _next_cursor jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF _limit < 1 OR _limit > 30 THEN
    RAISE EXCEPTION 'invalid_page_limit' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.dating_memberships membership
    JOIN public.profiles profile ON profile.id = membership.user_id
    WHERE membership.user_id = _uid
      AND membership.status = 'active'
      AND profile.status = 'approved'
      AND profile.deactivated_at IS NULL
      AND profile.deletion_requested_at IS NULL
  ) THEN
    RAISE EXCEPTION 'dating_membership_not_active' USING ERRCODE = '42501';
  END IF;

  WITH ordered AS (
    SELECT
      candidate.id,
      candidate.full_name AS display_name,
      candidate.age,
      candidate.city,
      candidate.state,
      candidate.church,
      coalesce(candidate.bio, '') AS bio,
      candidate.photo_url,
      coalesce(candidate.verified, false) AS verified,
      preference.desired_quality,
      advanced.seeking,
      advanced.pace,
      CASE WHEN impression.viewer_id IS NULL THEN 1 ELSE 0 END AS unseen_priority,
      CASE WHEN candidate.state = viewer.state THEN 1 ELSE 0 END AS same_state_priority,
      candidate.created_at,
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM public.interests received
          WHERE received.sender_id = candidate.id
            AND received.receiver_id = _uid
        ) THEN 'received'
        ELSE 'none'
      END AS interest_state
    FROM public.profiles viewer
    JOIN public.profiles candidate ON candidate.id <> viewer.id
    LEFT JOIN public.profile_preferences preference ON preference.user_id = candidate.id
    LEFT JOIN public.profile_advanced advanced ON advanced.user_id = candidate.id
    LEFT JOIN public.dating_discovery_impressions_v2 impression
      ON impression.viewer_id = _uid
     AND impression.candidate_id = candidate.id
    WHERE viewer.id = _uid
      AND public.v2_dating_users_eligible(_uid, candidate.id)
      AND NOT EXISTS (
        SELECT 1
        FROM public.matches match
        WHERE (match.user_a = _uid AND match.user_b = candidate.id)
           OR (match.user_a = candidate.id AND match.user_b = _uid)
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.interests sent
        WHERE sent.sender_id = _uid
          AND sent.receiver_id = candidate.id
      )
      AND (
        _cursor_unseen IS NULL
        OR (
          (
            CASE WHEN impression.viewer_id IS NULL THEN 1 ELSE 0 END,
            CASE WHEN candidate.state = viewer.state THEN 1 ELSE 0 END,
            candidate.created_at,
            candidate.id
          ) < (
            _cursor_unseen,
            _cursor_same_state,
            _cursor_created_at,
            _cursor_id
          )
        )
      )
    ORDER BY
      unseen_priority DESC,
      same_state_priority DESC,
      candidate.created_at DESC,
      candidate.id DESC
  ),
  page AS MATERIALIZED (
    SELECT *
    FROM ordered
    LIMIT _limit + 1
  ),
  selected AS MATERIALIZED (
    SELECT *
    FROM page
    ORDER BY unseen_priority DESC, same_state_priority DESC, created_at DESC, id DESC
    LIMIT _limit
  )
  SELECT
    coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', selected.id,
            'display_name', selected.display_name,
            'age', selected.age,
            'city', selected.city,
            'state', selected.state,
            'church', selected.church,
            'bio', selected.bio,
            'photo_url', selected.photo_url,
            'verified', selected.verified,
            'desired_quality', selected.desired_quality,
            'seeking', selected.seeking,
            'pace', selected.pace,
            'explanation',
              CASE
                WHEN selected.same_state_priority = 1 THEN 'mesmo_estado_e_recente'
                ELSE 'recente'
              END,
            'interest_state', selected.interest_state
          )
          ORDER BY
            selected.unseen_priority DESC,
            selected.same_state_priority DESC,
            selected.created_at DESC,
            selected.id DESC
        )
        FROM selected
      ),
      '[]'::jsonb
    ),
    (SELECT count(*) > _limit FROM page),
    (
      SELECT jsonb_build_object(
        'unseenPriority', selected.unseen_priority,
        'sameStatePriority', selected.same_state_priority,
        'createdAt', selected.created_at,
        'id', selected.id
      )
      FROM selected
      ORDER BY
        selected.unseen_priority ASC,
        selected.same_state_priority ASC,
        selected.created_at ASC,
        selected.id ASC
      LIMIT 1
    )
  INTO _items, _has_more, _next_cursor;

  RETURN jsonb_build_object(
    'items', _items,
    'hasMore', coalesce(_has_more, false),
    'nextCursor', CASE WHEN _has_more THEN _next_cursor ELSE NULL END,
    'eligibilityRule', 'legacy-opposite-sex-v1'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_dating_impressions_v2(
  _candidate_ids uuid[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _recorded integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF coalesce(cardinality(_candidate_ids), 0) < 1
     OR cardinality(_candidate_ids) > 50 THEN
    RAISE EXCEPTION 'invalid_candidate_batch' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.dating_discovery_impressions_v2 (
    viewer_id,
    candidate_id,
    last_seen_at,
    view_count
  )
  SELECT _uid, candidate_id, now(), 1
  FROM (
    SELECT DISTINCT unnest(_candidate_ids) AS candidate_id
  ) candidates
  WHERE public.v2_dating_users_eligible(_uid, candidate_id)
  ON CONFLICT (viewer_id, candidate_id) DO UPDATE
    SET last_seen_at = now(),
        view_count = public.dating_discovery_impressions_v2.view_count + 1;

  GET DIAGNOSTICS _recorded = ROW_COUNT;
  RETURN _recorded;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_dating_interest_v2(
  _target_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _match_id uuid;
  _reciprocal boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF _target_user_id IS NULL OR _target_user_id = _uid THEN
    RAISE EXCEPTION 'invalid_interest_target' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext(least(_uid::text, _target_user_id::text)),
    hashtext(greatest(_uid::text, _target_user_id::text))
  );

  SELECT match.id
  INTO _match_id
  FROM public.matches match
  WHERE (match.user_a = _uid AND match.user_b = _target_user_id)
     OR (match.user_a = _target_user_id AND match.user_b = _uid)
  LIMIT 1;

  IF _match_id IS NOT NULL THEN
    RETURN jsonb_build_object('state', 'matched', 'match_id', _match_id);
  END IF;

  IF NOT public.v2_dating_users_eligible(_uid, _target_user_id) THEN
    RAISE EXCEPTION 'dating_target_not_eligible' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.interests interest
    WHERE interest.sender_id = _uid
      AND interest.receiver_id = _target_user_id
  ) AND (
    SELECT count(*)
    FROM public.interests recent
    WHERE recent.sender_id = _uid
      AND recent.created_at >= now() - interval '24 hours'
  ) >= 30 THEN
    RAISE EXCEPTION 'dating_interest_rate_limited' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.interests (sender_id, receiver_id)
  VALUES (_uid, _target_user_id)
  ON CONFLICT (sender_id, receiver_id) DO NOTHING;

  SELECT EXISTS (
    SELECT 1
    FROM public.interests reciprocal
    WHERE reciprocal.sender_id = _target_user_id
      AND reciprocal.receiver_id = _uid
  )
  INTO _reciprocal;

  IF _reciprocal THEN
    INSERT INTO public.matches (user_a, user_b)
    VALUES (
      least(_uid, _target_user_id),
      greatest(_uid, _target_user_id)
    )
    ON CONFLICT (user_a, user_b) DO NOTHING;

    SELECT match.id
    INTO _match_id
    FROM public.matches match
    WHERE match.user_a = least(_uid, _target_user_id)
      AND match.user_b = greatest(_uid, _target_user_id);
  END IF;

  RETURN jsonb_build_object(
    'state', CASE WHEN _match_id IS NULL THEN 'sent' ELSE 'matched' END,
    'match_id', _match_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.block_dating_profile_v2(
  _target_user_id uuid
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
  IF _target_user_id IS NULL OR _target_user_id = _uid THEN
    RAISE EXCEPTION 'invalid_block_target' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.blocks (blocker_id, blocked_id)
  VALUES (_uid, _target_user_id)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.report_dating_profile_v2(
  _target_user_id uuid,
  _reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _report_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF _target_user_id IS NULL OR _target_user_id = _uid THEN
    RAISE EXCEPTION 'invalid_report_target' USING ERRCODE = '22023';
  END IF;
  IF _reason NOT IN ('inappropriate_profile', 'false_identity', 'harassment', 'other') THEN
    RAISE EXCEPTION 'invalid_report_reason' USING ERRCODE = '22023';
  END IF;
  IF (
    SELECT count(*)
    FROM public.reports recent
    WHERE recent.reporter_id = _uid
      AND recent.created_at >= now() - interval '24 hours'
  ) >= 20 THEN
    RAISE EXCEPTION 'dating_report_rate_limited' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.reports (reporter_id, reported_id, reason)
  VALUES (_uid, _target_user_id, 'dating_v2:' || _reason)
  RETURNING id INTO _report_id;

  RETURN _report_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_dating_discovery_v2(integer, integer, timestamptz, uuid, integer)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_dating_impressions_v2(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_dating_interest_v2(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.block_dating_profile_v2(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_dating_profile_v2(uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_dating_discovery_v2(integer, integer, timestamptz, uuid, integer)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_dating_impressions_v2(uuid[])
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_dating_interest_v2(uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.block_dating_profile_v2(uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.report_dating_profile_v2(uuid, text)
  TO authenticated, service_role;

COMMENT ON TABLE public.dating_discovery_impressions_v2 IS
  'Additive V2 discovery history used to reduce repeated romantic candidates.';
COMMENT ON FUNCTION public.v2_dating_users_eligible(uuid, uuid) IS
  'Server-only compatibility rule legacy-opposite-sex-v1. Community eligibility is independent.';
COMMENT ON FUNCTION public.get_dating_discovery_v2(integer, integer, timestamptz, uuid, integer) IS
  'Stable, explainable and server-authoritative optional dating discovery.';
COMMENT ON FUNCTION public.send_dating_interest_v2(uuid) IS
  'Idempotent interest command with pair lock and atomic reciprocal match.';

COMMIT;
