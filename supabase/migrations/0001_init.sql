-- ClearPoints Phase 1 schema.
-- RLS is enabled on every user-scoped table. Reference tables are world-readable.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type subscription_tier as enum ('free', 'premium');
exception when duplicate_object then null; end $$;

do $$ begin
  create type cabin_class as enum ('economy', 'premium', 'business', 'first');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Reference tables (seeded, world-readable, no user data)
-- ---------------------------------------------------------------------------
create table if not exists points_programs (
  code         text primary key,
  display_name text not null,
  type         text not null default 'bank'
);

create table if not exists transfer_partners (
  id                 bigint generated always as identity primary key,
  from_program       text not null references points_programs(code) on delete cascade,
  to_airline_program text not null,
  ratio              text not null,
  transfer_time      text not null,
  active             boolean not null default true,
  unique (from_program, to_airline_program)
);

create table if not exists booking_instruction_templates (
  airline_program text primary key,
  steps           jsonb not null
);

-- ---------------------------------------------------------------------------
-- User profile (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists users_profile (
  id                 uuid primary key references auth.users(id) on delete cascade,
  home_airports      text[] not null default '{}',
  points_programs    text[] not null default '{}',
  cabin_pref         cabin_class not null default 'economy',
  subscription_tier  subscription_tier not null default 'free',
  stripe_customer_id text,
  onboarded          boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Deals (seeded via the mock provider; persistent award snapshots)
-- ---------------------------------------------------------------------------
create table if not exists deals (
  id                   uuid primary key default gen_random_uuid(),
  origin               text not null,
  destination          text not null,
  cabin                cabin_class not null,
  airline_program      text not null,
  points_cost          integer not null,
  taxes_usd            numeric(10,2) not null,
  cash_reference_usd   numeric(10,2) not null,
  value_cpp            numeric(8,4) not null,
  discount_pct         numeric(6,3) not null,
  depart_window_start  date not null,
  depart_window_end    date not null,
  booking_instructions jsonb not null default '{}'::jsonb,
  source               text not null default 'mock',
  seen_at              timestamptz not null default now(),
  expires_at           timestamptz,
  is_premium           boolean not null default false,
  created_at           timestamptz not null default now()
);

create index if not exists deals_route_idx on deals (origin, destination);
create index if not exists deals_value_idx on deals (value_cpp desc);
create index if not exists deals_cabin_idx on deals (cabin);

-- ---------------------------------------------------------------------------
-- Auto-provision a profile row when a new auth user is created.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profile (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh on profile writes.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_profile_touch on users_profile;
create trigger users_profile_touch
  before update on users_profile
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table users_profile enable row level security;
alter table points_programs enable row level security;
alter table transfer_partners enable row level security;
alter table booking_instruction_templates enable row level security;
alter table deals enable row level security;

-- A user can only see and modify their own profile.
drop policy if exists "own profile select" on users_profile;
create policy "own profile select" on users_profile
  for select using (auth.uid() = id);

drop policy if exists "own profile insert" on users_profile;
create policy "own profile insert" on users_profile
  for insert with check (auth.uid() = id);

drop policy if exists "own profile update" on users_profile;
create policy "own profile update" on users_profile
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Reference tables are readable by anyone (including anon for the public
-- Points 101 page). Writes happen only via the service role (seed script).
drop policy if exists "reference read programs" on points_programs;
create policy "reference read programs" on points_programs for select using (true);

drop policy if exists "reference read partners" on transfer_partners;
create policy "reference read partners" on transfer_partners for select using (true);

drop policy if exists "reference read templates" on booking_instruction_templates;
create policy "reference read templates" on booking_instruction_templates for select using (true);

-- Deals are readable by signed-in users. Premium gating (cabin/window) is
-- enforced in server code off the user's subscription_tier, not by hiding rows.
drop policy if exists "deals read auth" on deals;
create policy "deals read auth" on deals
  for select to authenticated using (true);
