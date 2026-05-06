-- Add soft-delete / deactivation columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_for timestamptz,
  ADD COLUMN IF NOT EXISTS is_anonymized boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_deactivated_at ON public.profiles(deactivated_at) WHERE deactivated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_scheduled_for ON public.profiles(deletion_scheduled_for) WHERE deletion_scheduled_for IS NOT NULL;

-- Hide deactivated/deletion-pending profiles from public listings (replace SELECT policy)
DROP POLICY IF EXISTS "see approved profiles" ON public.profiles;
CREATE POLICY "see approved profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    status = 'approved'::profile_status
    AND deactivated_at IS NULL
    AND deletion_requested_at IS NULL
    AND is_anonymized = false
  )
);

-- Deactivate (reversible)
CREATE OR REPLACE FUNCTION public.request_account_deactivation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.profiles
    SET deactivated_at = now(),
        updated_at = now()
  WHERE id = uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_account_reactivation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.profiles
    SET deactivated_at = NULL,
        updated_at = now()
  WHERE id = uid
    AND deletion_requested_at IS NULL;
END;
$$;

-- Soft delete with 30-day purge window. Requires explicit confirm string.
CREATE OR REPLACE FUNCTION public.request_account_deletion(_confirm text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_scheduled timestamptz;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _confirm IS NULL OR _confirm <> 'CONFIRMO' THEN
    RAISE EXCEPTION 'invalid_confirmation' USING ERRCODE = 'check_violation';
  END IF;
  v_scheduled := now() + interval '30 days';
  UPDATE public.profiles
    SET deletion_requested_at = now(),
        deletion_scheduled_for = v_scheduled,
        deactivated_at = COALESCE(deactivated_at, now()),
        updated_at = now()
  WHERE id = uid;
  RETURN v_scheduled;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.profiles
    SET deletion_requested_at = NULL,
        deletion_scheduled_for = NULL,
        deactivated_at = NULL,
        updated_at = now()
  WHERE id = uid
    AND is_anonymized = false;
END;
$$;

-- Lock down EXECUTE
REVOKE EXECUTE ON FUNCTION public.request_account_deactivation() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.request_account_reactivation() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.request_account_deletion(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cancel_account_deletion() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.request_account_deactivation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_reactivation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deletion(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion() TO authenticated;