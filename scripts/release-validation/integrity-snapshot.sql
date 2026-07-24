\set ON_ERROR_STOP on

CREATE TEMP TABLE release_validation_counts (
  relation_name text PRIMARY KEY,
  row_count bigint NOT NULL
);

DO $$
DECLARE
  relation_name text;
  row_count bigint;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY[
    'auth.users',
    'public.profiles',
    'public.user_roles',
    'public.user_coins',
    'public.coin_transactions',
    'public.matches',
    'public.messages',
    'public.blocks',
    'public.reports',
    'public.profile_photos',
    'public.user_pets',
    'public.user_pets_v2'
  ]
  LOOP
    IF to_regclass(relation_name) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM %s', relation_name) INTO row_count;
      INSERT INTO release_validation_counts VALUES (relation_name, row_count);
    END IF;
  END LOOP;
END
$$;

SELECT jsonb_build_object(
  'counts',
  (SELECT jsonb_object_agg(relation_name, row_count ORDER BY relation_name)
     FROM release_validation_counts),
  'profiles_semantic_checksum',
  COALESCE((
    SELECT md5(string_agg(
      concat_ws('|', id, status, deactivated_at IS NOT NULL, deletion_requested_at IS NOT NULL),
      ',' ORDER BY id
    ))
    FROM public.profiles
    WHERE full_name LIKE 'Synthetic User %'
  ), md5('')),
  'messages_semantic_checksum',
  COALESCE((
    SELECT md5(string_agg(concat_ws('|', id, match_id, sender_id, content), ',' ORDER BY id))
    FROM public.messages
    WHERE content = 'synthetic-message'
  ), md5('')),
  'negative_balances',
  (SELECT count(*) FROM public.user_coins WHERE balance < 0),
  'orphan_profiles',
  (SELECT count(*) FROM public.profiles p LEFT JOIN auth.users u ON u.id = p.id WHERE u.id IS NULL),
  'orphan_messages',
  (SELECT count(*) FROM public.messages m LEFT JOIN public.matches x ON x.id = m.match_id WHERE x.id IS NULL)
)::text;
