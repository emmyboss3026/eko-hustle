-- Eko Hustle database update: the story expansion (100-mission playthroughs) and payment refunds.
-- Run ONCE in Supabase → SQL Editor (emmyboss3026's Project), then run story-catalog.sql.
-- It only adds things; existing players, saves, leaderboards and payments are untouched. Safe to run again.

-- =====================================================================
-- 11. The story: the server's own list of missions, and what each player finished
-- =====================================================================
-- The missions themselves (text, dialogue, choices) live in the game files (src/data/story).
-- The server keeps a copy of each mission's id, chapter, route and reward, so it can check what players record.
create table if not exists public.story_catalog (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  chapter smallint not null check (chapter between 1 and 10),
  route text check (route in ('biz', 'med', 'law', 'tech', 'ent')),
  side boolean not null default false,
  reward_naira int not null default 0 check (reward_naira >= 0),
  reward_xp int not null default 0 check (reward_xp >= 0)
);
alter table public.story_catalog enable row level security;
revoke all on public.story_catalog from anon, authenticated;
grant select on public.story_catalog to anon, authenticated;
drop policy if exists "Anyone can read the mission list" on public.story_catalog;
create policy "Anyone can read the mission list" on public.story_catalog for select using (true);

-- One row per mission a player finished in one life (life = the game's seed). A mission counts once.
create table if not exists public.story_progress (
  user_id uuid not null references auth.users on delete cascade,
  life bigint not null,
  mission_id text not null references public.story_catalog on delete cascade,
  choice smallint check (choice between 0 and 9),
  completed_at timestamptz not null default now(),
  primary key (user_id, life, mission_id)
);
alter table public.story_progress enable row level security;
revoke all on public.story_progress from anon, authenticated;
grant select on public.story_progress to authenticated;
drop policy if exists "Players see their own story" on public.story_progress;
create policy "Players see their own story" on public.story_progress for select to authenticated using (user_id = auth.uid());
create index if not exists story_progress_recent on public.story_progress (user_id, completed_at desc);

-- Verified missions on the leaderboard (only what the server has seen counts)
alter table public.player_stats add column if not exists missions smallint not null default 0 check (missions between 0 and 200);

-- Record a finished mission. Safe to call twice (counts once). Checks that the mission exists,
-- that missions aren't recorded faster than anyone could play them, and returns the server's reward.
create or replace function public.record_mission(p_life bigint, p_mission text, p_choice int default null) returns json
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  m public.story_catalog;
  last timestamptz;
  n int;
  inserted int;
begin
  if uid is null then raise exception 'sign in first' using errcode = '28000'; end if;
  if p_life is null or p_life < 0 or p_life > 4294967295 then raise exception 'bad life' using errcode = '22023'; end if;
  select * into m from story_catalog where id = p_mission;
  if not found then raise exception 'unknown mission' using errcode = '22023'; end if;
  if p_choice is not null and (p_choice < 0 or p_choice > 9) then raise exception 'bad choice' using errcode = '22023'; end if;
  -- A real mission takes at least a few seconds of play
  select max(completed_at) into last from story_progress where user_id = uid;
  if last is not null and last > now() - interval '3 seconds' then
    return json_build_object('ok', false, 'reason', 'too_fast');
  end if;
  insert into story_progress (user_id, life, mission_id, choice) values (uid, p_life, m.id, p_choice)
    on conflict do nothing;
  get diagnostics inserted = row_count;
  select count(*) into n from story_progress sp join story_catalog sc on sc.id = sp.mission_id
    where sp.user_id = uid and sp.life = p_life and not sc.side;
  update player_stats set missions = least(200, n) where user_id = uid;
  return json_build_object('ok', true, 'repeat', inserted = 0, 'missions', n,
                           'reward_naira', m.reward_naira, 'reward_xp', m.reward_xp);
end $$;

revoke execute on function public.record_mission(bigint, text, int) from public, anon;
grant execute on function public.record_mission(bigint, text, int) to authenticated;

-- "Download my data" includes the story
create or replace function public.export_my_story() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('life', life, 'mission', mission_id, 'choice', choice, 'completed_at', completed_at)
                  order by completed_at), '[]')
  from story_progress where user_id = auth.uid();
$$;
revoke execute on function public.export_my_story() from public, anon;
grant execute on function public.export_my_story() to authenticated;

-- =====================================================================
-- 12. Payments: status and refunds
-- =====================================================================
alter table public.payments add column if not exists status text not null default 'paid'
  check (status in ('paid', 'refunded', 'partly_refunded'));
alter table public.payments add column if not exists refunded_at timestamptz;
alter table public.payments add column if not exists refund_note text check (char_length(refund_note) <= 300);

-- Refund a gem purchase (run by you in the SQL Editor, or by a server function; never by players):
--   select public.refund_gems('chk_...', 'Unused gems, asked within 14 days');   -- the Bachs checkout id
-- Removes the gems that are still unused (never more than the player has) and marks the payment.
-- Then refund the money in the Bachs dashboard. Running it twice does nothing the second time.
create or replace function public.refund_gems(p_reference text, p_note text default null) returns json
language plpgsql security definer set search_path = public as $$
declare
  pay public.payments;
  bought int;
  bal int;
  take int;
begin
  select * into pay from payments where reference = p_reference for update;
  if not found then raise exception 'no such payment'; end if;
  if pay.status <> 'paid' then return json_build_object('ok', true, 'repeat', true, 'status', pay.status); end if;
  select delta into bought from gem_ledger where reference = p_reference and reason = 'purchase';
  bought := coalesce(bought, 0);
  if pay.user_id is not null and bought > 0 then
    select balance into bal from gem_wallets where user_id = pay.user_id for update;
    take := least(bought, coalesce(bal, 0));
    if take > 0 then
      insert into gem_ledger (user_id, delta, reason, reference) values (pay.user_id, -take, 'refund', 'refund_' || p_reference);
      update gem_wallets set balance = balance - take, updated_at = now() where user_id = pay.user_id;
    end if;
  else
    take := 0;
  end if;
  update payments set status = case when bought > 0 and take < bought then 'partly_refunded' else 'refunded' end,
                      refunded_at = now(), refund_note = left(p_note, 300)
    where reference = p_reference;
  return json_build_object('ok', true, 'gems_removed', take, 'gems_bought', coalesce(bought, 0));
end $$;
revoke execute on function public.refund_gems(text, text) from public, anon, authenticated;
