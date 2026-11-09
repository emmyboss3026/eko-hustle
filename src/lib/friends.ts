// Friends, blocking and home invitations. Every call goes to a server function (see
// supabase/update-2026-11-friends.sql), which decides what is allowed. Signed-in players only.

import { supabase } from "./supabase";  // Supabase client

export type Found = { id: string; name: string; avatar: string | null; level: number };  // a player found by search
export type Friend = { id: string; name: string; avatar: string | null; status: "pending" | "accepted"; incoming: boolean; place?: string | null };  // a friend or a pending request
export type HomeInvite = { id: string; name: string; expires_at: string };  // an invitation to a home

type Result = { ok: boolean; status?: string; reason?: string };  // the usual server answer

/** Development only: with nobody signed in, the Friends app talks to a pretend server (see friendsDemo.ts) so it can be tried locally. */
let demo = false;  // demo switch for local testing
export const setFriendsDemo = (on: boolean) => { demo = import.meta.env.DEV && on; };  // turn the demo on, only in development

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T | null> {  // call a server function by name
  if (demo) return (await import("./friendsDemo")).demoCall(fn, args) as T;  // demo mode uses a pretend server
  if (!supabase) return null;  // no backend
  const { data, error } = await supabase.rpc(fn, args);  // run the server function
  return error ? null : (data as T);  // null on error
}

export const findPlayers = (name: string) => call<Found[]>("find_players", { p_name: name });  // search players by name
export const myFriends = () => call<Friend[]>("my_friends");  // my friends and requests
export const myHomeInvites = () => call<HomeInvite[]>("my_home_invites");  // my home invitations
export const requestFriend = (id: string) => call<Result>("friend_request", { p_to: id });  // send a friend request
export const respondFriend = (id: string, accept: boolean) => call<Result>("friend_respond", { p_from: id, p_accept: accept });  // accept or decline a request
export const removeFriend = (id: string) => call<Result>("friend_remove", { p_other: id });  // remove a friend
export const blockPlayer = (id: string) => call<Result>("block_player", { p_other: id });  // block a player
export const reportPlayer = (id: string, reason: string) => call<Result>("report_player", { p_other: id, p_reason: reason });  // report a player
export type Dm = { id: number; mine: boolean; body: string; created_at: string; has_audio?: boolean; audio_secs?: number | null };  // a direct message
export const sendDm = (id: string, text: string) => call<Result>("send_dm", { p_to: id, p_text: text });  // send a direct message
/** Voice notes: a short recording sent as a data URL, and fetched only when played. Presence tells friends where you are. */
export const sendVoice = (id: string, audio: string, secs: number) => call<Result>("send_voice", { p_to: id, p_audio: audio, p_secs: secs });  // send a voice note
export const dmAudio = (id: number) => call<string>("dm_audio", { p_id: id });  // fetch a voice note when played
export const touchPresence = (place: string) => call<void>("touch_presence", { p_place: place });  // tell friends where I am
export const dmThread = (id: string) => call<Dm[]>("dm_thread", { p_other: id });  // read a conversation
export const dmUnread = () => call<{ from: string; count: number }[]>("dm_unread");  // unread counts per friend
/** Your private friend code, and typing someone else's (see supabase/update-2026-11-friend-codes.sql). */
export const myFriendCode = () => call<string>("my_friend_code");  // get my friend code
export const resetFriendCode = () => call<string>("reset_friend_code");  // make a new friend code
export const addByCode = (code: string) => call<Result & { id?: string; name?: string }>("add_by_code", { p_code: code });  // add a friend by code
/** A code as people type it: letters and digits only, upper case, 8 characters. */
export const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);  // tidy a typed code
/** 8 characters shown as two groups of four, so it is easy to read out. */
export const showCode = (c: string) => (c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c);  // show a code as two groups of four
export const inviteHome = (id: string) => call<Result>("invite_home", { p_guest: id });  // invite a friend to my home
