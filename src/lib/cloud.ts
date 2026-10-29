// Accounts, cloud save and the leaderboard, all through Supabase.
// Every function is safe to call when Supabase isn't set up: it just does nothing.

import { upgrade, type GameState } from "../engine/game";
import { supabase } from "./supabase";

export type Profile = { id: string; email: string; supporter: boolean };
export type Run = { sim_name: string; trait: string; ending: string; days: number; earned: number };

export async function signInWithEmail(email: string): Promise<string | null> {
  if (!supabase) return "account.notSetUp";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  return error ? error.message : null;
}

export async function signInWithGoogle(): Promise<string | null> {
  if (!supabase) return "account.notSetUp";
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  return error ? error.message : null;
}

export async function signOut() {
  await supabase?.auth.signOut();
}

export async function fetchProfile(userId: string, email: string): Promise<Profile> {
  if (!supabase) return { id: userId, email, supporter: false };
  const { data } = await supabase.from("profiles").select("supporter").eq("id", userId).maybeSingle();
  return { id: userId, email, supporter: !!data?.supporter };
}

export async function loadCloudSave(userId: string): Promise<{ state: GameState; updatedAt: string } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("saves").select("state, updated_at").eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  const state = upgrade(data.state);
  return state ? { state, updatedAt: data.updated_at } : null;
}

export async function pushCloudSave(userId: string, state: GameState | null): Promise<boolean> {
  if (!supabase) return false;
  if (!state) {
    const { error } = await supabase.from("saves").delete().eq("user_id", userId);
    return !error;
  }
  const { error } = await supabase
    .from("saves")
    .upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
  return !error;
}

export async function submitRun(userId: string, state: GameState): Promise<boolean> {
  if (!supabase || !state.ending) return false;
  const { error } = await supabase.from("runs").insert({
    user_id: userId,
    sim_name: state.sim.name.slice(0, 20),
    trait: state.sim.trait,
    ending: state.ending.kind,
    days: state.ending.day,
    earned: Math.round(state.stats.earned),
  });
  return !error;
}

// Fastest players to reach a good ending
export async function fetchLeaderboard(ending: "japa" | "landlord", limit = 10): Promise<Run[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("runs")
    .select("sim_name, trait, ending, days, earned")
    .eq("ending", ending)
    .order("days", { ascending: true })
    .limit(limit);
  return (data as Run[] | null) ?? [];
}

export type FeedbackCategory = "bug" | "idea" | "like" | "confusing";
export type Feedback = { category: FeedbackCategory; rating: number | null; message: string; lang: string; gameDay: number };

export const APP_VERSION = "2.2.0";
const QUEUE_KEY = "eko-hustle-feedback-queue";

/** Send feedback to the game's database. Without a connection it waits on this device and is sent later. */
export async function sendFeedback(f: Feedback): Promise<"sent" | "queued"> {
  const ok = await postFeedback(f);
  if (ok) return "sent";
  try {
    const queue: Feedback[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
    localStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, f].slice(-20)));
  } catch {
    // storage blocked: nothing more we can do
  }
  return "queued";
}

/** Try again to send feedback that couldn't go out before. */
export async function flushFeedback() {
  let queue: Feedback[] = [];
  try {
    queue = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return;
  }
  if (!queue.length || !supabase) return;
  const left: Feedback[] = [];
  for (const f of queue) if (!(await postFeedback(f))) left.push(f);
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(left));
  } catch {
    // ignore
  }
}

async function postFeedback(f: Feedback): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  const { error } = await supabase.from("feedback").insert({
    user_id: data.session?.user.id ?? null,
    category: f.category,
    rating: f.rating,
    message: f.message.slice(0, 1000),
    lang: f.lang,
    game_day: f.gameDay,
    app_version: APP_VERSION,
  });
  return !error;
}

/** Everything the server keeps about you (the "download my data" button). */
export async function exportMyData(): Promise<unknown | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("export_my_data");
  return error ? null : data;
}

/** Deletes your account and its online data (payment records stay, without your id, for tax law). */
export async function deleteMyAccount(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("delete_my_account");
  if (error || !(data as { ok?: boolean } | null)?.ok) return false;
  await supabase.auth.signOut().catch(() => {});
  return true;
}
