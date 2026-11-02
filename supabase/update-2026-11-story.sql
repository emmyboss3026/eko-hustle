-- Eko Hustle database update: the story (see src/data/story).
-- Run ONCE in Supabase → SQL Editor. It only adds what's listed and is safe to run again. Nothing existing is changed
-- except export_my_data(), which now also lists your story record.
--
-- What this does and does not do: the game's money lives in the player's save, so this does NOT make story
-- rewards server-paid. It keeps a server-side record of each finished mission (one row per player per mission, so a
-- replay or double tap can never count twice) for the leaderboard and for support. Reward amounts are fixed in the
-- mission data, not sent by the client.

create table if not exists public.story_claims (
  user_id uuid not null references auth.users on delete cascade,
  mission_id text not null check (mission_id ~ '^s[0-9]{2}[a-z]?-[a-z0-9-]{1,40}$'),
  choice smallint check (choice between 0 and 9),
  game_day int check (game_day between 1 and 100000),
  created_at timestamptz not null default now(),
  primary key (user_id, mission_id)
);
alter table public.story_claims enable row level security;
revoke all on public.story_claims from anon, authenticated;
grant select on public.story_claims to authenticated;
drop policy if exists "Players see their own story record" on public.story_claims;
create policy "Players see their own story record" on public.story_claims for select to authenticated using (user_id = auth.uid());

-- Record a finished mission. The same mission twice returns recorded = false and changes nothing.
create or replace function public.record_story_mission(p_mission text, p_choice int, p_day int) returns json
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  added int;
begin
  if uid is null then raise exception 'sign in first' using errcode = '28000'; end if;
  if p_mission is null or p_mission !~ '^s[0-9]{2}[a-z]?-[a-z0-9-]{1,40}$' then raise exception 'bad mission' using errcode = '22023'; end if;
  insert into story_claims (user_id, mission_id, choice, game_day)
  values (uid, p_mission, nullif(least(greatest(coalesce(p_choice, -1), -1), 9), -1), least(greatest(coalesce(p_day, 1), 1), 100000))
  on conflict (user_id, mission_id) do nothing;
  get diagnostics added = row_count;
  return json_build_object('recorded', added = 1, 'total', (select count(*) from story_claims where user_id = uid));
end $$;
revoke execute on function public.record_story_mission(text, int, int) from public, anon;
grant execute on function public.record_story_mission(text, int, int) to authenticated;

-- "Download my data" now includes the story record
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
    'story', (select coalesce(json_agg(json_build_object('mission', c.mission_id, 'choice', c.choice, 'game_day', c.game_day, 'created_at', c.created_at)), '[]') from story_claims c where c.user_id = auth.uid())
  );
$$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
