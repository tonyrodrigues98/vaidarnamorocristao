BEGIN;

-- Community participation must not require romantic identity fields. These
-- columns stay intact for legacy profiles and become nullable only for new
-- community-first onboarding records.
ALTER TABLE public.profiles
  ALTER COLUMN sex DROP NOT NULL,
  ALTER COLUMN marital DROP NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS community_onboarding_version text,
  ADD COLUMN IF NOT EXISTS community_onboarding_completed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.community_onboarding_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  questionnaire_version text NOT NULL,
  current_step text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_onboarding_progress_answers_object
    CHECK (jsonb_typeof(answers) = 'object')
);

ALTER TABLE public.community_onboarding_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.community_onboarding_progress FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.community_onboarding_progress TO authenticated;
GRANT ALL ON TABLE public.community_onboarding_progress TO service_role;

CREATE POLICY "community onboarding owner read"
  ON public.community_onboarding_progress
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "community onboarding owner insert"
  ON public.community_onboarding_progress
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community onboarding owner update"
  ON public.community_onboarding_progress
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.dating_memberships (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'inactive'
    CHECK (
      status IN (
        'inactive',
        'active',
        'paused',
        'legacy_active_pending_confirmation',
        'paused_by_commitment',
        'restricted'
      )
    ),
  onboarding_version text,
  receive_anonymous boolean NOT NULL DEFAULT false,
  activated_at timestamptz,
  paused_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dating_memberships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.dating_memberships FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.dating_memberships FROM authenticated;
GRANT SELECT ON TABLE public.dating_memberships TO authenticated;
GRANT ALL ON TABLE public.dating_memberships TO service_role;

CREATE POLICY "dating membership owner read"
  ON public.dating_memberships
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.complete_community_onboarding(
  _questionnaire_version text,
  _full_name text,
  _birth_date date,
  _photo_url text,
  _city text,
  _state text,
  _bio text,
  _church text,
  _years_baptized integer,
  _faith_moment text
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _age integer;
  _profile public.profiles;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  _age := extract(year FROM age(current_date, _birth_date))::integer;

  IF length(trim(coalesce(_questionnaire_version, ''))) < 3 THEN
    RAISE EXCEPTION 'invalid_questionnaire_version' USING ERRCODE = '22023';
  END IF;
  IF length(trim(coalesce(_full_name, ''))) < 2 OR length(_full_name) > 120 THEN
    RAISE EXCEPTION 'invalid_full_name' USING ERRCODE = '22023';
  END IF;
  IF _age < 18 OR _age > 110 THEN
    RAISE EXCEPTION 'invalid_birth_date' USING ERRCODE = '22023';
  END IF;
  IF length(trim(coalesce(_photo_url, ''))) < 8 OR length(_photo_url) > 2048 THEN
    RAISE EXCEPTION 'invalid_photo_url' USING ERRCODE = '22023';
  END IF;
  IF length(trim(coalesce(_city, ''))) < 2 OR length(_city) > 120
     OR coalesce(_state, '') !~ '^[A-Z]{2}$' THEN
    RAISE EXCEPTION 'invalid_location' USING ERRCODE = '22023';
  END IF;
  IF length(coalesce(_bio, '')) > 600
     OR length(trim(coalesce(_church, ''))) < 2
     OR length(_church) > 160
     OR _years_baptized < 0
     OR _years_baptized > 110
     OR length(coalesce(_faith_moment, '')) > 120 THEN
    RAISE EXCEPTION 'invalid_community_profile' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    age,
    photo_url,
    city,
    state,
    bio,
    church,
    years_baptized,
    status,
    avatar_ai_verified,
    community_onboarding_version,
    community_onboarding_completed_at,
    updated_at
  )
  VALUES (
    _uid,
    trim(_full_name),
    _age,
    trim(_photo_url),
    trim(_city),
    _state,
    nullif(trim(coalesce(_bio, '')), ''),
    trim(_church),
    _years_baptized,
    'pending'::public.profile_status,
    false,
    trim(_questionnaire_version),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        age = EXCLUDED.age,
        photo_url = EXCLUDED.photo_url,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        bio = EXCLUDED.bio,
        church = EXCLUDED.church,
        years_baptized = EXCLUDED.years_baptized,
        avatar_ai_verified = false,
        community_onboarding_version = EXCLUDED.community_onboarding_version,
        community_onboarding_completed_at = EXCLUDED.community_onboarding_completed_at,
        updated_at = now()
  RETURNING * INTO _profile;

  INSERT INTO public.profile_advanced (
    user_id,
    faith_moment,
    updated_at
  )
  VALUES (
    _uid,
    nullif(trim(coalesce(_faith_moment, '')), ''),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET faith_moment = EXCLUDED.faith_moment,
        updated_at = now();

  INSERT INTO public.community_onboarding_progress (
    user_id,
    questionnaire_version,
    current_step,
    completed_at,
    updated_at
  )
  VALUES (_uid, trim(_questionnaire_version), 'privacy', now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET questionnaire_version = EXCLUDED.questionnaire_version,
        current_step = EXCLUDED.current_step,
        completed_at = EXCLUDED.completed_at,
        updated_at = now();

  RETURN _profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_dating_membership(
  _onboarding_version text,
  _sex public.sex_type,
  _marital public.marital_status,
  _height_cm integer,
  _seeking text,
  _pace text,
  _essential_quality text,
  _age_min integer,
  _age_max integer,
  _location_scope public.location_scope,
  _custom_states text[],
  _accepts_children boolean,
  _looking_for_bio text,
  _receive_anonymous boolean DEFAULT false
)
RETURNS public.dating_memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _profile_status public.profile_status;
  _existing_status text;
  _membership public.dating_memberships;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT status
    INTO _profile_status
    FROM public.profiles
   WHERE id = _uid
     AND deactivated_at IS NULL
     AND deletion_requested_at IS NULL;

  IF _profile_status IS DISTINCT FROM 'approved'::public.profile_status THEN
    RAISE EXCEPTION 'approved_community_profile_required' USING ERRCODE = '42501';
  END IF;

  SELECT status
    INTO _existing_status
    FROM public.dating_memberships
   WHERE user_id = _uid;

  IF _existing_status = 'restricted' THEN
    RAISE EXCEPTION 'dating_membership_restricted' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (
    SELECT 1
      FROM public.relationship_commitments
     WHERE status = 'active'
       AND (_uid = user_a OR _uid = user_b)
  ) THEN
    RAISE EXCEPTION 'dating_paused_by_commitment' USING ERRCODE = '42501';
  END IF;

  IF _onboarding_version IS NULL OR length(trim(_onboarding_version)) < 3 THEN
    RAISE EXCEPTION 'invalid_onboarding_version' USING ERRCODE = '22023';
  END IF;
  IF _height_cm < 120 OR _height_cm > 230 THEN
    RAISE EXCEPTION 'invalid_height' USING ERRCODE = '22023';
  END IF;
  IF _age_min < 18 OR _age_max > 110 OR _age_max < _age_min THEN
    RAISE EXCEPTION 'invalid_age_range' USING ERRCODE = '22023';
  END IF;
  IF length(coalesce(_seeking, '')) > 120
     OR length(coalesce(_pace, '')) > 120
     OR length(coalesce(_essential_quality, '')) > 120
     OR length(coalesce(_looking_for_bio, '')) > 600 THEN
    RAISE EXCEPTION 'dating_input_too_long' USING ERRCODE = '22023';
  END IF;
  IF _location_scope = 'personalizado'::public.location_scope
     AND coalesce(array_length(_custom_states, 1), 0) = 0 THEN
    RAISE EXCEPTION 'custom_states_required' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
     SET sex = _sex,
         marital = _marital,
         height_cm = _height_cm,
         updated_at = now()
   WHERE id = _uid;

  INSERT INTO public.profile_preferences (
    user_id,
    age_min,
    age_max,
    location_scope,
    custom_states,
    desired_quality,
    accepts_children,
    looking_for_bio,
    updated_at
  )
  VALUES (
    _uid,
    _age_min,
    _age_max,
    _location_scope,
    CASE
      WHEN _location_scope = 'personalizado'::public.location_scope
        THEN coalesce(_custom_states, '{}'::text[])
      ELSE '{}'::text[]
    END,
    nullif(trim(coalesce(_essential_quality, '')), ''),
    _accepts_children,
    nullif(trim(coalesce(_looking_for_bio, '')), ''),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET age_min = EXCLUDED.age_min,
        age_max = EXCLUDED.age_max,
        location_scope = EXCLUDED.location_scope,
        custom_states = EXCLUDED.custom_states,
        desired_quality = EXCLUDED.desired_quality,
        accepts_children = EXCLUDED.accepts_children,
        looking_for_bio = EXCLUDED.looking_for_bio,
        updated_at = now();

  INSERT INTO public.profile_advanced (
    user_id,
    seeking,
    pace,
    essential_quality,
    updated_at
  )
  VALUES (
    _uid,
    nullif(trim(coalesce(_seeking, '')), ''),
    nullif(trim(coalesce(_pace, '')), ''),
    nullif(trim(coalesce(_essential_quality, '')), ''),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET seeking = EXCLUDED.seeking,
        pace = EXCLUDED.pace,
        essential_quality = EXCLUDED.essential_quality,
        updated_at = now();

  INSERT INTO public.anonymous_message_settings (
    user_id,
    accept_anonymous,
    updated_at
  )
  VALUES (_uid, coalesce(_receive_anonymous, false), now())
  ON CONFLICT (user_id) DO UPDATE
    SET accept_anonymous = EXCLUDED.accept_anonymous,
        updated_at = now();

  INSERT INTO public.dating_memberships (
    user_id,
    status,
    onboarding_version,
    receive_anonymous,
    activated_at,
    paused_at,
    updated_at
  )
  VALUES (
    _uid,
    'active',
    trim(_onboarding_version),
    coalesce(_receive_anonymous, false),
    now(),
    NULL,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET status = 'active',
        onboarding_version = EXCLUDED.onboarding_version,
        receive_anonymous = EXCLUDED.receive_anonymous,
        activated_at = now(),
        paused_at = NULL,
        updated_at = now()
  RETURNING * INTO _membership;

  RETURN _membership;
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_dating_membership()
RETURNS public.dating_memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _membership public.dating_memberships;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.dating_memberships
     WHERE user_id = _uid
       AND status = 'restricted'
  ) THEN
    RAISE EXCEPTION 'dating_membership_restricted' USING ERRCODE = '42501';
  END IF;

  UPDATE public.dating_memberships
     SET status = 'paused',
         paused_at = now(),
         updated_at = now()
   WHERE user_id = _uid
  RETURNING * INTO _membership;

  IF _membership.user_id IS NULL THEN
    RAISE EXCEPTION 'dating_membership_not_found' USING ERRCODE = 'P0002';
  END IF;

  RETURN _membership;
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_dating_membership()
RETURNS public.dating_memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _membership public.dating_memberships;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.dating_memberships
     WHERE user_id = _uid
       AND status = 'restricted'
  ) THEN
    RAISE EXCEPTION 'dating_membership_restricted' USING ERRCODE = '42501';
  END IF;

  UPDATE public.dating_memberships
     SET status = 'inactive',
         receive_anonymous = false,
         paused_at = NULL,
         updated_at = now()
   WHERE user_id = _uid
  RETURNING * INTO _membership;

  IF _membership.user_id IS NULL THEN
    RAISE EXCEPTION 'dating_membership_not_found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.anonymous_message_settings (
    user_id,
    accept_anonymous,
    updated_at
  )
  VALUES (_uid, false, now())
  ON CONFLICT (user_id) DO UPDATE
    SET accept_anonymous = false,
        updated_at = now();

  RETURN _membership;
END;
$$;

CREATE OR REPLACE FUNCTION public.stage_legacy_dating_memberships(
  _legacy_cutover_at timestamptz,
  _batch_size integer DEFAULT 500
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _inserted integer;
BEGIN
  IF _legacy_cutover_at IS NULL OR _batch_size < 1 OR _batch_size > 5000 THEN
    RAISE EXCEPTION 'invalid_legacy_staging_parameters' USING ERRCODE = '22023';
  END IF;

  WITH candidates AS (
    SELECT
      p.id AS user_id,
      CASE
        WHEN EXISTS (
          SELECT 1
            FROM public.relationship_commitments rc
           WHERE rc.status = 'active'
             AND (rc.user_a = p.id OR rc.user_b = p.id)
        ) THEN 'paused_by_commitment'
        ELSE 'legacy_active_pending_confirmation'
      END AS membership_status,
      coalesce(ams.accept_anonymous, false) AS receive_anonymous
      FROM public.profiles p
      JOIN public.profile_preferences pp ON pp.user_id = p.id
      LEFT JOIN public.anonymous_message_settings ams ON ams.user_id = p.id
     WHERE p.status = 'approved'::public.profile_status
       AND p.created_at < _legacy_cutover_at
       AND p.deactivated_at IS NULL
       AND p.deletion_requested_at IS NULL
       AND p.sex IS NOT NULL
       AND p.marital IS NOT NULL
       AND p.height_cm IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
           FROM public.dating_memberships dm
          WHERE dm.user_id = p.id
       )
     ORDER BY p.created_at, p.id
     LIMIT _batch_size
  )
  INSERT INTO public.dating_memberships (
    user_id,
    status,
    onboarding_version,
    receive_anonymous,
    activated_at,
    paused_at,
    updated_at
  )
  SELECT
    user_id,
    membership_status,
    'legacy_v1',
    receive_anonymous,
    CASE
      WHEN membership_status = 'legacy_active_pending_confirmation' THEN now()
      ELSE NULL
    END,
    CASE
      WHEN membership_status = 'paused_by_commitment' THEN now()
      ELSE NULL
    END,
    now()
  FROM candidates
  ON CONFLICT (user_id) DO NOTHING;

  GET DIAGNOSTICS _inserted = ROW_COUNT;
  RETURN _inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_dating_membership(
  text,
  public.sex_type,
  public.marital_status,
  integer,
  text,
  text,
  text,
  integer,
  integer,
  public.location_scope,
  text[],
  boolean,
  text,
  boolean
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_community_onboarding(
  text,
  text,
  date,
  text,
  text,
  text,
  text,
  text,
  integer,
  text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_community_onboarding(
  text,
  text,
  date,
  text,
  text,
  text,
  text,
  text,
  integer,
  text
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_dating_membership(
  text,
  public.sex_type,
  public.marital_status,
  integer,
  text,
  text,
  text,
  integer,
  integer,
  public.location_scope,
  text[],
  boolean,
  text,
  boolean
) TO authenticated;

REVOKE ALL ON FUNCTION public.pause_dating_membership() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pause_dating_membership() TO authenticated;

REVOKE ALL ON FUNCTION public.deactivate_dating_membership() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deactivate_dating_membership() TO authenticated;

REVOKE ALL ON FUNCTION public.stage_legacy_dating_memberships(timestamptz, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.stage_legacy_dating_memberships(timestamptz, integer)
  TO service_role;

COMMENT ON TABLE public.community_onboarding_progress IS
  'Versioned owner-only progress for community-first onboarding.';
COMMENT ON TABLE public.dating_memberships IS
  'Explicit romantic-mode membership. Community participation never creates a row.';
COMMENT ON FUNCTION public.complete_community_onboarding(
  text,
  text,
  date,
  text,
  text,
  text,
  text,
  text,
  integer,
  text
) IS
  'Completes the community profile without creating or activating a Dating membership.';
COMMENT ON FUNCTION public.activate_dating_membership(
  text,
  public.sex_type,
  public.marital_status,
  integer,
  text,
  text,
  text,
  integer,
  integer,
  public.location_scope,
  text[],
  boolean,
  text,
  boolean
) IS
  'Explicitly activates Dating for an approved user and persists romantic preferences atomically.';
COMMENT ON FUNCTION public.stage_legacy_dating_memberships(timestamptz, integer) IS
  'Stages pre-cutover eligible users without executing automatically. Service-role only, idempotent and batched.';

COMMIT;
