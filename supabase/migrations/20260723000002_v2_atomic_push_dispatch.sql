-- V2-008: lease push work atomically and complete it with a per-claim token.
-- This migration is additive and intentionally not applied by Codex.

DO $$
BEGIN
  IF to_regclass('public.push_queue') IS NULL THEN
    RAISE EXCEPTION 'required table missing: public.push_queue';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_attribute
    WHERE attrelid = 'public.push_queue'::regclass
      AND attname = 'processed_at'
      AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'required column missing: public.push_queue.processed_at';
  END IF;
END
$$;

ALTER TABLE public.push_queue
  ADD COLUMN IF NOT EXISTS claim_token uuid,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '28 days'),
  ADD COLUMN IF NOT EXISTS dead_lettered_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error_code text;

CREATE INDEX IF NOT EXISTS push_queue_dispatchable_idx
  ON public.push_queue (next_attempt_at, created_at)
  WHERE processed_at IS NULL AND dead_lettered_at IS NULL;

CREATE INDEX IF NOT EXISTS push_queue_lease_idx
  ON public.push_queue (claimed_at)
  WHERE processed_at IS NULL
    AND dead_lettered_at IS NULL
    AND claim_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.claim_push_dispatch_batch(
  _batch_limit integer DEFAULT 50,
  _lease_seconds integer DEFAULT 120
)
RETURNS TABLE (
  queue_id uuid,
  lease_token uuid,
  user_id uuid,
  title text,
  body text,
  url text,
  attempts integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF _batch_limit < 1 OR _batch_limit > 100 THEN
    RAISE EXCEPTION 'invalid_batch_limit';
  END IF;

  IF _lease_seconds < 15 OR _lease_seconds > 600 THEN
    RAISE EXCEPTION 'invalid_lease_seconds';
  END IF;

  UPDATE public.push_queue AS expired
     SET dead_lettered_at = now(),
         claim_token = NULL,
         claimed_at = NULL,
         last_error_code = CASE
           WHEN expired.expires_at <= now() THEN 'expired'
           ELSE 'attempts_exhausted'
         END,
         last_error = CASE
           WHEN expired.expires_at <= now() THEN 'expired'
           ELSE 'attempts_exhausted'
         END
   WHERE expired.processed_at IS NULL
     AND expired.dead_lettered_at IS NULL
     AND (
       expired.expires_at <= now()
       OR expired.attempts >= 5
     );

  RETURN QUERY
  WITH candidates AS (
    SELECT candidate.id
    FROM public.push_queue AS candidate
    WHERE candidate.processed_at IS NULL
      AND candidate.dead_lettered_at IS NULL
      AND candidate.expires_at > now()
      AND candidate.attempts < 5
      AND candidate.next_attempt_at <= now()
      AND (
        candidate.claim_token IS NULL
        OR candidate.claimed_at < now() - make_interval(secs => _lease_seconds)
      )
    ORDER BY candidate.created_at, candidate.id
    LIMIT _batch_limit
    FOR UPDATE SKIP LOCKED
  ),
  claimed AS (
    UPDATE public.push_queue AS queue_row
       SET claim_token = gen_random_uuid(),
           claimed_at = now(),
           attempts = queue_row.attempts + 1,
           last_error = NULL,
           last_error_code = NULL
      FROM candidates
     WHERE queue_row.id = candidates.id
    RETURNING
      queue_row.id,
      queue_row.claim_token,
      queue_row.user_id,
      queue_row.title,
      queue_row.body,
      queue_row.url,
      queue_row.attempts
  )
  SELECT
    claimed.id,
    claimed.claim_token,
    claimed.user_id,
    claimed.title,
    claimed.body,
    claimed.url,
    claimed.attempts
  FROM claimed;
END
$function$;

CREATE OR REPLACE FUNCTION public.complete_push_dispatch_item(
  _queue_id uuid,
  _lease_token uuid,
  _outcome text,
  _error_code text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  affected integer;
  safe_error_code text := left(
    regexp_replace(lower(coalesce(_error_code, 'unknown')), '[^a-z0-9_:-]', '', 'g'),
    80
  );
BEGIN
  IF _outcome NOT IN ('success', 'retry', 'dead') THEN
    RAISE EXCEPTION 'invalid_outcome';
  END IF;

  UPDATE public.push_queue AS queue_row
     SET processed_at = CASE
           WHEN _outcome = 'success' THEN now()
           ELSE queue_row.processed_at
         END,
         dead_lettered_at = CASE
           WHEN _outcome = 'dead' OR (_outcome = 'retry' AND queue_row.attempts >= 5)
             THEN now()
           ELSE queue_row.dead_lettered_at
         END,
         next_attempt_at = CASE
           WHEN _outcome = 'retry' AND queue_row.attempts < 5
             THEN now() + make_interval(
               secs => least(3600, 30 * power(2, greatest(0, queue_row.attempts - 1)))::integer
             )
           ELSE queue_row.next_attempt_at
         END,
         last_error_code = CASE
           WHEN _outcome = 'success' THEN NULL
           ELSE safe_error_code
         END,
         last_error = CASE
           WHEN _outcome = 'success' THEN NULL
           ELSE safe_error_code
         END,
         claim_token = NULL,
         claimed_at = NULL
   WHERE queue_row.id = _queue_id
     AND queue_row.claim_token = _lease_token
     AND queue_row.processed_at IS NULL
     AND queue_row.dead_lettered_at IS NULL;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected = 1;
END
$function$;

COMMENT ON FUNCTION public.claim_push_dispatch_batch(integer, integer) IS
  'Claims dispatchable push rows atomically using SKIP LOCKED and expiring leases.';
COMMENT ON FUNCTION public.complete_push_dispatch_item(uuid, uuid, text, text) IS
  'Completes one push row only when its current lease token matches.';

REVOKE ALL ON FUNCTION public.claim_push_dispatch_batch(integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_push_dispatch_batch(integer, integer)
  TO service_role;

REVOKE ALL ON FUNCTION public.complete_push_dispatch_item(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_push_dispatch_item(uuid, uuid, text, text)
  TO service_role;
