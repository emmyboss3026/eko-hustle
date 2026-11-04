// Chess for the phone: you play white against a small computer player. Pure rules, no screen.
// Left out to keep it small: castling, en passant and under-promotion (a pawn that arrives on the last row becomes a queen).

export type Side = "w" | "b";  // the two players
export type Board = string[];   // 64 squares, index = row × 8 + col, row 0 is black's back row. Uppercase = white, "." = empty
export type Move = { from: number; to: number };  // a move: from one square to another

const START = "rnbqkbnrpppppppp................................PPPPPPPPRNBQKBNR";  // the starting position as 64 letters
export const newBoard = (): Board => START.split("");  // a fresh board for a new game

export const sideOf = (p: string): Side | null => (p === "." ? null : p === p.toUpperCase() ? "w" : "b");  // which side owns a piece (upper case = white)
const row = (i: number) => i >> 3;  // row of a square index
const col = (i: number) => i & 7;  // column of a square index
const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;  // is this row/column on the board?

const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];  // the eight knight jumps
const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];  // the eight king steps
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];  // the four diagonal directions
const STRAIGHT = [[-1, 0], [1, 0], [0, -1], [0, 1]];  // the four straight directions

/** Every move the piece on `from` could make if it didn't matter whether its own king ends up in check. */
function pseudo(b: Board, from: number): number[] {
  const p = b[from];  // the piece on the starting square
  const side = sideOf(p);  // its owner
  if (!side) return [];  // empty square: no moves
  const out: number[] = [];  // squares it can go to
  const r = row(from), c = col(from);  // its row and column
  const type = p.toLowerCase();  // its type in lower case
  const push = (nr: number, nc: number) => {  // try one target square
    if (!inside(nr, nc)) return false;  // off the board: stop
    const t = nr * 8 + nc;  // index of the target square
    const o = sideOf(b[t]);  // who stands there
    if (o === side) return false;  // own piece blocks the way
    out.push(t);  // the square is reachable
    return o === null;   // keep sliding only over empty squares
  };
  if (type === "p") {  // pawn rules
    const dir = side === "w" ? -1 : 1;  // white moves up the board, black down
    const startRow = side === "w" ? 6 : 1;  // the row pawns start on
    if (inside(r + dir, c) && b[(r + dir) * 8 + c] === ".") {  // one step forward if free
      out.push((r + dir) * 8 + c);  // add the single step
      if (r === startRow && b[(r + 2 * dir) * 8 + c] === ".") out.push((r + 2 * dir) * 8 + c);  // two steps from the start row if both are free
    }
    for (const dc of [-1, 1]) if (inside(r + dir, c + dc) && sideOf(b[(r + dir) * 8 + c + dc]) === (side === "w" ? "b" : "w")) out.push((r + dir) * 8 + c + dc);  // diagonal captures of enemy pieces
  } else if (type === "n") {  // knight rules
    for (const [dr, dc] of KNIGHT) push(r + dr, c + dc);  // try each knight jump
  } else if (type === "k") {  // king rules
    for (const [dr, dc] of KING) push(r + dr, c + dc);  // try each king step
  } else {  // bishop, rook and queen
    const dirs = type === "b" ? DIAG : type === "r" ? STRAIGHT : [...DIAG, ...STRAIGHT];  // pick the directions for this piece
    for (const [dr, dc] of dirs) for (let k = 1; k < 8; k++) if (!push(r + dr * k, c + dc * k)) break;  // slide along each direction until blocked
  }
  return out;  // hand back every square
}

export function apply(b: Board, m: Move): Board {  // play a move on a copy of the board
  const n = b.slice();  // copy so the old board is kept
  let p = n[m.from];  // the moving piece
  if (p === "P" && row(m.to) === 0) p = "Q";  // white pawn on the last row becomes a queen
  if (p === "p" && row(m.to) === 7) p = "q";  // black pawn on the last row becomes a queen
  n[m.to] = p;  // put the piece on its new square
  n[m.from] = ".";  // empty the old square
  return n;  // return the new board
}

/** Is `side`'s king attacked? */
export function inCheck(b: Board, side: Side): boolean {  // is this side's king under attack?
  const king = side === "w" ? "K" : "k";  // the king letter for this side
  const at = b.indexOf(king);  // where the king stands
  if (at < 0) return true;  // no king means lost
  const foe = side === "w" ? "b" : "w";  // the other side
  for (let i = 0; i < 64; i++) if (sideOf(b[i]) === foe && pseudo(b, i).includes(at)) return true;  // does any enemy piece reach the king?
  return false;  // safe
}

