// Tips: short hints that react to what's happening right now, plus general advice.
// The most urgent tip is shown in the tip bubble; the player can tap "Next" for more.

import type { GameState } from "../engine/game";
import { dayOf, powered } from "../engine/game";
import { RENT, RENT_EVERY_DAYS, naira } from "../engine/economy";
import { careers } from "../data/careers";
import { districts } from "../data/places";

export type Tip = { id: string; emoji: string; text: string; urgent?: boolean };

const hourOf = (s: GameState) => (s.time % 1440) / 60;

/** Tips for this moment, most urgent first. */
export function tipsFor(s: GameState): Tip[] {
  const n = s.needs;
  const h = hourOf(s);
  const home = s.location === "mushin";
  const tips: Tip[] = [];
  const add = (id: string, emoji: string, text: string, urgent = false) => tips.push({ id, emoji, text, urgent });

  // Danger first
  if (s.health < 40) add("health", "❤️", "Your health is dropping because some needs are empty. Fill the red bars fast: eat, sleep, use the toilet.", true);
  if (s.rentOwed > 0) add("owed", "😬", `You owe the landlord ${naira(s.rentOwed)}. Tap Pay on the red bar at the top before next rent day, or you'll be evicted.`, true);
  const day = dayOf(s.time);
  const daysToRent = RENT_EVERY_DAYS - ((day - 1) % RENT_EVERY_DAYS);
  if (daysToRent <= 2 && s.money < RENT) add("rent", "🏠", `Rent (${naira(RENT)}) is due in ${daysToRent} day${daysToRent > 1 ? "s" : ""} and you have ${naira(s.money)}. Work shifts and hustle now!`, true);

  // Needs
  if (n.bladder < 25) add("bladder", "🚻", home ? "You need the toilet! Tap the toilet in the bathroom." : "You need the toilet! Open 📍 Places: there's a public toilet under 📱 Your phone.", true);
  if (n.hunger < 30) add("hunger", "🍲", home ? "You're hungry. Tap the gas burner in the kitchen → Cook egusi, or eat at Mama Ronke's Buka (📍 Places)." : "You're hungry. Open 📍 Places and pick something to eat (look for the 🍲 hunger chip).", true);
  if (n.energy < 25) add("energy", "⚡", home ? "You're exhausted. Tap your mattress in the bedroom → Sleep." : "You're exhausted. Go home and sleep (🚌 Travel → Mushin), or rent a short-let nap on the Island.", true);
  if (n.hygiene < 25) add("hygiene", "🛁", home ? "You smell! Tap the bucket in the bathroom → Bucket bath." : "You need a wash. The gym shower in Yaba costs ₦200, or go home for a free bucket bath.");
  if (n.social < 25) add("social", "💬", "You're lonely. Call Mummy (📍 Places → 📱 Your phone) or gist with friends.");
  if (n.fun < 25) add("fun", "🎉", "You're bored. Watch Nollywood, play football, or hang out at the beach.");

  // Situation
  if (!powered(s) && home) add("nepa", "🕯️", "NEPA took light: the TV, fridge, fan and shower won't work. A radio still works. A generator (₦120,000) beats NEPA.");
  if (s.home.food === 0) add("food", "🧺", "No meal packs left at home. Buy groceries at Oja Tuntun Market (cheap) or order delivery on your phone.");
  if (!s.career) add("job", "💼", "No job yet. Open 💼 Jobs and apply: POS business needs no skills and pays ₦6,000+ a shift.");
  if (s.career) {
    const c = careers[s.career.id];
    if (s.location !== c.where) add("work-far", "🚌", `Your job is in ${districts[c.where].name}. Travel there (🚌 Travel) to work a shift.`);
    else if (n.energy >= 15) add("work-here", "💼", "You're near your job. Tap 💼 Go to work at the bottom to earn money.");
  }
  if (h >= 22 || h < 5) add("late", "🌙", "It's late. Sleeping now gives you a 😌 Well rested mood for tomorrow.");
  if (h >= 6 && h < 9) add("morning", "🌅", "Good morning! A good start: bath, eat, then head to work before the rush hour (7–10 am) gets bad.");

  // General advice (always there, shown when nothing else is going on)
  add("plan", "📅", "A good day: morning bath and food, work in the day, fun and friends in the evening, sleep before midnight.");
  add("pause", "⏸️", "The clock runs by itself. Tap ❚❚ at the top to pause while you think.");
  add("mood", "😄", "Keep your mood at 70+ and every shift pays 10% more. Moods from food, sleep and fun all add up.");
  add("skills", "📈", "Buttons with a 📈 tag train skills. Better skills unlock better jobs and bigger side hustles.");
  add("walk", "🚶🏾", "Tap 🚶🏾 Walk to explore the 3D streets for free. Walk up to a glowing ring to go inside.");
  add("save", "💾", "The game saves by itself on this device. Sign in (👤 Me) to keep it safe in the cloud.");
  add("help", "❓", "Stuck? Tap ❓ Help at the top for simple how-tos.");
  return tips;
}
