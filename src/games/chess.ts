// Chess for the phone: you play white against a small computer player. Pure rules, no screen.
// Left out to keep it small: castling, en passant and under-promotion (a pawn that arrives on the last row becomes a queen).

export type Side = "w" | "b";
export type Board = string[];   // 64 squares, index = row × 8 + col, row 0 is black's back row. Uppercase = white, "." = empty
export type Move = { from: number; to: number };

const START = "rnbqkbnrpppppppp................................PPPPPPPPRNBQKBNR";
export const newBoard = (): Board => START.split("");

export const sideOf = (p: string): Side | null => (p === "." ? null : p === p.toUpperCase() ? "w" : "b");
const row = (i: number) => i >> 3;
const col = (i: number) => i & 7;
const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const STRAIGHT = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/** Every move the piece on `from` could make if it didn't matter whether its own king ends up in check. */
function pseudo(b: Board, from: number): number[] {
  const p = b[from];
  const side = sideOf(p);
  if (!side) return [];
  const out: number[] = [];
  const r = row(from), c = col(from);
  const type = p.toLowerCase();
  const push = (nr: number, nc: number) => {
    if (!inside(nr, nc)) return false;
    const t = nr * 8 + nc;
    const o = sideOf(b[t]);
    if (o === side) return false;
    out.push(t);
    return o === null;   // keep sliding only over empty squares
  };
  if (type === "p") {
    const dir = side === "w" ? -1 : 1;
    const startRow = side === "w" ? 6 : 1;
    if (inside(r + dir, c) && b[(r + dir) * 8 + c] === ".") {
      out.push((r + dir) * 8 + c);
      if (r === startRow && b[(r + 2 * dir) * 8 + c] === ".") out.push((r + 2 * dir) * 8 + c);
    }
    for (const dc of [-1, 1]) if (inside(r + dir, c + dc) && sideOf(b[(r + dir) * 8 + c + dc]) === (side === "w" ? "b" : "w")) out.push((r + dir) * 8 + c + dc);
  } else if (type === "n") {
    for (const [dr, dc] of KNIGHT) push(r + dr, c + dc);
  } else if (type === "k") {
    for (const [dr, dc] of KING) push(r + dr, c + dc);
  } else {
    const dirs = type === "b" ? DIAG : type === "r" ? STRAIGHT : [...DIAG, ...STRAIGHT];
    for (const [dr, dc] of dirs) for (let k = 1; k < 8; k++) if (!push(r + dr * k, c + dc * k)) break;
  }
  return out;
}

export function apply(b: Board, m: Move): Board {
  const n = b.slice();
  let p = n[m.from];
  if (p === "P" && row(m.to) === 0) p = "Q";
  if (p === "p" && row(m.to) === 7) p = "q";
  n[m.to] = p;
  n[m.from] = ".";
  return n;
}

/** Is `side`'s king attacked? */
export function inCheck(b: Board, side: Side): boolean {
  const king = side === "w" ? "K" : "k";
  const at = b.indexOf(king);
  if (at < 0) return true;
  const foe = side === "w" ? "b" : "w";
  for (let i = 0; i < 64; i++) if (sideOf(b[i]) === foe && pseudo(b, i).includes(at)) return true;
  return false;
}

export function legalMoves(b: Board, side: Side): Move[] {
  const out: Move[] = [];
  for (let from = 0; from < 64; from++) {
    if (sideOf(b[from]) !== side) continue;
    for (const to of pseudo(b, from)) if (!inCheck(apply(b, { from, to }), side)) out.push({ from, to });
  }
  return out;
}

export type Status = "play" | "check" | "mate" | "stalemate";
export function status(b: Board, side: Side): Status {
  const any = legalMoves(b, side).length > 0;
  const chk = inCheck(b, side);
  return any ? (chk ? "check" : "play") : chk ? "mate" : "stalemate";
}

const VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

/** Material plus a small bonus for pawns that advance and pieces near the centre. From white's point of view. */
function evaluate(b: Board): number {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const p = b[i];
    if (p === ".") continue;
    const side = sideOf(p)!;
    const t = p.toLowerCase();
    const centre = 3.5 - Math.max(Math.abs(row(i) - 3.5), Math.abs(col(i) - 3.5)) * 0.5;
    const advance = t === "p" ? (side === "w" ? 6 - row(i) : row(i) - 1) * 6 : 0;
    const v = VALUE[t] + (t === "k" ? 0 : centre * 4) + advance;
    score += side === "w" ? v : -v;
  }
  return score;
}

function search(b: Board, side: Side, depth: number, alpha: number, beta: number): number {
  const moves = legalMoves(b, side);
  if (moves.length === 0) return inCheck(b, side) ? (side === "w" ? -99999 - depth : 99999 + depth) : 0;
  if (depth === 0) return evaluate(b);
  // look at captures first so the cut-offs come early
  moves.sort((x, y) => (b[y.to] === "." ? 0 : VALUE[b[y.to].toLowerCase()]) - (b[x.to] === "." ? 0 : VALUE[b[x.to].toLowerCase()]));
  if (side === "w") {
    let best = -Infinity;
    for (const m of moves) { best = Math.max(best, search(apply(b, m), "b", depth - 1, alpha, beta)); alpha = Math.max(alpha, best); if (alpha >= beta) break; }
    return best;
  }
  let best = Infinity;
  for (const m of moves) { best = Math.min(best, search(apply(b, m), "w", depth - 1, alpha, beta)); beta = Math.min(beta, best); if (alpha >= beta) break; }
  return best;
}

/** The computer's move for `side`. `depth` 2 is easy and quick, 3 is a fair fight. `rng` breaks ties. */
export function bestMove(b: Board, side: Side, depth = 2, rng: () => number = Math.random): Move | null {
  const moves = legalMoves(b, side);
  if (!moves.length) return null;
  let best: Move[] = [];
  let bestScore = side === "w" ? -Infinity : Infinity;
  for (const m of moves) {
    const s = search(apply(b, m), side === "w" ? "b" : "w", depth - 1, -Infinity, Infinity) + rng() * 4;
    if (side === "w" ? s > bestScore + 0.0001 : s < bestScore - 0.0001) { bestScore = s; best = [m]; }
    else if (Math.abs(s - bestScore) < 0.0001) best.push(m);
  }
  return best[Math.floor(rng() * best.length)] ?? moves[0];
}

export const GLYPH: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙", k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};
