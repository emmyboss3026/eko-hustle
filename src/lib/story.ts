// Tell the server a story mission was finished (see record_story_mission in supabase/update-2026-11-story.sql).
// Best effort: the game never waits for it, and it does nothing when signed out or before the database is updated.

import { supabase } from "./supabase";

export async function recordStoryMission(id: string, choice: number | null, day: number): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    await supabase.rpc("record_story_mission", { p_mission: id, p_choice: choice ?? -1, p_day: day });
  } catch {
    // offline or not updated yet: the save still holds the story
  }
}
