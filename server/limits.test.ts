import { expect, it } from "vitest";
import { makeLimiter } from "./limits.ts";

it("blocks after max messages and recovers next window", () => {
  let t = 0; // fake clock
  const ok = makeLimiter(3, 1000, () => t); // 3 per second
  expect([ok(), ok(), ok(), ok()]).toEqual([true, true, true, false]); // 4th is refused
  t = 1000; // a second later
  expect(ok()).toBe(true); // allowed again
});
