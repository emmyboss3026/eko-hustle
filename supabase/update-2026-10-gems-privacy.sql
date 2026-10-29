-- Eko Hustle database update: Power Gems (revive purchases), payment records that survive account
-- deletion, and the "download my data" / "delete my account" buttons.
-- Run ONCE in Supabase → SQL Editor (emmyboss3026's Project). It only adds or changes what's listed. Safe to run again.

-- =====================================================================
-- 8. Payments: keep the record for tax law even if the player deletes their account
-- =====================================================================
alter table public.payments add column if not exists product text;
alter table public.payments alter column user_id drop not null;
alter table public.payments drop constraint if exists payments_user_id_fkey;
alter table public.payments add constraint payments_user_id_fkey
  foreign key (user_id) references auth.users on delete set null;

-- =====================================================================
-- 9. Power Gems: the balance lives here, never in the game save
-- =====================================================================
create table if not exists public.gem_wallets (
  user_id uuid primary key references auth.users on delete cascade,
  balance int not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.gem_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  delta int not null check (delta <> 0),
  reason text not null check (reason in ('purchase', 'revive', 'refund', 'gift')),
  reference text not null unique,          -- a payment id or a revive id: each counts once
  created_at timestamptz not null default now()
);
alter table public.gem_wallets enable row level security;
alter table public.gem_ledger enable row level security;
revoke all on public.gem_wallets, public.gem_ledger from anon, authenticated;
grant select on public.gem_wallets, public.gem_ledger to authenticated;
drop policy if exists "Players see their own gems" on public.gem_wallets;
create policy "Players see their own gems" on public.gem_wallets for select to authenticated using (user_id = auth.uid());
drop policy if exists "Players see their own gem history" on public.gem_ledger;
create policy "Players see their own gem history" on public.gem_ledger for select to authenticated using (user_id = auth.uid());

-- Your balance (0 if you never bought any)
create or replace function public.my_gems() returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select balance from gem_wallets where user_id = auth.uid()), 0);
$$;

-- Spend one gem to revive. p_ref is a random id the game makes for this revive, so a retry
-- (bad connection, double tap) never spends twice.
create or replace function public.use_gem(p_ref text) returns json
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  ref text;
  bal int;
begin
  if uid is null then raise exception 'sign in first' using errcode = '28000'; end if;
  if p_ref is null or p_ref !~ '^[A-Za-z0-9_-]{8,64}$' then raise exception 'bad reference' using errcode = '22023'; end if;
  ref := 'revive_' || uid || '_' || p_ref;
  if exists (select 1 from gem_ledger where reference = ref) then
    return json_build_object('ok', true, 'ref', p_ref, 'balance', my_gems(), 'repeat', true);
  end if;
  select balance into bal from gem_wallets where user_id = uid for update;
  if coalesce(bal, 0) < 1 then
    return json_build_object('ok', false, 'reason', 'no_gems', 'balance', coalesce(bal, 0));
  end if;
  update gem_wallets set balance = balance - 1, updated_at = now() where user_id = uid;
  insert into gem_ledger (user_id, delta, reason, reference) values (uid, -1, 'revive', ref);
  return json_build_object('ok', true, 'ref', p_ref, 'balance', bal - 1);
end $$;

-- Add gems after a payment. ONLY the payment webhook (service role) may call this.
create or replace function public.grant_gems(p_user uuid, p_amount int, p_reference text) returns int
language plpgsql security definer set search_path = public as $$
declare inserted int;
begin
  if p_amount < 1 or p_amount > 1000 then raise exception 'bad amount'; end if;
  insert into gem_ledger (user_id, delta, reason, reference) values (p_user, p_amount, 'purchase', p_reference)
    on conflict (reference) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return (select balance from gem_wallets where user_id = p_user); end if; -- already credited
  insert into gem_wallets (user_id, balance) values (p_user, p_amount)
    on conflict (user_id) do update set balance = gem_wallets.balance + excluded.balance, updated_at = now();
  return (select balance from gem_wallets where user_id = p_user);
end $$;

revoke execute on function public.my_gems() from public, anon;
revoke execute on function public.use_gem(text) from public, anon;
revoke execute on function public.grant_gems(uuid, int, text) from public, anon, authenticated;
grant execute on function public.my_gems() to authenticated;
grant execute on function public.use_gem(text) to authenticated;

-- =====================================================================
-- 10. Your data: download it, or delete your account
-- =====================================================================
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
    'feedback', (select coalesce(json_agg(json_build_object('created_at', f.created_at, 'category', f.category, 'message', f.message)), '[]') from feedback f where f.user_id = auth.uid())
  );
$$;

-- Deletes the account and everything linked to it. Payment records stay, without your id,
-- because tax law requires them; feedback stays, without your id.
create or replace function public.delete_my_account() returns json
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'sign in first' using errcode = '28000'; end if;
  delete from saves where user_id = uid;
  delete from runs where user_id = uid;
  delete from player_stats where user_id = uid;
  delete from daily_claims where user_id = uid;
  delete from gem_ledger where user_id = uid;
  delete from gem_wallets where user_id = uid;
  update feedback set user_id = null where user_id = uid;
  update payments set user_id = null where user_id = uid;
  delete from profiles where id = uid;
  delete from auth.users where id = uid;
  return json_build_object('ok', true);
end $$;

revoke execute on function public.export_my_data() from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.export_my_data() to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- Small clean-ups from Supabase's security check
revoke execute on function public.handle_new_user() from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_proc where proname = 'rls_auto_enable' and pronamespace = 'public'::regnamespace) then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;
revoke execute on function public.my_rank(text) from public, anon;
grant execute on function public.my_rank(text) to authenticated;
alter function public.daily_reward_for(int) set search_path = public;
alter function public.clean_name(text) set search_path = public;
alter function public.eko_score(int, int, int, int, int, bigint) set search_path = public;
