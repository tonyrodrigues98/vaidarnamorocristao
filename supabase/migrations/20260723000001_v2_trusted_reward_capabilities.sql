-- V2-008: close generic reward/progress helpers and expose one narrow,
-- idempotent client capability for the only direct browser caller found.
-- This migration is intentionally not applied by Codex.

DO $$
DECLARE
  required_signature text;
BEGIN
  FOREACH required_signature IN ARRAY ARRAY[
    'public.grant_coin_event(uuid,integer,text)',
    'public.award_xp(text,integer,integer,jsonb)',
    'public.track_achievement(uuid,text,integer,text)',
    'public.progress_mission_action(uuid,text,integer)',
    'public.create_notification(uuid,text,text,text,text,uuid,uuid)'
  ]
  LOOP
    IF to_regprocedure(required_signature) IS NULL THEN
      RAISE EXCEPTION 'required function missing: %', required_signature;
    END IF;
  END LOOP;
END
$$;

CREATE TABLE IF NOT EXISTS public.trusted_reward_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_kind text NOT NULL CHECK (event_kind IN ('pet_care')),
  event_id uuid NOT NULL,
  reward_source text NOT NULL,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recipient_id, event_kind, event_id)
);

CREATE INDEX IF NOT EXISTS trusted_reward_claims_recipient_created_idx
  ON public.trusted_reward_claims (recipient_id, created_at DESC);

ALTER TABLE public.trusted_reward_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.trusted_reward_claims FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.trusted_reward_claims TO service_role;

COMMENT ON TABLE public.trusted_reward_claims IS
  'Server-owned idempotency ledger for trusted reward capabilities; never client writable.';

-- Care state and its event log are server-owned inputs to reward decisions.
-- No static caller writes care_state directly; apply_pet_care is the canonical command.
DROP POLICY IF EXISTS "care_state_owner_all" ON public.pet_care_state;
DROP POLICY IF EXISTS "care_state_owner_read" ON public.pet_care_state;
CREATE POLICY "care_state_owner_read"
  ON public.pet_care_state
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_pets_v2 AS pet
      WHERE pet.id = pet_care_state.user_pet_id
        AND pet.user_id = (SELECT auth.uid())
    )
  );

REVOKE INSERT, UPDATE, DELETE ON TABLE public.pet_care_state FROM authenticated;
GRANT SELECT ON TABLE public.pet_care_state TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.pet_care_events FROM authenticated;
GRANT SELECT ON TABLE public.pet_care_events TO authenticated;

CREATE OR REPLACE FUNCTION public.award_my_care_xp(_user_pet_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  caller_id uuid := auth.uid();
  care_event record;
  state_value integer;
  value_before integer;
  reward_source text;
  reward_amount integer;
  daily_cap integer;
  claim_id uuid;
  reward_result jsonb;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT event_row.id,
         event_row.kind,
         event_row.delta,
         event_row.created_at
    INTO care_event
    FROM public.pet_care_events AS event_row
    JOIN public.user_pets_v2 AS pet
      ON pet.id = event_row.user_pet_id
     AND pet.user_id = caller_id
   WHERE event_row.user_pet_id = _user_pet_id
     AND event_row.user_id = caller_id
     AND event_row.created_at >= now() - interval '5 minutes'
   ORDER BY event_row.created_at DESC, event_row.id DESC
   LIMIT 1
   FOR UPDATE OF event_row;

  IF care_event.id IS NULL THEN
    RAISE EXCEPTION 'care_event_not_found';
  END IF;

  SELECT care_state.value_at_anchor
    INTO state_value
    FROM public.pet_care_state AS care_state
   WHERE care_state.user_pet_id = _user_pet_id
     AND care_state.kind = care_event.kind;

  IF state_value IS NULL THEN
    RAISE EXCEPTION 'care_state_not_found';
  END IF;

  value_before := greatest(0, least(100, state_value - care_event.delta));
  IF value_before < 20 THEN
    reward_source := 'care_rescue';
    reward_amount := 15;
    daily_cap := 4;
  ELSIF value_before < 50 THEN
    reward_source := 'care_low';
    reward_amount := 8;
    daily_cap := 6;
  ELSE
    RETURN jsonb_build_object('granted', 0, 'reason', 'not_eligible');
  END IF;

  INSERT INTO public.trusted_reward_claims (
    recipient_id,
    event_kind,
    event_id,
    reward_source
  )
  VALUES (
    caller_id,
    'pet_care',
    care_event.id,
    reward_source
  )
  ON CONFLICT (recipient_id, event_kind, event_id) DO NOTHING
  RETURNING id INTO claim_id;

  IF claim_id IS NULL THEN
    RETURN jsonb_build_object('granted', 0, 'reason', 'replay');
  END IF;

  reward_result := public.award_xp(
    reward_source,
    reward_amount,
    daily_cap,
    jsonb_build_object(
      'capability', 'award_my_care_xp',
      'care_event_id', care_event.id,
      'care_kind', care_event.kind
    )
  );

  UPDATE public.trusted_reward_claims
     SET result = coalesce(reward_result, '{}'::jsonb)
   WHERE id = claim_id;

  RETURN coalesce(reward_result, jsonb_build_object('granted', 0));
END
$function$;

COMMENT ON FUNCTION public.award_my_care_xp(uuid) IS
  'Awards catalogued care XP to auth.uid() from the latest trusted care event, once per event.';

-- The browser receives only the narrow capability. Generic functions remain
-- callable by their owner/SECURITY DEFINER bodies and by service_role.
REVOKE ALL ON FUNCTION public.award_my_care_xp(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_my_care_xp(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.grant_coin_event(uuid, integer, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_coin_event(uuid, integer, text) TO service_role;
ALTER FUNCTION public.grant_coin_event(uuid, integer, text)
  SET search_path = pg_catalog, public;

REVOKE ALL ON FUNCTION public.award_xp(text, integer, integer, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp(text, integer, integer, jsonb) TO service_role;
ALTER FUNCTION public.award_xp(text, integer, integer, jsonb)
  SET search_path = pg_catalog, public;

REVOKE ALL ON FUNCTION public.track_achievement(uuid, text, integer, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_achievement(uuid, text, integer, text) TO service_role;
ALTER FUNCTION public.track_achievement(uuid, text, integer, text)
  SET search_path = pg_catalog, public;

REVOKE ALL ON FUNCTION public.progress_mission_action(uuid, text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.progress_mission_action(uuid, text, integer) TO service_role;
ALTER FUNCTION public.progress_mission_action(uuid, text, integer)
  SET search_path = pg_catalog, public;

REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, uuid, uuid)
  TO service_role;
ALTER FUNCTION public.create_notification(uuid, text, text, text, text, uuid, uuid)
  SET search_path = pg_catalog, public;

-- Applies to functions subsequently created by the migration role. The
-- authenticated snapshot must still inspect default ACLs for every actual owner.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
