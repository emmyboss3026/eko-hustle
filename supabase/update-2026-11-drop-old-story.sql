-- Eko Hustle database clean-up: remove the unused story_claims table and record_story_mission() function
-- (from the first 100-mission path, replaced by story_progress / record_mission()), and make the
-- "download my data" export read the story from story_progress instead.
-- story_claims had 0 rows when this was written. Run ONCE in Supabase → SQL Editor. Safe to run again.

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
    'reports_i_sent', (select coalesce(json_agg(json_build_object('reported', r.reported, 'reason', r.reason, 'note', r.note, 'created_at', r.created_at)), '[]') from reports r where r.reporter = auth.uid())
  );
$$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

drop function if exists public.record_story_mission(text, int, int);
drop table if exists public.story_claims;
