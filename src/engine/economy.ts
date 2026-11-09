export const START_MONEY = 10_000;  // money the player starts with
export const RENT = 15_000;  // monthly-style rent amount
export const RENT_EVERY_DAYS = 7;  // days between rent payments

// Format a number as naira, e.g. 15000 → "₦15,000"
export const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");  // format a number as naira

// Is rent due at this moment? (start of day 8, 15, 22, ...)
export function rentDue(prevTime: number, newTime: number): boolean {  // true when a rent day was crossed
  const period = RENT_EVERY_DAYS * 1440; // minutes in 7 days
  return Math.floor(newTime / period) > Math.floor(prevTime / period);  // compare rent periods before and after
}