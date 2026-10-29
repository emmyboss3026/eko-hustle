import { useState } from "react";

type Q = { emoji: string; q: string; steps: string[] };

// Simple how-tos, written as taps on this screen.
const howTos: Q[] = [
  { emoji: "🍲", q: "How do I eat?", steps: [
    "At home: tap the gas burner in the kitchen, then 🍳 Cook egusi. It uses 1 meal pack.",
    "Out: tap 📍 Places and pick food, e.g. 🥘 Amala at Mama Ronke's Buka (07:00–21:00).",
    "No meal packs? Buy groceries at 🧺 Oja Tuntun Market, or order delivery from 📱 Your phone.",
  ] },
  { emoji: "😴", q: "How do I sleep?", steps: [
    "Go home to Mushin.",
    "Tap your mattress in the bedroom (right side of the flat), then 🛏️ Sleep.",
    "Sleep takes 8 hours of game time. Do it at night so you're fresh for work.",
  ] },
  { emoji: "🚽", q: "How do I use the toilet or bath?", steps: [
    "At home: tap the white toilet or the blue bucket in the bathroom (top right of the flat).",
    "Out: 📍 Places → 📱 Your phone → 🚻 Public toilet (₦100), or the toilet at the buka, hub or club.",
  ] },
  { emoji: "💰", q: "How do I make money?", steps: [
    "Fastest start: 📍 Places → 📱 Your phone → 💬 WhatsApp hustle. Works anywhere.",
    "Get a job: 💼 Jobs → Apply (POS business needs no skills). Then travel to the job and tap 💼 Go to work.",
    "Buttons with a 💰 tag earn money. Many pay more as your skill grows.",
  ] },
  { emoji: "💼", q: "How do jobs work?", steps: [
    "💼 Jobs → pick a job without 🔒 → Apply.",
    "Travel to the job's area (shown under the job).",
    "Tap 💼 Go to work at the bottom of the screen. A shift takes 6–8 hours and pays at the end.",
    "After enough shifts and the right skill level, you're promoted and paid more.",
  ] },
  { emoji: "🚌", q: "How do I get around?", steps: [
    "🚌 Travel → pick an area (Mushin, Yaba, the Island, Ikeja) → pick a ride.",
    "🚌 Danfo is cheap, 🏍️ Okada is fast, 🚶 Trek is free but slow and tiring. Rush hour (7–10 am, 4–8 pm) slows danfo and keke.",
    "Or tap 🚶🏾 Walk to walk the 3D streets yourself and go into any building.",
  ] },
  { emoji: "🛒", q: "How do I buy furniture?", steps: [
    "Go home to Mushin and tap 🛒 Shop.",
    "Pick an item, then tap the floor where it should go. Tap ⟳ to turn it.",
    "Tap Buy. Furniture unlocks new things to do: a TV for fun, a desk for coding, a generator for power cuts.",
  ] },
  { emoji: "🏠", q: "How does rent work?", steps: [
    "Rent is ₦15,000 every 7 days. The top bar shows how many days are left.",
    "It's taken by itself on rent day. If you're short, you owe the landlord.",
    "Pay what you owe with the Pay button on the red bar before the next rent day, or you're evicted.",
  ] },
  { emoji: "🕯️", q: "What is NEPA / no light?", steps: [
    "Sometimes the power goes off for a few hours (🕯️ at the top).",
    "Electric things (TV, fridge, fan, shower, laptop) won't work until it's back.",
    "A ⚡ Small generator with fuel gives you light. Buy fuel from 📱 Your phone.",
  ] },
  { emoji: "📈", q: "How do I get better skills?", steps: [
    "Do things with a 📈 tag: 📖 library and 👩🏾‍💻 coding class (Study), 🏋🏾 gym (Fitness), 💬 gist (Charisma), 🛒 trading (Hustle), 🍳 cooking (Cooking).",
    "See your levels in 👤 Me.",
  ] },
  { emoji: "✈️", q: "How do I win?", steps: [
    "Japa: pass IELTS in Yaba (needs Study), get a visa on the Island (needs ₦600,000 savings), then fly from Ikeja.",
    "Or stay: save ₦1.5 million and buy your own flat on the Island.",
    "Open ✈️ Goals to see each step and how close you are.",
  ] },
  { emoji: "🏷️", q: "What do the tags mean?", steps: [
    "🎯 your mission · 💰 earns money · 📈 trains a skill · 💡 needs light · 🧺 uses a meal pack · 🔒 needs a skill · 🕒 closed now.",
    "A grey button can't be used yet. The red line under it says why.",
  ] },
];

const dayPlan: [string, string][] = [
  ["🌅 Morning (6–9)", "Toilet, bucket bath, cook breakfast."],
  ["☀️ Day (9–17)", "Go to work or hustle. Train a skill if you're free."],
  ["🌆 Evening (17–22)", "Have fun and see friends: football, gist, call Mummy, the club opens at 21:00."],
  ["🌙 Night (22–6)", "Sleep. Waking up well rested gives you a good mood."],
];

/** The help panel: simple how-tos, a daily plan, and the full guide. */
export default function HelpSheet({ onGuide }: { onGuide: () => void }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <>
      <p className="lede">Tap a question to see how, step by step.</p>
      <div className="group faq">
        {howTos.map((h, i) => (
          <div key={h.q} className="faq-item">
            <button className="row" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <span className="row-emoji" aria-hidden>{h.emoji}</span>
              <span className="row-main"><span className="row-title">{h.q}</span></span>
              <span aria-hidden>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && (
              <ol className="how faq-steps">
                {h.steps.map(s => <li key={s}>{s}</li>)}
              </ol>
            )}
          </div>
        ))}
      </div>

      <h3>📅 How to get through a day</h3>
      <div className="group">
        {dayPlan.map(([when, what]) => (
          <div key={when} className="plan-row"><b>{when}</b><span>{what}</span></div>
        ))}
      </div>

      <button className="btn block" onClick={onGuide}>📖 Show the full beginner guide</button>
    </>
  );
}
