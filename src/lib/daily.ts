// Daily login rewards.
// Signed in: the server decides (its own clock, one claim per account per Lagos day), see
//   daily_status() and claim_daily_reward() in supabase/schema.sql.
// Not signed in (or the database isn't updated yet): this device's clock is used instead.
//   That can't be checked by anyone, so it's only a fallback.

import { supabase } from "./supabase";
import { GRACE_DAYS, rewardFor } from "../data/daily";

export type DailyStatus = {
  server: boolean;          // true: checked by the server
  canClaim: boolean;
  nextDay: number;          // the streak day you'll get next (1–7)
  nextAmount: number;
  lastDay: number | null;   // the last streak day you claimed
  today: string;            // YYYY-MM-DD in Lagos
  resetsAt: number;         // when the next reward unlocks (ms since 1970, this device's clock)
  history: { date: string; day: number; amount: number }[];
};

export type ClaimResult = { claimed: boolean; id: string; day: number; amount: number; server: boolean } | { error: string };

const LOCAL_KEY = "eko-hustle-daily";

/** Today's date in Lagos, e.g. "2026-10-29". */
export function lagosDate(ms = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
}

/** Midnight at the start of tomorrow in Lagos (Lagos is UTC+1 all year). */
export function nextLagosMidnight(ms = Date.now()): number {
  const [y, m, d] = lagosDate(ms).split("-").map(Number);
  return Date.UTC(y, m - 1, d + 1, 0, 0, 0) - 60 * 60 * 1000;
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/** The streak day after `last` claimed on `lastDate`, if you claim on `today`. */
export function nextStreakDay(lastDate: string | null, lastDay: number | null, today: string): number {
  if (!lastDate || !lastDay) return 1;
  const gap = daysBetween(lastDate, today);
  if (gap <= 0) return (lastDay % 7) + 1;
  return gap <= 1 + GRACE_DAYS ? (lastDay % 7) + 1 : 1;
}

type Local = { history: { date: string; day: number; amount: number }[] };

function readLocal(): Local {
  try {
    const v = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "null");
    if (v && Array.isArray(v.history)) return v;
  } catch {
    // blocked or broken storage
  }
  return { history: [] };
}

function writeLocal(l: Local) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ history: l.history.slice(-30) }));
  } catch {
    // ignore
  }
}

function localStatus(): DailyStatus {
  const l = readLocal();
  const today = lagosDate();
  const last = l.history.at(-1) ?? null;
  const nextDay = nextStreakDay(last?.date ?? null, last?.day ?? null, today);
  return {
    server: false,
    canClaim: last?.date !== today,
    nextDay,
    nextAmount: rewardFor(nextDay),
    lastDay: last?.day ?? null,
    today,
    resetsAt: nextLagosMidnight(),
    history: [...l.history].reverse(),
  };
}

type ServerStatus = { today: string; can_claim: boolean; last_day: number | null; next_day: number; next_amount: number; server_now: string; resets_at: string };

async function signedIn() {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function getDailyStatus(): Promise<DailyStatus> {
  if (!(await signedIn())) return localStatus();
  const { data, error } = await supabase!.rpc("daily_status");
  if (error || !data) return localStatus(); // database not updated yet: fall back
  const st = data as ServerStatus;
  // The server's clock decides; turn its reset time into this device's clock for the countdown.
  const offset = Date.parse(st.server_now) - Date.now();
  const { data: rows } = await supabase!.from("daily_claims").select("claim_date, streak_day, amount").order("claim_date", { ascending: false }).limit(14);
  return {
    server: true,
    canClaim: st.can_claim,
    nextDay: st.next_day,
    nextAmount: st.next_amount,
    lastDay: st.last_day,
    today: st.today,
    resetsAt: Date.parse(st.resets_at) - offset,
    history: ((rows ?? []) as { claim_date: string; streak_day: number; amount: number }[]).map(r => ({ date: r.claim_date, day: r.streak_day, amount: r.amount })),
  };
}

export async function claimDaily(): Promise<ClaimResult> {
  if (await signedIn()) {
    const { data, error } = await supabase!.rpc("claim_daily_reward");
    if (!error && data) {
      const r = data as { claimed: boolean; date: string; day: number; amount: number };
      return { claimed: r.claimed, id: `srv-${r.date}`, day: r.day, amount: r.amount, server: true };
    }
    if (error && !/function|schema cache|does not exist/i.test(error.message)) return { error: "daily.err.server" };
    // the database hasn't been updated yet: use this device
  }
  const st = localStatus();
  if (!st.canClaim) return { claimed: false, id: `loc-${st.today}`, day: st.lastDay ?? 1, amount: 0, server: false };
  const l = readLocal();
  writeLocal({ history: [...l.history, { date: st.today, day: st.nextDay, amount: st.nextAmount }] });
  return { claimed: true, id: `loc-${st.today}`, day: st.nextDay, amount: st.nextAmount, server: false };
}
