// The phone's extra apps: the arcade (mini-games with small daily prizes) and Gram (post, gain followers, win sponsors).
// Pure rules, like the rest of the engine. Scores come from the browser, so prizes are small and capped each day.

import type { GameState } from "./game";  // game state type
import type { Kit } from "./phone";  // helpers the phone provides
import { addRep } from "./phone";  // reputation helper
import { dayNumber } from "./progress";  // current day number

export type AppsCommand =  // commands the extra apps accept
  | { type: "arcade"; game: string; score: number }  // finish an arcade game with a score
  | { type: "gramPost"; caption: number };  // post on Gram with a caption

export type ArcadeGame = "memory" | "maths" | "rush" | "ludo" | "chess" | "checkers" | "sudoku" | "snake" | "g2048";  // the mini-games
export const ARCADE_GAMES: ArcadeGame[] = ["ludo", "snake", "sudoku", "chess", "checkers", "g2048", "memory", "maths", "rush"];  // order shown in the arcade
export const ARCADE_PAID_PLAYS = 2;      // paid plays per game per day; more is just for fun
export const ARCADE_TOP_PRIZE = 1_000;   // for a perfect score (100)
const isGame = (g: unknown): g is ArcadeGame => ARCADE_GAMES.includes(g as ArcadeGame);  // check a name is a real game

export const arcadeLeft = (s: GameState, game: ArcadeGame) =>  // paid plays left today
  Math.max(0, ARCADE_PAID_PLAYS - (s.arcade?.day === dayNumber(s) ? (s.arcade.plays[game] ?? 0) : 0));  // limit minus today's plays

/** The prize for a score from 0 to 100, in naira (0 once today's paid plays are used up). */
export function arcadePrize(s: GameState, game: ArcadeGame, score: number): number {  // prize in naira for a score
  if (arcadeLeft(s, game) <= 0) return 0;  // no prize once the paid plays are used
  const f = Math.max(0, Math.min(100, Math.round(Number(score) || 0))) / 100;  // score as a fraction from 0 to 1
  return Math.round((f * ARCADE_TOP_PRIZE) / 50) * 50;  // round to the nearest 50 naira
}

export const GRAM_MILESTONES: { followers: number; prize: number }[] = [  // follower goals with prizes
  { followers: 50, prize: 10_000 },  // first goal
  { followers: 200, prize: 30_000 },  // second goal
  { followers: 500, prize: 80_000 },  // third goal
];

/** Followers gained by one post: more with a good reputation and a good mood. */
export const gramGain = (s: GameState) => 3 + Math.floor((s.rep ?? 0) / 5) + (s.needs.fun >= 60 ? 2 : 0);  // followers from one post
export const gramPostedToday = (s: GameState) => s.gram?.lastPost === dayNumber(s);  // true if already posted today

export function appsStep(s: GameState, cmd: AppsCommand, kit: Kit): GameState {  // apply an apps command to the game
  switch (cmd.type) {
    case "arcade": {  // an arcade game ended
      if (!isGame(cmd.game)) return s;  // ignore unknown games
      const prize = arcadePrize(s, cmd.game, cmd.score);  // prize for this score
      const day = dayNumber(s);  // today's number
      const plays = s.arcade?.day === day ? s.arcade.plays : {};  // today's play counts, or a fresh set
      let next: GameState = { ...s, arcade: { day, plays: { ...plays, [cmd.game]: (plays[cmd.game] ?? 0) + 1 } } };  // count this play
      if (prize > 0) next = kit.pay(next, prize, "other", cmd.game);  // pay the prize if there is one
      return kit.passTime(next, 15, { fun: 18 });  // the game takes 15 minutes and is fun
    }

    case "gramPost": {  // a Gram post
      if (gramPostedToday(s)) return s;  // one post a day
      const day = dayNumber(s);  // today's number
      const old = s.gram ?? { followers: 0, posts: 0, lastPost: -1, paid: [] as number[] };  // current Gram data or a fresh start
      const followers = old.followers + gramGain(s) + (cmd.caption === 0 ? 1 : 0);  // new followers, plus a bonus for the first caption
      let next: GameState = { ...s, gram: { ...old, followers, posts: old.posts + 1, lastPost: day } };  // record the post
      next = addRep(next, 1);  // posting earns a little reputation
      for (const m of GRAM_MILESTONES) {  // check each milestone
        if (followers >= m.followers && !old.paid.includes(m.followers)) {  // reached and not yet paid
          next = kit.pay({ ...next, gram: { ...next.gram!, paid: [...next.gram!.paid, m.followers] } }, m.prize, "other", "Gram");  // pay the milestone prize and mark it paid
          next = kit.say(next, `📸 ${m.followers}`);  // tell the player
        }
      }
      return kit.passTime(next, 10, { social: 12 });  // posting takes 10 minutes and is social
    }
  }
}
