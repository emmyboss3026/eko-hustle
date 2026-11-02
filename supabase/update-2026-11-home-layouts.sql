-- Eko Hustle database update: a shareable copy of your room, so invited friends can see it when they visit.
-- Run ONCE in Supabase → SQL Editor. Safe to run again. Needs update-2026-11-friends.sql first.
--
-- Only the furniture (type, tile and turn) is shared, never your save. The game sends it when you change your room.
-- Only you can write your own layout, and only you or a friend with a live invitation can read it
-- (the same can_enter_home check the multiplayer server uses).

create table if not exists public.home_layouts (
  owner uuid primary key references auth.users on delete cascade,
  objects jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(objects) = 'array' and jsonb_array_length(objects) <= 80)
);
alter table public.home_layouts enable row level security;
revoke all on public.home_layouts from anon, authenticated;

-- Save my layout. Anything that is not a plain piece of furniture on the 8 x 8 grid is dropped.
create or replace function public.publish_home(p_objects jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := _me(); clean jsonb;
begin
  if p_objects is null or jsonb_typeof(p_objects) <> 'array' or jsonb_array_length(p_objects) > 80 then
    raise exception 'bad layout' using errcode = '22023';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('type', o->>'type', 'x', (o->>'x')::int, 'y', (o->>'y')::int, 'rot', (o->>'rot')::int)), '[]'::jsonb)
    into clean
  from jsonb_array_elements(p_objects) o
  where (o->>'type') ~ '^[a-z0-9-]{1,24}$'
    and (o->>'x') ~ '^[0-7]$' and (o->>'y') ~ '^[0-7]$' and (o->>'rot') ~ '^[0-3]$';
  insert into home_layouts (owner, objects, updated_at) values (me, clean, now())
  on conflict (owner) do update set objects = excluded.objects, updated_at = now();
  return json_build_object('ok', true, 'count', jsonb_array_length(clean));
end $$;

-- A home's layout, for the owner or an invited friend. Everyone else gets nothing.
create or replace function public.home_layout(p_owner uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare ok boolean; l jsonb;
begin
  ok := can_enter_home(p_owner);
  if not ok then return null; end if;
  select objects into l from home_layouts where owner = p_owner;
  return json_build_object('objects', coalesce(l, '[]'::jsonb));
end $$;

revoke execute on function public.publish_home(jsonb), public.home_layout(uuid) from public, anon;
grant execute on function public.publish_home(jsonb), public.home_layout(uuid) to authenticated;
