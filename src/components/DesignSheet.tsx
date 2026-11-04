// Furnished home designs: a showroom of ready-made homes (walls, floors and furniture) with a drawing of the layout for each floor.
import { useMemo, useState } from "react";
import type { Command, GameState } from "../engine/game";
import { DESIGNS, type Design } from "../data/designs";
import { CATALOG, flatSize, homePlan, upperPlan, wingLevel, type Placed } from "../data/home";
import { designEdges, layoutFor } from "../engine/designs";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";

const TINT = (type: string) => (CATALOG[type as keyof typeof CATALOG]?.walkable ? "#d9c9f2" : ["bed", "kingbed", "mattress"].includes(type) ? "#bcd7f5" : ["fridge", "burner", "island", "shower", "bucket", "toilet"].includes(type) ? "#c8e6c9" : ["sofa", "leathersofa", "armchair", "chair", "dining", "coffeetable", "tvstand", "tv", "ottoman"].includes(type) ? "#ffe0b2" : "#f5d0d8");

/** A drawing of one floor: rooms, walls, doorways, the stairs and every piece of furniture with its picture. */
function Floor({ plan, objects, label }: { plan: ReturnType<typeof homePlan>; objects: Placed[]; label: string }) {
  const n = plan.size;
  return (
    <figure className="design-floor">
      <svg viewBox={`-0.4 -0.4 ${n + 0.8} ${n + 0.8}`} role="img" aria-label={label}>
        <rect x="0" y="0" width={n} height={n} fill="#fffaf0" stroke="#241a6b" strokeWidth="0.3" />
        {plan.rooms.map(r => <rect key={r.name} x={r.x0} y={r.y0} width={r.x1 - r.x0} height={r.y1 - r.y0} fill={r.floor} opacity="0.55" />)}
        {plan.stairs?.tiles.map(t => <rect key={`${t.x}${t.y}`} x={t.x} y={t.y} width="1" height="1" fill="#8d6e63" stroke="#5d4037" strokeWidth="0.06" />)}
        {objects.map(o => {
          const w = (o.rot ?? 0) % 2 ? CATALOG[o.type].d : CATALOG[o.type].w, d = (o.rot ?? 0) % 2 ? CATALOG[o.type].w : CATALOG[o.type].d;
          return (
            <g key={o.uid}>
              <rect x={o.x + 0.06} y={o.y + 0.06} width={w - 0.12} height={d - 0.12} rx="0.18" fill={TINT(o.type)} stroke="#6b5b8a" strokeWidth="0.05" />
              <text x={o.x + w / 2} y={o.y + d / 2 + 0.28} fontSize="0.8" textAnchor="middle">{CATALOG[o.type].emoji}</text>
            </g>
          );
        })}
        {plan.walls.flatMap(w => {
          const cells = Array.from({ length: w.to - w.from }, (_, k) => w.from + k).filter(i => !w.doors.includes(i));
          return cells.map(i => w.axis === "v"
            ? <line key={`v${w.at}-${i}`} x1={w.at} y1={i} x2={w.at} y2={i + 1} stroke="#241a6b" strokeWidth="0.26" strokeLinecap="square" />
            : <line key={`h${w.at}-${i}`} x1={i} y1={w.at} x2={i + 1} y2={w.at} stroke="#241a6b" strokeWidth="0.26" strokeLinecap="square" />);
        })}
        <rect x={plan.door.x + 0.1} y={plan.door.y + 0.78} width="0.8" height="0.22" fill="#ff7043" />
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export default function DesignSheet({ state, dispatch }: { state: GameState; dispatch: (c: Command) => void }) {
  const { t, tx } = useLang();
  const level = wingLevel(state.property);
  const floor2 = !!state.property?.floor2;
  const [open, setOpen] = useState<string | null>(null);
  const [ask, setAsk] = useState<string | null>(null);   // the design waiting for "yes, buy it" (browsers can block confirm(), so this is on screen)
  const [done, setDone] = useState<string | null>(null);
  const keep = useMemo(() => state.home.objects.filter(o => CATALOG[o.type].fixed), [state.home.objects]);
  const refund = state.home.objects.filter(o => !CATALOG[o.type].fixed).reduce((s, o) => s + Math.round(CATALOG[o.type].price * 0.5), 0);

  const card = (d: Design) => {
    const locked = level < d.minLevel;
    const names = tx.design(d.id);
    const lay = locked ? null : layoutFor(d, level, floor2, keep);
    const pieces = lay ? lay.ground.length + lay.upper.length : 0;
    const shown = open === d.id;
    const buy = () => {
      if (!lay) return;
      dispatch({ type: "design", id: d.id });
      setAsk(null);
      setDone(d.id);
    };
    const short = lay ? lay.price - refund - state.money : 0;
    return (
      <div className={`design-card ${locked ? "locked" : ""}`} key={d.id}>
        <button className="design-head" onClick={() => setOpen(shown ? null : d.id)} aria-expanded={shown}>
          <span className="design-emoji" aria-hidden>{d.emoji}</span>
          <span className="design-title"><b>{names.name}</b><small>{names.desc}</small></span>
          <span className="design-price">{lay ? naira(lay.price) : t("designs.needs", { level: d.minLevel })}</span>
        </button>
        {shown && lay && (
          <div className="design-body">
            <div className="design-floors">
              <Floor plan={homePlan(level, designEdges(d, level), undefined, floor2)} objects={lay.ground} label={t("designs.ground")} />
              {floor2 && d.upper && <Floor plan={upperPlan(level)} objects={lay.upper} label={t("designs.upstairs")} />}
            </div>
            <ul className="design-list">
              {Object.entries([...lay.ground, ...lay.upper].reduce<Record<string, number>>((m, o) => ({ ...m, [o.type]: (m[o.type] ?? 0) + 1 }), {})).map(([type, n]) => (
                <li key={type}><span>{CATALOG[type as keyof typeof CATALOG].emoji} {n > 1 ? `${n} × ` : ""}{tx.furniture(type as never)}</span><b>{naira(CATALOG[type as keyof typeof CATALOG].price * n)}</b></li>
              ))}
            </ul>
            <div className="design-sum">
              <span>{t("designs.furniture", { n: pieces })}</span><b>{naira(lay.value)}</b>
              <span>{t("designs.fee")}</span><b>{naira(d.fee)}</b>
              <span>{t("designs.refund")}</span><b>−{naira(refund)}</b>
              <span><b>{t("designs.total")}</b></span><b>{naira(Math.max(0, lay.price - refund))}</b>
            </div>
            {!floor2 && d.upper && <p className="note">{t("designs.upNote")}</p>}
            {done === d.id && <p className="design-done" role="status">✅ {t("designs.bought", { name: names.name })}</p>}
            {short > 0 && <p className="note bad">{t("designs.short", { money: naira(short) })}</p>}
            {ask === d.id ? (
              <div className="design-ask" role="alertdialog">
                <p>{t("designs.confirm", { name: names.name, price: naira(lay.price), refund: naira(refund) })}</p>
                <div className="btn-row"><button className="btn big" onClick={buy}>✓ {t("designs.yes")}</button><button className="btn plain" onClick={() => setAsk(null)}>{t("designs.no")}</button></div>
              </div>
            ) : (
              <button className="btn big block" disabled={short > 0} onClick={() => { setDone(null); setAsk(d.id); }}>{t("designs.buy", { price: naira(lay.price) })}</button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <p className="note">{t("designs.lede", { n: flatSize(level) })}</p>
      {DESIGNS.map(card)}
    </>
  );
}
