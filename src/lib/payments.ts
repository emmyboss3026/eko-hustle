// "Supporter pack": a one-time payment through Bachs (bachs.io) that unlocks cosmetic avatars and a gold receipt.
//
// How it works (all money logic lives on the server):
// 1. The game asks our server function `bachs-checkout` for a payment page. The server sets the price and the player.
// 2. The player pays on Bachs's own checkout page (card, bank transfer, mobile money…).
// 3. Bachs tells our server function `bachs-webhook`, which checks Bachs's signature and unlocks the pack.
// 4. Bachs sends the player back to the game with ?supporter=success, and the game waits for the unlock.

import { supabase } from "./supabase";  // Supabase client

export const SUPPORTER_PRICE_NAIRA = 1_500; // keep in sync with PRICE_NAIRA in supabase/functions/_shared/bachs.ts

// Turn on with VITE_PAYMENTS_ENABLED=true once the two server functions are deployed (see the launch guide).
export const paymentsEnabled = Boolean(supabase) && import.meta.env.VITE_PAYMENTS_ENABLED === "true";  // payments need a backend and the switch turned on

export type Consent = { terms: boolean; immediate: boolean };  // what the player agreed to

// Sends the player to Bachs's checkout page. Only returns if something went wrong.
// `consent`: the two boxes the player ticked (terms, and immediate delivery so the EU withdrawal right ends).
export async function buySupporterPack(consent: Consent = { terms: true, immediate: true }): Promise<{ ok: false; message: string }> {  // start a supporter-pack purchase
  return buyProduct("supporter-pack", consent);  // same flow as any product
}

export async function buyProduct(product: string, consent: Consent): Promise<{ ok: false; message: string }> {  // start a purchase of any product
  if (!paymentsEnabled || !supabase) return { ok: false, message: "pay.notSetUp" };  // refuse when payments are not set up
  if (!consent.terms || !consent.immediate) return { ok: false, message: "pay.needConsent" };  // refuse without both consent boxes
  const { data, error } = await supabase.functions.invoke("bachs-checkout", {  // ask the server for a checkout page
    body: { returnTo: window.location.origin + "/", product, consent },  // the server sets the price, we only name the product
  });
  if (error || !data?.ok || typeof data.url !== "string" || !data.url.startsWith("https://")) {
    return { ok: false, message: data?.error ?? "pay.startFailed" };  // show the server's error or a general one
  }
  window.location.assign(data.url);  // send the player to the payment page
  return new Promise(() => {}); // the page is leaving
}

// After Bachs sends the player back: read ?supporter=success|cancel once, then clean the address bar.
export function takeReturnStatus(): "success" | "cancel" | "gems-success" | "gems-cancel" | null {  // read the result after returning from payment
  try {
    const url = new URL(window.location.href);  // the current address
    const gems = url.searchParams.get("gems");  // gem purchase flag
    const value = url.searchParams.get("supporter") ?? gems;  // supporter flag, else the gem flag
    if (value !== "success" && value !== "cancel") return null;  // ignore anything unexpected
    url.searchParams.delete("supporter");  // clean the supporter flag
    url.searchParams.delete("gems");  // clean the gems flag
    url.searchParams.delete("checkout_id");  // clean the checkout id
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);  // update the address bar without reloading
    return gems ? (`gems-${value}` as const) : value;  // tell gem and supporter results apart
  } catch {  // a bad address counts as no result
    return null;  // no result
  }
}
