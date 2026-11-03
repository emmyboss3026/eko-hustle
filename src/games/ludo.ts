// Ludo for the phone: you (player 0) against three computer players. Pure rules, no screen.
// The first to bring all four tokens home wins. Each token has a `progress`: -1 in the yard, 0 to 50 along the shared track, 51 to 56 up its own home lane, 57 home.
// You need a 6 to leave the yard. A 6 gives another turn. Landing on a lone opponent (not on a safe square) sends it back.

export const PLAYERS = 4;
export const TOKENS = 4;
export const HOME = 57;
export const TRACK = 52;
const SAFE = [0, 8, 13, 21, 26, 34, 39, 47];   // each colour's start square and the star square 8 further on

export type Ludo = {
  tokens: number[][];     // tokens[player][i] = progress
  turn: number;           // whose turn
  roll: number | null;    // the dice, once rolled and until a token moves
  sixes: number;          // sixes in a row (three in a row loses the turn)
  winner: number | null;
  places: number[];       // the winner, once there is one
};

export const newLudo = (): Ludo => ({
  tokens: Array.from({ length: PLAYERS }, () => Array(TOKENS).fill(-1)),
  turn: 0, roll: null, sixes: 0, winner: null, places: [],
});

/** The square of the shared track a token stands on, or null in the yard, in its home lane or home. */
export const trackSquare = (player: number, progress: number): number | null =>
  progress >= 0 && progress <= 50 ? (player * 13 + progress) % TRACK : null;

/** Which tokens of `player` can move with `roll`. */
export function movable(g: Ludo, player: number, roll: number): number[] {
  const out: number[] = [];
  g.tokens[player].forEach((p, i) => {
    if (p === HOME) return;
    if (p === -1) { if (roll === 6) out.push(i); return; }
    if (p + roll <= HOME) out.push(i);
  });
  return out;
}

function nextTurn(g: Ludo, from: number): number {
  for (let k = 1; k <= PLAYERS; k++) {
    const p = (from + k) % PLAYERS;
    if (!g.places.includes(p)) return p;
  }
  return from;
}

/** Roll the dice for the player whose turn it is. If nothing can move the turn passes at once. */
export function rollDice(g: Ludo, value: number): Ludo {
  if (g.winner !== null || g.roll !== null) return g;
  const n: Ludo = { ...g, roll: value };
  if (movable(n, g.turn, value).length === 0) return endTurn({ ...n, roll: null }, value === 6 ? g.sixes + 1 : 0, value === 6);
  return n;
}

function endTurn(g: Ludo, sixes: number, again: boolean): Ludo {
  if (again && sixes < 3 && !g.places.includes(g.turn)) return { ...g, roll: null, sixes };
  return { ...g, roll: null, sixes: 0, turn: nextTurn(g, g.turn) };
}

/** Move one of the current player's tokens by the rolled number. */
export function moveToken(g: Ludo, token: number): Ludo {
  if (g.roll === null || g.winner !== null) return g;
  const player = g.turn;
  if (!movable(g, player, g.roll).includes(token)) return g;
  const tokens = g.tokens.map(t => t.slice());
  const was = tokens[player][token];
  const now = was === -1 ? 0 : was + g.roll;
  tokens[player][token] = now;
  const sq = trackSquare(player, now);
  if (sq !== null && !SAFE.includes(sq)) {
    // send home a lone opponent token
    for (let o = 0; o < PLAYERS; o++) {
      if (o === player) continue;
      const here = tokens[o].map((p, i) => (trackSquare(o, p) === sq ? i : -1)).filter(i => i >= 0);
      if (here.length === 1) tokens[o][here[0]] = -1;
    }
  }
  // the first to bring all four tokens home wins
  if (tokens[player].every(p => p === HOME)) return { ...g, tokens, roll: null, winner: player, places: [player] };
  const again = g.roll === 6 || now === HOME;
  return endTurn({ ...g, tokens }, g.roll === 6 ? g.sixes + 1 : 0, again);
}

/** A sensible pick for a computer player: finish a token, capture, leave the yard, then move the token most at risk or furthest. */
export function chooseToken(g: Ludo, rng: () => number = Math.random): number {
  const player = g.turn;
  const roll = g.roll ?? 0;
  const options = movable(g, player, roll);
  let best = options[0], bestScore = -Infinity;
  for (const i of options) {
    const p = g.tokens[player][i];
    const to = p === -1 ? 0 : p + roll;
    let s = rng();
    if (to === HOME) s += 100;
    const sq = trackSquare(player, to);
    if (sq !== null && !SAFE.includes(sq)) {
      for (let o = 0; o < PLAYERS; o++) if (o !== player) {
        const n = g.tokens[o].filter(q => trackSquare(o, q) === sq).length;
        if (n === 1) s += 60;
      }
    }
    if (p === -1) s += 40;
    if (sq !== null && SAFE.includes(sq)) s += 15;
    if (to > 50) s += 12;       // into the home lane: nobody can touch it
    s += to * 0.3;
    if (s > bestScore) { bestScore = s; best = i; }
  }
  return best;
}
