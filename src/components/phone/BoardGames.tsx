// The phone's bigger games: Chess, Checkers, Ludo, Sudoku, Snake and 2048. The rules live in src/games/; this file is only
// the board, the taps and the pictures. Each game calls onDone(score from 0 to 100) when it ends.
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useLang } from "../../i18n/react";
import { play } from "../../lib/audio";
import * as chess from "../../games/chess";
import * as checkers from "../../games/checkers";
import { HOME, TOKENS, chooseToken, movable, moveToken, newLudo, rollDice, type Ludo } from "../../games/ludo";
import { canMoveTiles, conflicts, makeSudoku, moveTiles, addTile, newSnake, newTiles, stepSnake, type Dir } from "../../games/puzzles";

type Done = (score: number) => void;   // score from 0 to 100
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Turns a swipe on the element into a direction. */
function useSwipe(onDir: (d: Dir) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: PointerEvent) => { start.current = { x: e.clientX, y: e.clientY }; },
    onPointerUp: (e: PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.clientX - s.x, dy = e.clientY - s.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      onDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
    },
  };
}

const KEY_DIR: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };

function DPad({ onDir }: { onDir: (d: Dir) => void }) {
  return (
    <div className="dpad" aria-hidden>
      <button className="up" onClick={() => onDir("up")}>▲</button>
      <button className="left" onClick={() => onDir("left")}>◀</button>
      <button className="right" onClick={() => onDir("right")}>▶</button>
      <button className="down" onClick={() => onDir("down")}>▼</button>
    </div>
  );
}

// ------------------------------------------------------------------ Chess

export function Chess({ onDone }: { onDone: Done }) {
  const { t } = useLang();
  const [board, setBoard] = useState(chess.newBoard);
  const [turn, setTurn] = useState<chess.Side>("w");
  const [sel, setSel] = useState<number | null>(null);
  const [last, setLast] = useState<chess.Move | null>(null);
  const over = useRef(false);

  const st = chess.status(board, turn);
  const legal = useMemo(() => (turn === "w" ? chess.legalMoves(board, "w") : []), [board, turn]);
  const targets = sel === null ? [] : legal.filter(m => m.from === sel).map(m => m.to);

  useEffect(() => {
    if (over.current) return;
    if (st === "mate") { over.current = true; setTimeout(() => onDone(turn === "b" ? 100 : 20), 900); return; }
    if (st === "stalemate") { over.current = true; setTimeout(() => onDone(50), 900); return; }
    if (turn === "b") {
      const id = setTimeout(() => {
        const m = chess.bestMove(board, "b", 2);
        if (!m) return;
        play("pop");
        setBoard(chess.apply(board, m));
        setLast(m);
        setTurn("w");
      }, 450);
      return () => clearTimeout(id);
    }
  }, [board, turn, st, onDone]);

  function tap(i: number) {
    if (turn !== "w" || over.current) return;
    if (sel !== null && targets.includes(i)) {
      const m = { from: sel, to: i };
      play("coin");
      setBoard(chess.apply(board, m));
      setLast(m);
      setSel(null);
      setTurn("b");
    } else setSel(chess.sideOf(board[i]) === "w" ? i : null);
  }

  return (
    <>
      <p className="note">{st === "mate" ? t(turn === "b" ? "games.win" : "games.lose") : st === "stalemate" ? t("games.draw") : turn === "w" ? (st === "check" ? t("games.check") : t("games.yourMove")) : t("games.thinking")}</p>
      <div className="bg-board chess">
        {board.map((p, i) => (
          <button key={i} className={`sq ${(i + (i >> 3)) % 2 ? "dark" : "light"} ${sel === i ? "sel" : ""} ${targets.includes(i) ? "target" : ""} ${last && (last.from === i || last.to === i) ? "last" : ""} ${chess.sideOf(p) === "w" ? "white-piece" : "black-piece"}`} onClick={() => tap(i)} aria-label={p}>
            {p !== "." ? chess.GLYPH[p] : ""}
          </button>
        ))}
      </div>
      <button className="btn plain" onClick={() => { if (!over.current) { over.current = true; onDone(10); } }}>{t("games.giveUp")}</button>
    </>
  );
}

// ------------------------------------------------------------------ Checkers

