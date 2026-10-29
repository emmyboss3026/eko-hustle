// Shared settings for the Bachs payment functions.
// Secrets (set with `npx supabase secrets set ...`, never in the game code):
//   BACHS_API_KEY         sk_sandbox_... while testing, sk_live_... when live
//   BACHS_WEBHOOK_SECRET  the signing secret of your webhook endpoint (Bachs dashboard → Developer Portal → Webhooks)
//   BACHS_API_BASE        optional; https://sandbox-api.bachs.io (default) or https://api.bachs.io for live

// Everything the game sells. The SERVER's prices are the ones that count: the game only says which
// product the player picked. Keep in step with src/lib/payments.ts and src/data/revive.ts.
export const PRODUCTS: Record<string, { naira: number; gems?: number; label: string }> = {
  "supporter-pack": { naira: 1_500, label: "Eko Hustle supporter pack" },
  "gems-1": { naira: 300, gems: 1, label: "1 Power Gem" },
  "gems-5": { naira: 1_200, gems: 5, label: "5 Power Gems" },
  "gems-12": { naira: 2_500, gems: 12, label: "12 Power Gems" },
};

// Older name, still used by the supporter pack code
export const PRODUCT = "supporter-pack";
export const PRICE_NAIRA = PRODUCTS[PRODUCT].naira;

export const apiBase = () => (Deno.env.get("BACHS_API_BASE") ?? "https://sandbox-api.bachs.io").replace(/\/+$/, "");

export async function bachs(path: string, init: RequestInit = {}) {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${Deno.env.get("BACHS_API_KEY")}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

// Works with both the new keys (sb_publishable_/sb_secret_) and the legacy anon/service_role keys
export function supabaseKey(kind: "public" | "secret"): string {
  const [legacy, modern] =
    kind === "public"
      ? ["SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEYS"]
      : ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEYS"];
  const old = Deno.env.get(legacy);
  if (old) return old;
  try {
    return JSON.parse(Deno.env.get(modern) ?? "{}").default ?? "";
  } catch {
    return "";
  }
}

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
