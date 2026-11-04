-- Eko Hustle database update: voice messages and "where is my friend" presence.
-- Run ONCE in Supabase → SQL Editor, after update-2026-11-messages.sql. Safe to run again.
--
-- Voice notes are short recordings (up to 45 seconds) kept with the message. The thread lists only that a message has audio;
-- the recording itself is fetched when it is played, so opening a chat stays light.
-- Presence shows friends (and only friends) where you are: at home, in the streets, or at a place. "Offline" after 100 seconds.

alter table public.dms add column if not exists audio text check (audio is null or (char_length(audio) <= 400000 and audio ~ '^data:audio/(webm|ogg|mp4|mpeg|wav|x-m4a|aac)[;,]'));
alter table public.dms add column if not exists audio_secs int check (audio_secs is null or audio_secs between 1 and 60);

create or replace function public.send_voice(p_to uuid, p_audio text, p_secs int) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := _me();
begin
  if p_to is null or p_to = me then raise exception 'bad request' using errcode = '22023'; end if;
  if _is_blocked(me, p_to) then return json_build_object('ok', false, 'reason', 'blocked'); end if;
  if not _are_friends(me, p_to) then return json_build_object('ok', false, 'reason', 'not_friends'); end if;
  if p_audio is null or char_length(p_audio) > 400000 or p_audio !~ '^data:audio/(webm|ogg|mp4|mpeg|wav|x-m4a|aac)[;,]' or p_secs is null or p_secs not between 1 and 60 then
    return json_build_object('ok', false, 'reason', 'bad_audio');
  end if;
  if (select count(*) from dms where sender = me and created_at > now() - interval '1 minute') >= 6 then
    return json_build_object('ok', false, 'reason', 'too_fast');
  end if;
  insert into dms (sender, recipient, body, audio, audio_secs) values (me, p_to, '🎤', p_audio, p_secs);
  return json_build_object('ok', true);
end $$;

-- The thread now says which messages are voice notes (and how long), without sending the audio itself
create or replace function public.dm_thread(p_other uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := _me();
begin
  if not _are_friends(me, p_other) or _is_blocked(me, p_other) then return '[]'::json; end if;
  update dms set read_at = now() where recipient = me and sender = p_other and read_at is null;
  return coalesce((
    select json_agg(r order by r.id) from (
      select id, (sender = me) as mine, body, created_at, (audio is not null) as has_audio, audio_secs
      from dms
      where (sender = me and recipient = p_other) or (sender = p_other and recipient = me)
      order by id desc limit 50
    ) r
  ), '[]'::json);
end $$;

-- One recording, only for the two people in the conversation
create or replace function public.dm_audio(p_id bigint) returns text
language plpgsql stable security definer set search_path = public as $$
declare me uuid := _me(); a text;
begin
  select audio into a from dms where id = p_id and (sender = me or recipient = me) and not _is_blocked(sender, recipient);
  return a;
end $$;

-- Presence: where I am right now (a place id, "home" or "street"), seen by my friends only
create table if not exists public.presence (
  user_id uuid primary key references auth.users on delete cascade,
  place text not null check (place ~ '^[a-z0-9-]{1,24}$'),
  seen_at timestamptz not null default now()
);
alter table public.presence enable row level security;
revoke all on public.presence from anon, authenticated;

create or replace function public.touch_presence(p_place text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := _me(); p text := lower(coalesce(p_place, ''));
begin
  if p !~ '^[a-z0-9-]{1,24}$' then p := 'street'; end if;
  insert into presence (user_id, place, seen_at) values (me, p, now())
  on conflict (user_id) do update set place = excluded.place, seen_at = now();
end $$;

-- My friends and requests, now with where each friend is (null when they have not been seen lately)
create or replace function public.my_friends() returns json
language plpgsql stable security definer set search_path = public as $$
declare me uuid := _me();
begin
  return coalesce((
    select json_agg(r order by r.status, r.name) from (
      select case when f.low = me then f.high else f.low end as id,
             coalesce(s.display_name, 'Player') as name, s.avatar, f.status,
             (f.status = 'pending' and f.requested_by <> me) as incoming,
             case when f.status = 'accepted' and p.seen_at > now() - interval '100 seconds' then p.place end as place
      from friendships f
      left join player_stats s on s.user_id = case when f.low = me then f.high else f.low end
      left join presence p on p.user_id = case when f.low = me then f.high else f.low end
      where f.low = me or f.high = me
    ) r
  ), '[]'::json);
end $$;

revoke execute on function public.send_voice(uuid, text, int), public.dm_audio(bigint), public.touch_presence(text) from public, anon;
grant execute on function public.send_voice(uuid, text, int), public.dm_audio(bigint), public.touch_presence(text) to authenticated;