export function Checkers({ onDone }: { onDone: Done }) {
  const { t } = useLang();
  const [board, setBoard] = useState(checkers.newBoard);
  const [turn, setTurn] = useState<checkers.Side>("r");
  const [sel, setSel] = useState<number | null>(null);
  const over = useRef(false);

  const moves = useMemo(() => checkers.legalMoves(board, turn), [board, turn]);
  const mine = turn === "r" ? moves : [];
  const targets = sel === null ? [] : mine.filter(m => m.from === sel).map(m => m.path[m.path.length - 1]);
  const mustCapture = mine.some(m => m.captured.length > 0);

  useEffect(() => {
    if (over.current) return;
    const w = checkers.winner(board, turn);
    if (w) { over.current = true; setTimeout(() => onDone(w === "r" ? 100 : 20), 900); return; }
    if (turn === "b") {
      const id = setTimeout(() => {
        const m = checkers.bestMove(board, "b", 4);
        if (!m) return;
        play("pop");
        setBoard(checkers.apply(board, m));
        setTurn("r");
      }, 550);
      return () => clearTimeout(id);
    }
  }, [board, turn, onDone]);

  function tap(i: number) {
    if (turn !== "r" || over.current) return;
    if (sel !== null && targets.includes(i)) {
      const m = mine.find(x => x.from === sel && x.path[x.path.length - 1] === i)!;
      play("coin");
      setBoard(checkers.apply(board, m));
      setSel(null);
      setTurn("b");
    } else setSel(mine.some(m => m.from === i) ? i : null);
  }

  return (
    <>
      <p className="note">{turn === "r" ? (mustCapture ? t("games.mustJump") : t("games.yourMove")) : t("games.thinking")} · 🔴 {board.filter(p => p.toLowerCase() === "r").length} ⚫ {board.filter(p => p.toLowerCase() === "b").length}</p>
      <div className="bg-board checkers">
        {board.map((p, i) => {
          const dark = ((i >> 3) + (i & 7)) % 2 === 1;
          return (
            <button key={i} className={`sq ${dark ? "dark" : "light"} ${sel === i ? "sel" : ""} ${targets.includes(i) ? "target" : ""}`} onClick={() => tap(i)} disabled={!dark} aria-label={p}>
              {p !== "." && <span className={`disc ${checkers.sideOf(p) === "r" ? "red" : "black"} ${p === "R" || p === "B" ? "king" : ""}`}>{p === "R" || p === "B" ? "♛" : ""}</span>}
            </button>
          );
        })}
      </div>
      <button className="btn plain" onClick={() => { if (!over.current) { over.current = true; onDone(10); } }}>{t("games.giveUp")}</button>
    </>
  );
}

// ------------------------------------------------------------------ Ludo

// The 52 squares of the shared track as [row, col] on a 15 × 15 board, clockwise from the first player's start square
const TRACK: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0],
];
const LANE: [number, number][][] = [
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
];
const YARD: [number, number][][] = [
  [[2, 2], [2, 4], [4, 2], [4, 4]], [[2, 10], [2, 12], [4, 10], [4, 12]],
  [[10, 10], [10, 12], [12, 10], [12, 12]], [[10, 2], [10, 4], [12, 2], [12, 4]],
];
const CENTRE: [number, number][] = [[6.6, 6.6], [6.6, 8.4], [8.4, 8.4], [8.4, 6.6]];
const LUDO_COLOURS = ["#e53935", "#43a047", "#fbc02d", "#1e88e5"];
const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function cellOf(player: number, progress: number, i: number): [number, number] {
  if (progress < 0) return YARD[player][i];
  if (progress === HOME) return CENTRE[player];
  if (progress > 50) return LANE[player][progress - 51];
  return TRACK[(player * 13 + progress) % 52];
}

