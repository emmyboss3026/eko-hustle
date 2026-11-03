import { useEffect, useRef, useState } from "react";
import type { Command, GameState } from "../../engine/game";
import { ARCADE_GAMES, ARCADE_PAID_PLAYS, arcadeLeft, arcadePrize, type ArcadeGame } from "../../engine/apps";
import { naira } from "../../engine/economy";
import { useLang } from "../../i18n/react";
import { play } from "../../lib/audio";

type Done = (score: number) => void;   // score from 0 to 100
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const shuffle = <T,>(a: T[]) => a.map(x => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map(p => p[1]);

// ------------------------------------------------------------------ Chop Match: find the pairs

const FOODS = ["🍛", "🍲", "🍗", "🥘", "🍢", "🥭", "🍌", "🍚"];

function Memory({ onDone }: { onDone: Done }) {
  const { t } = useLang();
  const [cards] = useState(() => shuffle([...FOODS, ...FOODS]));
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (found.length === cards.length && !done.current) {
      done.current = true;
      onDone(clamp(100 - (moves - 8) * 7, 10, 100));
    }
  }, [found, cards.length, moves, onDone]);

  function flip(i: number) {
    if (open.length === 2 || open.includes(i) || found.includes(i)) return;
    play("pop");
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) {
      setMoves(m => m + 1);
      if (cards[next[0]] === cards[next[1]]) { setFound(f => [...f, ...next]); setOpen([]); }
      else setTimeout(() => setOpen([]), 650);
    }
  }

  return (
    <>
      <p className="note">{t("games.memory.help")} · {t("games.moves", { n: moves })}</p>
      <div className="memory-grid">
        {cards.map((c, i) => {
          const shown = open.includes(i) || found.includes(i);
          return <button key={i} className={`memory-card ${shown ? "up" : ""} ${found.includes(i) ? "found" : ""}`} onClick={() => flip(i)} aria-label={shown ? c : t("games.card")}>{shown ? c : "❓"}</button>;
        })}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Market Maths: work out the change

type Q = { price: number; note: number; options: number[] };
function makeQuestion(): Q {
  const price = (3 + Math.floor(Math.random() * 33)) * 50;                      // ₦150 to ₦1,800
  const note = [500, 1000, 2000].find(n => n > price + 100) ?? 2000;
  const answer = note - price;
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const w = answer + (Math.floor(Math.random() * 6) - 3) * 50;
    if (w !== answer && w > 0) wrong.add(w);
  }
  return { price, note, options: shuffle([answer, ...wrong]) };
}

