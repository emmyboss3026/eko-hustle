import { useState } from "react";
import Art from "./Art";
import { tagInfo, type TagKind } from "./ui";

export const GUIDE_KEY = "eko-hustle-guide-seen";

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

type Page = { title: string; art?: string; body: React.ReactNode };

const tabs: [string, string, string][] = [
  ["📍", "Places", "Everything you can do where you are: eat, hustle, train skills, have fun."],
  ["🚌", "Travel", "Go to another part of Lagos by danfo, keke or okada."],
  ["💼", "Jobs", "Apply for a job. Promotions raise your pay."],
  ["🛒", "Shop", "Buy furniture for your room. Each piece unlocks new things to do."],
  ["✈️", "Goals", "Your big dream: japa abroad, or buy your own flat."],
  ["👤", "Me", "Your skills and moods, your account and save files."],
];

const needs: [string, string, string][] = [
  ["🍲", "Hunger", "cook at home, or eat at the buka"],
  ["⚡", "Energy", "sleep on your mattress"],
  ["🎉", "Fun", "TV, football, the beach"],
  ["💬", "Social", "gist with friends, call Mummy"],
  ["🛁", "Hygiene", "bucket bath or shower"],
  ["🚻", "Bladder", "use the toilet"],
];

const pages: Page[] = [
  {
    title: "Welcome to Lagos!",
    art: "home",
    body: (
      <>
        <p>You've just arrived with <b>₦10,000</b> and a small room in Mushin.</p>
        <p>Your aim: hustle your way up, then <b>japa abroad</b> or <b>buy your own flat</b>.</p>
        <p>This quick guide shows you how everything works. You can open it again any time with the <b>❓</b> button at the top.</p>
      </>
    ),
  },
  {
    title: "Your world fills the screen",
    body: (
      <ul className="guide-list">
        <li>Your flat is in the middle. <b>Tap a piece of furniture</b> to use it (bed, burner, bucket, toilet…). Tap the floor to walk. Drag to turn the view, pinch or scroll to zoom.</li>
        <li><b>Top bar</b>: your name, the day and clock, where you are, days until rent, and your <b>₦ money</b>.</li>
        <li>Time runs by itself (10 game minutes a second). It waits while a menu is open.</li>
        <li><b>On the right</b>: ❓ Help, ❚❚ Pause and Speed (1×, 2×, 4×).</li>
        <li><b>❤️ Health</b> drops when needs are empty. <b>😄 Mood</b> 70+ makes shifts pay 10% more. <b>💡</b> light on, <b>🕯️</b> NEPA took light.</li>
      </ul>
    ),
  },
  {
    title: "Your six needs",
    body: (
      <>
        <p>The small bars in the top bar are your needs. Keep them up. A bar turns red and blinks when it's low.</p>
        <ul className="guide-list">
          {needs.map(([e, n, how]) => <li key={n}>{e} <b>{n}</b>: {how}</li>)}
        </ul>
      </>
    ),
  },
  {
    title: "The buttons at the bottom",
    body: (
      <>
        <p>Each one opens a panel over your world. Close it with ✕ to get back to the game.</p>
        <ul className="guide-list">
          {tabs.map(([e, n, d]) => <li key={n}><b>{e} {n}</b>: {d}</li>)}
          <li><b>🚶🏾 Walk outside</b>: walk the 3D streets and go into any building.</li>
          <li><b>💼 Go to work</b> appears when you're near your job.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Follow the missions 🎯",
    body: (
      <>
        <p>The <b>🎯 Mission</b> card (top left) tells you what to do next. Tap <b>How?</b> to see each step, tap by tap.</p>
        <p><b>👉 Show me</b> takes you straight there. Look for the 🎯 tag: it marks the button and place you need.</p>
        <p>Every mission pays a reward. The <b>💡 Tip</b> bubble at the bottom gives hints as you play, and warns you when a need is low.</p>
      </>
    ),
  },
  {
    title: "What the tags mean",
    body: (
      <>
        <p>Small tags on buttons explain them at a glance:</p>
        <ul className="guide-list">
          {(["mission", "money", "skill", "light", "food", "lock", "closed"] as TagKind[]).map(k => (
            <li key={k}><span className={`tag tag-${k}`}>{tagInfo[k].emoji} {tagInfo[k].text}</span> {tagInfo[k].help}</li>
          ))}
        </ul>
        <p>Grey buttons can't be used yet: the red line under them says why.</p>
      </>
    ),
  },
];

/** The beginner guide: a few pages that explain the screen, the tabs and the missions. */
export default function Guide({ onClose, time }: { onClose: () => void; time: number }) {
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
          <small>How to play · {i + 1} of {pages.length}</small>
          <button className="btn plain" onClick={close}>Skip</button>
        </div>
        {page.art && <div className="guide-art"><Art id={page.art} time={time} /></div>}
        <h2 className="sheet-title" id="guide-title">{page.title}</h2>
        <div className="guide-body">{page.body}</div>
        <div className="guide-dots" aria-hidden>
          {pages.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}
        </div>
        <div className="guide-nav">
          <button className="btn plain" disabled={i === 0} onClick={() => setI(i - 1)}>‹ Back</button>
          <button className="btn" autoFocus onClick={() => (last ? close() : setI(i + 1))}>{last ? "Let's go! 🚀" : "Next ›"}</button>
        </div>
      </div>
    </div>
  );
}
