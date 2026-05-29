-- Restrict SELECT on anonymous_message_settings to owner only.
-- Cross-user reads (to check accept_anonymous of a recipient) go through
-- SECURITY DEFINER functions used by the anonymous-message send flow.
DROP POLICY IF EXISTS "auth read settings" ON public.anonymous_message_settings;

CREATE POLICY "owner read settings"
ON public.anonymous_message_settings
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Remove overly-broad storage read on profile-photos bucket.
-- The owner-or-staff policy ("photos owner or staff read") remains in place;
-- non-owner reads go through short-lived signed URLs created server-side.
DROP POLICY IF EXISTS "authenticated read profile-photos" ON storage.objects;