function Maths({ onDone }: { onDone: Done }) {
  const { t } = useLang();
  const [round, setRound] = useState(0);
  const [right, setRight] = useState(0);
  const [q, setQ] = useState(makeQuestion);
  const [flash, setFlash] = useState<"ok" | "no" | null>(null);

  function pick(o: number) {
    if (flash) return;
    const ok = o === q.note - q.price;
    play(ok ? "coin" : "pop");
    setFlash(ok ? "ok" : "no");
    const score = right + (ok ? 1 : 0);
    setTimeout(() => {
      setFlash(null);
      if (round === 4) return onDone(score * 20);
      setRight(score);
      setRound(r => r + 1);
      setQ(makeQuestion());
    }, 550);
  }

  return (
    <>
      <p className="note">{t("games.maths.round", { n: round + 1 })}</p>
      <div className={`maths-q ${flash ?? ""}`}>{t("games.maths.q", { price: naira(q.price), note: naira(q.note) })}</div>
      <div className="maths-options">
        {q.options.map(o => <button key={o} className="btn plain" onClick={() => pick(o)}>{naira(o)}</button>)}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Danfo Rush: tap the buses, not the police

const RUSH_SECONDS = 20;

function Rush({ onDone }: { onDone: Done }) {
  const { t } = useLang();
  const [left, setLeft] = useState(RUSH_SECONDS);
  const [score, setScore] = useState(0);
  const [spot, setSpot] = useState(() => ({ x: 40, y: 40, bus: true }));
  const scoreRef = useRef(0);
  const finished = useRef(false);

  const move = () => setSpot({ x: 6 + Math.random() * 78, y: 6 + Math.random() * 78, bus: Math.random() > 0.25 });

  useEffect(() => {
    const tick = setInterval(() => setLeft(l => l - 1), 1000);
    const hop = setInterval(move, 850);
    return () => { clearInterval(tick); clearInterval(hop); };
  }, []);

  useEffect(() => {
    if (left <= 0 && !finished.current) {
      finished.current = true;
      onDone(clamp(scoreRef.current * 4, 0, 100));
    }
  }, [left, onDone]);

  function tap() {
    if (left <= 0) return;
    scoreRef.current = Math.max(0, scoreRef.current + (spot.bus ? 1 : -2));
    setScore(scoreRef.current);
    play(spot.bus ? "coin" : "pop");
    move();
  }

  return (
    <>
      <p className="note">{t("games.rush.help")} · ⏱️ {Math.max(0, left)}s · ⭐ {score}</p>
      <div className="rush-field">
        {left > 0 && <button className="rush-target" style={{ left: `${spot.x}%`, top: `${spot.y}%` }} onClick={tap} aria-label={spot.bus ? t("games.rush.bus") : t("games.rush.police")}>{spot.bus ? "🚌" : "🚓"}</button>}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ the arcade

const META: Record<ArcadeGame, { emoji: string }> = { memory: { emoji: "🍛" }, maths: { emoji: "🧮" }, rush: { emoji: "🚌" } };

/** Mini-games: a few minutes of fun that lift your mood and pay a little (a few paid plays of each game per day). */
export default function GamesApp({ state, dispatch }: { state: GameState; dispatch: (c: Command) => void }) {
  const { t } = useLang();
  const [game, setGame] = useState<ArcadeGame | null>(null);
  const [result, setResult] = useState<{ game: ArcadeGame; score: number; prize: number } | null>(null);
  const [round, setRound] = useState(0);   // a new key restarts a game

  const finish = (g: ArcadeGame) => (score: number) => {
    const prize = arcadePrize(state, g, score);
    dispatch({ type: "arcade", game: g, score });
    setResult({ game: g, score, prize });
  };

  if (result) {
    return (
      <div className="arcade-result" role="status">
        <div className="arcade-big" aria-hidden>{result.score >= 80 ? "🏆" : result.score >= 40 ? "👏🏾" : "🙂"}</div>
        <h3>{t("games.score", { n: result.score })}</h3>
        <p>{result.prize > 0 ? t("games.won", { money: naira(result.prize) }) : t("games.noPrize")}</p>
        <button className="btn" onClick={() => { setResult(null); setRound(r => r + 1); }}>{t("games.again")}</button>
        <button className="btn plain" onClick={() => { setResult(null); setGame(null); }}>{t("games.menu")}</button>
      </div>
    );
  }

  if (game) {
    return (
      <>
        <button className="btn plain" onClick={() => setGame(null)}>‹ {t("games.menu")}</button>
        <h3>{META[game].emoji} {t(`games.${game}.name`)}</h3>
        {game === "memory" && <Memory key={round} onDone={finish("memory")} />}
        {game === "maths" && <Maths key={round} onDone={finish("maths")} />}
        {game === "rush" && <Rush key={round} onDone={finish("rush")} />}
      </>
    );
  }

  return (
    <>
      <p className="note">{t("games.lede", { n: ARCADE_PAID_PLAYS, top: naira(1000) })}</p>
      <div className="group">
        {ARCADE_GAMES.map(g => (
          <button key={g} className="row" onClick={() => setGame(g)}>
            <span className="row-emoji" aria-hidden>{META[g].emoji}</span>
            <span className="row-main">
              <span className="row-title">{t(`games.${g}.name`)}</span>
              <span className="note">{t(`games.${g}.blurb`)}</span>
            </span>
            <span className="row-price">{t("games.left", { n: arcadeLeft(state, g) })}</span>
          </button>
        ))}
      </div>
    </>
  );
}
