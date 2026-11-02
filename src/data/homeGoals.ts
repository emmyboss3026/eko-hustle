// Home goals: a ladder of milestones for your flat, your yard and your cars. Each one is a list of tasks (the same kind
// the story uses), a reward, and a story flag "home:<id>" when you claim it. Those flags open side missions (see sides.ts),
// and later goals wait for the story to reach a chapter, so your home and your story grow together.

import type { Effect, Task } from "./story/types";

export type HomeGoal = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  tasks: Task[];
  reward: Effect;
  ch?: number;         // opens when the main story reaches this chapter
};

export const HOME_GOALS: HomeGoal[] = [
  { id: "settle", emoji: "🛋️", name: "Settle in", desc: "A flat is not a home until it has furniture. Fill it.",
    tasks: [{ furnish: 8 }], reward: { money: 15_000, xp: 100, rep: 1 } },
  { id: "colour", emoji: "🎨", name: "Make it yours", desc: "Lay new floors and move a wall. Your taste, your flat.",
    tasks: [{ floors: 2 }, { rearranged: true }], reward: { money: 20_000, xp: 120, rep: 1 } },
  { id: "yard", emoji: "🌳", name: "Own the yard", desc: "A driveway and a garden turn a compound into a front yard.",
    tasks: [{ built: "driveway" }, { built: "garden" }], reward: { money: 30_000, xp: 150, rep: 2 } },
  { id: "wheels", emoji: "🚗", name: "First wheels", desc: "Buy your first vehicle and park it at home.",
    tasks: [{ cars: 1 }], reward: { xp: 200, rep: 3, bond: { tunde: 5 } } },
  { id: "extend", emoji: "🧱", name: "Room to grow", desc: "Build an extension: a study, a guest room, a dining area.",
    tasks: [{ built: "wing" }, { homeSize: 12 }], reward: { money: 50_000, xp: 300, rep: 3 }, ch: 3 },
  { id: "duplex", emoji: "🏢", name: "Duplex living", desc: "A balcony, then a whole second floor.",
    tasks: [{ built: "balcony" }, { built: "floor2" }], reward: { money: 100_000, xp: 400, rep: 5 }, ch: 5 },
  { id: "garage", emoji: "🏠", name: "A proper garage", desc: "A covered garage, and two vehicles to fill the drive.",
    tasks: [{ built: "garage" }, { cars: 2 }], reward: { money: 80_000, xp: 350, rep: 4 }, ch: 5 },
  { id: "mansion", emoji: "🏰", name: "The big house", desc: "Second floor, garage, pool and the largest extension. The whole estate.",
    tasks: [{ built: "floor2" }, { built: "garage" }, { built: "pool" }, { built: "wing2" }], reward: { money: 250_000, xp: 800, rep: 8 }, ch: 7 },
];

export const homeGoalById = (id: string) => HOME_GOALS.find(g => g.id === id);
