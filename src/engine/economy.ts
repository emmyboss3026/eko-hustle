export const START_MONEY = 10_000;
export const RENT = 15_000;
export const RENT_EVERY_DAYS = 7;

// Format a number as naira, e.g. 15000 → "₦15,000"
export const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");

// Is rent due at this moment? (start of day 8, 15, 22, ...)
export function rentDue(prevTime: number, newTime: number): boolean {
  const period = RENT_EVERY_DAYS * 1440; // minutes in 7 days
  return Math.floor(newTime / period) > Math.floor(prevTime / period);
}