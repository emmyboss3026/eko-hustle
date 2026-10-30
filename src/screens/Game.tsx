import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { CLASSIC, RELAXED, isRelaxed } from "../data/survival";
import { canDo, clockOf, dayOf, generatorOn, mood, type Command, type GameState } from "../engine/game";
import { naira, RENT, RENT_EVERY_DAYS } from "../engine/economy";
import { isRushHour } from "../data/places";
import { careers } from "../data/careers";
import { needInfo, needKeys } from "../components/ui";
import EventSheet from "../components/EventSheet";
import DoTab from "../components/DoTab";
import GoTab from "../components/GoTab";
import WorkTab from "../components/WorkTab";
import GoalsTab from "../components/GoalsTab";
import MeTab from "../components/MeTab";
import ShopSheet from "../components/ShopSheet";
import ItemCard from "../components/ItemCard";
import HelpSheet from "../components/HelpSheet";
import Sheet from "../components/Sheet";
import TipBubble from "../components/TipBubble";
import MissionCard from "../components/MissionCard";
import StorySheet from "../components/StorySheet";
import { storyOf, taskProgress, taskTarget } from "../engine/story";
import { taskKind } from "../data/story/types";
import Guide, { guideSeen } from "../components/Guide";
import Cutscene, { type Ride } from "../components/Cutscene";
import Loading from "../components/Loading";
import { placingValid, type Placing } from "../components/RoomScene";
import { soundForLog } from "../lib/sound";
import { play, setScene, startAmbience, stopAmbience, type Sfx } from "../lib/audio";
import { soundForAction } from "../data/sounds";
import { actionById } from "../data/actions";
import { initAds } from "../lib/ads";
import PaymentNotice from "../components/PaymentNotice";
import { currentMission, type Mission } from "../data/missions";
import { CATALOG, type FurnitureType } from "../data/home";
import { spots, type SpotId } from "../data/spots";
import { skylineStrip, skyFor } from "../art/art.js";
import type { HouseView } from "../three/HouseView";
import FeedbackSheet from "../components/FeedbackSheet";
import DiarySheet from "../components/DiarySheet";
import { useLang } from "../i18n/react";
import { flushFeedback } from "../lib/cloud";
import Phone, { type AppId } from "../components/phone/Phone";
import { openInvites, unreadCount } from "../engine/phone";
import { claimDaily, getDailyStatus, type DailyStatus } from "../lib/daily";
import { naira as nairaFmt } from "../engine/economy";

// The 3D scenes are a big download, so they load in the background.
const RoomScene = lazy(() => import("../components/RoomScene"));
const StreetScene = lazy(() => import("../components/StreetScene"));

type Panel = "do" | "go" | "work" | "shop" | "goals" | "me" | "help" | "feedback" | "diary" | "story";

const dock: { id: Panel | "phone"; emoji: string }[] = [
  { id: "do", emoji: "📍" },
  { id: "go", emoji: "🚌" },
  { id: "work", emoji: "💼" },
  { id: "phone", emoji: "📱" },
  { id: "shop", emoji: "🛒" },
  { id: "goals", emoji: "✈️" },
  { id: "me", emoji: "👤" },
];

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// What you see when you're out (and not walking): the main place of that part of Lagos
const DISTRICT_VIEW: Record<string, SpotId | null> = { yaba: "hub", island: "beach", ikeja: null, mushin: null };

const moodFace = (m: number) => (m >= 70 ? "😄" : m >= 35 ? "🙂" : "😣");

/** The first task of the mission you haven't done yet. */
function nextTask(s: GameState, m: Mission | null) {
  if (!m) return null;
  const p = storyOf(s).cur;
  const i = m.tasks.findIndex((task, n) => !taskProgress(s, task, p, n).done);
  return i >= 0 ? m.tasks[i] : null;
}

/** Which dock button a mission points at (for its 🎯 tag). */
function missionPanel(s: GameState, m: Mission | null): Panel | "phone" | null {
  if (!m) return null;
  if (m.tab === "home") return m.furniture ? null : "shop";
  if (m.tab) return m.tab;
  const task = nextTask(s, m);
  if (!task) return null;
  const target = taskTarget(task);
  if (target.app) return "phone";
  if (target.tab === "home") return "shop";
  return (target.tab as Panel) ?? null;
}

type Props = {
  state: GameState;
  dispatch: (c: Command) => void;
  onRestart: () => void;
  onLoad: (s: GameState) => void;
  synced: "off" | "syncing" | "saved" | "error";
  userId: string | null;
};

