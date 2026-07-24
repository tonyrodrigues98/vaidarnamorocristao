BEGIN;

-- The published project exposes relationship_commitments and the generated
-- client types depend on it, but the historical migration chain never created
-- the table. Keep existing environments unchanged; this compatibility block
-- only repairs a clean bootstrap where the relation is absent.
DO $$
BEGIN
  IF to_regclass('public.relationship_commitments') IS NULL THEN
    CREATE TABLE public.relationship_commitments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id uuid NOT NULL,
      user_a uuid NOT NULL,
      user_b uuid NOT NULL,
      requested_by uuid NOT NULL,
      status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'ended')),
      requested_at timestamptz NOT NULL DEFAULT now(),
      accepted_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      CHECK (user_a <> user_b),
      CHECK (requested_by IN (user_a, user_b))
    );

    CREATE INDEX relationship_commitments_user_a_status_bootstrap_idx
      ON public.relationship_commitments (user_a, status);
    CREATE INDEX relationship_commitments_user_b_status_bootstrap_idx
      ON public.relationship_commitments (user_b, status);

    ALTER TABLE public.relationship_commitments ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public.relationship_commitments FROM PUBLIC, anon;
    -- A clean local bootstrap also lacks the service-role grants that exist in
    -- the published project. Restore only the privileged server contract; this
    -- does not grant anything to anon/authenticated and runs only when the
    -- published-only relation above is absent.
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
    GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
    GRANT SELECT, INSERT ON TABLE public.terms_acceptances TO authenticated;
    GRANT SELECT, INSERT ON TABLE public.global_messages TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO authenticated;
    GRANT SELECT ON TABLE public.matches TO authenticated;
    GRANT SELECT, INSERT ON TABLE public.interests TO authenticated;
    GRANT SELECT, INSERT, DELETE ON TABLE public.message_flags TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE
      ON TABLE public.relationship_commitments TO authenticated;
    GRANT ALL ON TABLE public.relationship_commitments TO service_role;

    CREATE POLICY "relationship participants read bootstrap"
      ON public.relationship_commitments
      FOR SELECT TO authenticated
      USING (auth.uid() IN (user_a, user_b));

    CREATE POLICY "relationship requester inserts bootstrap"
      ON public.relationship_commitments
      FOR INSERT TO authenticated
      WITH CHECK (
        auth.uid() = requested_by
        AND requested_by IN (user_a, user_b)
      );

    CREATE POLICY "relationship participants update bootstrap"
      ON public.relationship_commitments
      FOR UPDATE TO authenticated
      USING (auth.uid() IN (user_a, user_b))
      WITH CHECK (auth.uid() IN (user_a, user_b));

    CREATE POLICY "relationship requester deletes pending bootstrap"
      ON public.relationship_commitments
      FOR DELETE TO authenticated
      USING (auth.uid() = requested_by AND status = 'pending');
  END IF;
END;
$$;

COMMIT;
