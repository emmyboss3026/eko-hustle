import { useState } from "react";
import Art from "./Art";
import { tagEmoji, type TagKind } from "./ui";
import { useLang, Rich } from "../i18n/react";
import type { T } from "../i18n/core";

export const GUIDE_KEY = "eko-hustle-guide-seen";

// eslint-disable-next-line react-refresh/only-export-components
export function guideSeen(): boolean {
  try {
    return localStorage.getItem(GUIDE_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(GUIDE_KEY, "1");
  } catch {
    // ignore
  }
}

const bullets = (t: T, prefix: string, n: number) => (
  <ul className="guide-list">
    {Array.from({ length: n }, (_, i) => <li key={i}><Rich text={t(`${prefix}.${i}`)} /></li>)}
  </ul>
);

type Page = { title: string; art?: string; body: (t: T) => React.ReactNode };

const pages: Page[] = [
  { title: "guide.welcome", art: "home", body: t => <>{[0, 1, 2].map(i => <p key={i}><Rich text={t(`guide.welcome.${i}`)} /></p>)}</> },
  { title: "guide.screen", body: t => bullets(t, "guide.screen", 5) },
  { title: "guide.needs", body: t => <><p>{t("guide.needs.intro")}</p>{bullets(t, "guide.needs", 6)}</> },
  { title: "guide.buttons", body: t => <><p>{t("guide.buttons.intro")}</p>{bullets(t, "guide.buttons", 8)}</> },
  { title: "guide.missions", body: t => <>{[0, 1, 2].map(i => <p key={i}><Rich text={t(`guide.missions.${i}`)} /></p>)}</> },
  {
    title: "guide.tags",
    body: t => (
      <>
        <p>{t("guide.tags.intro")}</p>
        <ul className="guide-list">
          {(["mission", "money", "skill", "light", "food", "lock", "closed"] as TagKind[]).map(k => (
            <li key={k}><span className={`tag tag-${k}`}>{tagEmoji[k]} {t(`tag.${k}`)}</span> {t(`tag.${k}.help`)}</li>
          ))}
        </ul>
        <p>{t("guide.tags.grey")}</p>
      </>
    ),
  },
  { title: "guide.feedback", body: t => <>{[0, 1, 2].map(i => <p key={i}><Rich text={t(`guide.feedback.${i}`)} /></p>)}</> },
];

/** The beginner guide: a few pages that explain the screen, the buttons, missions and feedback. */
export default function Guide({ onClose, time }: { onClose: () => void; time: number }) {
  const { t } = useLang();
  const [i, setI] = useState(0);
  const page = pages[i];
  const last = i === pages.length - 1;
  const close = () => {
    markSeen();
    onClose();
  };
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <div className="sheet guide">
        <div className="guide-top">
          <small>{t("guide.counter", { n: i + 1, total: pages.length })}</small>
          <button className="btn plain" onClick={close}>{t("guide.skip")}</button>
        </div>
        {page.art && <div className="guide-art"><Art id={page.art} time={time} /></div>}
        <h2 className="sheet-title" id="guide-title">{t(page.title)}</h2>
        <div className="guide-body">{page.body(t)}</div>
        <div className="guide-dots" aria-hidden>
          {pages.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}
        </div>
        <div className="guide-nav">
          <button className="btn plain" disabled={i === 0} onClick={() => setI(i - 1)}>{t("guide.back")}</button>
          <button className="btn" autoFocus onClick={() => (last ? close() : setI(i + 1))}>{last ? t("guide.go") : t("guide.next")}</button>
        </div>
      </div>
    </div>
  );
}
