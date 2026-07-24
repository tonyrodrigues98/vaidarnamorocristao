\set ON_ERROR_STOP on

DO $$
DECLARE
  missing_rls text[];
  expected text[] := ARRAY[
    'trusted_reward_claims',
    'photo_repair_audit',
    'community_onboarding_progress',
    'dating_memberships',
    'community_privacy_settings',
    'social_relationships',
    'community_posts',
    'community_post_reactions',
    'community_post_comments',
    'community_statuses',
    'community_status_views',
    'community_spaces',
    'community_space_members',
    'community_events',
    'community_event_participants',
    'community_space_audit_log',
    'conversation_threads_v2',
    'conversation_participants_v2',
    'conversation_messages_v2',
    'conversation_receipts_v2',
    'conversation_preferences_v2',
    'conversation_attachments_v2',
    'profile_modules_v2',
    'dating_discovery_impressions_v2',
    'relationship_commitment_events_v2',
    'contextual_gift_commands_v2',
    'economy_commands_v2',
    'economy_feature_gates_v2',
    'pet_commands_v2',
    'christian_content_sources_v2',
    'bible_versions_v2',
    'bible_passages_v2',
    'verbo_notes_v2',
    'verbo_bookmarks_v2',
    'verbo_reading_progress_v2',
    'verbo_studies_v2',
    'verbo_challenges_v2',
    'verbo_challenge_progress_v2',
    'cinema_operation_gates_v2',
    'cinema_media_v2',
    'cinema_media_processing_v2',
    'cinema_sessions_v2',
    'cinema_participants_v2',
    'cinema_control_events_v2',
    'notification_preferences_v2',
    'notification_domain_events_v2',
    'notification_delivery_attempts_v2',
    'user_mutes_v2',
    'moderation_cases_v2',
    'support_ticket_context_v2',
    'admin_command_requests_v2',
    'admin_action_audit_v2'
  ];
  relation_name text;
BEGIN
  FOREACH relation_name IN ARRAY expected LOOP
    IF to_regclass('public.' || relation_name) IS NULL THEN
      RAISE EXCEPTION 'missing expected V2 relation: %', relation_name;
    END IF;
  END LOOP;

  SELECT array_agg(c.relname ORDER BY c.relname)
    INTO missing_rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relname = ANY(expected)
     AND c.relkind IN ('r', 'p')
     AND NOT c.relrowsecurity;

  IF missing_rls IS NOT NULL THEN
    RAISE EXCEPTION 'expected V2 relations without RLS: %', missing_rls;
  END IF;
END
$$;

SELECT jsonb_build_object(
  'public_tables', (
    SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  ),
  'rls_enabled_tables', (
    SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relrowsecurity
  ),
  'policies', (SELECT count(*) FROM pg_policies WHERE schemaname = 'public'),
  'security_definer_functions', (
    SELECT count(*)
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  ),
  'triggers', (
    SELECT count(*)
    FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND NOT t.tgisinternal
  ),
  'storage_buckets', (SELECT count(*) FROM storage.buckets),
  'realtime_tables', (
    SELECT count(*)
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
  )
)::text;
