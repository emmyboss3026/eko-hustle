// Receives payment events from Bachs and unlocks the supporter pack.
// Deploy WITHOUT Supabase login checks (Bachs calls it, not a player):
//   npx supabase functions deploy bachs-webhook --no-verify-jwt
// Then add this URL as a webhook in Bachs: https://<project-ref>.supabase.co/functions/v1/bachs-webhook

import { createClient } from "npm:@supabase/supabase-js@2";
import { bachs, json, PRODUCTS, supabaseKey } from "../_shared/bachs.ts";

const TOLERANCE_SECONDS = 300;

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Bachs signs "{timestamp}.{raw_body}" with HMAC-SHA256 (hex).
// Headers: X-Bachs-Timestamp + X-Bachs-Signature, or X-Bachs-Signature-V2: "t=...,v1=...,v1=..."
async function verify(req: Request, raw: string): Promise<boolean> {
  const secret = Deno.env.get("BACHS_WEBHOOK_SECRET");
  if (!secret) return false;
  let timestamp = req.headers.get("X-Bachs-Timestamp") ?? "";
  let candidates = [req.headers.get("X-Bachs-Signature") ?? ""];
  const v2 = req.headers.get("X-Bachs-Signature-V2");
  if (v2) {
    const parts = v2.split(",").map(p => p.trim());
    timestamp = parts.find(p => p.startsWith("t="))?.slice(2) ?? timestamp;
    candidates = parts.filter(p => p.startsWith("v1=")).map(p => p.slice(3));
  }
  const t = parseInt(timestamp, 10);
  if (!Number.isFinite(t) || Math.abs(Date.now() / 1000 - t) > TOLERANCE_SECONDS) return false;
  const expected = await hmacHex(secret, `${t}.${raw}`);
  return candidates.some(c => c && safeEqual(expected, c.toLowerCase()));
}

Deno.serve(async req => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const raw = await req.text(); // raw body first, before parsing
  if (!(await verify(req, raw))) return json({ ok: false, error: "Bad signature" }, 400);

  let event: { type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "Bad JSON" }, 400);
  }

  const paid =
    (event.type === "checkout.completed" && event.data?.status === "completed") ||
    (event.type === "collection.succeeded" && String(event.data?.status).toUpperCase() === "SUCCEEDED");
  if (!paid) return json({ ok: true, ignored: event.type }); // other events: acknowledge and ignore

  const checkoutId = String(event.data?.checkout_id ?? "");
  if (!checkoutId.startsWith("chk_")) return json({ ok: true, ignored: "no checkout" });

  // The player id lives in the checkout's metadata, which only our server could set.
  let metadata = event.data?.metadata as Record<string, string> | undefined;
  if (!metadata?.user_id) {
    const s = await bachs(`/v1/checkout-sessions/${encodeURIComponent(checkoutId)}`);
    if (!s.ok) return json({ ok: false, error: "Couldn't read checkout" }, 502); // 5xx → Bachs retries
    metadata = s.body?.metadata;
  }
  const product = metadata?.product ? PRODUCTS[metadata.product] : undefined;
  if (!product || !metadata?.user_id) return json({ ok: true, ignored: "other product" });

  const amount = Number(event.data?.amount ?? product.naira);
  // Paid less than the price? Don't deliver (and log it for a look).
  if (Number.isFinite(amount) && amount + 0.01 < product.naira) {
    console.error("Underpaid", checkoutId, amount, product.naira);
    return json({ ok: true, ignored: "amount" });
  }
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, supabaseKey("secret"));

  // Record once (checkout id is the primary key), then deliver. Both are safe to repeat.
  const { error: payErr } = await admin
    .from("payments")
    .upsert(
      { reference: checkoutId, user_id: metadata.user_id, amount_kobo: Math.round(amount * 100), product: metadata.product },
      { onConflict: "reference", ignoreDuplicates: true },
    );
  const { error: deliverErr } = product.gems
    ? await admin.rpc("grant_gems", { p_user: metadata.user_id, p_amount: product.gems, p_reference: checkoutId })
    : await admin.from("profiles").update({ supporter: true }).eq("id", metadata.user_id);
  if (payErr || deliverErr) {
    console.error("Delivery failed", payErr?.message, deliverErr?.message);
    return json({ ok: false }, 500); // Bachs retries
  }
  return json({ ok: true });
});
