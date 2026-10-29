import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { clockOf, dayOf, generatorOn, mood, weekdayOf, type Command, type GameState } from "../engine/game";
import { naira, RENT, RENT_EVERY_DAYS } from "../engine/economy";
import { districts, isRushHour } from "../data/places";
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
import Guide, { guideSeen } from "../components/Guide";
import Cutscene, { type Ride } from "../components/Cutscene";
import Loading from "../components/Loading";
import { placingValid, type Placing } from "../components/RoomScene";
import { play, soundForLog } from "../lib/sound";
import { initAds } from "../lib/ads";
import PaymentNotice from "../components/PaymentNotice";
import { currentMission, type Mission } from "../data/missions";
import { CATALOG, type FurnitureType } from "../data/home";
import { spots, type SpotId } from "../data/spots";
import { skylineStrip, skyFor } from "../art/art.js";
import type { HouseView } from "../three/HouseView";

// The 3D scenes are a big download, so they load in the background.
const RoomScene = lazy(() => import("../components/RoomScene"));
const StreetScene = lazy(() => import("../components/StreetScene"));

type Panel = "do" | "go" | "work" | "shop" | "goals" | "me" | "help";

const dock: { id: Panel; emoji: string; label: string }[] = [
  { id: "do", emoji: "📍", label: "Places" },
  { id: "go", emoji: "🚌", label: "Travel" },
  { id: "work", emoji: "💼", label: "Jobs" },
  { id: "shop", emoji: "🛒", label: "Shop" },
  { id: "goals", emoji: "✈️", label: "Goals" },
  { id: "me", emoji: "👤", label: "Me" },
];

const titles: Record<Panel, string> = {
  do: "📍 Places", go: "🚌 Travel", work: "💼 Jobs", shop: "🛒 Furniture shop", goals: "✈️ Your big dream", me: "👤 Me", help: "❓ Help",
};

// What you see when you're out (and not walking): the main place of that part of Lagos
const DISTRICT_VIEW: Record<string, SpotId | null> = { yaba: "hub", island: "beach", ikeja: null, mushin: null };

const MINUTES_PER_TICK = 10;
const moodFace = (m: number) => (m >= 70 ? "😄" : m >= 35 ? "🙂" : "😣");

/** Which dock button a mission points at (for its 🎯 tag). */
function missionPanel(m: Mission | null): Panel | null {
  if (!m) return null;
  if (m.tab === "home") return m.furniture ? null : "shop";
  return m.tab;
}

type Props = {
  state: GameState;
  dispatch: (c: Command) => void;
  onRestart: () => void;
  onLoad: (s: GameState) => void;
  synced: "off" | "syncing" | "saved" | "error";
};

