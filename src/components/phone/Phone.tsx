import { useEffect, type ReactNode } from "react";
import { clockOf, dayOf, type Command, type GameState } from "../../engine/game";
import { naira } from "../../engine/economy";
import { openInvites, unreadCount } from "../../engine/phone";
import { level, statusTier, STATUS } from "../../engine/progress";
import { useLang } from "../../i18n/react";
import type { DailyStatus } from "../../lib/daily";
import BankApp from "./BankApp";
import InvestApp from "./InvestApp";
import BizApp from "./BizApp";
import InvitesApp from "./InvitesApp";
import ContactsApp from "./ContactsApp";
import MessagesApp from "./MessagesApp";
import RewardsApp from "./RewardsApp";
import BoardApp from "./BoardApp";
import QuickApp from "./QuickApp";
import WorkTab from "../WorkTab";
import StoryApp from "./StoryApp";
import { currentStory, storyOf, tasksDone, challengeProgress } from "../../engine/story";
import { CHALLENGES } from "../../data/story";

export type AppId = "story" | "bank" | "invest" | "business" | "invites" | "contacts" | "messages" | "rewards" | "board" | "jobs" | "quick";

export const APPS: { id: AppId; emoji: string; color: string }[] = [
  { id: "story", emoji: "📖", color: "#8e44ad" },
  { id: "messages", emoji: "💬", color: "#25a55f" },
  { id: "bank", emoji: "🏦", color: "#1e5bd8" },
  { id: "invest", emoji: "📈", color: "#0d8a7a" },
  { id: "business", emoji: "🏪", color: "#d9822b" },
  { id: "invites", emoji: "💌", color: "#d63384" },
  { id: "contacts", emoji: "📇", color: "#6f42c1" },
  { id: "rewards", emoji: "🎁", color: "#e0a800" },
  { id: "board", emoji: "🏆", color: "#b8860b" },
  { id: "jobs", emoji: "💼", color: "#495057" },
  { id: "quick", emoji: "🛵", color: "#c0392b" },
];

type Props = {
  state: GameState;
  dispatch: (c: Command) => void;
  app: AppId | null;              // null = the home screen
  onApp: (app: AppId | null) => void;
  onClose: () => void;
  onTravel: () => void;
  daily: DailyStatus | null;
  onClaim: () => Promise<void>;
  claiming: boolean;
  claimed: { amount: number; day: number } | null;
  userId: string | null;
  onStory: (id: string | null) => void;
};

/** The in-game smartphone: a home screen of apps, each one working with the real game state. */
export default function Phone({ state, dispatch, app, onApp, onClose, onTravel, daily, onClaim, claiming, claimed, userId, onStory }: Props) {
  const { t } = useLang();
  const st = storyOf(state);
  const cur = currentStory(st);
  const storyBadge = (cur && tasksDone(state, cur, st.cur) ? 1 : 0)
    + (st.challenges?.ids ?? []).filter(id => !st.challenges?.claimed.includes(id) && challengeProgress(state, CHALLENGES.find(c => c.id === id)!).done).length;
  const badges: Partial<Record<AppId, number>> = {
    story: storyBadge,
    messages: unreadCount(state),
    invites: openInvites(state).filter(i => i.until >= dayOf(state.time)).length,
    rewards: daily?.canClaim ? 1 : 0,
  };

  // Phone-style keys: Escape goes home, then closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault(); // the panel around the phone shouldn't close too
      if (app) onApp(null);
      else onClose();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [app, onApp, onClose]);

  const tier = statusTier(state);
  let body: ReactNode;
  switch (app) {
    case "story": body = <StoryApp state={state} dispatch={dispatch} onOpen={onStory} />; break;
    case "bank": body = <BankApp state={state} onRewards={() => onApp("rewards")} />; break;
    case "invest": body = <InvestApp state={state} dispatch={dispatch} />; break;
    case "business": body = <BizApp state={state} dispatch={dispatch} />; break;
    case "invites": body = <InvitesApp state={state} dispatch={dispatch} />; break;
    case "contacts": body = <ContactsApp state={state} dispatch={dispatch} onMessages={() => onApp("messages")} />; break;
    case "messages": body = <MessagesApp state={state} dispatch={dispatch} onApp={onApp} />; break;
    case "rewards": body = <RewardsApp status={daily} onClaim={onClaim} claiming={claiming} claimed={claimed} />; break;
    case "board": body = <BoardApp state={state} userId={userId} />; break;
    case "jobs": body = <WorkTab state={state} dispatch={dispatch} goTo={onTravel} />; break;
    case "quick": body = <QuickApp state={state} dispatch={dispatch} />; break;
    default:
      body = (
        <div className="phone-home">
          <div className="phone-widget">
            <div className="phone-widget-time">{clockOf(state.time)}</div>
            <div>{t("hud.day", { day: dayOf(state.time) })}</div>
            <div className="phone-widget-money">{naira(state.money)}</div>
            <div className="phone-widget-meta">
              {STATUS[tier].emoji} {t(STATUS[tier].key)} · {t("phone.level", { level: level(state) })}
            </div>
          </div>
          <div className="phone-grid" role="list">
            {APPS.map(a => (
              <button key={a.id} role="listitem" className="phone-app" onClick={() => onApp(a.id)} aria-label={t(`app.${a.id}`) + (badges[a.id] ? ` (${badges[a.id]})` : "")}>
                <span className="phone-icon" style={{ background: a.color }} aria-hidden>
                  {a.emoji}
                  {!!badges[a.id] && <b className="phone-badge">{badges[a.id]! > 9 ? "9+" : badges[a.id]}</b>}
                </span>
                <span className="phone-label">{t(`app.${a.id}`)}</span>
              </button>
            ))}
          </div>
        </div>
      );
  }

  return (
    <div className="phone-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <section className="phone" role="dialog" aria-label={t("phone.title")}>
        <div className="phone-status" aria-hidden>
          <span>{clockOf(state.time)}</span>
          <span className="phone-notch" />
          <span>📶 🔋</span>
        </div>
        {app && (
          <header className="phone-appbar">
            <button className="phone-back" onClick={() => onApp(null)} aria-label={t("phone.home")}>‹</button>
            <h2>{APPS.find(a => a.id === app)?.emoji} {t(`app.${app}`)}</h2>
            <button className="phone-x" onClick={onClose} aria-label={t("ui.close")}>✕</button>
          </header>
        )}
        {!app && (
          <button className="phone-x home-x" onClick={onClose} aria-label={t("ui.close")}>✕</button>
        )}
        <div className={`phone-screen ${app ? "in-app" : ""}`} key={app ?? "home"}>{body}</div>
        <button className="phone-homebar" onClick={() => (app ? onApp(null) : onClose())} aria-label={app ? t("phone.home") : t("ui.close")}>
          <span />
        </button>
      </section>
    </div>
  );
}