const DAILY_SEEN_KEY = "eko-hustle-daily-seen";

/** The whole game on one screen: the 3D world fills it, and everything else sits around it. */
export default function Game({ state, dispatch: send, onRestart, onLoad, synced, userId }: Props) {
  // Every command goes through here, so it can make the right sound (cooking sizzles, toilets flush…)
  const stateRef = useRef(state);
  stateRef.current = state;
  const dispatch = useCallback((c: Command) => {
    const sfx = soundForCommand(stateRef.current, c);
    if (sfx) play(sfx);
    send(c);
  }, [send]);
  const { t, tx, lang } = useLang();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [guide, setGuide] = useState(() => !guideSeen());
  const [ride, setRide] = useState<Ride | null>(null);
  const [walking, setWalking] = useState(false);
  const [entered, setEntered] = useState<SpotId | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [placing, setPlacing] = useState<Placing | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const viewRef = useRef<HouseView | null>(null);
  const [phone, setPhone] = useState<AppId | "home" | null>(null);
  const [daily, setDaily] = useState<DailyStatus | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState<{ amount: number; day: number } | null>(null);
  const firstPerson = state.camera === "first";
  const [camHint, setCamHint] = useState(false);
  const [dailySeen, setDailySeen] = useState(() => {
    try { return sessionStorage.getItem(DAILY_SEEN_KEY) ?? ""; } catch { return ""; }
  });
  const mission = currentMission(state);
  const atHome = state.location === "mushin";

  // What the screen shows: your room, the streets (walking), or the place you're at
  const focus: SpotId | null =
    entered && spots[entered].district === state.location && spots[entered].lot && entered !== "home"
      ? entered
      : DISTRICT_VIEW[state.location];
  const showRoom = atHome && !walking;
  const showStreet = walking || (!atHome && focus !== null);

  // The clock: game minutes per real second (slower with relaxed survival, see data/survival.ts). It waits while a panel, event, the guide or a ride is open,
  // so you can read in peace.
  const eventOpen = state.eventId !== null;
  const stopped = paused || eventOpen || guide || ride !== null || panel !== null || placing !== null || phone !== null;
  const minutesPerTick = isRelaxed(state) ? RELAXED.minutesPerTick : CLASSIC.minutesPerTick;
  useEffect(() => {
    if (stopped) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      dispatch({
        type: "tick", minutes: minutesPerTick, roll: Math.random(), pick: Math.random(),
        power: Math.random(), powerPick: Math.random(),
      });
    }, 1000 / speed);
    return () => clearInterval(id);
  }, [stopped, speed, dispatch, minutesPerTick]);

  // Sounds, and a short message for each new thing that happens
  const lastLine = useRef(state.log[0]);
  useEffect(() => {
    if (state.log[0] === lastLine.current) return;
    lastLine.current = state.log[0];
    const sfx = soundForLog(state.log[0] ?? "");
    if (sfx) play(sfx);
    setToast(state.log[0] ?? null);
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [state.log]);
  useEffect(() => {
    if (eventOpen) play("event");
  }, [eventOpen]);
  // Background sound: the city outside, birds, crickets, your generator
  useEffect(() => {
    startAmbience();
    return () => stopAmbience();
  }, []);
  const hourNow = Math.floor((state.time % 1440) / 60);
  const genOn = generatorOn(state) && state.location === "mushin";
  useEffect(() => {
    setScene({ hour: hourNow, outdoors: walking || state.location !== "mushin", generator: genOn, place: state.location });
  }, [hourNow, walking, state.location, genOn]);
  // A ping when a new message or invitation arrives
  const unreadNow = unreadCount(state) + openInvites(state).length;
  const lastUnread = useRef(unreadNow);
  useEffect(() => {
    if (unreadNow > lastUnread.current) play("ping");
    lastUnread.current = unreadNow;
  }, [unreadNow]);

  useEffect(() => {
    initAds();
    void flushFeedback(); // send any feedback written while offline
  }, []);

  // Daily reward: check when the game opens, when you sign in or out, and when the phone's Rewards app opens
  const refreshDaily = useCallback(async () => setDaily(await getDailyStatus()), []);
  useEffect(() => {
    void refreshDaily();
  }, [userId, refreshDaily]);
  useEffect(() => {
    if (phone === "rewards") void refreshDaily();
  }, [phone, refreshDaily]);
  async function claim() {
    setClaiming(true);
    const r = await claimDaily();
    setClaiming(false);
    if ("error" in r) {
      setToast(t(r.error));
    } else if (r.claimed) {
      dispatch({ type: "daily", id: r.id, streakDay: r.day, amount: r.amount, server: r.server });
      setClaimed({ amount: r.amount, day: r.day });
    }
    await refreshDaily();
  }
  function hideDaily() {
    const id = daily?.today ?? "";
    setDailySeen(id);
    try { sessionStorage.setItem(DAILY_SEEN_KEY, id); } catch { /* ignore */ }
  }

  // Game messages follow the chosen language
  useEffect(() => {
    if (state.lang !== lang) dispatch({ type: "lang", lang });
  }, [lang, state.lang, dispatch]);

  // Leaving home closes the furniture card
  useEffect(() => {
    if (!atHome) {
      setSelected(null);
      setPlacing(null);
    }
  }, [atHome]);

  const openPanel = useCallback((p: Panel | null, spot?: SpotId) => {
    setSelected(null);
    setPhone(null);
    setPanel(p);
    if (p && spot) {
      window.setTimeout(() => document.getElementById(`spot-${spot}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }, []);
  const endRide = useCallback(() => setRide(null), []);
  const [storyId, setStoryId] = useState<string | null>(null);
  const openStory = useCallback((id: string | null) => {
    setStoryId(id);
    setSelected(null);
    setPhone(null);
    setPanel("story");
  }, []);

  // "Show me" on the mission card
  function showMission() {
    const m = mission;
    if (!m) return;
    const task = nextTask(state, m);
    if (task && !m.tab) {
      const target = taskTarget(task);
      if (target.app) {
        setPanel(null);
        setPhone(target.app as AppId);
        return;
      }
      if (taskKind(task) === "count" && (task as { count: string }).count === "enter") {
        setPanel(null);
        setWalking(true);
        return;
      }
      if (target.tab === "home") return openPanel(atHome ? "shop" : "go");
      const action = target.spot ? actionById(target.spot) : undefined;
      const spot = (action?.spot ?? target.spot) as SpotId | undefined;
      const where = spot && spots[spot] ? spots[spot].district : null;
      if (where && where !== "any" && where !== state.location) return openPanel("go");
      if (spot === "home") return openPanel(null);
      return openPanel((target.tab as Panel) ?? "do", spot && spots[spot] ? spot : undefined);
    }
    if (m.furniture) {
      if (!atHome) return openPanel("go");
      const item = state.home.objects.find(o => o.type === m.furniture);
      setWalking(false);
      setPanel(null);
      if (item) setSelected(item.uid);
      return;
    }
    if (m.id === "streets") {
      setPanel(null);
      setWalking(true);
      return;
    }
    if (m.tab === "home") return openPanel(atHome ? "shop" : "go");
    openPanel(m.tab ?? "do", m.hint);
  }

  function startPlacing(type: FurnitureType, uid: number | null = null) {
    const current = uid !== null ? state.home.objects.find(o => o.uid === uid) : null;
    setPanel(null);
    setSelected(null);
    setWalking(false);
    setPlacing({ type, uid, x: current?.x ?? null, y: current?.y ?? null, rot: current?.rot ?? 0 });
  }

  function confirmPlacing() {
    if (!placing || placing.x === null || placing.y === null || !placingValid(state, placing)) return;
    const { x, y, rot } = placing;
    dispatch(placing.uid !== null ? { type: "move", uid: placing.uid, x, y, rot } : { type: "buy", item: placing.type, x, y, rot });
    setPlacing(null);
  }

  const day = dayOf(state.time);
  const daysToRent = RENT_EVERY_DAYS - ((day - 1) % RENT_EVERY_DAYS);
  const rentWarn = daysToRent <= 2 && state.money < RENT;
  const m = mood(state);
  const job = state.career ? careers[state.career.id] : null;
  const canWork = !!job && job.where === state.location && !walking;
  const missionDock = missionPanel(state, mission);
  const narrow = typeof innerWidth === "number" && innerWidth < 900;
  const lit = state.power.grid || generatorOn(state);
  const phoneBadge = unreadCount(state) + openInvites(state).filter(i => i.until >= day).length + (daily?.canClaim ? 1 : 0);

  return (
    <div className="game">
      {/* ---------- the world, full screen ---------- */}
      <Suspense fallback={<div className="scene"><Loading /></div>}>
        {showRoom && (
          <RoomScene
            state={state}
            viewRef={viewRef}
            selected={selected}
            onSelect={uid => {
              setSelected(uid);
              if (uid !== null) setPanel(null);
            }}
            placing={placing}
            onPlaceTile={(x, y) => placing && setPlacing({ ...placing, x, y })}
            shift={narrow && (panel || selected !== null) ? 0.12 : 0}
            firstPerson={firstPerson}
          />
        )}
        {showStreet && (
          <StreetScene
            state={state}
            dispatch={dispatch}
            walking={walking}
            focus={walking && atHome ? "home" : focus}
            onEnter={id => {
              setWalking(false);
              setEntered(id);
              if (id !== "home") openPanel("do", id);
            }}
            onStop={() => setWalking(false)}
            firstPerson={firstPerson}
          />
        )}
      </Suspense>
      {camHint && firstPerson && (showRoom || walking) && <div className="cam-hint" onAnimationEnd={() => setCamHint(false)}>{t("camera.look")}</div>}
      {!showRoom && !showStreet && <CityBackdrop time={state.time} name={tx.district(state.location)} />}

      {/* ---------- top: who, when, money and needs ---------- */}
      <header className="hud2">
        <div className="hud2-row">
          <span className="hud2-avatar" aria-hidden>{state.sim.avatar}</span>
          <div className="hud2-who">
            <b>{state.sim.name}</b>
            <span>
              {t(`day.${WEEKDAY_KEYS[Math.floor(state.time / 1440) % 7]}`)} · {t("hud.day", { day })} · {clockOf(state.time)}{isRushHour(state.time) ? " 🚦" : ""}
            </span>
            <span>📍 {tx.district(state.location)} · <span className={rentWarn ? "warn" : ""}>{t(daysToRent > 1 ? "hud.rentIn" : "hud.rentIn1", { days: daysToRent })}</span></span>
          </div>
          <div className="hud2-right">
            <div className="hud2-money">{naira(state.money)}</div>
            <div className="hud2-stats">
              <span className={state.health <= 30 ? "low" : ""} title={t("hud.health")}>❤️ {Math.round(state.health)}</span>
              <span className={m < 35 ? "low" : ""} title={t("hud.moodTip")}>{moodFace(m)} {m}</span>
              <span className={lit ? "" : "low"} title={state.power.grid ? t("hud.lightOn") : generatorOn(state) ? t("hud.genOn") : t("hud.lightOff")}>
                {state.power.grid ? "💡" : generatorOn(state) ? "⚡" : "🕯️"}
              </span>
            </div>
          </div>
        </div>
        <div className="hud2-needs" aria-label={t("hud.needs")}>
          {needKeys.map(k => {
            const v = Math.round(state.needs[k]);
            return (
              <div key={k} className={`need2 ${v <= 25 ? "low" : ""}`} title={`${tx.need(k)}: ${v}`}>
                <span aria-hidden>{needInfo[k].emoji}</span>
                <span className="need2-bar"><i style={{ width: `${v}%` }} /></span>
                <span className="sr">{tx.need(k)} {v}</span>
              </div>
            );
          })}
        </div>
      </header>

      <div className="side-buttons">
        <button onClick={() => openPanel(panel === "help" ? null : "help")} aria-label={t("side.help")}>❓<small>{t("side.help")}</small></button>
        <button className="feedback-btn" onClick={() => openPanel(panel === "feedback" ? null : "feedback")} aria-label={t("side.feedback")}>💬<small>{t("side.feedback")}</small></button>
        <button aria-pressed={paused} onClick={() => setPaused(p => !p)} aria-label={paused ? t("side.play") : t("side.pause")}>
          {paused ? "▶" : "❚❚"}<small>{paused ? t("side.play") : t("side.pause")}</small>
        </button>
        <button
          aria-pressed={firstPerson}
          onClick={() => {
            dispatch({ type: "camera", mode: firstPerson ? "top" : "first" });
            setCamHint(!firstPerson);
          }}
          aria-label={firstPerson ? t("camera.toTop") : t("camera.toFirst")}
          title={firstPerson ? t("camera.toTop") : t("camera.toFirst")}
        >
          {firstPerson ? "🗺️" : "🎥"}<small>{t("camera.view")}</small>
        </button>
        <button onClick={() => setSpeed(s => (s === 1 ? 2 : s === 2 ? 4 : 1))} aria-label={t("side.speedAria", { speed })}>
          {speed}×<small>{t("side.speed")}</small>
        </button>
      </div>

      <div className="alerts">
        <MissionCard state={state} dispatch={dispatch} onShow={showMission} onStory={() => openStory(null)} />
        <PaymentNotice />
        {state.rentOwed > 0 && (
          <div className="owed2" role="alert">
            <span>{t("hud.owe", { money: naira(state.rentOwed) })}</span>
            <button className="btn" disabled={state.money <= 0} onClick={() => dispatch({ type: "payRent" })}>{t("hud.pay")}</button>
          </div>
        )}
        {daily?.canClaim && dailySeen !== daily.today && !phone && (
          <div className="daily-note" role="status">
            <span>🎁 {t("daily.ready", { money: nairaFmt(daily.nextAmount), day: daily.nextDay })}</span>
            <button className="btn" onClick={() => { setPanel(null); setPhone("rewards"); }}>{t("daily.open")}</button>
            <button className="btn plain" onClick={hideDaily} aria-label={t("ui.close")}>✕</button>
          </div>
        )}
        {!paused && (panel || placing || phone) && <div className="paused-note">{t("hud.pausedPanel")}</div>}
        {paused && <div className="paused-note">{t("hud.paused")}</div>}
      </div>

      {/* ---------- bottom: messages, tips, quick buttons and the dock ---------- */}
      <div className={`bottom2 ${panel ? "under-panel" : ""}`}>
        {toast && !ride && !panel && <div className="toast2" aria-live="polite">{toast}</div>}
        {!placing && !walking && !panel && selected === null && (
          <div className="quick">
            {canWork && (
              <button className="btn big" disabled={state.needs.energy < 15} onClick={() => dispatch({ type: "work" })}>
                {state.needs.energy < 15 ? t("work.tooTired") : t("work.goTo", { hours: job!.hours })}
              </button>
            )}
            {state.location !== "ikeja" && (
              <button
                className={`btn plain walk-btn ${mission?.id === "streets" ? "row-mission" : ""}`}
                onClick={() => {
                  setPanel(null);
                  setSelected(null);
                  setWalking(true);
                }}
              >
                🚶🏾 {t("hud.walk")}
              </button>
            )}
          </div>
        )}
        {!placing && !panel && selected === null && !walking && <TipBubble state={state} onHelp={() => openPanel("help")} />}

        {placing && (
          <div className="place-bar" role="group" aria-label={t("place.aria")}>
            <div>
              <b>{CATALOG[placing.type].emoji} {tx.furniture(placing.type)}</b>
              <small>{placing.x === null ? t("place.tapFloor") : placingValid(state, placing) ? t("place.fits") : t("place.noFit")}</small>
            </div>
            <button className="btn plain" onClick={() => setPlacing({ ...placing, rot: (placing.rot + 1) % 4 })} aria-label={t("place.turn")}>⟳</button>
            <button className="btn" disabled={!placingValid(state, placing)} onClick={confirmPlacing}>
              {placing.uid !== null ? t("place.put") : t("place.buy", { money: naira(CATALOG[placing.type].price) })}
            </button>
            <button className="btn plain" onClick={() => setPlacing(null)}>{t("place.cancel")}</button>
          </div>
        )}

        {!walking && (
          <nav className="dock" aria-label={t("hud.menu")}>
            {dock.map(d => (
              <button
                key={d.id}
                aria-pressed={d.id === "phone" ? phone !== null : panel === d.id}
                onClick={() => {
                  if (d.id === "phone") {
                    setPanel(null);
                    setSelected(null);
                    setPhone(phone ? null : "home");
                  } else openPanel(panel === d.id ? null : d.id);
                }}
              >
                <span aria-hidden>{d.emoji}</span>
                {t(`dock.${d.id}`)}
                {missionDock === d.id && <i className="tab-tag" aria-label={t("hud.missionHere")}>🎯</i>}
                {d.id === "phone" && phoneBadge > 0 && <i className="phone-badge dock-badge" aria-label={t("phone.badge", { n: phoneBadge })}>{phoneBadge > 9 ? "9+" : phoneBadge}</i>}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* ---------- panels over the world ---------- */}
      {panel && (
        <Sheet title={panel === "do" ? t("panel.doIn", { place: tx.district(state.location) }) : t(`panel.${panel}`)} onClose={() => setPanel(null)}>
          {panel === "do" && <DoTab state={state} dispatch={dispatch} goTo={t => openPanel(t === "home" ? null : t)} />}
          {panel === "go" && (
            <GoTab
              state={state}
              dispatch={dispatch}
              onRide={r => {
                setPanel(null);
                setEntered(null);
                setRide(r);
              }}
              onWalk={() => {
                setPanel(null);
                setWalking(true);
              }}
              missionTab={mission?.id === "streets"}
            />
          )}
          {panel === "work" && <WorkTab state={state} dispatch={dispatch} goTo={() => openPanel("go")} />}
          {panel === "shop" && (
            <ShopSheet
              state={state}
              onBuy={t => startPlacing(t)}
              onPick={uid => {
                setPanel(null);
                setSelected(uid);
              }}
            />
          )}
          {panel === "goals" && <GoalsTab state={state} dispatch={dispatch} />}
          {panel === "me" && (
            <MeTab
              state={state}
              onRestart={onRestart}
              onLoad={onLoad}
              onGuide={() => setGuide(true)}
              onDiary={() => openPanel("diary")}
              onFeedback={() => openPanel("feedback")}
              onRelaxed={on => dispatch({ type: "relaxed", on })}
              synced={synced}
            />
          )}
          {panel === "feedback" && <FeedbackSheet state={state} />}
          {panel === "diary" && <DiarySheet state={state} />}
          {panel === "help" && <HelpSheet onGuide={() => setGuide(true)} />}
          {panel === "story" && <StorySheet key={storyId ?? "main"} state={state} dispatch={dispatch} id={storyId} onShow={showMission} onClose={() => setPanel(null)} />}
        </Sheet>
      )}
      {selected !== null && !panel && showRoom && (
        <ItemCard
          state={state}
          uid={selected}
          dispatch={dispatch}
          viewRef={viewRef}
          onClose={() => setSelected(null)}
          onMove={() => {
            const item = state.home.objects.find(o => o.uid === selected);
            if (item) startPlacing(item.type, item.uid);
          }}
        />
      )}

      {phone && (
        <Phone
          state={state}
          dispatch={dispatch}
          app={phone === "home" ? null : phone}
          onApp={a => setPhone(a ?? "home")}
          onClose={() => { setPhone(null); setClaimed(null); }}
          onTravel={() => { setPhone(null); setPanel("go"); }}
          onStory={openStory}
          daily={daily}
          onClaim={claim}
          claiming={claiming}
          claimed={claimed}
          userId={userId}
        />
      )}
      {ride && <Cutscene ride={ride} onDone={endRide} />}
      {guide && <Guide time={state.time} onClose={() => setGuide(false)} />}
      {eventOpen && !guide && <EventSheet state={state} dispatch={dispatch} />}
    </div>
  );
}

/** Ikeja isn't in 3D yet: a drawn skyline fills the screen instead. */
function CityBackdrop({ time, name }: { time: number; name: string }) {
  const sk = skyFor(Math.floor((time % 1440) / 60));
  // Our own drawing code (no user text), so it's safe to insert.
  const svg = `<defs><linearGradient id="cb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sk.top}"/><stop offset="1" stop-color="${sk.bottom}"/></linearGradient></defs>
    <rect y="-200" width="400" height="425" fill="url(#cb-sky)"/>
    <g>${skylineStrip(sk.night)}</g>
    <rect y="150" width="400" height="80" fill="${sk.night ? "#26262e" : "#4b4b52"}"/>`;
  return (
    <div className="scene backdrop" aria-label={`${name} skyline`}>
      <svg viewBox="0 -60 400 285" preserveAspectRatio="xMidYMax slice" aria-hidden dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="backdrop-name">{name}</div>
    </div>
  );
}

/** The sound for something you do (only if it can actually happen). */
function soundForCommand(s: GameState, c: Command): Sfx | null {
  switch (c.type) {
    case "act": {
      const a = actionById(c.id);
      return a && !canDo(s, a) ? soundForAction(a) : null;
    }
    case "walk": return "door";
    case "buy": case "sell": case "payRent": case "invest": case "sellFund": case "buyBiz": case "upgradeBiz": case "sellBiz": case "daily": return "coin";
    case "contact": return c.how === "call" ? "ring" : c.how === "text" ? "type" : c.how === "gift" ? "coin" : "chime";
    case "invite": return c.accept ? "beat" : "pop";
    case "reply": case "choose": case "camera": case "staff": return "pop";
    default: return null;
  }
}

