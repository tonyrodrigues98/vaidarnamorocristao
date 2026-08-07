-- Profile pictures and pet catalog art are intentionally public product media.
-- This restores stable CDN delivery for legacy rows that may still contain
-- expired signed URLs. Private evidence, documents and chat attachments use
-- separate buckets and are not affected by this migration.

UPDATE storage.buckets
SET public = true
WHERE id IN ('profile-photos', 'pets');
