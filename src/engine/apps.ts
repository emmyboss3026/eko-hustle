// The phone's extra apps: the arcade (mini-games with small daily prizes) and Gram (post, gain followers, win sponsors).
// Pure rules, like the rest of the engine. Scores come from the browser, so prizes are small and capped each day.

import type { GameState } from "./game";
import type { Kit } from "./phone";
import { addRep } from "./phone";
import { dayNumber } from "./progress";

export type AppsCommand =
  | { type: "arcade"; game: string; score: number }
  | { type: "gramPost"; caption: number };

export type ArcadeGame = "memory" | "maths" | "rush" | "ludo" | "chess" | "checkers" | "sudoku" | "snake" | "g2048";
export const ARCADE_GAMES: ArcadeGame[] = ["ludo", "snake", "sudoku", "chess", "checkers", "g2048", "memory", "maths", "rush"];
export const ARCADE_PAID_PLAYS = 2;      // paid plays per game per day; more is just for fun
export const ARCADE_TOP_PRIZE = 1_000;   // for a perfect score (100)
const isGame = (g: unknown): g is ArcadeGame => ARCADE_GAMES.includes(g as ArcadeGame);

export const arcadeLeft = (s: GameState, game: ArcadeGame) =>
  Math.max(0, ARCADE_PAID_PLAYS - (s.arcade?.day === dayNumber(s) ? (s.arcade.plays[game] ?? 0) : 0));

/** The prize for a score from 0 to 100, in naira (0 once today's paid plays are used up). */
export function arcadePrize(s: GameState, game: ArcadeGame, score: number): number {
  if (arcadeLeft(s, game) <= 0) return 0;
  const f = Math.max(0, Math.min(100, Math.round(Number(score) || 0))) / 100;
  return Math.round((f * ARCADE_TOP_PRIZE) / 50) * 50;
}

export const GRAM_MILESTONES: { followers: number; prize: number }[] = [
  { followers: 50, prize: 10_000 },
  { followers: 200, prize: 30_000 },
  { followers: 500, prize: 80_000 },
];

/** Followers gained by one post: more with a good reputation and a good mood. */
export const gramGain = (s: GameState) => 3 + Math.floor((s.rep ?? 0) / 5) + (s.needs.fun >= 60 ? 2 : 0);
export const gramPostedToday = (s: GameState) => s.gram?.lastPost === dayNumber(s);

export function appsStep(s: GameState, cmd: AppsCommand, kit: Kit): GameState {
  switch (cmd.type) {
    case "arcade": {
      if (!isGame(cmd.game)) return s;
      const prize = arcadePrize(s, cmd.game, cmd.score);
      const day = dayNumber(s);
      const plays = s.arcade?.day === day ? s.arcade.plays : {};
      let next: GameState = { ...s, arcade: { day, plays: { ...plays, [cmd.game]: (plays[cmd.game] ?? 0) + 1 } } };
      if (prize > 0) next = kit.pay(next, prize, "other", cmd.game);
      return kit.passTime(next, 15, { fun: 18 });
    }

    case "gramPost": {
      if (gramPostedToday(s)) return s;
      const day = dayNumber(s);
      const old = s.gram ?? { followers: 0, posts: 0, lastPost: -1, paid: [] as number[] };
      const followers = old.followers + gramGain(s) + (cmd.caption === 0 ? 1 : 0);
      let next: GameState = { ...s, gram: { ...old, followers, posts: old.posts + 1, lastPost: day } };
      next = addRep(next, 1);
      for (const m of GRAM_MILESTONES) {
        if (followers >= m.followers && !old.paid.includes(m.followers)) {
          next = kit.pay({ ...next, gram: { ...next.gram!, paid: [...next.gram!.paid, m.followers] } }, m.prize, "other", "Gram");
          next = kit.say(next, `📸 ${m.followers}`);
        }
      }
      return kit.passTime(next, 10, { social: 12 });
    }
  }
}
