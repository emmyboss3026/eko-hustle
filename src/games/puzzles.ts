// Sudoku, Snake and 2048: the rules of three solo puzzle games. Pure, so they can be tested without a screen.

// ------------------------------------------------------------------ Sudoku

export type Grid = number[];   // 81 cells, 0 = empty

function candidates(g: Grid, i: number): number[] {  // numbers still allowed in one cell
  const r = Math.floor(i / 9), c = i % 9;  // the cell's row and column
  const used = new Set<number>();  // digits already used
  for (let k = 0; k < 9; k++) { used.add(g[r * 9 + k]); used.add(g[k * 9 + c]); }  // collect its row and column digits
  const br = r - (r % 3), bc = c - (c % 3);  // top-left corner of its 3x3 box
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) used.add(g[(br + y) * 9 + bc + x]);  // collect its box digits
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !used.has(n));  // digits 1-9 that are not used
}

/** Count solutions, stopping at `limit` (2 is enough to know a puzzle has exactly one). */
export function countSolutions(g: Grid, limit = 2): number {  // count solutions up to a limit
  let best = -1, bestC: number[] = [];  // the emptiest cell and its options
  for (let i = 0; i < 81; i++) {  // scan all cells
    if (g[i]) continue;  // skip filled cells
    const c = candidates(g, i);  // options for this cell
    if (best < 0 || c.length < bestC.length) { best = i; bestC = c; if (c.length <= 1) break; }  // keep the cell with the fewest options
  }
  if (best < 0) return 1;  // no empty cell: one solution found
  let n = 0;  // solutions counted
  for (const v of bestC) {  // try each option
    g[best] = v;  // place it
    n += countSolutions(g, limit - n);  // count the solutions that follow
    g[best] = 0;  // undo the placement
    if (n >= limit) break;  // stop once the limit is reached
  }
  return n;  // total found
}

function fill(g: Grid, rng: () => number): boolean {  // fill a grid with a random valid solution
  let best = -1, bestC: number[] = [];  // the emptiest cell and its options
  for (let i = 0; i < 81; i++) {  // scan all cells
    if (g[i]) continue;  // skip filled cells
    const c = candidates(g, i);  // options for this cell
    if (best < 0 || c.length < bestC.length) { best = i; bestC = c; }  // keep the cell with the fewest options
  }
  if (best < 0) return true;  // no empty cell: finished
  const order = bestC.map(v => [rng(), v] as const).sort((a, b) => a[0] - b[0]).map(p => p[1]);  // shuffle the options
  for (const v of order) {  // try each option
    g[best] = v;  // place it
    if (fill(g, rng)) return true;  // continue; success bubbles up
  }
  g[best] = 0;  // dead end: clear the cell
  return false;  // tell the caller to backtrack
}

/** A puzzle with exactly one solution. `clues` is how many numbers are given (36 is easy, 30 is harder). */
export function makeSudoku(clues = 36, rng: () => number = Math.random): { puzzle: Grid; solution: Grid } {  // make a puzzle with one solution
  const solution: Grid = Array(81).fill(0);  // empty grid
  fill(solution, rng);  // fill it with a full solution
  const puzzle = solution.slice();  // start the puzzle as a copy
  const order = Array.from({ length: 81 }, (_, i) => i).map(i => [rng(), i] as const).sort((a, b) => a[0] - b[0]).map(p => p[1]);  // visit the cells in random order
  let left = 81;  // cells still filled
  for (const i of order) {  // try removing each cell
    if (left <= clues) break;  // stop at the wanted number of clues
    const keep = puzzle[i];  // remember the number
    puzzle[i] = 0;  // remove it
    if (countSolutions(puzzle.slice()) !== 1) puzzle[i] = keep;  // if the puzzle stops being unique, put it back
    else left--;  // otherwise count the removal
  }
  return { puzzle, solution };  // puzzle and its answer
}

/** Cells that break a rule (the same number twice in a row, column or box). */
export function conflicts(g: Grid): Set<number> {  // find cells that break a rule
  const bad = new Set<number>();  // cells in conflict
  const check = (cells: number[]) => {  // check one group of nine cells
    const seen = new Map<number, number>();  // digit and where it was first seen
    for (const i of cells) {  // each cell of the group
      if (!g[i]) continue;  // skip empty cells
      if (seen.has(g[i])) { bad.add(i); bad.add(seen.get(g[i])!); } else seen.set(g[i], i);  // a repeat marks both cells
    }
  };
  for (let a = 0; a < 9; a++) {  // for each of the nine rows/columns/boxes
    check(Array.from({ length: 9 }, (_, k) => a * 9 + k));  // check row a
    check(Array.from({ length: 9 }, (_, k) => k * 9 + a));  // check column a
    const br = Math.floor(a / 3) * 3, bc = (a % 3) * 3;  // top-left of box a
    check(Array.from({ length: 9 }, (_, k) => (br + Math.floor(k / 3)) * 9 + bc + (k % 3)));  // check box a
  }
  return bad;  // the conflicting cells
}

