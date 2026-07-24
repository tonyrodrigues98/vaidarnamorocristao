BEGIN;

-- V2-013 is additive. It does not move or delete profile, photo, inventory,
-- gift, achievement, pet or romantic data.

CREATE TABLE IF NOT EXISTS public.profile_modules_v2 (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_type text NOT NULL CHECK (module_type IN (
    'about', 'faith', 'favorites', 'gallery', 'achievements', 'gifts',
    'pet', 'verses', 'communities', 'collections', 'relationship'
  )),
  sort_order integer NOT NULL CHECK (sort_order BETWEEN 0 AND 31),
  visible boolean NOT NULL DEFAULT true,
  audience text NOT NULL DEFAULT 'community'
    CHECK (audience IN ('public', 'community', 'connections', 'private')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(config) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, module_type),
  UNIQUE (user_id, sort_order)
);

ALTER TABLE public.profile_modules_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profile_modules_v2 FROM anon, authenticated;
GRANT ALL ON TABLE public.profile_modules_v2 TO service_role;

CREATE POLICY "profile modules owner read"
  ON public.profile_modules_v2 FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.v2_can_view_profile_audience(
  _profile_user_id uuid,
  _audience text,
  _viewer_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN _viewer_user_id = _profile_user_id THEN true
    WHEN _audience = 'private' THEN false
    WHEN _audience IN ('public', 'community') THEN
      public.v2_community_user_is_approved(_viewer_user_id)
    WHEN _audience = 'connections' THEN EXISTS (
      SELECT 1
      FROM public.social_relationships relationship
      WHERE relationship.kind = 'connection'
        AND relationship.status = 'active'
        AND (
          (relationship.source_user_id = _profile_user_id
            AND relationship.target_user_id = _viewer_user_id)
          OR
          (relationship.source_user_id = _viewer_user_id
            AND relationship.target_user_id = _profile_user_id)
        )
    )
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_community_profile_v2(
  _profile_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _viewer uuid := auth.uid();
  _owner boolean := _viewer = _profile_user_id;
  _result jsonb;
  _configuration_updated_at timestamptz;
BEGIN
  IF _viewer IS NULL
     OR _profile_user_id IS NULL
     OR NOT public.v2_community_user_is_approved(_viewer)
     OR (NOT _owner AND NOT public.v2_community_user_is_approved(_profile_user_id))
     OR (NOT _owner AND public.v2_community_users_blocked(_viewer, _profile_user_id)) THEN
    RAISE EXCEPTION 'profile_not_available' USING ERRCODE = '42501';
  END IF;

  SELECT max(module.updated_at)
  INTO _configuration_updated_at
  FROM public.profile_modules_v2 module
  WHERE module.user_id = _profile_user_id;

  WITH default_modules(module_type, sort_order, visible, audience) AS (
    VALUES
      ('about'::text, 0, true, 'community'::text),
      ('faith', 1, true, 'community'),
      ('favorites', 2, true, 'connections'),
      ('gallery', 3, true, 'connections'),
      ('achievements', 4, true, 'connections'),
      ('gifts', 5, true, 'connections'),
      ('pet', 6, true, 'connections'),
      ('verses', 7, true, 'connections'),
      ('communities', 8, true, 'connections'),
      ('collections', 9, true, 'connections'),
      ('relationship', 10, false, 'private')
  ),
  effective_modules AS (
    SELECT
      defaults.module_type,
      coalesce(config.sort_order, defaults.sort_order) AS sort_order,
      coalesce(config.visible, defaults.visible) AS visible,
      coalesce(config.audience, defaults.audience) AS audience
    FROM default_modules defaults
    LEFT JOIN public.profile_modules_v2 config
      ON config.user_id = _profile_user_id
      AND config.module_type = defaults.module_type
  ),
  visible_modules AS (
    SELECT module.*
    FROM effective_modules module
    WHERE (
      _owner
      OR (
        module.visible
        AND public.v2_can_view_profile_audience(
          _profile_user_id,
          module.audience,
          _viewer
        )
      )
    )
      AND (
        module.module_type <> 'relationship'
        OR (
          _owner
          AND EXISTS (
            SELECT 1
            FROM public.dating_memberships membership
            WHERE membership.user_id = _profile_user_id
              AND membership.status = 'active'
          )
        )
      )
  ),
  profile_row AS (
    SELECT profile.*
    FROM public.profiles profile
    WHERE profile.id = _profile_user_id
  ),
  appearance AS (
    SELECT jsonb_build_object(
      'background_url', background.image_url,
      'frame_url', frame.image_url,
      'aura_url', aura.image_url,
      'name_color_a', gradient.color_a,
      'name_color_b', gradient.color_b
    ) AS value
    FROM profile_row profile
    LEFT JOIN public.user_profile_backgrounds owned_background
      ON owned_background.user_id = profile.id
      AND owned_background.background_id = profile.equipped_background_id
    LEFT JOIN public.profile_backgrounds background
      ON background.id = owned_background.background_id
      AND background.is_active
    LEFT JOIN public.user_decorations owned_frame
      ON owned_frame.user_id = profile.id
      AND owned_frame.decoration_id = profile.equipped_frame_id
    LEFT JOIN public.avatar_decorations frame
      ON frame.id = owned_frame.decoration_id
      AND frame.type = 'frame'
      AND frame.active
    LEFT JOIN public.user_decorations owned_aura
      ON owned_aura.user_id = profile.id
      AND owned_aura.decoration_id = profile.equipped_aura_id
    LEFT JOIN public.avatar_decorations aura
      ON aura.id = owned_aura.decoration_id
      AND aura.type = 'aura'
      AND aura.active
    LEFT JOIN public.user_name_gradients owned_gradient
      ON owned_gradient.user_id = profile.id
      AND owned_gradient.gradient_id = profile.equipped_name_gradient_id
    LEFT JOIN public.name_gradients gradient
      ON gradient.id = owned_gradient.gradient_id
      AND gradient.is_active
  ),
  module_payload AS (
    SELECT
      module.module_type,
      module.sort_order,
      module.visible,
      module.audience,
      CASE module.module_type
        WHEN 'about' THEN jsonb_build_object(
          'text',
          nullif(concat_ws(
            E'\n',
            nullif(profile.bio, ''),
            CASE
              WHEN profile.city <> '' THEN profile.city || ', ' || profile.state
              ELSE NULL
            END
          ), '')
        )
        WHEN 'faith' THEN jsonb_build_object(
          'text',
          nullif(concat_ws(
            E'\n',
            nullif(profile.church, ''),
            CASE
              WHEN profile.years_baptized > 0
                THEN profile.years_baptized::text || ' anos de batismo'
              ELSE NULL
            END
          ), '')
        )
        WHEN 'gallery' THEN jsonb_build_object(
          'gallery',
          coalesce((
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', gallery_row.id,
                'url', gallery_row.url,
                'category', gallery_row.category
              )
              ORDER BY gallery_row.sort_order, gallery_row.created_at, gallery_row.id
            )
            FROM (
              SELECT photo.id, photo.url, photo.category, photo.sort_order, photo.created_at
              FROM public.profile_photos photo
              WHERE photo.user_id = _profile_user_id
                AND (photo.ai_verified OR _owner)
              ORDER BY photo.sort_order, photo.created_at, photo.id
              LIMIT 12
            ) gallery_row
          ), '[]'::jsonb)
        )
        WHEN 'achievements' THEN jsonb_build_object(
          'items',
          coalesce((
            SELECT jsonb_agg(to_jsonb(achievement_row))
            FROM (
              SELECT
                unlocked.id,
                achievement.name AS title,
                coalesce(achievement.description, '') AS description,
                NULL::text AS image_url
              FROM public.user_achievements unlocked
              JOIN public.pet_achievements achievement
                ON achievement.id = unlocked.achievement_id
              WHERE unlocked.user_id = _profile_user_id
                AND unlocked.unlocked_at IS NOT NULL
                AND achievement.active
              ORDER BY unlocked.unlocked_at DESC, unlocked.id
              LIMIT 6
            ) achievement_row
          ), '[]'::jsonb)
        )
        WHEN 'gifts' THEN jsonb_build_object(
          'items',
          coalesce((
            SELECT jsonb_agg(to_jsonb(gift_row))
            FROM (
              SELECT
                transaction.id,
                gift.name AS title,
                coalesce(transaction.message, '') AS description,
                gift.image_url
              FROM public.gift_transactions transaction
              JOIN public.virtual_gifts gift ON gift.id = transaction.gift_id
              WHERE transaction.receiver_id = _profile_user_id
                AND gift.active
              ORDER BY transaction.created_at DESC, transaction.id
              LIMIT 6
            ) gift_row
          ), '[]'::jsonb)
        )
        WHEN 'pet' THEN jsonb_build_object(
          'items',
          coalesce((
            SELECT jsonb_agg(to_jsonb(pet_row))
            FROM (
              SELECT
                pet.id,
                coalesce(nullif(pet.custom_name, ''), 'Meu Pet') AS title,
                coalesce(variant.name, species.name, category.name, '') AS description,
                coalesce(variant.image_url, species.image_url, category.image_url) AS image_url
              FROM public.user_pets_v2 pet
              JOIN public.pet_categories category ON category.id = pet.category_id
              LEFT JOIN public.pet_species species ON species.id = pet.species_id
              LEFT JOIN public.pet_variants variant ON variant.id = pet.variant_id
              WHERE pet.user_id = _profile_user_id
                AND pet.is_equipped
                AND (_owner OR pet.visibility = 'public')
              ORDER BY pet.updated_at DESC, pet.id
              LIMIT 1
            ) pet_row
          ), '[]'::jsonb)
        )
        WHEN 'relationship' THEN jsonb_build_object(
          'text', 'Esta vitrine é configurada exclusivamente dentro do Modo Namoro.'
        )
        ELSE '{}'::jsonb
      END AS data
    FROM visible_modules module
    CROSS JOIN profile_row profile
  )
  SELECT jsonb_build_object(
    'owner', _owner,
    'configuration_updated_at', _configuration_updated_at,
    'identity', jsonb_build_object(
      'display_name', profile.full_name,
      'photo_url', profile.photo_url,
      'bio', CASE
        WHEN _owner OR EXISTS (
          SELECT 1 FROM visible_modules module WHERE module.module_type = 'about'
        ) THEN coalesce(profile.bio, '')
        ELSE ''
      END,
      'city', CASE
        WHEN _owner OR EXISTS (
          SELECT 1 FROM visible_modules module WHERE module.module_type = 'about'
        ) THEN profile.city
        ELSE NULL
      END,
      'state', CASE
        WHEN _owner OR EXISTS (
          SELECT 1 FROM visible_modules module WHERE module.module_type = 'about'
        ) THEN profile.state
        ELSE NULL
      END,
      'church', CASE
        WHEN _owner OR EXISTS (
          SELECT 1 FROM visible_modules module WHERE module.module_type = 'faith'
        ) THEN profile.church
        ELSE NULL
      END,
      'years_baptized', CASE
        WHEN _owner OR EXISTS (
          SELECT 1 FROM visible_modules module WHERE module.module_type = 'faith'
        ) THEN profile.years_baptized
        ELSE NULL
      END,
      'verified', profile.verified,
      'presence', CASE
        WHEN _owner OR public.v2_can_view_profile_audience(
          _profile_user_id, 'connections', _viewer
        ) THEN coalesce((
          SELECT CASE
            WHEN presence.last_seen_at >= now() - interval '3 minutes' THEN 'online'
            WHEN presence.last_seen_at >= now() - interval '30 minutes' THEN 'recently'
            ELSE 'offline'
          END
          FROM public.presence_last_seen presence
          WHERE presence.user_id = _profile_user_id
        ), 'offline')
        ELSE 'offline'
      END
    ),
    'appearance', (SELECT value FROM appearance),
    'modules', coalesce((
      SELECT jsonb_agg(to_jsonb(module_payload) ORDER BY sort_order, module_type)
      FROM module_payload
    ), '[]'::jsonb)
  )
  INTO _result
  FROM profile_row profile;

  IF _result IS NULL THEN
    RAISE EXCEPTION 'profile_not_available' USING ERRCODE = '42501';
  END IF;
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_profile_modules_v2(
  _modules jsonb,
  _expected_updated_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _current_updated_at timestamptz;
  _next_updated_at timestamptz := clock_timestamp();
  _module_count integer;
BEGIN
  IF _modules IS NULL OR jsonb_typeof(_modules) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'invalid_profile_modules' USING ERRCODE = '22023';
  END IF;

  _module_count := jsonb_array_length(_modules);
  IF NOT public.v2_community_user_is_approved(_uid)
     OR _module_count NOT IN (10, 11) THEN
    RAISE EXCEPTION 'invalid_profile_modules' USING ERRCODE = '22023';
  END IF;

  SELECT max(module.updated_at)
  INTO _current_updated_at
  FROM public.profile_modules_v2 module
  WHERE module.user_id = _uid;
  IF _current_updated_at IS DISTINCT FROM _expected_updated_at THEN
    RAISE EXCEPTION 'profile_modules_conflict' USING ERRCODE = '40001';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(_modules) AS item(
      module_type text,
      sort_order integer,
      visible boolean,
      audience text
    )
    WHERE item.module_type NOT IN (
      'about', 'faith', 'favorites', 'gallery', 'achievements', 'gifts',
      'pet', 'verses', 'communities', 'collections', 'relationship'
    )
      OR item.sort_order NOT BETWEEN 0 AND 10
      OR item.audience NOT IN ('public', 'community', 'connections', 'private')
      OR item.visible IS NULL
  ) OR (
    SELECT count(DISTINCT item.module_type) <> _module_count
      OR count(DISTINCT item.sort_order) <> _module_count
      OR min(item.sort_order) <> 0
      OR max(item.sort_order) <> _module_count - 1
    FROM jsonb_to_recordset(_modules) AS item(module_type text, sort_order integer)
  ) OR EXISTS (
    SELECT 1
    FROM (
      VALUES
        ('about'::text), ('faith'), ('favorites'), ('gallery'), ('achievements'),
        ('gifts'), ('pet'), ('verses'), ('communities'), ('collections')
    ) required(module_type)
    WHERE NOT EXISTS (
      SELECT 1
      FROM jsonb_to_recordset(_modules) AS item(module_type text)
      WHERE item.module_type = required.module_type
    )
  ) THEN
    RAISE EXCEPTION 'invalid_profile_modules' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(_modules) AS item(
      module_type text,
      visible boolean
    )
    WHERE item.module_type = 'relationship'
      AND item.visible
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.dating_memberships membership
    WHERE membership.user_id = _uid
      AND membership.status = 'active'
  ) THEN
    RAISE EXCEPTION 'dating_module_not_available' USING ERRCODE = '42501';
  END IF;

  -- Move the current ordering outside the final 0..10 range so swapping two
  -- modules cannot trip the unique constraint during the upsert.
  UPDATE public.profile_modules_v2
  SET sort_order = sort_order + 11
  WHERE user_id = _uid
    AND sort_order BETWEEN 0 AND 10;

  INSERT INTO public.profile_modules_v2 (
    user_id, module_type, sort_order, visible, audience, updated_at
  )
  SELECT
    _uid,
    item.module_type,
    item.sort_order,
    item.visible,
    item.audience,
    _next_updated_at
  FROM jsonb_to_recordset(_modules) AS item(
    module_type text,
    sort_order integer,
    visible boolean,
    audience text
  )
  ON CONFLICT (user_id, module_type)
  DO UPDATE SET
    sort_order = EXCLUDED.sort_order,
    visible = EXCLUDED.visible,
    audience = EXCLUDED.audience,
    updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object('updated_at', _next_updated_at);
END;
$$;

REVOKE ALL ON FUNCTION public.v2_can_view_profile_audience(uuid, text, uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_community_profile_v2(uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_profile_modules_v2(jsonb, timestamptz)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.v2_can_view_profile_audience(uuid, text, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_community_profile_v2(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_profile_modules_v2(jsonb, timestamptz)
  TO authenticated;

COMMENT ON TABLE public.profile_modules_v2 IS
  'Presentation order and audience only; profile, economy and inventory data remain owned by their source domains.';
COMMENT ON FUNCTION public.get_community_profile_v2(uuid) IS
  'Privacy-filtered modular community profile. Romantic preferences are never returned.';

COMMIT;
