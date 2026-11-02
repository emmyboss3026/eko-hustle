-- Eko Hustle database update: private messages between friends.
-- Run ONCE in Supabase → SQL Editor. Safe to run again. Needs update-2026-11-friends.sql and
-- update-2026-11-reports-export.sql first.
--
-- Only friends can message each other. Players cannot read or write the table directly: every call goes through the
-- functions below, which check friendship, blocks, length and speed. Blocking or removing a friend stops new messages.

create table if not exists public.dms (
  id bigint generated always as identity primary key,
  sender uuid not null references auth.users on delete cascade,
  recipient uuid not null references auth.users on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender <> recipient)
);
create index if not exists dms_pair on public.dms (least(sender, recipient), greatest(sender, recipient), id desc);
create index if not exists dms_unread on public.dms (recipient) where read_at is null;
alter table public.dms enable row level security;
revoke all on public.dms from anon, authenticated;

-- Send a message to a friend. At most 20 a minute.
create or replace function public.send_dm(p_to uuid, p_text text) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := _me(); clean text;
begin
  if p_to is null or p_to = me then raise exception 'bad request' using errcode = '22023'; end if;
  if _is_blocked(me, p_to) then return json_build_object('ok', false, 'reason', 'blocked'); end if;
  if not _are_friends(me, p_to) then return json_build_object('ok', false, 'reason', 'not_friends'); end if;
  clean := left(btrim(regexp_replace(coalesce(p_text, ''), '[\x00-\x1f\x7f]', ' ', 'g')), 500);
  if clean = '' then return json_build_object('ok', false, 'reason', 'empty'); end if;
  if (select count(*) from dms where sender = me and created_at > now() - interval '1 minute') >= 20 then
    return json_build_object('ok', false, 'reason', 'too_fast');
  end if;
  insert into dms (sender, recipient, body) values (me, p_to, clean);
  return json_build_object('ok', true);
end $$;

-- The last 50 messages with a friend, oldest first. Opening the thread marks theirs as read.
create or replace function public.dm_thread(p_other uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := _me();
begin
  if not _are_friends(me, p_other) or _is_blocked(me, p_other) then return '[]'::json; end if;
  update dms set read_at = now() where recipient = me and sender = p_other and read_at is null;
  return coalesce((
    select json_agg(r order by r.id) from (
      select id, (sender = me) as mine, body, created_at
      from dms
      where (sender = me and recipient = p_other) or (sender = p_other and recipient = me)
      order by id desc limit 50
    ) r
  ), '[]'::json);
end $$;

-- How many unread messages each friend has sent me
create or replace function public.dm_unread() returns json
language plpgsql stable security definer set search_path = public as $$
declare me uuid := _me();
begin
  return coalesce((
    select json_agg(json_build_object('from', d.sender, 'count', d.n)) from (
      select sender, count(*) as n from dms
      where recipient = me and read_at is null and not _is_blocked(me, sender)
      group by sender
    ) d
  ), '[]'::json);
end $$;

revoke execute on function public.send_dm(uuid, text), public.dm_thread(uuid), public.dm_unread() from public, anon;
grant execute on function public.send_dm(uuid, text), public.dm_thread(uuid), public.dm_unread() to authenticated;

-- "Download my data" includes the messages I sent and received
create or replace function public.export_my_data() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'exported_at', now(),
    'account', (select json_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at) from auth.users u where u.id = auth.uid()),
    'profile', (select row_to_json(p) from profiles p where p.id = auth.uid()),
    'save', (select row_to_json(s) from saves s where s.user_id = auth.uid()),
    'finished_lives', (select coalesce(json_agg(r), '[]') from runs r where r.user_id = auth.uid()),
    'leaderboard', (select row_to_json(ps) from player_stats ps where ps.user_id = auth.uid()),
    'daily_rewards', (select coalesce(json_agg(d), '[]') from daily_claims d where d.user_id = auth.uid()),
    'gems', (select row_to_json(w) from gem_wallets w where w.user_id = auth.uid()),
    'gem_history', (select coalesce(json_agg(g), '[]') from gem_ledger g where g.user_id = auth.uid()),
    'payments', (select coalesce(json_agg(json_build_object('reference', pm.reference, 'product', pm.product, 'amount_kobo', pm.amount_kobo, 'created_at', pm.created_at)), '[]') from payments pm where pm.user_id = auth.uid()),
    'feedback', (select coalesce(json_agg(json_build_object('created_at', f.created_at, 'category', f.category, 'message', f.message)), '[]') from feedback f where f.user_id = auth.uid()),
    'story', (select coalesce(json_agg(json_build_object('life', sp.life, 'mission', sp.mission_id, 'choice', sp.choice, 'completed_at', sp.completed_at) order by sp.completed_at), '[]') from story_progress sp where sp.user_id = auth.uid()),
    'friends', (select coalesce(json_agg(json_build_object('player', case when f.low = auth.uid() then f.high else f.low end, 'status', f.status, 'asked_by_me', f.requested_by = auth.uid(), 'created_at', f.created_at)), '[]') from friendships f where f.low = auth.uid() or f.high = auth.uid()),
    'blocked_players', (select coalesce(json_agg(json_build_object('player', b.blocked, 'created_at', b.created_at)), '[]') from blocks b where b.blocker = auth.uid()),
    'home_invitations', (select coalesce(json_agg(json_build_object('owner', i.owner, 'guest', i.guest, 'expires_at', i.expires_at)), '[]') from home_invites i where i.owner = auth.uid() or i.guest = auth.uid()),
    'shared_room', (select row_to_json(h) from home_layouts h where h.owner = auth.uid()),
    'reports_i_sent', (select coalesce(json_agg(json_build_object('reported', r.reported, 'reason', r.reason, 'note', r.note, 'created_at', r.created_at)), '[]') from reports r where r.reporter = auth.uid()),
    'messages', (select coalesce(json_agg(json_build_object('with', case when m.sender = auth.uid() then m.recipient else m.sender end, 'sent_by_me', m.sender = auth.uid(), 'body', m.body, 'created_at', m.created_at) order by m.id), '[]') from dms m where m.sender = auth.uid() or m.recipient = auth.uid())
  );
$$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
