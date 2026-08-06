-- VaiDarNamoro — Item 3
-- Inventário SOMENTE LEITURA do Supabase publicado.
-- Não contém INSERT, UPDATE, DELETE, ALTER, CREATE, DROP, GRANT ou REVOKE.
-- Execute apenas no SQL Editor do projeto fngczifztngaanqsjtyn.

-- 1. Identidade e versão do PostgreSQL
select
  current_database() as database_name,
  current_user as executed_by,
  current_setting('server_version') as postgres_version,
  now() as captured_at;

-- 2. Histórico de migrations aplicado pelo Supabase
select
  version,
  name,
  statements
from supabase_migrations.schema_migrations
order by version;

-- 3. Tabelas e views públicas
select
  n.nspname as schema_name,
  c.relname as object_name,
  case c.relkind
    when 'r' then 'table'
    when 'p' then 'partitioned_table'
    when 'v' then 'view'
    when 'm' then 'materialized_view'
    when 'f' then 'foreign_table'
    else c.relkind::text
  end as object_type,
  pg_get_userbyid(c.relowner) as owner,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'storage')
  and c.relkind in ('r', 'p', 'v', 'm', 'f')
order by n.nspname, object_type, c.relname;

-- 4. Colunas, tipos, nulabilidade e defaults
select
  n.nspname as schema_name,
  c.relname as table_name,
  a.attnum as ordinal_position,
  a.attname as column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
  not a.attnotnull as is_nullable,
  pg_get_expr(ad.adbin, ad.adrelid) as column_default,
  col_description(c.oid, a.attnum) as comment
from pg_attribute a
join pg_class c on c.oid = a.attrelid
join pg_namespace n on n.oid = c.relnamespace
left join pg_attrdef ad on ad.adrelid = a.attrelid and ad.adnum = a.attnum
where n.nspname = 'public'
  and c.relkind in ('r', 'p', 'v', 'm')
  and a.attnum > 0
  and not a.attisdropped
order by c.relname, a.attnum;

-- 5. Constraints, incluindo PK, FK, UNIQUE e CHECK
select
  n.nspname as schema_name,
  c.relname as table_name,
  con.conname as constraint_name,
  case con.contype
    when 'p' then 'primary_key'
    when 'f' then 'foreign_key'
    when 'u' then 'unique'
    when 'c' then 'check'
    when 'x' then 'exclusion'
    else con.contype::text
  end as constraint_type,
  pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
order by c.relname, constraint_type, con.conname;

-- 6. Enums e valores em ordem
select
  n.nspname as schema_name,
  t.typname as enum_name,
  e.enumsortorder,
  e.enumlabel
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
order by t.typname, e.enumsortorder;

-- 7. Funções: assinatura, retorno, owner e modo de segurança
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  pg_get_function_result(p.oid) as result_type,
  l.lanname as language,
  pg_get_userbyid(p.proowner) as owner,
  p.prosecdef as security_definer,
  p.provolatile as volatility,
  p.proconfig as function_settings,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_can_execute,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
order by p.proname, identity_arguments;

-- 8. Policies RLS completas
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- 9. Grants de tabela
select
  table_schema,
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema in ('public', 'storage')
order by table_schema, table_name, grantee, privilege_type;

-- 10. Triggers de usuário e função acionada
select
  n.nspname as schema_name,
  c.relname as table_name,
  t.tgname as trigger_name,
  t.tgenabled as enabled_state,
  pg_get_triggerdef(t.oid, true) as definition,
  pn.nspname as function_schema,
  p.proname as function_name
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
join pg_namespace pn on pn.oid = p.pronamespace
where n.nspname = 'public'
  and not t.tgisinternal
order by c.relname, t.tgname;

-- 11. Índices
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- 12. Tabelas publicadas no Realtime
select
  pubname,
  schemaname,
  tablename,
  attnames,
  rowfilter
from pg_publication_tables
where pubname = 'supabase_realtime'
order by schemaname, tablename;

-- 13. Buckets de Storage
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
from storage.buckets
order by id;

-- 14. Extensões instaladas
select
  e.extname,
  e.extversion,
  n.nspname as schema_name
from pg_extension e
join pg_namespace n on n.oid = e.extnamespace
order by e.extname;

-- 15. Resumo para comparação rápida com o snapshot documental
select 'public_tables' as metric, count(*)::bigint as value
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
union all
select 'public_views', count(*)::bigint
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('v', 'm')
union all
select 'public_functions', count(*)::bigint
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
union all
select 'public_enums', count(distinct t.oid)::bigint
from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
union all
select 'public_rls_policies', count(*)::bigint
from pg_policies where schemaname = 'public'
union all
select 'storage_rls_policies', count(*)::bigint
from pg_policies where schemaname = 'storage'
union all
select 'public_user_triggers', count(*)::bigint
from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and not t.tgisinternal
union all
select 'realtime_tables', count(*)::bigint
from pg_publication_tables where pubname = 'supabase_realtime'
union all
select 'storage_buckets', count(*)::bigint
from storage.buckets
order by metric;
