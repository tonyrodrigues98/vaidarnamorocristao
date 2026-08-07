create table if not exists public.live_monthly_highlights (
  id uuid primary key default gen_random_uuid(),
  ranking_type text not null,
  position integer not null,
  name text not null,
  photo_url text,
  storage_path text,
  chip_text text,
  tiktok_url text,
  month integer not null,
  year integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint live_monthly_highlights_type_check check (
    ranking_type in ('viewer', 'gifter')
  ),
  constraint live_monthly_highlights_position_check check (position between 1 and 3),
  constraint live_monthly_highlights_month_check check (month between 1 and 12),
  constraint live_monthly_highlights_year_check check (year >= 2026),
  constraint live_monthly_highlights_tiktok_url_check check (
    tiktok_url is null
    or tiktok_url ~* '^https?://(www\.)?tiktok\.com/.+'
  )
);

create index if not exists idx_live_monthly_highlights_public_order
on public.live_monthly_highlights (is_active, year, month, ranking_type, position);

create unique index if not exists idx_live_monthly_highlights_active_position_unique
on public.live_monthly_highlights (ranking_type, year, month, position)
where is_active = true;

alter table public.live_monthly_highlights enable row level security;

drop policy if exists "public read active live monthly highlights" on public.live_monthly_highlights;
create policy "public read active live monthly highlights"
on public.live_monthly_highlights
for select
using (
  is_active = true
  or public.has_role(auth.uid(), 'admin'::app_role)
  or public.has_role(auth.uid(), 'super_admin'::app_role)
);

drop policy if exists "admins manage live monthly highlights" on public.live_monthly_highlights;
create policy "admins manage live monthly highlights"
on public.live_monthly_highlights
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

drop trigger if exists trg_live_monthly_highlights_updated_at on public.live_monthly_highlights;
create trigger trg_live_monthly_highlights_updated_at
before update on public.live_monthly_highlights
for each row execute function public.update_updated_at_column();

grant select on public.live_monthly_highlights to anon, authenticated;
grant insert, update, delete on public.live_monthly_highlights to authenticated;
grant all on public.live_monthly_highlights to service_role;
