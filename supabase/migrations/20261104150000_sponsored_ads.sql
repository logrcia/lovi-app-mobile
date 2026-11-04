-- Sponsored cards in the feed — a monetization simulation.
--
-- Nearby businesses come from a Google Maps search (SerpAPI) run by the `nearby-ads` edge
-- function, which keeps the API key server-side and caches one result list per ~5 km zone so a
-- search is spent per zone, never per user. The app shows them as sponsored cards every N posts
-- and logs impressions and clicks; admins see the totals and an estimated revenue.
--
--   ad_settings  one row, edited from the Supabase dashboard; readable by everyone.
--   ad_zones     search cache; only the edge function (service role) touches it.
--   ad_events    impressions and clicks, written as yourself; only admins read them back.
--   ad_admins    who may open the monetization panel.

-- ---------------------------------------------------------------------------
-- ad_settings — a single row
-- ---------------------------------------------------------------------------

create table public.ad_settings (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default true,
  every_n_posts integer not null default 5 check (every_n_posts between 1 and 50),
  search_query text not null default 'veterinaria' check (length(trim(search_query)) > 0),
  cache_ttl_hours integer not null default 168 check (cache_ttl_hours between 1 and 2160),
  max_results integer not null default 8 check (max_results between 1 and 20),
  label text not null default 'Patrocinado · demo',
  -- Simulated prices, in US dollars, for the revenue estimate.
  cpm_usd numeric(10, 2) not null default 2.50 check (cpm_usd >= 0),
  cpc_usd numeric(10, 2) not null default 0.30 check (cpc_usd >= 0),
  -- When the search fails (no key, quota spent, network), serve sample businesses instead of
  -- an empty slot, so a live demo never shows a blank feed.
  use_demo_fallback boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table public.ad_settings is
  'Edit this single row from the dashboard; the app reads it on load.';

insert into public.ad_settings (id) values (1);

create trigger ad_settings_set_updated_at
  before update on public.ad_settings
  for each row execute function public.set_updated_at();

alter table public.ad_settings enable row level security;

create policy "ad settings are publicly readable"
  on public.ad_settings for select
  to anon, authenticated
  using (true);

revoke all on public.ad_settings from anon, authenticated;
grant select on public.ad_settings to anon, authenticated;

-- ---------------------------------------------------------------------------
-- ad_zones — search cache, service role only
-- ---------------------------------------------------------------------------

create table public.ad_zones (
  zone_key text not null,
  search_query text not null,
  places jsonb not null default '[]'::jsonb,
  -- 'serpapi' for a real search, 'demo' for the fallback sample.
  source text not null check (source in ('serpapi', 'demo')),
  fetched_at timestamptz not null default now(),
  primary key (zone_key, search_query)
);

comment on table public.ad_zones is
  'Written by the nearby-ads edge function only. zone_key is lat/lng rounded to 0.05 degrees.';

-- RLS on with no policies: invisible to the API roles. The edge function uses the service role.
alter table public.ad_zones enable row level security;
revoke all on public.ad_zones from anon, authenticated;

-- ---------------------------------------------------------------------------
-- ad_admins
-- ---------------------------------------------------------------------------

create table public.ad_admins (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.ad_admins is
  'Profiles that can open the monetization panel. Add rows from the dashboard.';

create or replace function public.is_ad_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ad_admins a where a.profile_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_ad_admin() from public, anon;
grant execute on function public.is_ad_admin() to authenticated;

alter table public.ad_admins enable row level security;

-- You can see whether you are an admin; nobody can list the others or add themselves.
create policy "users see their own admin row"
  on public.ad_admins for select
  to authenticated
  using (profile_id = (select auth.uid()));

revoke all on public.ad_admins from anon, authenticated;
grant select on public.ad_admins to authenticated;

-- ---------------------------------------------------------------------------
-- ad_events — impressions and clicks
-- ---------------------------------------------------------------------------

create type public.ad_event_kind as enum ('impression', 'click');

create table public.ad_events (
  id bigint generated always as identity primary key,
  kind public.ad_event_kind not null,
  place_id text not null check (length(place_id) between 1 and 200),
  place_name text not null check (length(place_name) between 1 and 200),
  zone_key text not null check (length(zone_key) between 1 and 40),
  profile_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index ad_events_place_kind_idx on public.ad_events (place_id, kind);
create index ad_events_profile_id_idx on public.ad_events (profile_id);

alter table public.ad_events enable row level security;

create policy "users log their own ad events"
  on public.ad_events for insert
  to authenticated
  with check (profile_id = (select auth.uid()));

create policy "admins read ad events"
  on public.ad_events for select
  to authenticated
  using (public.is_ad_admin());

revoke all on public.ad_events from anon, authenticated;
grant insert (kind, place_id, place_name, zone_key) on public.ad_events to authenticated;
grant select on public.ad_events to authenticated;

-- ---------------------------------------------------------------------------
-- ad_stats() — the monetization panel, one row per business
-- ---------------------------------------------------------------------------

create or replace function public.ad_stats()
returns table (
  place_id text,
  place_name text,
  impressions bigint,
  clicks bigint,
  viewers bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_ad_admin() then
    raise exception 'Only ad admins can read ad stats' using errcode = '42501';
  end if;

  return query
    select
      e.place_id,
      max(e.place_name) as place_name,
      count(*) filter (where e.kind = 'impression') as impressions,
      count(*) filter (where e.kind = 'click') as clicks,
      count(distinct e.profile_id) as viewers
    from public.ad_events e
    group by e.place_id
    order by count(*) filter (where e.kind = 'impression') desc, max(e.place_name);
end;
$$;

revoke execute on function public.ad_stats() from public, anon;
grant execute on function public.ad_stats() to authenticated;
