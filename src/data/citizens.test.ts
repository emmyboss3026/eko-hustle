import { describe, expect, it } from "vitest";
import { CITIZEN_COUNT_PLAIN, CITIZEN_OUTFITS, CITIZEN_STATURES, citizenLook } from "./citizens";

// The multiplayer server (server/city.ts cleanLook) keeps at most 12 keys with values matching ^[#\w-]{1,16}$.
describe("citizen looks stay multiplayer-safe", () => {
  it("every look passes the server's filter unchanged", () => {
    for (let n = 1; n <= CITIZEN_COUNT_PLAIN; n++) {
      const look = { ...citizenLook(n), model: "citizen", style: CITIZEN_OUTFITS[0], stature: CITIZEN_STATURES[0] } as Record<string, unknown>;
      const entries = Object.entries(look);
      expect(entries.length).toBeLessThanOrEqual(12);
      for (const [k, v] of entries) {
        expect(k).toMatch(/^[a-zA-Z]{1,16}$/);
        expect(v).toMatch(/^[#\w-]{1,16}$/);
      }
    }
  });
  it("all outfit shapes and statures fit too", () => {
    for (const v of [...CITIZEN_OUTFITS, ...CITIZEN_STATURES]) expect(v).toMatch(/^[#\w-]{1,16}$/);
  });
});
