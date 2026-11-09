// Power Gems: bought with real money (Bachs), stored and spent ONLY on the server
// (my_gems / use_gem in supabase/update-2026-10-gems-privacy.sql). The game never decides the balance.

import { supabase } from "./supabase";  // Supabase client

export async function gemBalance(): Promise<number | null> {  // read the signed-in player's gem balance
  if (!supabase) return null;  // no backend means no balance
  const { data: s } = await supabase.auth.getSession();  // get the current login session
  if (!s.session) return null;  // signed out means no balance
  const { data, error } = await supabase.rpc("my_gems");  // ask the server for the balance
  return error ? null : Number(data ?? 0);  // return the number, or null on error
}

/** A random id for one revive, so a retry never spends two gems. */
export function newReviveRef(): string {  // make a random id for one revive
  const a = new Uint8Array(12);  // 12 random bytes
  crypto.getRandomValues(a);  // fill with random values
  return [...a].map(b => b.toString(16).padStart(2, "0")).join("");  // turn the bytes into a hex string
}

export type SpendResult = { ok: true; ref: string; balance: number } | { ok: false; reason: "no_gems" | "signin" | "network" };  // result of trying to spend a gem

export async function spendGem(ref: string): Promise<SpendResult> {  // ask the server to spend one gem
  if (!supabase) return { ok: false, reason: "network" };  // no backend
  const { data: s } = await supabase.auth.getSession();  // get the login session
  if (!s.session) return { ok: false, reason: "signin" };  // must be signed in
  const { data, error } = await supabase.rpc("use_gem", { p_ref: ref });  // server spends the gem, once per ref
  if (error || !data) return { ok: false, reason: "network" };  // network or server error
  const r = data as { ok: boolean; ref?: string; balance: number; reason?: string };  // shape of the server answer
  return r.ok ? { ok: true, ref: r.ref ?? ref, balance: r.balance } : { ok: false, reason: "no_gems" };  // success, or not enough gems
}