/** The whole game on one screen: the 3D world fills it, and everything else sits around it. */
export default function Game({ state, dispatch, onRestart, onLoad, synced }: Props) {
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
  const mission = currentMission(state);
  const atHome = state.location === "mushin";

  // What the screen shows: your room, the streets (walking), or the place you're at
  const focus: SpotId | null =
    entered && spots[entered].district === state.location && spots[entered].lot && entered !== "home"
      ? entered
      : DISTRICT_VIEW[state.location];
  const showRoom = atHome && !walking;
  const showStreet = walking || (!atHome && focus !== null);

  // The clock: 10 game minutes per tick. It waits while a panel, event, the guide or a ride is open,
  // so you can read in peace.
  const eventOpen = state.eventId !== null;
  const stopped = paused || eventOpen || guide || ride !== null || panel !== null || placing !== null;
  useEffect(() => {
    if (stopped) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      dispatch({
        type: "tick", minutes: MINUTES_PER_TICK, roll: Math.random(), pick: Math.random(),
        power: Math.random(), powerPick: Math.random(),
      });
    }, 1000 / speed);
    return () => clearInterval(id);
  }, [stopped, speed, dispatch]);

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
  useEffect(() => {
    initAds();
  }, []);

  // Leaving home closes the furniture card
  useEffect(() => {
    if (!atHome) {
      setSelected(null);
      setPlacing(null);
    }
  }, [atHome]);

  const openPanel = useCallback((p: Panel | null, spot?: SpotId) => {
    setSelected(null);
    setPanel(p);
    if (p && spot) {
      window.setTimeout(() => document.getElementById(`spot-${spot}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }, []);
  const endRide = useCallback(() => setRide(null), []);

  // "Show me" on the mission card
  function showMission() {
    const m = mission;
    if (!m) return;
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
    openPanel(m.tab, m.spot);
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
  const missionDock = missionPanel(mission);
  const narrow = typeof innerWidth === "number" && innerWidth < 900;
  const lit = state.power.grid || generatorOn(state);

  return (
    <div className="game">
      {/* ---------- the world, full screen ---------- */}
      <Suspense fallback={<div className="scene"><Loading what="Lagos" /></div>}>
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
          />
        )}
      </Suspense>
      {!showRoom && !showStreet && <CityBackdrop time={state.time} name={districts[state.location].name} />}

      {/* ---------- top: who, when, money and needs ---------- */}
      <header className="hud2">
        <div className="hud2-row">
          <span className="hud2-avatar" aria-hidden>{state.sim.avatar}</span>
          <div className="hud2-who">
            <b>{state.sim.name}</b>
            <span>
              {weekdayOf(state.time)} · Day {day} · {clockOf(state.time)}{isRushHour(state.time) ? " 🚦" : ""}
            </span>
            <span>📍 {districts[state.location].name} · <span className={rentWarn ? "warn" : ""}>rent in {daysToRent} day{daysToRent > 1 ? "s" : ""}</span></span>
          </div>
          <div className="hud2-right">
            <div className="hud2-money">{naira(state.money)}</div>
            <div className="hud2-stats">
              <span className={state.health <= 30 ? "low" : ""} title="Health">❤️ {Math.round(state.health)}</span>
              <span className={m < 35 ? "low" : ""} title="Mood: 70+ = shifts pay 10% more">{moodFace(m)} {m}</span>
              <span className={lit ? "" : "low"} title={state.power.grid ? "Light is on" : generatorOn(state) ? "Generator on" : "NEPA took light"}>
                {state.power.grid ? "💡" : generatorOn(state) ? "⚡" : "🕯️"}
              </span>
            </div>
          </div>
        </div>
        <div className="hud2-needs" aria-label="Your needs">
          {needKeys.map(k => {
            const v = Math.round(state.needs[k]);
            return (
              <div key={k} className={`need2 ${v <= 25 ? "low" : ""}`} title={`${needInfo[k].name}: ${v}`}>
                <span aria-hidden>{needInfo[k].emoji}</span>
                <span className="need2-bar"><i style={{ width: `${v}%` }} /></span>
                <span className="sr">{needInfo[k].name} {v}</span>
              </div>
            );
          })}
        </div>
      </header>

      <div className="side-buttons">
        <button onClick={() => openPanel(panel === "help" ? null : "help")} aria-label="Help">❓<small>Help</small></button>
        <button aria-pressed={paused} onClick={() => setPaused(p => !p)} aria-label={paused ? "Resume" : "Pause"}>
          {paused ? "▶" : "❚❚"}<small>{paused ? "Play" : "Pause"}</small>
        </button>
        <button onClick={() => setSpeed(s => (s === 1 ? 2 : s === 2 ? 4 : 1))} aria-label={`Game speed ${speed} times`}>
          {speed}×<small>Speed</small>
        </button>
      </div>

      <div className="alerts">
        <MissionCard state={state} onShow={showMission} />
        <PaymentNotice />
        {state.rentOwed > 0 && (
          <div className="owed2" role="alert">
            <span>😬 You owe <b>{naira(state.rentOwed)}</b> rent</span>
            <button className="btn" disabled={state.money <= 0} onClick={() => dispatch({ type: "payRent" })}>Pay</button>
          </div>
        )}
        {!paused && (panel || placing) && <div className="paused-note">⏸ Time is paused while this is open</div>}
        {paused && <div className="paused-note">⏸ Paused. Tap ▶ to play.</div>}
      </div>

      {/* ---------- bottom: messages, tips, quick buttons and the dock ---------- */}
      <div className={`bottom2 ${panel ? "under-panel" : ""}`}>
        {toast && !ride && !panel && <div className="toast2" aria-live="polite">{toast}</div>}
        {!placing && !walking && !panel && selected === null && (
          <div className="quick">
            {canWork && (
              <button className="btn big" disabled={state.needs.energy < 15} onClick={() => dispatch({ type: "work" })}>
                {state.needs.energy < 15 ? "😴 Too tired to work" : `💼 Go to work (${job!.hours} h)`}
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
                🚶🏾 Walk outside
              </button>
            )}
          </div>
        )}
        {!placing && !panel && selected === null && !walking && <TipBubble state={state} onHelp={() => openPanel("help")} />}

        {placing && (
          <div className="place-bar" role="group" aria-label="Placing furniture">
            <div>
              <b>{CATALOG[placing.type].emoji} {CATALOG[placing.type].name}</b>
              <small>{placing.x === null ? "Tap the floor where it should go." : placingValid(state, placing) ? "Fits here. Tap Buy." : "Doesn't fit here. Try another spot or ⟳ turn it."}</small>
            </div>
            <button className="btn plain" onClick={() => setPlacing({ ...placing, rot: (placing.rot + 1) % 4 })} aria-label="Turn it">⟳</button>
            <button className="btn" disabled={!placingValid(state, placing)} onClick={confirmPlacing}>
              {placing.uid !== null ? "Put here" : `Buy ${naira(CATALOG[placing.type].price)}`}
            </button>
            <button className="btn plain" onClick={() => setPlacing(null)}>Cancel</button>
          </div>
        )}

        {!walking && (
          <nav className="dock" aria-label="Menu">
            {dock.map(d => (
              <button key={d.id} aria-pressed={panel === d.id} onClick={() => openPanel(panel === d.id ? null : d.id)}>
                <span aria-hidden>{d.emoji}</span>
                {d.label}
                {missionDock === d.id && <i className="tab-tag" aria-label="Your mission is here">🎯</i>}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* ---------- panels over the world ---------- */}
      {panel && (
        <Sheet title={panel === "do" ? `📍 Places in ${districts[state.location].name}` : titles[panel]} onClose={() => setPanel(null)}>
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
          {panel === "me" && <MeTab state={state} onRestart={onRestart} onLoad={onLoad} onGuide={() => setGuide(true)} synced={synced} />}
          {panel === "help" && <HelpSheet onGuide={() => setGuide(true)} />}
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
