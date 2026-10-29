// Daily login rewards: a 7-day calendar that starts again after day 7.
// One missed day is forgiven (the streak carries on), so nobody has to log in every single day.
// Keep the amounts in step with daily_reward_for() in supabase/schema.sql.
//
// Why these amounts: a first shift pays about ₦6,000 and rent is ₦15,000 a week. A full week of
// logging in pays ₦26,500 (about four shifts), a nice help without replacing work.

export const DAILY_REWARDS = [1_000, 1_500, 2_000, 3_000, 4_000, 5_000, 10_000];
export const rewardFor = (day: number) => DAILY_REWARDS[Math.max(1, Math.min(7, day)) - 1];
/** Days you can miss without losing your streak (1 = you can skip one day). */
export const GRACE_DAYS = 1;
