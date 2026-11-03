// Checkers (English draughts) for the phone: you play red against the computer. Captures are compulsory and a piece keeps
// jumping while it can. Pure rules, no screen.

export type Side = "r" | "b";
export type Board = string[];   // 64 squares, index = row × 8 + col. r/b = men, R/B = kings, "." = empty. Pieces live on dark squares
export type Move = { from: number; path: number[]; captured: number[] };   // path: each landing square, in order

export function newBoard(): Board {
  const b: Board = Array(64).fill(".");
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if ((r + c) % 2 === 0) continue;
    if (r < 3) b[r * 8 + c] = "b";
    if (r > 4) b[r * 8 + c] = "r";
  }
  return b;
}

export const sideOf = (p: string): Side | null => (p === "." ? null : p.toLowerCase() === "r" ? "r" : "b");
const king = (p: string) => p === "R" || p === "B";
const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

function dirs(p: string): number[][] {
  const fwd = sideOf(p) === "r" ? -1 : 1;
  return king(p) ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : [[fwd, -1], [fwd, 1]];
}

function jumpsFrom(b: Board, from: number, p: string, done: number[], path: number[], out: Move[], origin: number) {
  let any = false;
  const r = from >> 3, c = from & 7;
  for (const [dr, dc] of dirs(p)) {
    const mr = r + dr, mc = c + dc, lr = r + 2 * dr, lc = c + 2 * dc;
    if (!inside(lr, lc)) continue;
    const mid = mr * 8 + mc, land = lr * 8 + lc;
    const o = sideOf(b[mid]);
    if (!o || o === sideOf(p) || done.includes(mid)) continue;
    if (b[land] !== "." && land !== origin) continue;
    any = true;
    // a man that reaches the far row becomes a king and stops there
    const crowned = !king(p) && ((sideOf(p) === "r" && lr === 0) || (sideOf(p) === "b" && lr === 7));
    if (crowned) out.push({ from: origin, path: [...path, land], captured: [...done, mid] });
    else jumpsFrom(b, land, p, [...done, mid], [...path, land], out, origin);
  }
  if (!any && done.length) out.push({ from: origin, path, captured: done });
}

/** All legal moves for `side`: if any piece can capture, only captures are allowed. */
export function legalMoves(b: Board, side: Side): Move[] {
  const jumps: Move[] = [];
  const steps: Move[] = [];
  for (let i = 0; i < 64; i++) {
    const p = b[i];
    if (sideOf(p) !== side) continue;
    jumpsFrom(b, i, p, [], [], jumps, i);
    for (const [dr, dc] of dirs(p)) {
      const r = (i >> 3) + dr, c = (i & 7) + dc;
      if (inside(r, c) && b[r * 8 + c] === ".") steps.push({ from: i, path: [r * 8 + c], captured: [] });
    }
  }
  return jumps.length ? jumps : steps;
}

export function apply(b: Board, m: Move): Board {
  const n = b.slice();
  let p = n[m.from];
  n[m.from] = ".";
  for (const x of m.captured) n[x] = ".";
  const end = m.path[m.path.length - 1];
  if (p === "r" && end >> 3 === 0) p = "R";
  if (p === "b" && end >> 3 === 7) p = "B";
  n[end] = p;
  return n;
}

/** Who has won? null while both can still move. */
export function winner(b: Board, toMove: Side): Side | null {
  return legalMoves(b, toMove).length === 0 ? (toMove === "r" ? "b" : "r") : null;
}

function evaluate(b: Board): number {   // from red's point of view
  let s = 0;
  for (let i = 0; i < 64; i++) {
    const p = b[i];
    if (p === ".") continue;
    const row = i >> 3;
    const v = king(p) ? 170 : 100 + (sideOf(p) === "r" ? 7 - row : row) * 3;
    s += sideOf(p) === "r" ? v : -v;
  }
  return s;
}

function search(b: Board, side: Side, depth: number, alpha: number, beta: number): number {
  const moves = legalMoves(b, side);
  if (!moves.length) return side === "r" ? -9999 - depth : 9999 + depth;
  if (depth === 0) return evaluate(b);
  if (side === "r") {
    let best = -Infinity;
    for (const m of moves) { best = Math.max(best, search(apply(b, m), "b", depth - 1, alpha, beta)); alpha = Math.max(alpha, best); if (alpha >= beta) break; }
    return best;
  }
  let best = Infinity;
  for (const m of moves) { best = Math.min(best, search(apply(b, m), "r", depth - 1, alpha, beta)); beta = Math.min(beta, best); if (alpha >= beta) break; }
  return best;
}

export function bestMove(b: Board, side: Side, depth = 4, rng: () => number = Math.random): Move | null {
  const moves = legalMoves(b, side);
  if (!moves.length) return null;
  let best: Move[] = [];
  let bestScore = side === "r" ? -Infinity : Infinity;
  for (const m of moves) {
    const s = search(apply(b, m), side === "r" ? "b" : "r", depth - 1, -Infinity, Infinity) + rng() * 2;
    if (side === "r" ? s > bestScore + 0.0001 : s < bestScore - 0.0001) { bestScore = s; best = [m]; }
    else if (Math.abs(s - bestScore) < 0.0001) best.push(m);
  }
  return best[Math.floor(rng() * best.length)] ?? moves[0];
}
