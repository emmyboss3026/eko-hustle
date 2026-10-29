// Power Gems: bought with real money (Bachs), stored and spent ONLY on the server
// (my_gems / use_gem in supabase/update-2026-10-gems-privacy.sql). The game never decides the balance.

import { supabase } from "./supabase";

export async function gemBalance(): Promise<number | null> {
  if (!supabase) return null;
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data, error } = await supabase.rpc("my_gems");
  return error ? null : Number(data ?? 0);
}

/** A random id for one revive, so a retry never spends two gems. */
export function newReviveRef(): string {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return [...a].map(b => b.toString(16).padStart(2, "0")).join("");
}

export type SpendResult = { ok: true; ref: string; balance: number } | { ok: false; reason: "no_gems" | "signin" | "network" };

export async function spendGem(ref: string): Promise<SpendResult> {
  if (!supabase) return { ok: false, reason: "network" };
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return { ok: false, reason: "signin" };
  const { data, error } = await supabase.rpc("use_gem", { p_ref: ref });
  if (error || !data) return { ok: false, reason: "network" };
  const r = data as { ok: boolean; ref?: string; balance: number; reason?: string };
  return r.ok ? { ok: true, ref: r.ref ?? ref, balance: r.balance } : { ok: false, reason: "no_gems" };
}
