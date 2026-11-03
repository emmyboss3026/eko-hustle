// Sudoku, Snake and 2048: the rules of three solo puzzle games. Pure, so they can be tested without a screen.

// ------------------------------------------------------------------ Sudoku

export type Grid = number[];   // 81 cells, 0 = empty

function candidates(g: Grid, i: number): number[] {
  const r = Math.floor(i / 9), c = i % 9;
  const used = new Set<number>();
  for (let k = 0; k < 9; k++) { used.add(g[r * 9 + k]); used.add(g[k * 9 + c]); }
  const br = r - (r % 3), bc = c - (c % 3);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) used.add(g[(br + y) * 9 + bc + x]);
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !used.has(n));
}

/** Count solutions, stopping at `limit` (2 is enough to know a puzzle has exactly one). */
export function countSolutions(g: Grid, limit = 2): number {
  let best = -1, bestC: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (g[i]) continue;
    const c = candidates(g, i);
    if (best < 0 || c.length < bestC.length) { best = i; bestC = c; if (c.length <= 1) break; }
  }
  if (best < 0) return 1;
  let n = 0;
  for (const v of bestC) {
    g[best] = v;
    n += countSolutions(g, limit - n);
    g[best] = 0;
    if (n >= limit) break;
  }
  return n;
}

function fill(g: Grid, rng: () => number): boolean {
  let best = -1, bestC: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (g[i]) continue;
    const c = candidates(g, i);
    if (best < 0 || c.length < bestC.length) { best = i; bestC = c; }
  }
  if (best < 0) return true;
  const order = bestC.map(v => [rng(), v] as const).sort((a, b) => a[0] - b[0]).map(p => p[1]);
  for (const v of order) {
    g[best] = v;
    if (fill(g, rng)) return true;
  }
  g[best] = 0;
  return false;
}

/** A puzzle with exactly one solution. `clues` is how many numbers are given (36 is easy, 30 is harder). */
export function makeSudoku(clues = 36, rng: () => number = Math.random): { puzzle: Grid; solution: Grid } {
  const solution: Grid = Array(81).fill(0);
  fill(solution, rng);
  const puzzle = solution.slice();
  const order = Array.from({ length: 81 }, (_, i) => i).map(i => [rng(), i] as const).sort((a, b) => a[0] - b[0]).map(p => p[1]);
  let left = 81;
  for (const i of order) {
    if (left <= clues) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle.slice()) !== 1) puzzle[i] = keep;
    else left--;
  }
  return { puzzle, solution };
}

/** Cells that break a rule (the same number twice in a row, column or box). */
export function conflicts(g: Grid): Set<number> {
  const bad = new Set<number>();
  const check = (cells: number[]) => {
    const seen = new Map<number, number>();
    for (const i of cells) {
      if (!g[i]) continue;
      if (seen.has(g[i])) { bad.add(i); bad.add(seen.get(g[i])!); } else seen.set(g[i], i);
    }
  };
  for (let a = 0; a < 9; a++) {
    check(Array.from({ length: 9 }, (_, k) => a * 9 + k));
    check(Array.from({ length: 9 }, (_, k) => k * 9 + a));
    const br = Math.floor(a / 3) * 3, bc = (a % 3) * 3;
    check(Array.from({ length: 9 }, (_, k) => (br + Math.floor(k / 3)) * 9 + bc + (k % 3)));
  }
  return bad;
}

// ------------------------------------------------------------------ Snake

export type Dir = "up" | "down" | "left" | "right";
export type Snake = { w: number; h: number; body: { x: number; y: number }[]; dir: Dir; food: { x: number; y: number }; score: number; dead: boolean };
const D: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

function placeFood(w: number, h: number, body: { x: number; y: number }[], rng: () => number) {
  const free: { x: number; y: number }[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!body.some(b => b.x === x && b.y === y)) free.push({ x, y });
  return free.length ? free[Math.floor(rng() * free.length)] : { x: -1, y: -1 };
}

export function newSnake(w = 16, h = 16, rng: () => number = Math.random): Snake {
  const body = [{ x: 4, y: Math.floor(h / 2) }, { x: 3, y: Math.floor(h / 2) }, { x: 2, y: Math.floor(h / 2) }];
  return { w, h, body, dir: "right", food: placeFood(w, h, body, rng), score: 0, dead: false };
}

/** One step. A turn straight back on yourself is ignored. */
export function stepSnake(s: Snake, want: Dir, rng: () => number = Math.random): Snake {
  if (s.dead) return s;
  const dir = want !== OPPOSITE[s.dir] ? want : s.dir;
  const [dx, dy] = D[dir];
  const head = { x: s.body[0].x + dx, y: s.body[0].y + dy };
  const eats = head.x === s.food.x && head.y === s.food.y;
  const tail = eats ? s.body : s.body.slice(0, -1);   // the tail moves out of the way unless you grow
  if (head.x < 0 || head.y < 0 || head.x >= s.w || head.y >= s.h || tail.some(b => b.x === head.x && b.y === head.y)) return { ...s, dir, dead: true };
  const body = [head, ...tail];
  return { ...s, dir, body, score: s.score + (eats ? 1 : 0), food: eats ? placeFood(s.w, s.h, body, rng) : s.food };
}

// ------------------------------------------------------------------ 2048

export type Tiles = number[];   // 16 cells, row by row, 0 = empty

function slide(line: number[]): { line: number[]; gained: number } {
  const nums = line.filter(Boolean);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === nums[i + 1]) { out.push(nums[i] * 2); gained += nums[i] * 2; i++; }
    else out.push(nums[i]);
  }
  while (out.length < 4) out.push(0);
  return { line: out, gained };
}

export function addTile(t: Tiles, rng: () => number = Math.random): Tiles {
  const free = t.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
  if (!free.length) return t;
  const n = t.slice();
  n[free[Math.floor(rng() * free.length)]] = rng() < 0.9 ? 2 : 4;
  return n;
}

export const newTiles = (rng: () => number = Math.random): Tiles => addTile(addTile(Array(16).fill(0), rng), rng);

export function moveTiles(t: Tiles, dir: Dir): { tiles: Tiles; gained: number; moved: boolean } {
  const out = t.slice();
  let gained = 0;
  for (let k = 0; k < 4; k++) {
    const idx = [0, 1, 2, 3].map(j => (dir === "left" ? k * 4 + j : dir === "right" ? k * 4 + 3 - j : dir === "up" ? j * 4 + k : (3 - j) * 4 + k));
    const r = slide(idx.map(i => t[i]));
    gained += r.gained;
    idx.forEach((i, j) => { out[i] = r.line[j]; });
  }
  return { tiles: out, gained, moved: out.some((v, i) => v !== t[i]) };
}

export const canMoveTiles = (t: Tiles) => (["up", "down", "left", "right"] as Dir[]).some(d => moveTiles(t, d).moved);
