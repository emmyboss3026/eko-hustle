// The global leaderboard. Stats go to the server through submit_stats(), which checks them and
// computes the score and ranks itself (see supabase/schema.sql). Players can't write the table directly.

import type { GameState } from "../engine/game";
import { scoreParts, statusTier, dayNumber } from "../engine/progress";
import { careers } from "../data/careers";
import { supabase } from "./supabase";

export type Board = "global" | "wealth" | "status" | "weekly" | "friends";

export type BoardRow = {
  rank: number;
  name: string;
  avatar: string;
  level: number;
  net_worth: number;
  reputation: number;
  status: number;
  achievements: number;
  career: string;
  game_day: number;
  score: number;
  week_score: number;
  is_me: boolean;
};

export type BoardResult = { rows: BoardRow[]; me: BoardRow | null } | { error: "off" | "notReady" | "network" };

const missingFn = (msg: string) => /function|schema cache|does not exist/i.test(msg);

export async function fetchBoard(board: Exclude<Board, "friends">, search = ""): Promise<BoardResult> {
  if (!supabase) return { error: "off" };
  const { data, error } = await supabase.rpc("leaderboard", { p_board: board, p_search: search.trim() || null, p_limit: 50 });
  if (error) return { error: missingFn(error.message) ? "notReady" : "network" };
  const rows = ((data ?? []) as BoardRow[]).map(r => ({ ...r, rank: Number(r.rank), net_worth: Number(r.net_worth) }));
  let me = rows.find(r => r.is_me) ?? null;
  if (!me) {
    const { data: mine } = await supabase.auth.getSession().then(async ({ data: s }) =>
      s.session ? supabase!.rpc("my_rank", { p_board: board }) : { data: null });
    const m = (mine as BoardRow[] | null)?.[0];
    if (m) me = { ...m, rank: Number(m.rank), net_worth: Number(m.net_worth) };
  }
  return { rows, me };
}

/** The numbers we send. The server recomputes the score and rejects impossible values. */
export function statsFor(s: GameState) {
  const p = scoreParts(s);
  return {
    name: s.sim.name.slice(0, 20),
    avatar: s.sim.avatar,
    level: p.level,
    reputation: p.rep,
    achievements: p.achievements,
    career_level: p.careerLevel,
    businesses: p.businesses,
    net_worth: p.netWorth,
    status: statusTier(s),
    day: dayNumber(s),
    career: s.career ? careers[s.career.id].levels[s.career.level].title : "",
  };
}

export async function submitStats(s: GameState): Promise<boolean> {
  if (!supabase || s.ending) return false;
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return false;
  const { data, error } = await supabase.rpc("submit_stats", { p: statsFor(s) });
  return !error && !!(data as { ok?: boolean } | null)?.ok;
}

/** Your public leaderboard name (2–20 letters, numbers, spaces, . _ ' -). */
export async function setBoardName(userId: string, name: string): Promise<boolean> {
  if (!supabase) return false;
  const clean = name.trim().replace(/\s+/g, " ").slice(0, 20);
  if (!/^[\p{L}\p{N} ._'-]{2,20}$/u.test(clean)) return false;
  const { error } = await supabase.from("profiles").update({ display_name: clean }).eq("id", userId);
  return !error;
}
