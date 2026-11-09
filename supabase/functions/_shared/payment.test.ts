import { describe, expect, it } from "vitest";
import { checkPayment } from "./payment";

const products = { "gems-5": { naira: 1200, gems: 5, label: "5 Power Gems" } }; // sample catalogue
const uid = "123e4567-e89b-12d3-a456-426614174000"; // sample user id
const meta = { user_id: uid, product: "gems-5" }; // metadata our checkout sets
const ev = (data: Record<string, unknown>) => ({ data: { currency: "NGN", amount: 1200, ...data } }); // build an event

describe("checkPayment", () => {
  it("accepts a correct payment", () => expect(checkPayment(ev({}), meta, products).ok).toBe(true));
  it("accepts a string amount", () => expect(checkPayment(ev({ amount: "1200.00" }), meta, products).ok).toBe(true));
  it("accepts an overpayment", () => expect(checkPayment(ev({ amount: 5000 }), meta, products).ok).toBe(true));
  it("rejects a missing amount", () => expect(checkPayment(ev({ amount: undefined }), meta, products).ok).toBe(false));
  it("rejects null, empty, NaN and Infinity amounts", () => {
    for (const amount of [null, "", "abc", NaN, Infinity]) expect(checkPayment(ev({ amount }), meta, products).ok).toBe(false);
  });
  it("rejects underpayment", () => expect(checkPayment(ev({ amount: 1199 }), meta, products).ok).toBe(false));
  it("rejects a wrong or missing currency", () => {
    expect(checkPayment(ev({ currency: "USD" }), meta, products).ok).toBe(false);
    expect(checkPayment(ev({ currency: undefined }), meta, products).ok).toBe(false);
  });
  it("rejects unknown or inherited product names", () => {
    expect(checkPayment(ev({}), { ...meta, product: "gems-999" }, products).ok).toBe(false);
    expect(checkPayment(ev({}), { ...meta, product: "toString" }, products).ok).toBe(false);
  });
  it("rejects missing metadata and bad user ids", () => {
    expect(checkPayment(ev({}), undefined, products).ok).toBe(false);
    expect(checkPayment(ev({}), { ...meta, user_id: "not-a-uuid" }, products).ok).toBe(false);
  });
});
