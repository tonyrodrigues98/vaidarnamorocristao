-- Keep profile pictures reliably deliverable across browsers/devices.
-- The app still controls which profiles are listed through table RLS; this only
-- makes already-approved profile image URLs load through Supabase Storage/CDN.

update storage.buckets
set public = true
where id = 'profile-photos';

drop policy if exists "profile photos public read" on storage.objects;
create policy "profile photos public read"
on storage.objects
for select
using (bucket_id = 'profile-photos');
