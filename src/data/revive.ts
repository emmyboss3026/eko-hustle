// Coming back after you collapse. Two ways, both chosen freely on the hospital screen:
//   📺 watch one rewarded ad (free, a few times per life), or
//   💎 use a Power Gem (bought with real money through Bachs; the balance lives on the server).
// There is never a countdown or pressure: "End this life" is always one tap away.

export const REVIVE = {
  ad: { health: 45, needsAtLeast: 40, hospitalHours: 6, bill: 3_000, perLife: 3 },
  gem: { health: 100, needsAtLeast: 80, hospitalHours: 2, bill: 0, perLife: Infinity },
} as const;

export type ReviveHow = keyof typeof REVIVE;

// Power Gem packs. Prices in naira, charged once (no subscription). Keep in step with
// GEM_PACKS in supabase/functions/_shared/bachs.ts — the server's prices are the ones that count.
export const GEM_PACKS = [
  { id: "gems-1", gems: 1, price: 300 },
  { id: "gems-5", gems: 5, price: 1_200 },
  { id: "gems-12", gems: 12, price: 2_500 },
] as const;

export type GemPackId = (typeof GEM_PACKS)[number]["id"];
