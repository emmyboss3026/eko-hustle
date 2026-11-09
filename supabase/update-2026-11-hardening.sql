-- Security hardening. Only adds a limit; existing rows are not changed. Run by hand in the SQL Editor (not run by Claude).
-- Cloud saves: a signed-in player could store a huge jsonb in their own save row. Cap it at about 2 MB of text.
alter table public.saves drop constraint if exists saves_state_size; -- so this file can run twice
alter table public.saves add constraint saves_state_size check (octet_length(state::text) <= 2000000) not valid; -- not valid = old rows are not checked, new writes are
