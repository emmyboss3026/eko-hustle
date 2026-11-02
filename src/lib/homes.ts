// Sharing your room with friends who visit. The server keeps only the furniture (type, tile, turn) and the shape
// of the flat (extensions, moved walls, floors); see supabase/update-2026-11-home-shape.sql. Signed-in players only.

import { supabase } from "./supabase";
import { floorById, type Placed } from "../data/home";

/** What visitors need to draw the flat itself: how far it is extended, the walls you moved, the floors you laid. */
export type HomeShape = { wing: number; walls?: string[]; floors?: Record<string, string> };

/** Save my room for visitors. Quiet on failure: it only matters when someone visits. */
export async function publishHome(objects: Placed[], shape: HomeShape): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    const p_objects = objects.map(({ type, x, y, rot }) => ({ type, x, y, rot }));
    const { error } = await supabase.rpc("publish_home", { p_objects, p_shape: shape });
    // The database may not have the newer function yet: share the furniture alone
    if (error) await supabase.rpc("publish_home", { p_objects });
  } catch {
    // offline: the next change will try again
  }
}

/** Anything a visitor receives is checked before it is drawn. */
function cleanShape(s: unknown): HomeShape | null {
  const o = s as Partial<HomeShape> | null;
  if (!o || typeof o !== "object") return null;
  const wing = Number.isInteger(o.wing) ? Math.max(0, Math.min(6, o.wing as number)) : 0;
  const walls = Array.isArray(o.walls) ? o.walls.filter(w => typeof w === "string" && /^[vh]:\d{1,2}:\d{1,2}$/.test(w)).slice(0, 400) : undefined;
  const floors: Record<string, string> = {};
  if (o.floors && typeof o.floors === "object") {
    for (const [room, id] of Object.entries(o.floors).slice(0, 12)) if (typeof id === "string" && floorById(id) && /^[A-Za-z ]{1,20}$/.test(room)) floors[room] = id;
  }
  return { wing, walls, floors };
}

/** A home's furniture and shape, if I am the owner or an invited friend. null: not allowed (or not available). */
export async function fetchHome(owner: string): Promise<{ objects: Placed[]; shape: HomeShape | null } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("home_layout", { p_owner: owner });
  if (error || !data) return null;
  const d = data as { objects: Omit<Placed, "uid">[]; shape?: unknown };
  return { objects: d.objects.map((o, i) => ({ ...o, uid: i + 1 })), shape: cleanShape(d.shape) };
}