export function LudoGame({ onDone }: { onDone: Done }) {
  const { t } = useLang();
  const [g, setG] = useState<Ludo>(newLudo);
  const [dice, setDice] = useState(0);
  const [rolling, setRolling] = useState(false);
  const over = useRef(false);

  const roll = useCallback(() => {
    setRolling(true);
    play("pop");
    setTimeout(() => {
      const v = 1 + Math.floor(Math.random() * 6);
      setDice(v);
      setG(x => rollDice(x, v));
      setRolling(false);
    }, 450);
  }, []);

  // the computer players roll and move on their own
  useEffect(() => {
    if (g.winner !== null || g.turn === 0 || rolling) return;
    const id = setTimeout(() => {
      if (g.roll === null) roll();
      else setG(x => moveToken(x, chooseToken(x)));
    }, 650);
    return () => clearTimeout(id);
  }, [g, rolling, roll]);

  useEffect(() => {
    if (g.winner === null || over.current) return;
    over.current = true;
    const myHome = g.tokens[0].filter(p => p === HOME).length;
    setTimeout(() => onDone(g.winner === 0 ? 100 : clamp(10 + myHome * 18, 10, 80)), 1200);
  }, [g.winner, g.tokens, onDone]);

  const canMove = g.turn === 0 && g.roll !== null ? movable(g, 0, g.roll) : [];
  const stacks = new Map<string, number>();
  const pieces = g.tokens.flatMap((ts, p) => ts.map((prog, i) => {
    const [r, c] = cellOf(p, prog, i);
    const k = `${r},${c}`;
    const n = stacks.get(k) ?? 0;
    stacks.set(k, n + 1);
    return { p, i, r, c, n, prog };
  }));

  return (
    <>
      <p className="note">
        {g.winner !== null ? t(g.winner === 0 ? "games.win" : "games.lose")
          : g.turn === 0 ? (g.roll === null ? t("games.ludo.roll") : canMove.length ? t("games.ludo.pick") : "") : t("games.ludo.wait", { n: g.turn })}
      </p>
      <div className="ludo">
        <div className="ludo-yards">
          {LUDO_COLOURS.map((c, p) => <span key={p} className="yard" style={{ background: c, gridRow: p < 2 ? "1 / 7" : "10 / 16", gridColumn: p === 0 || p === 3 ? "1 / 7" : "10 / 16" }} />)}
        </div>
        {TRACK.map(([r, c], i) => <span key={i} className={`lcell ${[0, 13, 26, 39].includes(i) ? "start" : [8, 21, 34, 47].includes(i) ? "star" : ""}`} style={{ gridRow: r + 1, gridColumn: c + 1, ...([0, 13, 26, 39].includes(i) ? { background: LUDO_COLOURS[i / 13] } : {}) }}>{[8, 21, 34, 47].includes(i) ? "★" : ""}</span>)}
        {LANE.map((cells, p) => cells.map(([r, c], i) => <span key={`${p}${i}`} className="lcell lane" style={{ gridRow: r + 1, gridColumn: c + 1, background: LUDO_COLOURS[p] }} />))}
        <span className="ludo-home" />
        {pieces.map(({ p, i, r, c, n, prog }) => (
          <button key={`${p}-${i}`} className={`ltoken ${p === 0 && canMove.includes(i) ? "can" : ""}`} disabled={!(p === 0 && canMove.includes(i))}
            style={{ background: LUDO_COLOURS[p], left: `${(c + 0.5) / 15 * 100 + n * 1.2}%`, top: `${(r + 0.5) / 15 * 100 - n * 1.2}%`, zIndex: prog < 0 ? 1 : 2 + n }}
            onClick={() => { play("coin"); setG(x => moveToken(x, i)); }} aria-label={t("games.ludo.token", { n: i + 1 })} />
        ))}
      </div>
      <div className="ludo-bar">
        <span className="ludo-turn" style={{ background: LUDO_COLOURS[g.turn] }} aria-hidden />
        <button className={`dice ${rolling ? "rolling" : ""}`} disabled={g.turn !== 0 || g.roll !== null || rolling || g.winner !== null} onClick={roll} aria-label={t("games.ludo.rollBtn")}>{rolling ? "🎲" : dice ? FACES[dice - 1] : "🎲"}</button>
        <span className="note">{t("games.ludo.home", { n: g.tokens[0].filter(p => p === HOME).length, total: TOKENS })}</span>
      </div>
      <button className="btn plain" onClick={() => { if (!over.current) { over.current = true; onDone(10); } }}>{t("games.giveUp")}</button>
    </>
  );
}

// ------------------------------------------------------------------ Sudoku