export function legalMoves(b: Board, side: Side): Move[] {  // all moves that do not leave your king in check
  const out: Move[] = [];  // collected moves
  for (let from = 0; from < 64; from++) {  // every square
    if (sideOf(b[from]) !== side) continue;  // skip squares that are not ours
    for (const to of pseudo(b, from)) if (!inCheck(apply(b, { from, to }), side)) out.push({ from, to });  // keep a move only if the king is safe afterwards
  }
  return out;  // hand back the list
}

export type Status = "play" | "check" | "mate" | "stalemate";  // how a position can stand
export function status(b: Board, side: Side): Status {  // work out the state of this side
  const any = legalMoves(b, side).length > 0;  // does it have a legal move?
  const chk = inCheck(b, side);  // is its king attacked?
  return any ? (chk ? "check" : "play") : chk ? "mate" : "stalemate";  // no move + check = mate, no move + no check = stalemate
}

const VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };  // point value of each piece type

/** Material plus a small bonus for pawns that advance and pieces near the centre. From white's point of view. */
function evaluate(b: Board): number {  // score a position for white (positive is good for white)
  let score = 0;  // running total
  for (let i = 0; i < 64; i++) {  // every square
    const p = b[i];  // the piece here
    if (p === ".") continue;  // skip empty squares
    const side = sideOf(p)!;  // its owner
    const t = p.toLowerCase();  // its type
    const centre = 3.5 - Math.max(Math.abs(row(i) - 3.5), Math.abs(col(i) - 3.5)) * 0.5;  // closer to the centre is worth a little more
    const advance = t === "p" ? (side === "w" ? 6 - row(i) : row(i) - 1) * 6 : 0;  // pawns gain points as they advance
    const v = VALUE[t] + (t === "k" ? 0 : centre * 4) + advance;  // piece value plus position bonus
    score += side === "w" ? v : -v;  // add for white, subtract for black
  }
  return score;  // the final score
}

function search(b: Board, side: Side, depth: number, alpha: number, beta: number): number {  // look ahead with alpha-beta pruning
  const moves = legalMoves(b, side);  // moves available now
  if (moves.length === 0) return inCheck(b, side) ? (side === "w" ? -99999 - depth : 99999 + depth) : 0;  // no moves: mate is huge, stalemate is zero
  if (depth === 0) return evaluate(b);  // out of depth: score the position
  // look at captures first so the cut-offs come early
  moves.sort((x, y) => (b[y.to] === "." ? 0 : VALUE[b[y.to].toLowerCase()]) - (b[x.to] === "." ? 0 : VALUE[b[x.to].toLowerCase()]));  // try captures first so pruning works better
  if (side === "w") {  // white wants the highest score
    let best = -Infinity;  // worst case start
    for (const m of moves) { best = Math.max(best, search(apply(b, m), "b", depth - 1, alpha, beta)); alpha = Math.max(alpha, best); if (alpha >= beta) break; }  // try each move and keep the best
    return best;  // best score for white
  }
  let best = Infinity;  // black wants the lowest score
  for (const m of moves) { best = Math.min(best, search(apply(b, m), "w", depth - 1, alpha, beta)); beta = Math.min(beta, best); if (alpha >= beta) break; }  // try each move and keep the lowest
  return best;  // best score for black
}

/** The computer's move for `side`. `depth` 2 is easy and quick, 3 is a fair fight. `rng` breaks ties. */
export function bestMove(b: Board, side: Side, depth = 2, rng: () => number = Math.random): Move | null {  // pick the computer's move
  const moves = legalMoves(b, side);  // all legal moves
  if (!moves.length) return null;  // no moves: nothing to play
  let best: Move[] = [];  // the best moves found so far
  let bestScore = side === "w" ? -Infinity : Infinity;  // the score to beat
  for (const m of moves) {  // test each move
    const s = search(apply(b, m), side === "w" ? "b" : "w", depth - 1, -Infinity, Infinity) + rng() * 4;  // score it by looking ahead (plus a little random)
    if (side === "w" ? s > bestScore + 0.0001 : s < bestScore - 0.0001) { bestScore = s; best = [m]; }  // a better score replaces the list
    else if (Math.abs(s - bestScore) < 0.0001) best.push(m);  // an equal score joins the list
  }
  return best[Math.floor(rng() * best.length)] ?? moves[0];  // choose randomly among the equally good moves
}

export const GLYPH: Record<string, string> = {  // unicode pictures for each piece letter
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙", k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",  // white pieces then black pieces
};
