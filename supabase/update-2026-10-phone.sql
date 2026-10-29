-- Eko Hustle database update: feedback box, daily login rewards and the global leaderboard.
-- Run this ONCE in Supabase → SQL Editor for the project the game uses (emmyboss3026's Project).
-- It only adds things: no existing table or row is changed or deleted. Safe to run again.
--
-- Security model:
-- * Players can never write to daily_claims or player_stats directly (no insert/update grants).
--   They can only call the functions below, which run on the server with the server's clock
--   and recompute everything themselves.
-- * The game simulation runs on the player's device, so the server can't replay their whole
--   life. It checks that submitted numbers are plausible for the in-game day and rate-limits
--   updates. That stops casual cheating (editing requests in dev tools); it can't stop someone
--   who rewrites their own save file in a believable way.

-- =====================================================================
-- 5. Player feedback (from the in-game 💬 Feedback box)
-- =====================================================================
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users on delete set null,
  category text not null check (category in ('bug', 'idea', 'like', 'confusing')),
  rating smallint check (rating between 1 and 5),
  message text not null check (char_length(message) between 1 and 1000),
  lang text check (char_length(lang) <= 5),
  game_day integer check (game_day >= 0),
  app_version text check (char_length(app_version) <= 20)
);
alter table public.feedback enable row level security;
grant insert on public.feedback to anon, authenticated;
drop policy if exists "Anyone can send feedback" on public.feedback;
create policy "Anyone can send feedback"
  on public.feedback for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- =====================================================================
-- 6. Daily login rewards (server time, one claim per account per Lagos day)
-- =====================================================================
create table if not exists public.daily_claims (
  user_id uuid not null references auth.users on delete cascade,
  claim_date date not null,                       -- the day in Lagos (Africa/Lagos)
  streak_day smallint not null check (streak_day between 1 and 7),
  amount integer not null check (amount between 1 and 50000),
  created_at timestamptz not null default now(),
  primary key (user_id, claim_date)               -- a second claim on the same day is impossible
);
alter table public.daily_claims enable row level security;
revoke all on public.daily_claims from anon, authenticated;
grant select on public.daily_claims to authenticated;
drop policy if exists "Players read their own reward history" on public.daily_claims;
create policy "Players read their own reward history"
  on public.daily_claims for select to authenticated using (user_id = auth.uid());

-- Day 1 → 7 rewards (keep in step with src/data/daily.ts)
create or replace function public.daily_reward_for(p_day int) returns int
language sql immutable as $$
  select (array[1000, 1500, 2000, 3000, 4000, 5000, 10000])[greatest(1, least(7, p_day))];
$$;

-- Where the player stands today: can they claim, which streak day is next, when does it reset?
create or replace function public.daily_status() returns json
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'Africa/Lagos')::date;
  last_date date;
  last_day int;
  next_day int;
begin
  if uid is null then raise exception 'sign in first' using errcode = '28000'; end if;
  select claim_date, streak_day into last_date, last_day
    from daily_claims where user_id = uid order by claim_date desc limit 1;
  -- One missed day is forgiven, so nobody has to log in every single day.
  if last_date is not null and today - last_date <= 2 and last_date <> today then next_day := last_day % 7 + 1;
  elsif last_date = today then next_day := last_day % 7 + 1;
  else next_day := 1;
  end if;
  return json_build_object(
    'today', today,
    'can_claim', last_date is distinct from today,
    'last_date', last_date,
    'last_day', last_day,
    'next_day', next_day,
    'next_amount', daily_reward_for(next_day),
    'server_now', now(),
    'resets_at', ((today + 1)::timestamp at time zone 'Africa/Lagos')
  );
end $$;

-- Claim today's reward. Safe against double taps and replays: the primary key allows one row a day.
create or replace function public.claim_daily_reward() returns json
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'Africa/Lagos')::date;
  last_date date;
  last_day int;
  day int;
  amt int;
  inserted int;
begin
  if uid is null then raise exception 'sign in first' using errcode = '28000'; end if;
  select claim_date, streak_day into last_date, last_day
    from daily_claims where user_id = uid order by claim_date desc limit 1;
  if last_date = today then
    return json_build_object('claimed', false, 'date', today, 'day', last_day, 'amount', 0);
  end if;
  if last_date is not null and today - last_date <= 2 then day := last_day % 7 + 1; else day := 1; end if;
  amt := daily_reward_for(day);
  insert into daily_claims (user_id, claim_date, streak_day, amount) values (uid, today, day, amt)
    on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then
    return json_build_object('claimed', false, 'date', today, 'day', day, 'amount', 0);
  end if;
  return json_build_object('claimed', true, 'date', today, 'day', day, 'amount', amt,
    'resets_at', ((today + 1)::timestamp at time zone 'Africa/Lagos'));
