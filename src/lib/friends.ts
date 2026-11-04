// Friends, blocking and home invitations. Every call goes to a server function (see
// supabase/update-2026-11-friends.sql), which decides what is allowed. Signed-in players only.

import { supabase } from "./supabase";

export type Found = { id: string; name: string; avatar: string | null; level: number };
export type Friend = { id: string; name: string; avatar: string | null; status: "pending" | "accepted"; incoming: boolean };
export type HomeInvite = { id: string; name: string; expires_at: string };

type Result = { ok: boolean; status?: string; reason?: string };

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc(fn, args);
  return error ? null : (data as T);
}

export const findPlayers = (name: string) => call<Found[]>("find_players", { p_name: name });
export const myFriends = () => call<Friend[]>("my_friends");
export const myHomeInvites = () => call<HomeInvite[]>("my_home_invites");
export const requestFriend = (id: string) => call<Result>("friend_request", { p_to: id });
export const respondFriend = (id: string, accept: boolean) => call<Result>("friend_respond", { p_from: id, p_accept: accept });
export const removeFriend = (id: string) => call<Result>("friend_remove", { p_other: id });
export const blockPlayer = (id: string) => call<Result>("block_player", { p_other: id });
export const reportPlayer = (id: string, reason: string) => call<Result>("report_player", { p_other: id, p_reason: reason });
export type Dm = { id: number; mine: boolean; body: string; created_at: string };
export const sendDm = (id: string, text: string) => call<Result>("send_dm", { p_to: id, p_text: text });
export const dmThread = (id: string) => call<Dm[]>("dm_thread", { p_other: id });
export const dmUnread = () => call<{ from: string; count: number }[]>("dm_unread");
/** Your private friend code, and typing someone else's (see supabase/update-2026-11-friend-codes.sql). */
export const myFriendCode = () => call<string>("my_friend_code");
export const resetFriendCode = () => call<string>("reset_friend_code");
export const addByCode = (code: string) => call<Result & { id?: string; name?: string }>("add_by_code", { p_code: code });
/** A code as people type it: letters and digits only, upper case, 8 characters. */
export const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
/** 8 characters shown as two groups of four, so it is easy to read out. */
export const showCode = (c: string) => (c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c);
export const inviteHome = (id: string) => call<Result>("invite_home", { p_guest: id });