// ------------------------------------------------------------------ Snake

export type Dir = "up" | "down" | "left" | "right";  // the four directions
export type Snake = { w: number; h: number; body: { x: number; y: number }[]; dir: Dir; food: { x: number; y: number }; score: number; dead: boolean };  // the whole snake game state
const D: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };  // x/y step for each direction
const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };  // the opposite of each direction

function placeFood(w: number, h: number, body: { x: number; y: number }[], rng: () => number) {  // pick a random empty square for food
  const free: { x: number; y: number }[] = [];  // free squares
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!body.some(b => b.x === x && b.y === y)) free.push({ x, y });  // every square not under the snake
  return free.length ? free[Math.floor(rng() * free.length)] : { x: -1, y: -1 };  // choose one, or none if full
}

export function newSnake(w = 16, h = 16, rng: () => number = Math.random): Snake {  // a new game
  const body = [{ x: 4, y: Math.floor(h / 2) }, { x: 3, y: Math.floor(h / 2) }, { x: 2, y: Math.floor(h / 2) }];  // a three-segment snake in the middle
  return { w, h, body, dir: "right", food: placeFood(w, h, body, rng), score: 0, dead: false };  // state: food placed, score zero
}

/** One step. A turn straight back on yourself is ignored. */
export function stepSnake(s: Snake, want: Dir, rng: () => number = Math.random): Snake {  // move the snake one step
  if (s.dead) return s;  // a dead snake stays dead
  const dir = want !== OPPOSITE[s.dir] ? want : s.dir;  // ignore a reversal straight back
  const [dx, dy] = D[dir];  // the step for that direction
  const head = { x: s.body[0].x + dx, y: s.body[0].y + dy };  // where the head will be
  const eats = head.x === s.food.x && head.y === s.food.y;  // is there food on that square?
  const tail = eats ? s.body : s.body.slice(0, -1);   // the tail moves out of the way unless you grow
  if (head.x < 0 || head.y < 0 || head.x >= s.w || head.y >= s.h || tail.some(b => b.x === head.x && b.y === head.y)) return { ...s, dir, dead: true };  // hitting a wall or itself ends the game
  const body = [head, ...tail];  // new body: head first
  return { ...s, dir, body, score: s.score + (eats ? 1 : 0), food: eats ? placeFood(s.w, s.h, body, rng) : s.food };  // update score and food
}

// ------------------------------------------------------------------ 2048

export type Tiles = number[];   // 16 cells, row by row, 0 = empty

function slide(line: number[]): { line: number[]; gained: number } {  // slide one row of four tiles to the left
  const nums = line.filter(Boolean);  // drop the empty cells
  const out: number[] = [];  // merged result
  let gained = 0;  // points gained
  for (let i = 0; i < nums.length; i++) {  // walk through the tiles
    if (nums[i] === nums[i + 1]) { out.push(nums[i] * 2); gained += nums[i] * 2; i++; }  // two equal neighbours merge into one
    else out.push(nums[i]);  // otherwise keep the tile
  }
  while (out.length < 4) out.push(0);  // pad with empty cells
  return { line: out, gained };  // the new row and its points
}

export function addTile(t: Tiles, rng: () => number = Math.random): Tiles {  // add a 2 (90%) or 4 (10%) to a random empty cell
  const free = t.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);  // indexes of empty cells
  if (!free.length) return t;  // no room: unchanged
  const n = t.slice();  // copy the tiles
  n[free[Math.floor(rng() * free.length)]] = rng() < 0.9 ? 2 : 4;  // place the new tile
  return n;  // return the new tiles
}

export const newTiles = (rng: () => number = Math.random): Tiles => addTile(addTile(Array(16).fill(0), rng), rng);  // a new board with two starting tiles

export function moveTiles(t: Tiles, dir: Dir): { tiles: Tiles; gained: number; moved: boolean } {  // slide all rows or columns in a direction
  const out = t.slice();  // copy of the tiles
  let gained = 0;  // points gained
  for (let k = 0; k < 4; k++) {  // each of the four lines
    const idx = [0, 1, 2, 3].map(j => (dir === "left" ? k * 4 + j : dir === "right" ? k * 4 + 3 - j : dir === "up" ? j * 4 + k : (3 - j) * 4 + k));  // the tile indexes of that line, ordered toward the direction
    const r = slide(idx.map(i => t[i]));  // slide the line
    gained += r.gained;  // add its points
    idx.forEach((i, j) => { out[i] = r.line[j]; });  // write the line back
  }
  return { tiles: out, gained, moved: out.some((v, i) => v !== t[i]) };  // result and whether anything moved
}

export const canMoveTiles = (t: Tiles) => (["up", "down", "left", "right"] as Dir[]).some(d => moveTiles(t, d).moved);  // can any direction still move?
