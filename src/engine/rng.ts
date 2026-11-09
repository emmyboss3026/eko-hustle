// Repeatable random numbers. The rules must stay testable (same input → same result), so
// things that change by themselves every day (fund prices, business takings, invitations)
// use a number made from the save's seed, the day and a label instead of Math.random().

/** A whole number from any text (FNV-1a). */
export function hash(text: string): number {  // turn text into a whole number
  let h = 2166136261;  // FNV-1a starting value
  for (let i = 0; i < text.length; i++) {  // go through every character
    h ^= text.charCodeAt(i);  // mix the character in
    h = Math.imul(h, 16777619);  // multiply by the FNV prime
  }
  return h >>> 0;  // make it a positive 32-bit number
}

/** A repeatable number from 0 (inclusive) to 1 (exclusive). */
export function rand(seed: number, ...parts: (string | number)[]): number {  // repeatable random number from a seed and labels
  let x = hash(`${seed}|${parts.join("|")}`) || 1;  // start value from the seed and labels
  // xorshift32, a few rounds to spread the bits
  for (let i = 0; i < 3; i++) {  // a few rounds to spread the bits
    x ^= x << 13;  // shift left and mix
    x ^= x >>> 17;  // shift right and mix
    x ^= x << 5;  // shift left and mix again
    x >>>= 0;  // keep it a positive 32-bit number
  }
  return x / 4294967296;  // scale to 0 up to (not including) 1
}

/** A repeatable bell-curve number (mean 0, spread 1). */
export function randNormal(seed: number, ...parts: (string | number)[]): number {  // repeatable bell-curve random number
  const u = Math.max(1e-9, rand(seed, ...parts, "a"));  // first uniform number, never zero
  const v = rand(seed, ...parts, "b");  // second uniform number
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);  // Box-Muller turns two uniform numbers into a normal one
}
