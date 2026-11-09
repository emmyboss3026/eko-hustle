// Per-connection message limiter: allows `max` messages per `windowMs`, then says no.
export function makeLimiter(max: number, windowMs: number, now: () => number = Date.now) {
  let start = now(); // when the current window began
  let count = 0; // messages seen in this window
  return () => {
    const t = now(); // current time
    if (t - start >= windowMs) { start = t; count = 0; } // new window: start counting again
    return ++count <= max; // false once the window is full
  };
}
