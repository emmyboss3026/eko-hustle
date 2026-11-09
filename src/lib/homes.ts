// Sharing your room with friends who visit. The server keeps only the furniture (type, tile, turn) and the shape
// of the flat (extensions, moved walls, floors); see supabase/update-2026-11-home-shape.sql. Signed-in players only.

import { supabase } from "./supabase";  // Supabase client
import { floorById, type Placed } from "../data/home";  // floor lookup and furniture type

/** What visitors need to draw the flat itself: how far it is extended, the walls you moved, the floors you laid. */
export type HomeShape = { wing: number; walls?: string[]; floors?: Record<string, string> };  // the shape of a flat for visitors

/** Save my room for visitors. Quiet on failure: it only matters when someone visits. */
export async function publishHome(objects: Placed[], shape: HomeShape): Promise<void> {  // send my furniture and flat shape to the server
  if (!supabase) return;  // no backend, nothing to share
  try {  // stay quiet on any failure
    const { data } = await supabase.auth.getSession();  // get the login session
    if (!data.session) return;  // must be signed in
    const p_objects = objects.map(({ type, x, y, rot }) => ({ type, x, y, rot }));  // send only type, tile and turn
    const { error } = await supabase.rpc("publish_home", { p_objects, p_shape: shape });  // save furniture and shape
    // The database may not have the newer function yet: share the furniture alone
    if (error) await supabase.rpc("publish_home", { p_objects });  // retry with furniture alone for older databases
  } catch {  // offline: nothing to do
    // offline: the next change will try again
  }
}

/** Anything a visitor receives is checked before it is drawn. */
function cleanShape(s: unknown): HomeShape | null {  // check shape data before drawing it
  const o = s as Partial<HomeShape> | null;  // treat input as possibly missing
  if (!o || typeof o !== "object") return null;  // reject anything that is not an object
  const wing = Number.isInteger(o.wing) ? Math.max(0, Math.min(6, o.wing as number)) : 0;  // wing size is a whole number from 0 to 6
  const walls = Array.isArray(o.walls) ? o.walls.filter(w => typeof w === "string" && /^[vh]:\d{1,2}:\d{1,2}$/.test(w)).slice(0, 400) : undefined;  // keep only valid wall codes, at most 400
  const floors: Record<string, string> = {};  // floors by room name
  if (o.floors && typeof o.floors === "object") {  // only if floors is an object
    for (const [room, id] of Object.entries(o.floors).slice(0, 12)) if (typeof id === "string" && floorById(id) && /^[A-Za-z ]{1,20}$/.test(room)) floors[room] = id;  // keep known floor ids and plain room names, at most 12
  }
  return { wing, walls, floors };  // return the cleaned shape
}

/** A home's furniture and shape, if I am the owner or an invited friend. null: not allowed (or not available). */
export async function fetchHome(owner: string): Promise<{ objects: Placed[]; shape: HomeShape | null } | null> {  // load a home's furniture and shape
  if (!supabase) return null;  // no backend
  const { data, error } = await supabase.rpc("home_layout", { p_owner: owner });  // ask the server, which checks permission
  if (error || !data) return null;  // not allowed or failed
  const d = data as { objects: Omit<Placed, "uid">[]; shape?: unknown };  // the shape of the server answer
  return { objects: d.objects.map((o, i) => ({ ...o, uid: i + 1 })), shape: cleanShape(d.shape) };  // give each item an id and clean the shape
}
