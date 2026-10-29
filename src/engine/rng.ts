// Repeatable random numbers. The rules must stay testable (same input → same result), so
// things that change by themselves every day (fund prices, business takings, invitations)
// use a number made from the save's seed, the day and a label instead of Math.random().

/** A whole number from any text (FNV-1a). */
export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A repeatable number from 0 (inclusive) to 1 (exclusive). */
export function rand(seed: number, ...parts: (string | number)[]): number {
  let x = hash(`${seed}|${parts.join("|")}`) || 1;
  // xorshift32, a few rounds to spread the bits
  for (let i = 0; i < 3; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
  }
  return x / 4294967296;
}

/** A repeatable bell-curve number (mean 0, spread 1). */
export function randNormal(seed: number, ...parts: (string | number)[]): number {
  const u = Math.max(1e-9, rand(seed, ...parts, "a"));
  const v = rand(seed, ...parts, "b");
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
