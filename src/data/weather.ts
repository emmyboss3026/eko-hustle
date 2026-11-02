// Weather: some days it rains in the afternoon. It is the same for everyone on the same day, so nobody needs a weather server.

export type Weather = { raining: boolean; strength: number };   // strength 0 to 1: how hard it is coming down

/** Is it a rainy day? About one day in four. */
export const rainyDay = (day: number) => (Math.imul(day + 7, 2654435761) >>> 0) % 4 === 0;

const RAIN_FROM = 13, RAIN_TO = 20;   // hours

/** The weather at an in-game time (minutes since day 1, 00:00). Rain builds up for an hour, pours, then eases off. */
export function weatherAt(time: number): Weather {
  const day = Math.floor(time / 1440) + 1;
  const hour = (time % 1440) / 60;
  if (!rainyDay(day) || hour < RAIN_FROM || hour >= RAIN_TO) return { raining: false, strength: 0 };
  const ramp = Math.min(1, (hour - RAIN_FROM) / 1, (RAIN_TO - hour) / 1.5);
  return { raining: ramp > 0.02, strength: Math.max(0, ramp) };
}
