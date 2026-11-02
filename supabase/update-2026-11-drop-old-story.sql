-- Eko Hustle database clean-up: remove the unused story_claims table and record_story_mission() function
-- (from the first 100-mission path, replaced by story_progress / record_mission()).
-- story_claims had 0 rows when this was written. Run ONCE in Supabase → SQL Editor. Safe to run again.
-- IMPORTANT: run update-2026-11-messages.sql FIRST: it replaces export_my_data() so the export reads the story
-- from story_progress. Until then export_my_data() still reads story_claims, and dropping that table would break it.

drop function if exists public.record_story_mission(text, int, int);
drop table if exists public.story_claims;
