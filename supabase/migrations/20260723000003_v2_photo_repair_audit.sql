-- V2-008: append-only audit trail for privileged photo repair.
-- Expand-only migration. It does not touch existing photos, profiles or Storage.

CREATE TABLE IF NOT EXISTS public.photo_repair_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  target_user_id uuid,
  target_photo_id uuid,
  action text NOT NULL CHECK (action IN ('scan', 'replace', 'clear')),
  phase text NOT NULL CHECK (phase IN ('started', 'dry_run', 'succeeded', 'failed')),
  outcome text NOT NULL CHECK (outcome IN ('pending', 'allowed', 'completed', 'rejected')),
  scope text CHECK (scope IS NULL OR scope IN ('avatar', 'extra')),
  error_code text,
  dry_run boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS photo_repair_audit_request_created_idx
  ON public.photo_repair_audit (request_id, created_at);

CREATE INDEX IF NOT EXISTS photo_repair_audit_actor_created_idx
  ON public.photo_repair_audit (actor_id, created_at DESC);

ALTER TABLE public.photo_repair_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_repair_audit FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.photo_repair_audit FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reject_photo_repair_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'photo_repair_audit is append-only';
END;
$$;

REVOKE ALL ON FUNCTION public.reject_photo_repair_audit_mutation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS photo_repair_audit_append_only
  ON public.photo_repair_audit;

CREATE TRIGGER photo_repair_audit_append_only
BEFORE UPDATE OR DELETE ON public.photo_repair_audit
FOR EACH ROW
EXECUTE FUNCTION public.reject_photo_repair_audit_mutation();

COMMENT ON TABLE public.photo_repair_audit IS
  'Append-only audit events for the server-only administrative photo repair endpoint.';
