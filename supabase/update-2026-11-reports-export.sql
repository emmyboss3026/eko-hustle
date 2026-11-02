-- Eko Hustle database update: reporting players, and "download my data" now includes everything the social
-- features store. Run ONCE in Supabase → SQL Editor. Safe to run again. Needs the friends and home-layouts updates first.

-- ---------------------------------------------------------------------
-- Reports. Players can send them but never read them; you read them in the Supabase dashboard (Table Editor → reports).
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter uuid references auth.users on delete set null,
  reported uuid references auth.users on delete set null,
  reason text not null check (reason in ('harassment', 'cheating', 'offensive_name', 'spam', 'other')),
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
create index if not exists reports_reported on public.reports (reported, created_at desc);

-- At most 10 reports a day each, and the same person only once a day, so reports cannot be used to flood
create or replace function public.report_player(p_other uuid, p_reason text, p_note text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := _me();
begin
  if p_other is null or p_other = me then raise exception 'bad request' using errcode = '22023'; end if;
  if p_reason not in ('harassment', 'cheating', 'offensive_name', 'spam', 'other') then raise exception 'bad reason' using errcode = '22023'; end if;
  if not exists (select 1 from auth.users where id = p_other) then raise exception 'no such player' using errcode = '22023'; end if;
  if (select count(*) from reports where reporter = me and created_at > now() - interval '1 day') >= 10 then
    return json_build_object('ok', false, 'reason', 'too_many');
  end if;
  if exists (select 1 from reports where reporter = me and reported = p_other and created_at > now() - interval '1 day') then
    return json_build_object('ok', true, 'repeat', true);
  end if;
  insert into reports (reporter, reported, reason, note) values (me, p_other, p_reason, left(btrim(coalesce(p_note, '')), 200));
  return json_build_object('ok', true);
end $$;
revoke execute on function public.report_player(uuid, text, text) from public, anon;
grant execute on function public.report_player(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- "Download my data": now also friends, blocks, invitations, my shared room and the story record
-- ---------------------------------------------------------------------
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
    'story', (select coalesce(json_agg(json_build_object('mission', c.mission_id, 'choice', c.choice, 'game_day', c.game_day, 'created_at', c.created_at)), '[]') from story_claims c where c.user_id = auth.uid()),
    'friends', (select coalesce(json_agg(json_build_object('player', case when f.low = auth.uid() then f.high else f.low end, 'status', f.status, 'asked_by_me', f.requested_by = auth.uid(), 'created_at', f.created_at)), '[]') from friendships f where f.low = auth.uid() or f.high = auth.uid()),
    'blocked_players', (select coalesce(json_agg(json_build_object('player', b.blocked, 'created_at', b.created_at)), '[]') from blocks b where b.blocker = auth.uid()),
    'home_invitations', (select coalesce(json_agg(json_build_object('owner', i.owner, 'guest', i.guest, 'expires_at', i.expires_at)), '[]') from home_invites i where i.owner = auth.uid() or i.guest = auth.uid()),
    'shared_room', (select row_to_json(h) from home_layouts h where h.owner = auth.uid()),
    'reports_i_sent', (select coalesce(json_agg(json_build_object('reported', r.reported, 'reason', r.reason, 'note', r.note, 'created_at', r.created_at)), '[]') from reports r where r.reporter = auth.uid())
  );
$$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
