
-- Fix 1: Add missing UPDATE policy on avatar-looks bucket (owner-scoped)
CREATE POLICY "avatar looks owner update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatar-looks' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatar-looks' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Fix 2: Allow authenticated users to read restricted_words for client-side masking
-- (deliberate per security memory)
CREATE POLICY "authenticated read restricted words"
ON public.restricted_words
FOR SELECT
TO authenticated
USING (true);
