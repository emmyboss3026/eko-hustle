// Creates a Bachs checkout for the signed-in player and returns the payment page link.
// Deploy: npx supabase functions deploy bachs-checkout

import { createClient } from "npm:@supabase/supabase-js@2";
import { bachs, cors, json, PRODUCTS, supabaseKey } from "../_shared/bachs.ts";

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Use POST" }, 405);

  // 1. Who is buying? (the player's login token)
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const asPlayer = createClient(supabaseUrl, supabaseKey("public"), {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data } = await asPlayer.auth.getUser();
  const user = data.user;
  if (!user?.email) return json({ ok: false, error: "Sign in first." }, 401);

  // 2. What they're buying, that they agreed to the terms, and where to send them afterwards (only our own site)
  const body = await req.json().catch(() => ({}));
  const { returnTo } = body;
  const productId = typeof body.product === "string" && body.product in PRODUCTS ? body.product : "supporter-pack";
  const product = PRODUCTS[productId];
  // The player must tick both boxes in the game: terms + immediate delivery (EU withdrawal waiver)
  if (body.consent?.terms !== true || body.consent?.immediate !== true) {
    return json({ ok: false, error: "Please accept the terms first." }, 400);
  }
  let origin: string;
  try {
    origin = new URL(String(returnTo)).origin;
  } catch {
    return json({ ok: false, error: "Bad return address." }, 400);
  }
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map(s => s.trim()).filter(Boolean);
  if (allowed.length > 0 && !allowed.includes(origin)) return json({ ok: false, error: "Return address not allowed." }, 400);

  // 3. Create the checkout. The price and the player are set HERE, on the server, so nobody can change them.
  const kind = product.gems ? "gems" : "supporter";
  const res = await bachs("/v1/checkout-sessions", {
    method: "POST",
    body: JSON.stringify({
      pricing: { currency: "NGN", amount: product.naira.toFixed(2) },
      customer: { email: user.email },
      description: product.label,
      success_url: `${origin}/?${kind}=success`,
      cancel_url: `${origin}/?${kind}=cancel`,
      reference: `${kind === "gems" ? "gm" : "sp"}_${user.id}_${Date.now()}`.slice(0, 128),
      // Kept with the payment as proof of what the player agreed to, and when
      metadata: { user_id: user.id, product: productId, consent_at: new Date().toISOString(), consent_version: "2026-10-29" },
      expires_in_minutes: 60,
    }),
  });
  if (!res.ok || !res.body?.checkout_url) {
    console.error("Bachs checkout failed", res.status, JSON.stringify(res.body));
    return json({ ok: false, error: "Couldn't start the payment. Try again later." }, 502);
  }
  return json({ ok: true, url: res.body.checkout_url, checkoutId: res.body.checkout_id });
});
