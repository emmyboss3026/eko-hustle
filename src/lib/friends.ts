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
export const inviteHome = (id: string) => call<Result>("invite_home", { p_guest: id });
