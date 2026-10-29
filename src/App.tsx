import { useEffect, useReducer, useRef, useState } from "react";
import "./App.css";
import { newGame, reduce, type Command, type GameState } from "./engine/game";
import { loadGame, saveGame, clearSave, localSavedAt } from "./engine/save";
import type { Sim } from "./data/traits";
import { AccountProvider, useAccount } from "./lib/account";
import { LangProvider, useLang } from "./i18n/react";
import { recordLife } from "./lib/lives";
import type { Lang } from "./i18n/core";
import { loadCloudSave, pushCloudSave, submitRun } from "./lib/cloud";
import CreateSim from "./screens/CreateSim";
import Ending from "./screens/Ending";
import Game from "./screens/Game";

// Everything that can happen: a game command, starting a new life, loading a cloud save, or resetting.
type Msg = Command | { type: "start"; sim: Sim; lang: Lang } | { type: "load"; state: GameState } | { type: "reset" };

function root(state: GameState | null, msg: Msg): GameState | null {
  if (msg.type === "start") return newGame(msg.sim, msg.lang);
  if (msg.type === "load") return msg.state;
  if (msg.type === "reset") return null;
  return state ? reduce(state, msg) : state;
}

const SUBMITTED_KEY = "eko-hustle-submitted-run";

function Root() {
  const [state, dispatch] = useReducer(root, null, loadGame);
  const { profile } = useAccount();
  const { lang } = useLang();
  const [synced, setSynced] = useState<"off" | "syncing" | "saved" | "error">("off");
  const firstSave = useRef(true);
  const userId = profile?.id ?? null;

  // Save on this device after every change (skip the very first render, which only loaded the save)
  useEffect(() => {
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    saveGame(state);
  }, [state]);

  // When a player signs in: use whichever save is newer, this device's or the cloud's
  useEffect(() => {
    if (!userId) {
      setSynced("off");
      return;
    }
    let cancelled = false;
    (async () => {
      setSynced("syncing");
      const cloud = await loadCloudSave(userId);
      if (cancelled) return;
      const local = localSavedAt();
      if (cloud && (!local || cloud.updatedAt > local || !loadGame())) {
        dispatch({ type: "load", state: cloud.state });
      }
      setSynced("saved");
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Upload to the cloud a few seconds after the game changes (not on every tick)
  useEffect(() => {
    if (!userId) return;
    const t = window.setTimeout(async () => {
      setSynced("syncing");
      setSynced((await pushCloudSave(userId, state)) ? "saved" : "error");
    }, 4000);
    return () => window.clearTimeout(t);
  }, [state, userId]);

  // Remember a finished life on this device
  useEffect(() => {
    if (state?.ending) recordLife(state);
  }, [state]);

  // Post a finished life to the leaderboard once
  useEffect(() => {
    if (!userId || !state?.ending) return;
    const id = `${state.sim.name}|${state.ending.day}|${state.stats.earned}`;
    try {
      if (localStorage.getItem(SUBMITTED_KEY) === id) return;
      localStorage.setItem(SUBMITTED_KEY, id);
    } catch {
      // ignore
    }
    void submitRun(userId, state);
  }, [state, userId]);

  function restart() {
    clearSave();
    dispatch({ type: "reset" });
  }

  if (!state) return <CreateSim onDone={sim => dispatch({ type: "start", sim, lang })} />;
  if (state.ending) return <Ending state={state} onRestart={restart} />;
  return <Game state={state} dispatch={dispatch} onRestart={restart} onLoad={s => dispatch({ type: "load", state: s })} synced={synced} />;
}

export default function App() {
  return (
    <LangProvider>
      <AccountProvider>
        <Root />
      </AccountProvider>
    </LangProvider>
  );
}
