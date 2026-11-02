// Sharing your room with friends who visit. The server keeps only furniture (type, tile, turn);
// see supabase/update-2026-11-home-layouts.sql. Signed-in players only.

import { supabase } from "./supabase";
import type { Placed } from "../data/home";

/** Save my room for visitors. Quiet on failure: it only matters when someone visits. */
export async function publishHome(objects: Placed[]): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    await supabase.rpc("publish_home", { p_objects: objects.map(({ type, x, y, rot }) => ({ type, x, y, rot })) });
  } catch {
    // offline: the next change will try again
  }
}

/** A home's furniture, if I am the owner or an invited friend. null: not allowed (or not available). */
export async function fetchHome(owner: string): Promise<Placed[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("home_layout", { p_owner: owner });
  if (error || !data) return null;
  return ((data as { objects: Omit<Placed, "uid">[] }).objects).map((o, i) => ({ ...o, uid: i + 1 }));
}
