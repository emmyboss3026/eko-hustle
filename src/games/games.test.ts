import { describe, expect, it } from "vitest";
import * as chess from "./chess";
import * as checkers from "./checkers";
import { HOME, chooseToken, moveToken, movable, newLudo, rollDice, trackSquare } from "./ludo";
import { canMoveTiles, conflicts, countSolutions, makeSudoku, moveTiles, newSnake, newTiles, stepSnake } from "./puzzles";

// a small repeatable random generator
const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

describe("chess", () => {
  it("has 20 first moves and no check at the start", () => {
    const b = chess.newBoard();
    expect(chess.legalMoves(b, "w")).toHaveLength(20);
    expect(chess.status(b, "w")).toBe("play");
  });
  it("finds the fool's mate", () => {
    let b = chess.newBoard();
    const mv = (from: number, to: number) => { b = chess.apply(b, { from, to }); };
    mv(53, 45); mv(12, 28); mv(54, 38); mv(3, 39);   // f3 e5 g4 Qh4#
    expect(chess.status(b, "w")).toBe("mate");
  });
  it("does not let a move leave the king in check", () => {
    const b = Array(64).fill(".");
    b[60] = "K"; b[52] = "R"; b[4] = "r"; b[0] = "k";
    const moves = chess.legalMoves(b, "w").filter(m => m.from === 52);
    expect(moves.every(m => m.to % 8 === 4)).toBe(true);   // the pinned rook can only stay on its file
  });
  it("plays a whole game against itself without breaking", () => {
    let b = chess.newBoard();
    let side: chess.Side = "w";
    const rng = seeded(7);
    for (let i = 0; i < 60; i++) {
      const m = chess.bestMove(b, side, 1, rng);
      if (!m) break;
      b = chess.apply(b, m);
      side = side === "w" ? "b" : "w";
    }
    expect(b.filter(p => p === "K")).toHaveLength(1);
    expect(b.filter(p => p === "k")).toHaveLength(1);
  });
});

describe("checkers", () => {
  it("starts with 12 pieces each and 7 moves for red", () => {
    const b = checkers.newBoard();
    expect(b.filter(p => p === "r")).toHaveLength(12);
    expect(checkers.legalMoves(b, "r")).toHaveLength(7);
  });
  it("forces a capture and keeps jumping", () => {
    const b = Array(64).fill(".");
    b[7 * 8 + 0] = "r"; b[6 * 8 + 1] = "b"; b[4 * 8 + 3] = "b"; b[5 * 8 + 6] = "r";
    const moves = checkers.legalMoves(b, "r");
    expect(moves.every(m => m.captured.length > 0)).toBe(true);
    const double = moves.find(m => m.from === 56);
    expect(double?.captured).toHaveLength(2);
    expect(checkers.apply(b, double!)[3 * 8 + 4]).toBe("r");
  });
  it("crowns a man on the far row", () => {
    const b = Array(64).fill(".");
    b[1 * 8 + 2] = "r"; b[7 * 8 + 0] = "b";
    const m = checkers.legalMoves(b, "r")[0];
    expect(checkers.apply(b, m)[m.path[0]]).toBe("R");
  });
  it("plays on until someone wins or 120 moves pass", () => {
    let b = checkers.newBoard();
    let side: checkers.Side = "r";
    const rng = seeded(3);
    for (let i = 0; i < 120; i++) {
      const m = checkers.bestMove(b, side, 2, rng);
      if (!m) break;
      b = checkers.apply(b, m);
      side = side === "r" ? "b" : "r";
    }
    expect(b.filter(p => p.toLowerCase() === "r").length + b.filter(p => p.toLowerCase() === "b").length).toBeGreaterThan(0);
  });
});

describe("ludo", () => {
  it("needs a six to leave the yard", () => {
    const g = newLudo();
    expect(movable(g, 0, 3)).toEqual([]);
    expect(movable(g, 0, 6)).toEqual([0, 1, 2, 3]);
    expect(rollDice(g, 3).turn).toBe(1);   // nothing can move: the turn passes
  });
  it("sends a lone opponent back, but not from a safe square", () => {
    let g = newLudo();
    g.tokens[0][0] = 5;                                   // track square 5
    g.tokens[1][0] = 13 - 5 + 5 - 13 + 0;                 // placeholder, set below
    g.tokens[1][0] = (5 - 13 + 52) % 52;                  // player 1 is on square 5 too
    g = { ...g, roll: 5, turn: 0 };
    g.tokens[0][0] = 0;                                   // 0 + 5 = square 5
    const after = moveToken(g, 0);
    expect(after.tokens[1][0]).toBe(-1);
    const safe = newLudo();
    safe.tokens[0][0] = 4; safe.tokens[1][0] = (8 - 13 + 52) % 52;   // square 8 is safe
    const kept = moveToken({ ...safe, roll: 4, turn: 0 }, 0);
    expect(kept.tokens[1][0]).not.toBe(-1);
  });
  it("needs the exact number to reach home", () => {
    const g = { ...newLudo(), roll: 4 };
    g.tokens[0][0] = HOME - 2;
    expect(movable(g, 0, 4)).not.toContain(0);
    expect(movable(g, 0, 2)).toContain(0);
  });
  it("a full computer game ends with a winner", () => {
    let g = newLudo();
    const rng = seeded(11);
    for (let i = 0; i < 20000 && g.winner === null; i++) {
      g = rollDice(g, 1 + Math.floor(rng() * 6));
      if (g.roll !== null) g = moveToken(g, chooseToken(g, rng));
    }
    expect(g.winner).not.toBeNull();
    expect(g.tokens[g.winner!].every(p => p === HOME)).toBe(true);
    expect(trackSquare(0, 51)).toBeNull();
  });
});

describe("sudoku", () => {
  it("makes a puzzle with exactly one solution that matches the answer", () => {
    const { puzzle, solution } = makeSudoku(40, seeded(5));
    expect(puzzle.filter(Boolean).length).toBeLessThanOrEqual(46);
    expect(countSolutions(puzzle.slice())).toBe(1);
    expect(conflicts(solution).size).toBe(0);
    puzzle.forEach((v, i) => { if (v) expect(v).toBe(solution[i]); });
  });
  it("spots a repeated number", () => {
    const g = Array(81).fill(0);
    g[0] = 5; g[8] = 5;
    expect([...conflicts(g)].sort()).toEqual([0, 8]);
  });
});

describe("snake", () => {
  it("moves, eats, grows and dies on a wall", () => {
    let s = newSnake(8, 8, seeded(1));
    s = { ...s, food: { x: s.body[0].x + 1, y: s.body[0].y } };
    s = stepSnake(s, "right");
    expect(s.score).toBe(1);
    expect(s.body).toHaveLength(4);
    for (let i = 0; i < 10; i++) s = stepSnake(s, "right");
    expect(s.dead).toBe(true);
  });
  it("ignores a turn straight back", () => {
    const s = stepSnake(newSnake(8, 8, seeded(1)), "left");
    expect(s.dir).toBe("right");
    expect(s.dead).toBe(false);
  });
});

describe("2048", () => {
  it("merges equal tiles once per move", () => {
    const t = [2, 2, 2, 2, ...Array(12).fill(0)];
    const r = moveTiles(t, "left");
    expect(r.tiles.slice(0, 4)).toEqual([4, 4, 0, 0]);
    expect(r.gained).toBe(8);
  });
  it("starts with two tiles and knows when it is stuck", () => {
    expect(newTiles(seeded(2)).filter(Boolean)).toHaveLength(2);
    const stuck = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
    expect(canMoveTiles(stuck)).toBe(false);
  });
});
