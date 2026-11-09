-- Security hardening. Only adds a limit; existing rows are not changed. Run by hand in the SQL Editor (not run by Claude).
-- Cloud saves: a signed-in player could store a huge jsonb in their own save row. Cap it at about 2 MB of text.
alter table public.saves drop constraint if exists saves_state_size; -- so this file can run twice
alter table public.saves add constraint saves_state_size check (octet_length(state::text) <= 2000000) not valid; -- not valid = old rows are not checked, new writes are

-- Old "fastest ending" board (runs): any player could insert fake rows through the API, so the board is retired.
-- Old rows stay (data export and account deletion read them through their own functions). Safe if an old game version still tries to post: it just fails quietly.
drop policy if exists "Players add their own finished lives" on public.runs; -- no more player inserts
drop policy if exists "Anyone can read the leaderboard" on public.runs; -- nobody reads this table through the API any more
revoke all on public.runs from anon, authenticated; -- also close the table-level grants