export function Sudoku({ onDone }: { onDone: Done }) {
  const { t } = useLang();
  const [{ puzzle, solution }] = useState(() => makeSudoku(38));
  const [grid, setGrid] = useState(puzzle);
  const [sel, setSel] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [secs, setSecs] = useState(0);
  const over = useRef(false);

  useEffect(() => { const id = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(id); }, []);
  const bad = useMemo(() => conflicts(grid), [grid]);

  function put(n: number) {
    if (sel === null || puzzle[sel] || over.current) return;
    const next = grid.slice();
    next[sel] = n;
    if (n && n !== solution[sel]) { setMistakes(m => m + 1); play("pop"); } else play("coin");
    setGrid(next);
    if (next.every((v, i) => v === solution[i])) {
      over.current = true;
      setTimeout(() => onDone(clamp(100 - mistakes * 8 - Math.floor(secs / 15), 20, 100)), 700);
    }
  }

  const mm = String(Math.floor(secs / 60)).padStart(2, "0"), ss = String(secs % 60).padStart(2, "0");
  return (
    <>
      <p className="note">⏱️ {mm}:{ss} · {t("games.mistakes", { n: mistakes })}</p>
      <div className="sudoku">
        {grid.map((v, i) => {
          const r = Math.floor(i / 9), c = i % 9;
          const peer = sel !== null && (Math.floor(sel / 9) === r || sel % 9 === c || (Math.floor(sel / 27) === Math.floor(r / 3) && Math.floor((sel % 9) / 3) === Math.floor(c / 3)));
          return (
            <button key={i} className={`scell ${puzzle[i] ? "given" : ""} ${sel === i ? "sel" : peer ? "peer" : ""} ${bad.has(i) || (v && v !== solution[i]) ? "bad" : ""} ${c % 3 === 2 && c < 8 ? "rb" : ""} ${r % 3 === 2 && r < 8 ? "bb" : ""}`} onClick={() => setSel(i)}>{v || ""}</button>
          );
        })}
      </div>
      <div className="numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <button key={n} className="btn plain" onClick={() => put(n)}>{n}</button>)}
        <button className="btn plain" onClick={() => put(0)} aria-label={t("games.erase")}>⌫</button>
      </div>
      <button className="btn plain" onClick={() => { if (!over.current) { over.current = true; onDone(10); } }}>{t("games.giveUp")}</button>
    </>
  );
}

// ------------------------------------------------------------------ Snake

export function SnakeGame({ onDone }: { onDone: Done }) {
  const { t } = useLang();
  const [s, setS] = useState(() => newSnake(16, 16));
  const want = useRef<Dir>("right");
  const over = useRef(false);

  const turn = useCallback((d: Dir) => { want.current = d; }, []);
  const swipe = useSwipe(turn);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { const d = KEY_DIR[e.key]; if (d) { e.preventDefault(); want.current = d; } };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, []);

  useEffect(() => {
    if (s.dead) {
      if (!over.current) { over.current = true; play("pop"); setTimeout(() => onDone(clamp(s.score * 8, 0, 100)), 900); }
      return;
    }
    const id = setTimeout(() => setS(x => stepSnake(x, want.current)), Math.max(70, 150 - s.score * 4));
    return () => clearTimeout(id);
  }, [s, onDone]);

  useEffect(() => { if (s.score) play("coin"); }, [s.score]);

  const cells = useMemo(() => {
    const m = new Map<number, string>();
    s.body.forEach((b, i) => m.set(b.y * s.w + b.x, i === 0 ? "head" : "body"));
    m.set(s.food.y * s.w + s.food.x, "food");
    return m;
  }, [s]);

  return (
    <>
      <p className="note">{t("games.snake.help")} · 🍎 {s.score}</p>
      <div className="snake" style={{ gridTemplateColumns: `repeat(${s.w}, 1fr)` }} {...swipe}>
        {Array.from({ length: s.w * s.h }, (_, i) => <span key={i} className={`snk ${cells.get(i) ?? ""}`}>{cells.get(i) === "food" ? "🍎" : ""}</span>)}
      </div>
      <DPad onDir={turn} />
    </>
  );
}

// ------------------------------------------------------------------ 2048

export function Game2048({ onDone }: { onDone: Done }) {
  const { t } = useLang();
  const [tiles, setTiles] = useState(() => newTiles());
  const [score, setScore] = useState(0);
  const over = useRef(false);

  const live = useRef(tiles);   // the board as of the latest move, so quick swipes never act on an old one
  const go = useCallback((d: Dir) => {
    if (over.current) return;
    const r = moveTiles(live.current, d);
    if (!r.moved) return;
    live.current = addTile(r.tiles);
    setTiles(live.current);
    setScore(sc => sc + r.gained);
    play(r.gained ? "coin" : "pop");
  }, []);
  const swipe = useSwipe(go);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { const d = KEY_DIR[e.key]; if (d) { e.preventDefault(); go(d); } };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [go]);

  const stuck = !canMoveTiles(tiles);
  const finish = useCallback(() => {
    if (over.current) return;
    over.current = true;
    onDone(clamp(Math.round(score / 60), 5, 100));
  }, [onDone, score]);
  useEffect(() => { if (stuck) { const id = setTimeout(finish, 1000); return () => clearTimeout(id); } }, [stuck, finish]);

  return (
    <>
      <p className="note">{t("games.g2048.help")} · ⭐ {score}</p>
      <div className="board2048" {...swipe}>
        {tiles.map((v, i) => <span key={i} className={`tile t${Math.min(v, 4096)}`}>{v || ""}</span>)}
      </div>
      <DPad onDir={go} />
      <button className="btn plain" onClick={finish}>{t("games.finish")}</button>
    </>
  );
}
