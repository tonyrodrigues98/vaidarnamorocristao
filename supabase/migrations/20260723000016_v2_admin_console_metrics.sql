-- V2-021: modular Admin health dashboard and audit envelope.
-- Additive only; no existing administrative command is replaced.
BEGIN;

DO $$
DECLARE
  _required regclass;
BEGIN
  FOREACH _required IN ARRAY ARRAY[
    to_regclass('public.profiles'),
    to_regclass('public.moderation_cases_v2'),
    to_regclass('public.support_tickets'),
    to_regclass('public.push_queue'),
    to_regclass('public.economy_commands_v2'),
    to_regclass('public.cinema_media_processing_v2')
  ]
  LOOP
    IF _required IS NULL THEN
      RAISE EXCEPTION 'V2-021 preflight failed: required relation is missing';
    END IF;
  END LOOP;
END;
$$;

CREATE TABLE public.admin_command_requests_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE,
  actor_id uuid NOT NULL REFERENCES public.profiles(id),
  module text NOT NULL CHECK (
    module IN (
      'identity', 'verification', 'moderation', 'community', 'dating',
      'messaging', 'content', 'economy', 'catalog', 'pets', 'games',
      'cinema', 'notifications', 'support', 'team', 'system'
    )
  ),
  capability text NOT NULL,
  command_name text NOT NULL,
  target_type text NOT NULL,
  target_reference text NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 8 AND 1000),
  correlation_reference text,
  idempotency_key uuid NOT NULL UNIQUE,
  state text NOT NULL DEFAULT 'requested'
    CHECK (state IN ('requested', 'authorized', 'executing', 'succeeded', 'failed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.admin_action_audit_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_request_id uuid REFERENCES public.admin_command_requests_v2(id),
  actor_id uuid NOT NULL REFERENCES public.profiles(id),
  capability text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_reference text NOT NULL,
  result text NOT NULL CHECK (result IN ('allowed', 'denied', 'succeeded', 'failed')),
  reason_code text NOT NULL,
  before_digest text,
  after_digest text,
  correlation_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (before_digest IS NULL OR before_digest ~ '^[0-9a-f]{64}$'),
  CHECK (after_digest IS NULL OR after_digest ~ '^[0-9a-f]{64}$')
);

CREATE INDEX admin_action_audit_v2_created_idx
  ON public.admin_action_audit_v2 (created_at DESC);

ALTER TABLE public.admin_command_requests_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_audit_v2 ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.admin_command_requests_v2,
  public.admin_action_audit_v2
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.admin_command_requests_v2,
  public.admin_action_audit_v2
TO authenticated;
GRANT ALL ON TABLE
  public.admin_command_requests_v2,
  public.admin_action_audit_v2
TO service_role;

CREATE POLICY "admin reads command requests"
  ON public.admin_command_requests_v2 FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "admin reads action audit"
  ON public.admin_action_audit_v2 FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE OR REPLACE FUNCTION public.get_admin_console_v2()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _is_super boolean;
  _is_admin boolean;
  _is_moderator boolean;
  _is_presenter boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  _is_super := public.has_role(_uid, 'super_admin');
  _is_admin := public.has_role(_uid, 'admin');
  _is_moderator := public.has_role(_uid, 'moderador');
  _is_presenter := public.has_role(_uid, 'apresentador');
  IF NOT (_is_super OR _is_admin OR _is_moderator OR _is_presenter) THEN
    RAISE EXCEPTION 'admin_console_forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'server_now', now(),
    'data_freshness', 'live',
    'recent_audit_count', CASE
      WHEN _is_super OR _is_admin THEN (
        SELECT count(*) FROM public.admin_action_audit_v2
        WHERE created_at >= now() - interval '24 hours'
      )
      ELSE 0
    END,
    'metrics', jsonb_build_array(
      jsonb_build_object(
        'id', 'profile-approval-queue',
        'label', 'Cadastros aguardando aprovação',
        'value', (SELECT count(*) FROM public.profiles WHERE status = 'pending'),
        'status', CASE
          WHEN (SELECT count(*) FROM public.profiles WHERE status = 'pending') > 0
          THEN 'attention' ELSE 'healthy' END,
        'action_module', 'users'
      ),
      jsonb_build_object(
        'id', 'moderation-open',
        'label', 'Casos de moderação abertos',
        'value', (SELECT count(*) FROM public.moderation_cases_v2 WHERE state IN ('open', 'triage')),
        'status', CASE
          WHEN (SELECT count(*) FROM public.moderation_cases_v2 WHERE state IN ('open', 'triage')) > 0
          THEN 'attention' ELSE 'healthy' END,
        'action_module', 'moderation'
      ),
      jsonb_build_object(
        'id', 'support-open',
        'label', 'Tickets que exigem resposta',
        'value', (
          SELECT count(*) FROM public.support_tickets
          WHERE status IN ('open', 'in_review')
        ),
        'status', CASE
          WHEN (
            SELECT count(*) FROM public.support_tickets
            WHERE status IN ('open', 'in_review')
          ) > 0 THEN 'attention' ELSE 'healthy' END,
        'action_module', 'support'
      ),
      jsonb_build_object(
        'id', 'economy-failed',
        'label', 'Comandos econômicos com falha',
        'value', (
          SELECT count(*) FROM public.economy_commands_v2
          WHERE result->>'status' = 'failed' AND created_at >= now() - interval '24 hours'
        ),
        'status', CASE
          WHEN (
            SELECT count(*) FROM public.economy_commands_v2
            WHERE result->>'status' = 'failed' AND created_at >= now() - interval '24 hours'
          ) > 0 THEN 'critical' ELSE 'healthy' END,
        'action_module', 'economy'
      ),
      jsonb_build_object(
        'id', 'push-failed',
        'label', 'Entregas push com falha',
        'value', (
          SELECT count(*) FROM public.push_queue
          WHERE dead_lettered_at IS NOT NULL
            AND dead_lettered_at >= now() - interval '24 hours'
        ),
        'status', CASE
          WHEN (
            SELECT count(*) FROM public.push_queue
            WHERE dead_lettered_at IS NOT NULL
              AND dead_lettered_at >= now() - interval '24 hours'
          ) > 0 THEN 'critical' ELSE 'healthy' END,
        'action_module', 'notifications'
      ),
      jsonb_build_object(
        'id', 'cinema-processing-failed',
        'label', 'Mídias com processamento falho',
        'value', (
          SELECT count(*) FROM public.cinema_media_processing_v2
          WHERE status = 'failed' AND created_at >= now() - interval '24 hours'
        ),
        'status', CASE
          WHEN (
            SELECT count(*) FROM public.cinema_media_processing_v2
            WHERE status = 'failed' AND created_at >= now() - interval '24 hours'
          ) > 0 THEN 'critical' ELSE 'healthy' END,
        'action_module', 'cinema'
      )
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_console_v2() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_console_v2() TO authenticated, service_role;

COMMENT ON TABLE public.admin_command_requests_v2 IS
  'Audit envelope only. Domain commands remain authoritative and are not duplicated here.';
COMMENT ON TABLE public.admin_action_audit_v2 IS
  'Minimal before/after digests; never stores private content, tokens, balances or evidence payloads.';
COMMENT ON FUNCTION public.get_admin_console_v2() IS
  'Actionable health counts only. It returns no user row, message, balance or private content.';

COMMIT;
