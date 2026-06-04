drop policy if exists "live-team read images" on storage.objects;
create policy "live-team read images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'live-team');

drop policy if exists "admins upload live-team" on storage.objects;
create policy "admins upload live-team"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'live-team'
  and (
    public.has_role(auth.uid(), 'admin'::app_role)
    or public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);

drop policy if exists "admins update live-team" on storage.objects;
create policy "admins update live-team"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'live-team'
  and (
    public.has_role(auth.uid(), 'admin'::app_role)
    or public.has_role(auth.uid(), 'super_admin'::app_role)
  )
)
with check (
  bucket_id = 'live-team'
  and (
    public.has_role(auth.uid(), 'admin'::app_role)
    or public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);

drop policy if exists "admins delete live-team" on storage.objects;
create policy "admins delete live-team"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'live-team'
  and (
    public.has_role(auth.uid(), 'admin'::app_role)
    or public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);