// Pure payment checks (no Deno APIs) so vitest can test them. Used by bachs-webhook.

export type Product = { naira: number; gems?: number; label: string };

// Decides if a signed "paid" event may deliver a product. Returns the reason when it may not.
export function checkPayment(
  event: { data?: Record<string, unknown> },
  metadata: Record<string, string> | undefined,
  products: Record<string, Product>,
): { ok: true; product: Product; userId: string; productId: string; amount: number } | { ok: false; reason: string } {
  const productId = metadata?.product ?? ""; // product id set by our checkout function
  if (!Object.hasOwn(products, productId)) return { ok: false, reason: "unknown product" }; // not one of ours
  const userId = metadata?.user_id ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { ok: false, reason: "bad user" }; // must be a uuid
  const product = products[productId];
  const raw = event.data?.amount; // never fall back to the price: no amount = no delivery
  const amount = typeof raw === "number" || (typeof raw === "string" && raw.trim() !== "") ? Number(raw) : NaN;
  if (!Number.isFinite(amount)) return { ok: false, reason: "no valid amount" }; // missing, NaN or Infinity
  const currency = String(event.data?.currency ?? "").toUpperCase(); // payments here are Naira only
  if (currency !== "NGN") return { ok: false, reason: "currency" };
  if (amount + 0.01 < product.naira) return { ok: false, reason: "underpaid" }; // paid less than the price
  return { ok: true, product, userId, productId, amount };
}
