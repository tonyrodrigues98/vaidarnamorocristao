-- V2-024 READ-ONLY INVENTORY — NOT EXECUTED
-- Run only in an authenticated, approved read-only session. It returns metadata,
-- never row content, credentials, decrypted secrets, object paths or user data.

BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '2s';

SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_schema IN ('public', 'auth', 'storage')
ORDER BY table_schema, table_name;

SELECT table_schema, table_name, column_name, data_type, is_nullable, ordinal_position
FROM information_schema.columns
WHERE table_schema IN ('public', 'auth', 'storage')
ORDER BY table_schema, table_name, ordinal_position;

SELECT routine_schema, routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_catalog.pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

SELECT event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

SELECT table_schema, table_name, 'table' AS object_type, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema IN ('public', 'storage')
ORDER BY table_schema, table_name, grantee, privilege_type;

SELECT pubname, schemaname, tablename
FROM pg_catalog.pg_publication_tables
ORDER BY pubname, schemaname, tablename;

SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
ORDER BY id;

ROLLBACK;