end $$;

revoke execute on function public.daily_status() from public, anon;
revoke execute on function public.claim_daily_reward() from public, anon;
grant execute on function public.daily_status() to authenticated;
grant execute on function public.claim_daily_reward() to authenticated;

-- =====================================================================
-- 7. Global leaderboard (server-side scores and ranks)
-- =====================================================================
create table if not exists public.player_stats (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 20),
  avatar text check (char_length(avatar) <= 16),
  level int not null check (level between 1 and 99),
  net_worth bigint not null,
  reputation int not null check (reputation between 0 and 100),
  status smallint not null check (status between 0 and 5),
  achievements smallint not null check (achievements between 0 and 40),
  career text check (char_length(career) <= 40),
  career_level smallint not null default 0 check (career_level between 0 and 4),
  businesses smallint not null default 0 check (businesses between 0 and 10),
  game_day int not null check (game_day between 1 and 36500),
  score int not null,
  week_start date not null,
  week_base int not null default 0,
  week_score int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.player_stats enable row level security;
revoke all on public.player_stats from anon, authenticated;  -- only the functions below touch it

create index if not exists player_stats_score on public.player_stats (score desc);
create index if not exists player_stats_worth on public.player_stats (net_worth desc);
create index if not exists player_stats_status on public.player_stats (status desc, reputation desc);
create index if not exists player_stats_week on public.player_stats (week_start, week_score desc);

-- Public names: letters, numbers, spaces and . _ ' - only, and a short list of blocked words.
create or replace function public.clean_name(p text) returns text
language plpgsql immutable as $$
declare
  n text := btrim(regexp_replace(coalesce(p, ''), '\s+', ' ', 'g'));
begin
  if n !~ '^[[:alnum:] ._''-]{2,20}$' then return 'Player'; end if;
  if lower(n) ~ '(fuck|nigg|\mshit|\mbitch|\mcunt|\mwhore|\mpussy|\mnazi|\mhitler)' then return 'Player'; end if;
  return n;
end $$;

-- The leaderboard score. Keep in step with scoreFrom() in src/engine/progress.ts.
create or replace function public.eko_score(p_level int, p_rep int, p_ach int, p_career int, p_biz int, p_worth bigint)
returns int language sql immutable as $$
  select floor(p_level * 120 + p_rep * 25 + p_ach * 150 + p_career * 200 + p_biz * 250
               + sqrt(greatest(p_worth, 0) / 1000.0) * 30)::int;
$$;

