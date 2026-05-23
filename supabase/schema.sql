create table if not exists public.cih_competitors (
  url text primary key,
  name text,
  market text,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.cih_reports (
  id text primary key,
  generated_at timestamptz not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.cih_reviews (
  finding_id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.cih_catalog_overrides (
  service_line text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.cih_provider_registry (
  id text primary key,
  source_system text not null,
  source_id text,
  npi text,
  legal_name text not null,
  doing_business_as text,
  taxonomy jsonb not null default '[]'::jsonb,
  address_json jsonb not null default '{}'::jsonb,
  geo_json jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  confidence int not null default 0,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.cih_market_areas (
  id text primary key,
  area_type text not null,
  area_name text not null,
  fips text,
  geo_json jsonb not null default '{}'::jsonb,
  population_signals_json jsonb not null default '{}'::jsonb,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.cih_competitors enable row level security;
alter table public.cih_reports enable row level security;
alter table public.cih_reviews enable row level security;
alter table public.cih_catalog_overrides enable row level security;
alter table public.cih_provider_registry enable row level security;
alter table public.cih_market_areas enable row level security;

revoke all on table public.cih_competitors from anon, authenticated;
revoke all on table public.cih_reports from anon, authenticated;
revoke all on table public.cih_reviews from anon, authenticated;
revoke all on table public.cih_catalog_overrides from anon, authenticated;
revoke all on table public.cih_provider_registry from anon, authenticated;
revoke all on table public.cih_market_areas from anon, authenticated;

grant select, insert, update, delete on table public.cih_competitors to service_role;
grant select, insert, update, delete on table public.cih_reports to service_role;
grant select, insert, update, delete on table public.cih_reviews to service_role;
grant select, insert, update, delete on table public.cih_catalog_overrides to service_role;
grant select, insert, update, delete on table public.cih_provider_registry to service_role;
grant select, insert, update, delete on table public.cih_market_areas to service_role;

create index if not exists cih_competitors_name_idx on public.cih_competitors (name);
create index if not exists cih_reports_generated_at_idx on public.cih_reports (generated_at desc);
create index if not exists cih_reviews_updated_at_idx on public.cih_reviews (updated_at desc);
create index if not exists cih_provider_registry_source_idx on public.cih_provider_registry (source_system, source_id);
create index if not exists cih_market_areas_name_idx on public.cih_market_areas (area_name);
