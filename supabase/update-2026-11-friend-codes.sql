-- Eko Hustle database update: a private friend code for every player.
-- Run ONCE in Supabase → SQL Editor, after update-2026-11-friends.sql. It only adds what is listed and is safe to run again.
--
-- A player shares their code with someone they trust. Whoever types it in becomes their friend at once and receives
-- an invitation to the player's home (valid for 24 hours). The owner can make a new code at any time, which cancels the old one.
-- Codes are 8 letters and digits (no 0/O/1/I), so they cannot be guessed: wrong tries are also limited.

create table if not exists public.friend_codes (
  user_id uuid primary key references auth.users on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  created_at timestamptz not null default now()
);
alter table public.friend_codes enable row level security;
revoke all on public.friend_codes from anon, authenticated;

-- Wrong tries per player per hour (to stop guessing)
create table if not exists public.friend_code_tries (
  user_id uuid not null references auth.users on delete cascade,
  hour timestamptz not null,
  fails int not null default 0,
  primary key (user_id, hour)
);
alter table public.friend_code_tries enable row level security;
revoke all on public.friend_code_tries from anon, authenticated;

create or replace function public._new_code() returns text
language plpgsql volatile as $$
declare alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text := ''; i int;
begin
  for i in 1..8 loop c := c || substr(alphabet, 1 + floor(random() * 32)::int, 1); end loop;
  return c;
end $$;
revoke execute on function public._new_code() from public, anon, authenticated;

-- My code (made the first time it is asked for)
create or replace function public.my_friend_code() returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := _me(); c text; tries int := 0;
begin
  select code into c from friend_codes where user_id = me;
  if c is not null then return c; end if;
  loop
    c := _new_code();
    begin
      insert into friend_codes (user_id, code) values (me, c);
      return c;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 10 then raise exception 'could not make a code'; end if;
    end;
  end loop;
end $$;

-- A new code: the old one stops working
create or replace function public.reset_friend_code() returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := _me(); c text; tries int := 0;
begin
  loop
    c := _new_code();
    begin
      insert into friend_codes (user_id, code) values (me, c)
      on conflict (user_id) do update set code = excluded.code, created_at = now();
      return c;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 10 then raise exception 'could not make a code'; end if;
    end;
  end loop;
end $$;

-- Type someone's code: you become friends and they invite you over.
-- Result: { ok, id, name } or { ok: false, reason: bad_code | blocked | self | too_many_tries }
create or replace function public.add_by_code(p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare
  me uuid := _me();
  c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  owner_id uuid; nm text; h timestamptz := date_trunc('hour', now()); fails int;
begin
  select coalesce(t.fails, 0) into fails from friend_code_tries t where t.user_id = me and t.hour = h;
  if coalesce(fails, 0) >= 10 then return json_build_object('ok', false, 'reason', 'too_many_tries'); end if;
  select user_id into owner_id from friend_codes where code = c;
  if owner_id is null then
    insert into friend_code_tries (user_id, hour, fails) values (me, h, 1)
    on conflict (user_id, hour) do update set fails = friend_code_tries.fails + 1;
    return json_build_object('ok', false, 'reason', 'bad_code');
  end if;
  if owner_id = me then return json_build_object('ok', false, 'reason', 'self'); end if;
  if _is_blocked(me, owner_id) then return json_build_object('ok', false, 'reason', 'blocked'); end if;
  -- the code is the owner's permission: friends at once, and an invitation to their home for a day
  insert into friendships (low, high, requested_by, status)
  values (least(me, owner_id), greatest(me, owner_id), me, 'accepted')
  on conflict (low, high) do update set status = 'accepted';
  insert into home_invites (owner, guest, expires_at) values (owner_id, me, now() + interval '24 hours')
  on conflict (owner, guest) do update set expires_at = excluded.expires_at, created_at = now();
  select coalesce(display_name, 'Player') into nm from player_stats where user_id = owner_id;
  return json_build_object('ok', true, 'id', owner_id, 'name', coalesce(nm, 'Player'));
end $$;

revoke execute on function public.my_friend_code(), public.reset_friend_code(), public.add_by_code(text) from public, anon;
grant execute on function public.my_friend_code(), public.reset_friend_code(), public.add_by_code(text) to authenticated;