-- Send your current life's stats. The server checks them, computes the score and the week's score.
create or replace function public.submit_stats(p jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  cur public.player_stats;
  day int := coalesce((p->>'day')::int, 1);
  lvl int := coalesce((p->>'level')::int, 1);
  rep int := coalesce((p->>'reputation')::int, 0);
  ach int := coalesce((p->>'achievements')::int, 0);
  car int := coalesce((p->>'career_level')::int, 0);
  biz int := coalesce((p->>'businesses')::int, 0);
  worth bigint := coalesce((p->>'net_worth')::bigint, 0);
  stat int := coalesce((p->>'status')::int, 0);
  nm text;
  sc int;
  wk date := date_trunc('week', now() at time zone 'Africa/Lagos')::date;
  base int;
  had boolean;
begin
  if uid is null then raise exception 'sign in first' using errcode = '28000'; end if;
  -- Plausibility: everything must fit what's possible by this day of the game.
  if day < 1 or day > 36500
     or lvl < 1 or lvl > least(99, 3 + day * 2)
     or rep < 0 or rep > 100
     or ach < 0 or ach > 40
     or car < 0 or car > 4
     or biz < 0 or biz > 10
     or stat < 0 or stat > 5
     or worth < -1000000 or worth > 1000000::bigint * day + 500000 then
    raise exception 'stats not possible' using errcode = '22023';
  end if;
  select * into cur from player_stats where user_id = uid;
  had := found;
  if had and cur.updated_at > now() - interval '20 seconds' then
    return json_build_object('ok', false, 'reason', 'too_soon');
  end if;
  select display_name into nm from profiles where id = uid;
  nm := clean_name(coalesce(nullif(nm, ''), p->>'name'));
  sc := eko_score(lvl, rep, ach, car, biz, worth);
  -- The week's score counts what you gained since the week began (a new life starts from zero).
  if not had then base := 0;
  elsif cur.week_start <> wk then base := cur.score;
  else base := cur.week_base;
  end if;
  if sc < base then base := 0; end if;
  insert into player_stats as ps (user_id, display_name, avatar, level, net_worth, reputation, status, achievements,
                                  career, career_level, businesses, game_day, score, week_start, week_base, week_score, updated_at)
  values (uid, nm, left(coalesce(p->>'avatar', ''), 16), lvl, worth, rep, stat, ach,
          left(coalesce(p->>'career', ''), 40), car, biz, day, sc, wk, base, greatest(0, sc - base), now())
  on conflict (user_id) do update set
    display_name = excluded.display_name, avatar = excluded.avatar, level = excluded.level,
    net_worth = excluded.net_worth, reputation = excluded.reputation, status = excluded.status,
    achievements = excluded.achievements, career = excluded.career, career_level = excluded.career_level,
    businesses = excluded.businesses, game_day = excluded.game_day, score = excluded.score,
    week_start = excluded.week_start, week_base = excluded.week_base, week_score = excluded.week_score,
    updated_at = now();
  return json_build_object('ok', true, 'score', sc, 'week_score', greatest(0, sc - base));
end $$;

-- Everyone ranked on a board ('global', 'wealth', 'status' or 'weekly'). Internal: not callable by players.
create or replace function public.board_ranked(p_board text)
returns table (rk bigint, user_id uuid, display_name text, avatar text, level int, net_worth bigint, reputation int,
               status smallint, achievements smallint, career text, game_day int, score int, week_score int)
language sql stable security definer set search_path = public as $$
  select rank() over (order by
           case p_board when 'wealth' then ps.net_worth::numeric
                        when 'status' then ps.status * 1000 + ps.reputation
                        when 'weekly' then ps.week_score
                        else ps.score end desc,
           ps.score desc, ps.updated_at asc),
         ps.user_id, ps.display_name, ps.avatar, ps.level, ps.net_worth, ps.reputation, ps.status,
         ps.achievements, ps.career, ps.game_day, ps.score, ps.week_score
  from player_stats ps
  where p_board <> 'weekly' or ps.week_start = date_trunc('week', now() at time zone 'Africa/Lagos')::date;
$$;
revoke execute on function public.board_ranked(text) from public, anon, authenticated;

-- The top players on a board, with an optional name search. Ranks are worked out over everyone first,
-- so a search still shows true positions. User ids are never sent to the browser.
create or replace function public.leaderboard(p_board text default 'global', p_search text default null, p_limit int default 50)
returns table (rank bigint, name text, avatar text, level int, net_worth bigint, reputation int, status smallint,
               achievements smallint, career text, game_day int, score int, week_score int, is_me boolean)
language sql stable security definer set search_path = public as $$
  select r.rk, r.display_name, r.avatar, r.level, r.net_worth, r.reputation, r.status, r.achievements, r.career,
         r.game_day, r.score, r.week_score, r.user_id = auth.uid()
  from public.board_ranked(p_board) r
  where p_search is null or p_search = ''
     or r.display_name ilike '%' || replace(replace(replace(left(p_search, 20), '\', ''), '%', ''), '_', '') || '%'
  order by r.rk
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

-- Your own position on a board, even if you're far from the top.
create or replace function public.my_rank(p_board text default 'global')
returns table (rank bigint, name text, avatar text, level int, net_worth bigint, reputation int, status smallint,
               achievements smallint, career text, game_day int, score int, week_score int, is_me boolean)
language sql stable security definer set search_path = public as $$
  select r.rk, r.display_name, r.avatar, r.level, r.net_worth, r.reputation, r.status, r.achievements, r.career,
         r.game_day, r.score, r.week_score, true
  from public.board_ranked(p_board) r
  where r.user_id = auth.uid();
$$;

revoke execute on function public.submit_stats(jsonb) from public, anon;
grant execute on function public.submit_stats(jsonb) to authenticated;
grant execute on function public.leaderboard(text, text, int) to anon, authenticated;
grant execute on function public.my_rank(text) to authenticated;
