-- Eko Hustle database update: friends, blocking and home invitations (for the shared city).
-- Run ONCE in Supabase → SQL Editor. It only adds what is listed and is safe to run again.
--
-- Everything goes through the functions below: players cannot read or write these tables directly,
-- so nobody can list other people's friends, forge a friendship, or send a request as someone else.
-- Names shown to others come from player_stats.display_name (already cleaned for the leaderboard).

-- ---------------------------------------------------------------------
-- Friendships: one row per pair. low < high keeps a pair from existing twice.
-- ---------------------------------------------------------------------
create table if not exists public.friendships (
  low uuid not null references auth.users on delete cascade,
  high uuid not null references auth.users on delete cascade,
  requested_by uuid not null references auth.users on delete cascade,
  status text not null check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (low, high),
  check (low < high),
  check (requested_by in (low, high))
);
create index if not exists friendships_high on public.friendships (high);

create table if not exists public.blocks (
  blocker uuid not null references auth.users on delete cascade,
  blocked uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);

-- A player may let friends visit their home. Invitations expire after 24 hours.
create table if not exists public.home_invites (
  owner uuid not null references auth.users on delete cascade,
  guest uuid not null references auth.users on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (owner, guest),
  check (owner <> guest)
);

alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.home_invites enable row level security;
revoke all on public.friendships, public.blocks, public.home_invites from anon, authenticated;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public._me() returns uuid
language plpgsql stable as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'sign in first' using errcode = '28000'; end if;
  return uid;
end $$;

create or replace function public._is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where (blocker = a and blocked = b) or (blocker = b and blocked = a));
$$;

create or replace function public._are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from friendships where low = least(a, b) and high = greatest(a, b) and status = 'accepted');
$$;

