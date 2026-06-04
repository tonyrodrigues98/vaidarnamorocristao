create table if not exists public.live_team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_title text not null,
  category text not null,
  chip_text text,
  tiktok_url text,
  photo_url text not null,
  storage_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint live_team_members_category_check check (
    category in ('host', 'administradores', 'moderadores', 'midia')
  ),
  constraint live_team_members_sort_order_check check (sort_order >= 0),
  constraint live_team_members_tiktok_url_check check (
    tiktok_url is null
    or tiktok_url ~* '^https?://(www\.)?tiktok\.com/.+'
  )
);

create index if not exists idx_live_team_members_public_order
on public.live_team_members (is_active, category, sort_order);

create index if not exists idx_live_team_members_category_order
on public.live_team_members (category, sort_order);

alter table public.live_team_members enable row level security;

drop policy if exists "public read active live team members" on public.live_team_members;
create policy "public read active live team members"
on public.live_team_members
for select
using (
  is_active = true
  or public.has_role(auth.uid(), 'admin'::app_role)
  or public.has_role(auth.uid(), 'super_admin'::app_role)
);

drop policy if exists "admins manage live team members" on public.live_team_members;
create policy "admins manage live team members"
on public.live_team_members
for all
to authenticated
using (
  public.has_role(auth.uid(), 'admin'::app_role)
  or public.has_role(auth.uid(), 'super_admin'::app_role)
)
with check (
  public.has_role(auth.uid(), 'admin'::app_role)
  or public.has_role(auth.uid(), 'super_admin'::app_role)
);

drop trigger if exists trg_live_team_members_updated_at on public.live_team_members;
create trigger trg_live_team_members_updated_at
before update on public.live_team_members
for each row execute function public.update_updated_at_column();

grant select on public.live_team_members to anon, authenticated;
grant insert, update, delete on public.live_team_members to authenticated;
grant all on public.live_team_members to service_role;

insert into storage.buckets (id, name, public)
values ('live-team', 'live-team', true)
on conflict (id) do update set public = true;

drop policy if exists "live-team public read" on storage.objects;
create policy "live-team public read"
on storage.objects
for select
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
