// Shared settings for the Bachs payment functions.
// Secrets (set with `npx supabase secrets set ...`, never in the game code):
//   BACHS_API_KEY         sk_sandbox_... while testing, sk_live_... when live
//   BACHS_WEBHOOK_SECRET  the signing secret of your webhook endpoint (Bachs dashboard → Developer Portal → Webhooks)
//   BACHS_API_BASE        optional; https://sandbox-api.bachs.io (default) or https://api.bachs.io for live

export const PRODUCT = "supporter-pack";
export const PRICE_NAIRA = 1_500; // keep in sync with SUPPORTER_PRICE_NAIRA in src/lib/payments.ts

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
