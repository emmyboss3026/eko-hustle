-- Eko Hustle database update: visitors see your whole flat, not just the first 8 x 8 tiles.
-- Run ONCE in Supabase → SQL Editor. Safe to run again. Needs update-2026-11-home-layouts.sql first.
--
-- Before this, publish_home dropped any furniture outside the first 8 x 8 tiles, so furniture in an extension never
-- reached visitors. Now furniture may stand anywhere on the 12 x 12 grid, and a small "shape" is shared too:
-- how far the flat is extended (wing 0-2), the walls you moved, and the floors you laid.
-- Still only you can write your own layout, and only you or an invited friend can read it.

alter table public.home_layouts add column if not exists shape jsonb not null default '{}';
alter table public.home_layouts drop constraint if exists home_layouts_shape_check;
alter table public.home_layouts add constraint home_layouts_shape_check check (jsonb_typeof(shape) = 'object' and pg_column_size(shape) < 6000);

-- The old one-argument function is replaced (two versions side by side would be ambiguous for the app)
drop function if exists public.publish_home(jsonb);

create or replace function public.publish_home(p_objects jsonb, p_shape jsonb default '{}') returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := _me(); clean jsonb; walls jsonb; floors jsonb; wing int; shape jsonb;
begin
  if p_objects is null or jsonb_typeof(p_objects) <> 'array' or jsonb_array_length(p_objects) > 80 then
    raise exception 'bad layout' using errcode = '22023';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('type', o->>'type', 'x', (o->>'x')::int, 'y', (o->>'y')::int, 'rot', (o->>'rot')::int)), '[]'::jsonb)
    into clean
  from jsonb_array_elements(p_objects) o
  where (o->>'type') ~ '^[a-z0-9-]{1,24}$'
    and (o->>'x') ~ '^([0-9]|1[01])$' and (o->>'y') ~ '^([0-9]|1[01])$' and (o->>'rot') ~ '^[0-3]$';

  -- the shape: only values of the expected kind survive
  wing := case when (p_shape->>'wing') ~ '^[0-2]$' then (p_shape->>'wing')::int else 0 end;
  select coalesce(jsonb_agg(w), '[]'::jsonb) into walls
  from (select w from jsonb_array_elements_text(case when jsonb_typeof(p_shape->'walls') = 'array' then p_shape->'walls' else '[]'::jsonb end) w
        where w ~ '^[vh]:([1-9]|1[01]):([0-9]|1[01])$' limit 400) t;
  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) into floors
  from (select key as k, value #>> '{}' as v from jsonb_each(case when jsonb_typeof(p_shape->'floors') = 'object' then p_shape->'floors' else '{}'::jsonb end)
        where key ~ '^[A-Za-z ]{1,20}$' and (value #>> '{}') in ('wood','oak','tile','marble','carpet','slate','terracotta') limit 12) t;
  shape := jsonb_build_object('wing', wing, 'walls', walls, 'floors', floors);

  insert into home_layouts (owner, objects, shape, updated_at) values (me, clean, shape, now())
  on conflict (owner) do update set objects = excluded.objects, shape = excluded.shape, updated_at = now();
  return json_build_object('ok', true, 'count', jsonb_array_length(clean));
end $$;

create or replace function public.home_layout(p_owner uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare ok boolean; l jsonb; sh jsonb;
begin
  ok := can_enter_home(p_owner);
  if not ok then return null; end if;
  select objects, shape into l, sh from home_layouts where owner = p_owner;
  return json_build_object('objects', coalesce(l, '[]'::jsonb), 'shape', coalesce(sh, '{}'::jsonb));
end $$;

revoke execute on function public.publish_home(jsonb, jsonb), public.home_layout(uuid) from public, anon;
grant execute on function public.publish_home(jsonb, jsonb), public.home_layout(uuid) to authenticated;