revoke execute on function public._me(), public._is_blocked(uuid, uuid), public._are_friends(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Find players by name (leaderboard names only; at most 10; at least 2 letters)
-- ---------------------------------------------------------------------
create or replace function public.find_players(p_name text) returns json
language plpgsql stable security definer set search_path = public as $$
declare me uuid := _me(); q text := btrim(coalesce(p_name, ''));
begin
  if char_length(q) < 2 then return '[]'::json; end if;
  return coalesce((
    select json_agg(r) from (
      select s.user_id as id, s.display_name as name, s.avatar, s.level
      from player_stats s
      where s.user_id <> me
        and s.display_name ilike replace(replace(q, '%', ''), '_', '') || '%'
        and not _is_blocked(me, s.user_id)
      order by s.score desc
      limit 10
    ) r
  ), '[]'::json);
end $$;

-- ---------------------------------------------------------------------
-- Friend requests
-- ---------------------------------------------------------------------
create or replace function public.friend_request(p_to uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := _me(); f friendships; outgoing int;
begin
  if p_to is null or p_to = me then raise exception 'bad request' using errcode = '22023'; end if;
  if not exists (select 1 from auth.users where id = p_to) then raise exception 'no such player' using errcode = '22023'; end if;
  if _is_blocked(me, p_to) then return json_build_object('ok', false, 'reason', 'blocked'); end if;
  select * into f from friendships where low = least(me, p_to) and high = greatest(me, p_to);
  if found then
    if f.status = 'accepted' then return json_build_object('ok', true, 'status', 'accepted', 'repeat', true); end if;
    if f.requested_by = me then return json_build_object('ok', true, 'status', 'pending', 'repeat', true); end if;
    -- they had already asked me: asking back means yes
    update friendships set status = 'accepted' where low = f.low and high = f.high;
    return json_build_object('ok', true, 'status', 'accepted');
  end if;
  select count(*) into outgoing from friendships where requested_by = me and status = 'pending';
  if outgoing >= 20 then return json_build_object('ok', false, 'reason', 'too_many'); end if;
  insert into friendships (low, high, requested_by, status) values (least(me, p_to), greatest(me, p_to), me, 'pending');
  return json_build_object('ok', true, 'status', 'pending');
end $$;

create or replace function public.friend_respond(p_from uuid, p_accept boolean) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := _me(); n int;
begin
  if p_accept then
    update friendships set status = 'accepted'
    where low = least(me, p_from) and high = greatest(me, p_from) and status = 'pending' and requested_by = p_from;
  else
    delete from friendships
    where low = least(me, p_from) and high = greatest(me, p_from) and status = 'pending' and requested_by = p_from;
  end if;
  get diagnostics n = row_count;
  return json_build_object('ok', n = 1);
end $$;

create or replace function public.friend_remove(p_other uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := _me(); n int;
begin
  delete from friendships where low = least(me, p_other) and high = greatest(me, p_other);
  get diagnostics n = row_count;
  delete from home_invites where (owner = me and guest = p_other) or (owner = p_other and guest = me);
  return json_build_object('ok', n = 1);
end $$;

-- Blocking removes any friendship and invitation, and stops new requests either way.
create or replace function public.block_player(p_other uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := _me();
begin
  if p_other is null or p_other = me then raise exception 'bad request' using errcode = '22023'; end if;
  insert into blocks (blocker, blocked) values (me, p_other) on conflict do nothing;
  delete from friendships where low = least(me, p_other) and high = greatest(me, p_other);
  delete from home_invites where (owner = me and guest = p_other) or (owner = p_other and guest = me);
  return json_build_object('ok', true);
end $$;

create or replace function public.unblock_player(p_other uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := _me();
begin
  delete from blocks where blocker = me and blocked = p_other;
  return json_build_object('ok', true);
end $$;

-- My friends and requests, with names. incoming = they asked me.
create or replace function public.my_friends() returns json
language plpgsql stable security definer set search_path = public as $$
declare me uuid := _me();
begin
  return coalesce((
    select json_agg(r order by r.status, r.name) from (
      select case when f.low = me then f.high else f.low end as id,
             coalesce(s.display_name, 'Player') as name, s.avatar, f.status,
             (f.status = 'pending' and f.requested_by <> me) as incoming
      from friendships f
      left join player_stats s on s.user_id = case when f.low = me then f.high else f.low end
      where f.low = me or f.high = me
    ) r
  ), '[]'::json);
end $$;

-- ---------------------------------------------------------------------
-- Home invitations: only to friends, one per friend, valid for 24 hours
-- ---------------------------------------------------------------------
create or replace function public.invite_home(p_guest uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := _me();
begin
  if not _are_friends(me, p_guest) then return json_build_object('ok', false, 'reason', 'not_friends'); end if;
  insert into home_invites (owner, guest, expires_at) values (me, p_guest, now() + interval '24 hours')
  on conflict (owner, guest) do update set expires_at = excluded.expires_at, created_at = now();
  return json_build_object('ok', true);
end $$;

create or replace function public.cancel_home_invite(p_guest uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := _me();
begin
  delete from home_invites where owner = me and guest = p_guest;
  return json_build_object('ok', true);
end $$;

-- Invitations waiting for me
create or replace function public.my_home_invites() returns json
language plpgsql stable security definer set search_path = public as $$
declare me uuid := _me();
begin
  return coalesce((
    select json_agg(r order by r.created_at desc) from (
      select i.owner as id, coalesce(s.display_name, 'Player') as name, i.expires_at, i.created_at
      from home_invites i left join player_stats s on s.user_id = i.owner
      where i.guest = me and i.expires_at > now() and not _is_blocked(me, i.owner)
    ) r
  ), '[]'::json);
end $$;

-- The permission check the multiplayer server calls (with the visitor's own token) before letting
-- someone into a home: the owner, or a friend with a live invitation. Nothing else gets in.
create or replace function public.can_enter_home(p_owner uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare me uuid := _me();
begin
  if me = p_owner then return true; end if;
  return not _is_blocked(me, p_owner)
    and _are_friends(me, p_owner)
    and exists (select 1 from home_invites where owner = p_owner and guest = me and expires_at > now());
end $$;

revoke execute on function
  public.find_players(text), public.friend_request(uuid), public.friend_respond(uuid, boolean), public.friend_remove(uuid),
  public.block_player(uuid), public.unblock_player(uuid), public.my_friends(), public.invite_home(uuid),
  public.cancel_home_invite(uuid), public.my_home_invites(), public.can_enter_home(uuid)
  from public, anon;
grant execute on function
  public.find_players(text), public.friend_request(uuid), public.friend_respond(uuid, boolean), public.friend_remove(uuid),
  public.block_player(uuid), public.unblock_player(uuid), public.my_friends(), public.invite_home(uuid),
  public.cancel_home_invite(uuid), public.my_home_invites(), public.can_enter_home(uuid)
  to authenticated;
