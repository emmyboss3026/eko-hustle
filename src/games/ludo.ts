// Ludo for the phone: you (player 0) against three computer players. Pure rules, no screen.
// The first to bring all four tokens home wins. Each token has a `progress`: -1 in the yard, 0 to 50 along the shared track, 51 to 56 up its own home lane, 57 home.
// You need a 6 to leave the yard. A 6 gives another turn. Landing on a lone opponent (not on a safe square) sends it back.

export const PLAYERS = 4;  // four players
export const TOKENS = 4;  // four tokens each
export const HOME = 57;  // progress value meaning home
export const TRACK = 52;  // squares on the shared track
const SAFE = [0, 8, 13, 21, 26, 34, 39, 47];   // each colour's start square and the star square 8 further on

export type Ludo = {  // the whole game state
  tokens: number[][];     // tokens[player][i] = progress
  turn: number;           // whose turn
  roll: number | null;    // the dice, once rolled and until a token moves
  sixes: number;          // sixes in a row (three in a row loses the turn)
  winner: number | null;
  places: number[];       // the winner, once there is one
};

export const newLudo = (): Ludo => ({  // a fresh game
  tokens: Array.from({ length: PLAYERS }, () => Array(TOKENS).fill(-1)),  // every token starts in the yard (-1)
  turn: 0, roll: null, sixes: 0, winner: null, places: [],  // player 0 (you) goes first
});

/** The square of the shared track a token stands on, or null in the yard, in its home lane or home. */
export const trackSquare = (player: number, progress: number): number | null =>  // the track square a token is on
  progress >= 0 && progress <= 50 ? (player * 13 + progress) % TRACK : null;  // only tokens on the shared track have one

/** Which tokens of `player` can move with `roll`. */
export function movable(g: Ludo, player: number, roll: number): number[] {  // which tokens may move for this roll
  const out: number[] = [];  // token numbers that can move
  g.tokens[player].forEach((p, i) => {  // look at each token
    if (p === HOME) return;  // tokens already home never move
    if (p === -1) { if (roll === 6) out.push(i); return; }  // a token in the yard needs a six
    if (p + roll <= HOME) out.push(i);  // others move if they do not overshoot home
  });
  return out;  // the list of movable tokens
}

function nextTurn(g: Ludo, from: number): number {  // who plays next
  for (let k = 1; k <= PLAYERS; k++) {  // try each following player
    const p = (from + k) % PLAYERS;  // that player's number
    if (!g.places.includes(p)) return p;  // skip players who have finished
  }
  return from;  // nobody else: same player
}

/** Roll the dice for the player whose turn it is. If nothing can move the turn passes at once. */
export function rollDice(g: Ludo, value: number): Ludo {  // apply a dice roll
  if (g.winner !== null || g.roll !== null) return g;  // ignore if the game is over or already rolled
  const n: Ludo = { ...g, roll: value };  // remember the roll
  if (movable(n, g.turn, value).length === 0) return endTurn({ ...n, roll: null }, value === 6 ? g.sixes + 1 : 0, value === 6);  // nothing can move: the turn passes at once
  return n;  // wait for the player to pick a token
}

function endTurn(g: Ludo, sixes: number, again: boolean): Ludo {  // finish a turn
  if (again && sixes < 3 && !g.places.includes(g.turn)) return { ...g, roll: null, sixes };  // a six (up to three in a row) gives another go
  return { ...g, roll: null, sixes: 0, turn: nextTurn(g, g.turn) };  // otherwise pass to the next player
}

/** Move one of the current player's tokens by the rolled number. */
export function moveToken(g: Ludo, token: number): Ludo {  // move one token by the rolled number
  if (g.roll === null || g.winner !== null) return g;  // nothing to do without a roll
  const player = g.turn;  // the player moving
  if (!movable(g, player, g.roll).includes(token)) return g;  // refuse a token that cannot move
  const tokens = g.tokens.map(t => t.slice());  // copy the token lists
  const was = tokens[player][token];  // where the token was
  const now = was === -1 ? 0 : was + g.roll;  // leaving the yard lands on square 0
  tokens[player][token] = now;  // store the new position
  const sq = trackSquare(player, now);  // the track square it landed on
  if (sq !== null && !SAFE.includes(sq)) {  // safe squares protect from capture
    // send home a lone opponent token
    for (let o = 0; o < PLAYERS; o++) {  // check each opponent
      if (o === player) continue;  // skip yourself
      const here = tokens[o].map((p, i) => (trackSquare(o, p) === sq ? i : -1)).filter(i => i >= 0);  // opponent tokens on that square
      if (here.length === 1) tokens[o][here[0]] = -1;  // exactly one: send it back to the yard
    }
  }
  // the first to bring all four tokens home wins
  if (tokens[player].every(p => p === HOME)) return { ...g, tokens, roll: null, winner: player, places: [player] };  // all four home: this player wins
  const again = g.roll === 6 || now === HOME;  // another turn after a six or finishing a token
  return endTurn({ ...g, tokens }, g.roll === 6 ? g.sixes + 1 : 0, again);  // pass the turn on or repeat it
}

/** A sensible pick for a computer player: finish a token, capture, leave the yard, then move the token most at risk or furthest. */
export function chooseToken(g: Ludo, rng: () => number = Math.random): number {  // the computer picks a token
  const player = g.turn;  // the player moving
  const roll = g.roll ?? 0;  // the dice value
  const options = movable(g, player, roll);  // tokens it may move
  let best = options[0], bestScore = -Infinity;  // best token and its score so far
  for (const i of options) {  // score each option
    const p = g.tokens[player][i];  // where the token is now
    const to = p === -1 ? 0 : p + roll;  // where it would land
    let s = rng();  // a little random so play varies
    if (to === HOME) s += 100;  // reaching home is best
    const sq = trackSquare(player, to);  // track square it would land on
    if (sq !== null && !SAFE.includes(sq)) {  // not a safe square: a capture is possible
      for (let o = 0; o < PLAYERS; o++) if (o !== player) {  // look at each opponent
        const n = g.tokens[o].filter(q => trackSquare(o, q) === sq).length;  // count their tokens there
        if (n === 1) s += 60;  // a lone token can be captured
      }
    }
    if (p === -1) s += 40;  // leaving the yard is good
    if (sq !== null && SAFE.includes(sq)) s += 15;  // safe squares are good
    if (to > 50) s += 12;       // into the home lane: nobody can touch it
    s += to * 0.3;  // further along is slightly better
    if (s > bestScore) { bestScore = s; best = i; }  // keep the best option
  }
  return best;  // the chosen token
}
