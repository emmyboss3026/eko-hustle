// "Supporter pack": a one-time payment through Bachs (bachs.io) that unlocks cosmetic avatars and a gold receipt.
//
// How it works (all money logic lives on the server):
// 1. The game asks our server function `bachs-checkout` for a payment page. The server sets the price and the player.
// 2. The player pays on Bachs's own checkout page (card, bank transfer, mobile money…).
// 3. Bachs tells our server function `bachs-webhook`, which checks Bachs's signature and unlocks the pack.
// 4. Bachs sends the player back to the game with ?supporter=success, and the game waits for the unlock.

import { supabase } from "./supabase";

export const SUPPORTER_PRICE_NAIRA = 1_500; // keep in sync with PRICE_NAIRA in supabase/functions/_shared/bachs.ts

// Turn on with VITE_PAYMENTS_ENABLED=true once the two server functions are deployed (see the launch guide).
export const paymentsEnabled = Boolean(supabase) && import.meta.env.VITE_PAYMENTS_ENABLED === "true";

// Sends the player to Bachs's checkout page. Only returns if something went wrong.
export async function buySupporterPack(): Promise<{ ok: false; message: string }> {
  if (!paymentsEnabled || !supabase) return { ok: false, message: "Payments are not set up yet." };
  const { data, error } = await supabase.functions.invoke("bachs-checkout", {
    body: { returnTo: window.location.origin + "/" },
  });
  if (error || !data?.ok || typeof data.url !== "string" || !data.url.startsWith("https://")) {
    return { ok: false, message: data?.error ?? "Couldn't start the payment. Check your connection and try again." };
  }
  window.location.assign(data.url);
  return new Promise(() => {}); // the page is leaving
}

// After Bachs sends the player back: read ?supporter=success|cancel once, then clean the address bar.
export function takeReturnStatus(): "success" | "cancel" | null {
  try {
    const url = new URL(window.location.href);
    const value = url.searchParams.get("supporter");
    if (value !== "success" && value !== "cancel") return null;
    url.searchParams.delete("supporter");
    url.searchParams.delete("checkout_id");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    return value;
  } catch {
    return null;
  }
}
