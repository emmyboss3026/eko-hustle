-- Eko Hustle database.
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Row Level Security (RLS) makes sure each player can only touch their own data.

-- 1. Player profile (one per account)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text check (char_length(display_name) <= 20),
  supporter boolean not null default false,   -- set ONLY by the payment function
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Players read their own profile"
  on public.profiles for select using (auth.uid() = id);

-- Players may change their display name, but never the supporter flag
revoke update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;
create policy "Players update their own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Create a profile automatically when someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Cloud save (one per account)
create table if not exists public.saves (
  user_id uuid primary key references auth.users on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;

create policy "Players manage their own save"
  on public.saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Finished lives, for the leaderboard
create table if not exists public.runs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  sim_name text not null check (char_length(sim_name) between 1 and 20),
  trait text not null,
  ending text not null check (ending in ('japa', 'landlord', 'evicted', 'collapsed')),
  days int not null check (days between 1 and 100000),
  earned bigint not null check (earned between 0 and 1000000000),
  created_at timestamptz not null default now()
);

alter table public.runs enable row level security;

create policy "Anyone can read the leaderboard"
  on public.runs for select using (true);

create policy "Players add their own finished lives"
  on public.runs for insert with check (auth.uid() = user_id);

-- 4. Payments (only the server function can write here)
create table if not exists public.payments (
  reference text primary key,
  user_id uuid not null references auth.users on delete cascade,
  amount_kobo int not null,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;
-- No policies on purpose: players can neither read nor write payments.
