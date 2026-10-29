import { useCallback, useEffect, useState } from "react";
import type { GameState } from "../../engine/game";
import { naira } from "../../engine/economy";
import { achievements, level, score, STATUS, statusTier, netWorth, reputation, ACHIEVEMENTS } from "../../engine/progress";
import { fetchBoard, setBoardName, type Board, type BoardResult, type BoardRow } from "../../lib/board";
import { cloudEnabled } from "../../lib/supabase";
import { useLang } from "../../i18n/react";

const BOARDS: { id: Board; emoji: string }[] = [
  { id: "global", emoji: "🌍" },
  { id: "wealth", emoji: "💰" },
  { id: "status", emoji: "👑" },
  { id: "weekly", emoji: "📅" },
  { id: "friends", emoji: "🤝🏾" },
];

const MEDAL = ["🥇", "🥈", "🥉"];
const REFRESH_MS = 30_000;

/** 🏆 Leaderboard: everyone's ranks, worked out on the server. */
export default function BoardApp({ state, userId }: { state: GameState; userId: string | null }) {
  const { t } = useLang();
  const [board, setBoard] = useState<Board>("global");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<BoardResult | null>(null);
  const [peek, setPeek] = useState<BoardRow | null>(null);
  const [name, setName] = useState("");
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [mine, setMine] = useState(false);

  const load = useCallback(async () => {
    if (board === "friends") return;
    setResult(await fetchBoard(board, query));
  }, [board, query]);

  useEffect(() => {
    setResult(null);
    void load();
    const id = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  // Search a moment after typing stops
  useEffect(() => {
    const id = setTimeout(() => setQuery(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  const tier = statusTier(state);
  const value = (r: BoardRow) =>
    board === "wealth" ? naira(r.net_worth)
    : board === "status" ? `${STATUS[r.status]?.emoji ?? ""} ${r.reputation}`
    : board === "weekly" ? `+${r.week_score.toLocaleString()}`
    : r.score.toLocaleString();

  const row = (r: BoardRow, sticky = false) => (
    <button key={`${r.rank}-${r.name}-${sticky}`} className={`board-row ${r.is_me ? "me" : ""} ${r.rank <= 3 ? `top top${r.rank}` : ""} ${sticky ? "sticky" : ""}`} onClick={() => setPeek(r)}>
      <span className="board-rank">{r.rank <= 3 ? MEDAL[r.rank - 1] : r.rank}</span>
      <span className="board-face" aria-hidden>{r.avatar || "🙂"}</span>
      <span className="board-main">
        <b>{r.name}{r.is_me ? ` (${t("board.you")})` : ""}</b>
        <small>{t("phone.level", { level: r.level })} · {STATUS[r.status]?.emoji} {t(STATUS[r.status]?.key ?? "status.0")} · 🏅 {r.achievements}</small>
      </span>
      <span className="board-value">{value(r)}</span>
    </button>
  );

  return (
    <>
      {/* Your numbers right now (what the server will see next time it updates) */}
      <div className="board-me-card">
        <span className="board-face big" aria-hidden>{state.sim.avatar}</span>
        <div>
          <b>{state.sim.name}</b>
          <small>{t("phone.level", { level: level(state) })} · {STATUS[tier].emoji} {t(STATUS[tier].key)}</small>
          <small>⭐ {reputation(state)} · 💰 {naira(netWorth(state))} · 🏅 {achievements(state).length}/{ACHIEVEMENTS.length}</small>
        </div>
        <div className="board-score"><small>{t("board.score")}</small><b>{score(state).toLocaleString()}</b></div>
      </div>
      <button className="btn plain block" aria-expanded={mine} onClick={() => setMine(m => !m)}>🏅 {t("board.achievements")}</button>
      {mine && (
        <div className="ach-grid">
          {ACHIEVEMENTS.map(a => {
            const done = a.done(state);
            return (
              <div key={a.id} className={`ach ${done ? "done" : ""}`} title={t(`ach.${a.id}.desc`)}>
                <span aria-hidden>{done ? a.emoji : "🔒"}</span>
                <b>{t(`ach.${a.id}.name`)}</b>
                <small>{t(`ach.${a.id}.desc`)}</small>
              </div>
            );
          })}
        </div>
      )}

      <div className="seg board-tabs" role="tablist" aria-label={t("board.boards")}>
        {BOARDS.map(b => (
          <button key={b.id} role="tab" aria-selected={board === b.id} onClick={() => setBoard(b.id)}>
            <span aria-hidden>{b.emoji}</span> {t(`board.tab.${b.id}`)}
          </button>
        ))}
      </div>
      <p className="note">{t(`board.about.${board}`)}</p>

      {board === "friends" ? (
        <p className="note pad">{t("board.friendsSoon")}</p>
      ) : !cloudEnabled ? (
        <p className="note pad">{t("board.off")}</p>
      ) : (
        <>
          <label className="field search">
            <span className="sr">{t("board.search")}</span>
            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={`🔍 ${t("board.search")}`} maxLength={20} />
          </label>
          {result === null && <p className="note pad">{t("ui.loading")}</p>}
          {result && "error" in result && (
            <div className="note pad">
              <p>{t(`board.err.${result.error}`)}</p>
              <button className="btn plain" onClick={() => void load()}>{t("board.retry")}</button>
            </div>
          )}
          {result && "rows" in result && (
            <>
              {result.rows.length === 0 && <p className="note pad">{t(query ? "board.noMatch" : "board.empty")}</p>}
              <div className="board-list">{result.rows.map(r => row(r))}</div>
              {result.me && !result.rows.some(r => r.is_me) && (
                <>
                  <div className="board-gap">⋯</div>
                  {row(result.me, true)}
                </>
              )}
              {!userId && <p className="note">{t("board.signIn")}</p>}
              <p className="note">{t("board.auto")}</p>
            </>
          )}

          {userId && (
            <form className="board-name" onSubmit={async e => {
              e.preventDefault();
              const ok = await setBoardName(userId, name);
              setNameMsg(ok ? "board.nameSaved" : "board.nameBad");
            }}>
              <label className="field">
                {t("board.name")}
                <input value={name} onChange={e => setName(e.target.value)} maxLength={20} placeholder={state.sim.name} />
              </label>
              <button className="btn plain" disabled={name.trim().length < 2}>{t("board.saveName")}</button>
              <small className="note">{nameMsg ? t(nameMsg) : t("board.nameRules")}</small>
            </form>
          )}
        </>
      )}

      {peek && (
        <div className="peek" role="dialog" aria-label={peek.name} onClick={() => setPeek(null)}>
          <div className="peek-card" onClick={e => e.stopPropagation()}>
            <span className="board-face huge" aria-hidden>{peek.avatar || "🙂"}</span>
            <h3>{peek.rank <= 3 ? MEDAL[peek.rank - 1] : `#${peek.rank}`} {peek.name}</h3>
            <dl>
              <dt>{t("board.level")}</dt><dd>{peek.level}</dd>
              <dt>{t("board.status")}</dt><dd>{STATUS[peek.status]?.emoji} {t(STATUS[peek.status]?.key ?? "status.0")}</dd>
              <dt>{t("board.rep")}</dt><dd>⭐ {peek.reputation}</dd>
              <dt>{t("board.worth")}</dt><dd>{naira(peek.net_worth)}</dd>
              <dt>{t("board.ach")}</dt><dd>🏅 {peek.achievements}</dd>
              <dt>{t("board.job")}</dt><dd>{peek.career || "—"}</dd>
              <dt>{t("board.gameDay")}</dt><dd>{peek.game_day}</dd>
              <dt>{t("board.score")}</dt><dd><b>{peek.score.toLocaleString()}</b></dd>
              <dt>{t("board.week")}</dt><dd>+{peek.week_score.toLocaleString()}</dd>
            </dl>
            <button className="btn block" onClick={() => setPeek(null)}>{t("ui.close")}</button>
          </div>
        </div>
      )}
    </>
  );
}
