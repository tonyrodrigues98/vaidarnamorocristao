CREATE POLICY "owner backfills own log url"
ON public.photo_moderation_log
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND photo_url IS NULL)
WITH CHECK (user_id = auth.uid());