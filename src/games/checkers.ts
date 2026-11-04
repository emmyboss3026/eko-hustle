// Checkers (English draughts) for the phone: you play red against the computer. Captures are compulsory and a piece keeps
// jumping while it can. Pure rules, no screen.

export type Side = "r" | "b";  // red and black
export type Board = string[];   // 64 squares, index = row × 8 + col. r/b = men, R/B = kings, "." = empty. Pieces live on dark squares
export type Move = { from: number; path: number[]; captured: number[] };   // path: each landing square, in order

export function newBoard(): Board {  // a fresh starting board
  const b: Board = Array(64).fill(".");  // 64 empty squares
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {  // visit every square
    if ((r + c) % 2 === 0) continue;  // light squares stay empty
    if (r < 3) b[r * 8 + c] = "b";  // top three rows are black
    if (r > 4) b[r * 8 + c] = "r";  // bottom three rows are red
  }
  return b;  // hand back the board
}

export const sideOf = (p: string): Side | null => (p === "." ? null : p.toLowerCase() === "r" ? "r" : "b");  // owner of a piece, any case
const king = (p: string) => p === "R" || p === "B";  // is this piece a king?
const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;  // is the row/column on the board?

function dirs(p: string): number[][] {  // directions a piece may move
  const fwd = sideOf(p) === "r" ? -1 : 1;  // men move forward only: red up, black down
  return king(p) ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : [[fwd, -1], [fwd, 1]];  // kings move all four diagonals
}

function jumpsFrom(b: Board, from: number, p: string, done: number[], path: number[], out: Move[], origin: number) {  // find every jump chain from one square
  let any = false;  // becomes true if at least one jump exists
  const r = from >> 3, c = from & 7;  // row and column of the piece
  for (const [dr, dc] of dirs(p)) {  // try each direction
    const mr = r + dr, mc = c + dc, lr = r + 2 * dr, lc = c + 2 * dc;  // the square jumped over and the landing square
    if (!inside(lr, lc)) continue;  // landing off the board: skip
    const mid = mr * 8 + mc, land = lr * 8 + lc;  // index of the jumped square and of the landing square
    const o = sideOf(b[mid]);  // who is on the jumped square
    if (!o || o === sideOf(p) || done.includes(mid)) continue;  // must be an enemy not already taken
    if (b[land] !== "." && land !== origin) continue;  // landing must be empty (or the piece's own start)
    any = true;  // a jump is possible
    // a man that reaches the far row becomes a king and stops there
    const crowned = !king(p) && ((sideOf(p) === "r" && lr === 0) || (sideOf(p) === "b" && lr === 7));  // a man reaching the far row is crowned
    if (crowned) out.push({ from: origin, path: [...path, land], captured: [...done, mid] });  // crowned: the chain ends here
    else jumpsFrom(b, land, p, [...done, mid], [...path, land], out, origin);  // otherwise keep jumping from the landing square
  }
  if (!any && done.length) out.push({ from: origin, path, captured: done });  // no further jump: record the finished chain
}

/** All legal moves for `side`: if any piece can capture, only captures are allowed. */
export function legalMoves(b: Board, side: Side): Move[] {  // every legal move for a side
  const jumps: Move[] = [];  // capturing moves
  const steps: Move[] = [];  // plain steps
  for (let i = 0; i < 64; i++) {  // visit every square
    const p = b[i];  // the piece here
    if (sideOf(p) !== side) continue;  // skip pieces that are not ours
    jumpsFrom(b, i, p, [], [], jumps, i);  // collect jump chains from this piece
    for (const [dr, dc] of dirs(p)) {  // try each plain step
      const r = (i >> 3) + dr, c = (i & 7) + dc;  // target row and column
      if (inside(r, c) && b[r * 8 + c] === ".") steps.push({ from: i, path: [r * 8 + c], captured: [] });  // free square: add the step
    }
  }
  return jumps.length ? jumps : steps;  // captures are compulsory, so they replace steps
}

export function apply(b: Board, m: Move): Board {  // play a move on a copy of the board
  const n = b.slice();  // copy the board
  let p = n[m.from];  // the moving piece
  n[m.from] = ".";  // empty its start square
  for (const x of m.captured) n[x] = ".";  // remove every captured piece
  const end = m.path[m.path.length - 1];  // final landing square
  if (p === "r" && end >> 3 === 0) p = "R";  // red reaching the top becomes a king
  if (p === "b" && end >> 3 === 7) p = "B";  // black reaching the bottom becomes a king
  n[end] = p;  // put the piece down
  return n;  // hand back the new board
}

/** Who has won? null while both can still move. */
export function winner(b: Board, toMove: Side): Side | null {  // the side with no legal move loses
  return legalMoves(b, toMove).length === 0 ? (toMove === "r" ? "b" : "r") : null;  // no moves means the other side wins
}

function evaluate(b: Board): number {   // from red's point of view
  let s = 0;  // running total
  for (let i = 0; i < 64; i++) {  // visit every square
    const p = b[i];  // the piece here
    if (p === ".") continue;  // skip empty squares
    const row = i >> 3;  // its row
    const v = king(p) ? 170 : 100 + (sideOf(p) === "r" ? 7 - row : row) * 3;  // kings are worth more; men gain value as they advance
    s += sideOf(p) === "r" ? v : -v;  // add for red, subtract for black
  }
  return s;  // final score
}

function search(b: Board, side: Side, depth: number, alpha: number, beta: number): number {  // look ahead with alpha-beta pruning
  const moves = legalMoves(b, side);  // moves available now
  if (!moves.length) return side === "r" ? -9999 - depth : 9999 + depth;  // no moves: that side has lost
  if (depth === 0) return evaluate(b);  // depth used up: score the position
  if (side === "r") {  // red maximises
    let best = -Infinity;  // worst-case start
    for (const m of moves) { best = Math.max(best, search(apply(b, m), "b", depth - 1, alpha, beta)); alpha = Math.max(alpha, best); if (alpha >= beta) break; }  // try each move and keep the best
    return best;  // best score for red
  }
  let best = Infinity;  // black minimises
  for (const m of moves) { best = Math.min(best, search(apply(b, m), "r", depth - 1, alpha, beta)); beta = Math.min(beta, best); if (alpha >= beta) break; }  // try each move and keep the lowest
  return best;  // best score for black
}

export function bestMove(b: Board, side: Side, depth = 4, rng: () => number = Math.random): Move | null {  // choose the computer's move
  const moves = legalMoves(b, side);  // all legal moves
  if (!moves.length) return null;  // none: nothing to play
  let best: Move[] = [];  // best moves so far
  let bestScore = side === "r" ? -Infinity : Infinity;  // score to beat
  for (const m of moves) {  // test each move
    const s = search(apply(b, m), side === "r" ? "b" : "r", depth - 1, -Infinity, Infinity) + rng() * 2;  // look ahead (plus a little random)
    if (side === "r" ? s > bestScore + 0.0001 : s < bestScore - 0.0001) { bestScore = s; best = [m]; }  // better score replaces the list
    else if (Math.abs(s - bestScore) < 0.0001) best.push(m);  // equal score joins the list
  }
  return best[Math.floor(rng() * best.length)] ?? moves[0];  // pick randomly among the equally good moves
}
