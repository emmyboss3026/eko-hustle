// House blueprints: ready-made wall layouts you can buy and use on your flat. Each one is a function of the flat's size
// (8, 10 or 12 tiles), so it fits however far you have extended. Walls are edges (see edgeKey in home.ts); every room
// has a doorway (a gap in the wall), so every part of the flat can be reached and none of it is wasted.

import { edgeKey } from "./home";

export type Blueprint = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  price: number;
  walls: (n: number) => string[];
  floors: Record<string, string>;   // floors laid with it, by room name
};

const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a) }, (_, k) => a + k);
/** A vertical wall at x = `at` beside rows from..to-1, with doorways at `gaps`. */
const V = (at: number, from: number, to: number, gaps: number[] = []) => range(from, to).filter(i => !gaps.includes(i)).map(i => edgeKey("v", at, i));
/** A horizontal wall at y = `at` beside columns from..to-1, with doorways at `gaps`. */
const H = (at: number, from: number, to: number, gaps: number[] = []) => range(from, to).filter(i => !gaps.includes(i)).map(i => edgeKey("h", at, i));

/** A bathroom in the top-right corner, with a doorway into the flat. */
const bathroom = (n: number) => [...V(n - 3, 0, 3, [1]), ...H(3, n - 3, n, [n - 2])];

export const BLUEPRINTS: Blueprint[] = [
  {
    id: "loft", emoji: "🏙️", name: "Open-plan loft", price: 40_000,
    desc: "One big open space with just a bathroom in the corner. Nothing wasted on corridors.",
    walls: n => bathroom(n),
    floors: { Kitchen: "tile", Bathroom: "tile", "Living room": "oak", Bedroom: "oak" },
  },
  {
    id: "studio", emoji: "🛋️", name: "Studio with sleeping nook", price: 70_000,
    desc: "A half-wall divides the bed from the living area, so a small flat feels like two rooms.",
    walls: n => [...bathroom(n), ...H(Math.floor(n / 2), 0, Math.floor(n / 2))],
    floors: { Kitchen: "tile", Bathroom: "tile", "Living room": "wood", Bedroom: "carpet" },
  },
  {
    id: "twobed", emoji: "🛏️", name: "Two-bedroom flat", price: 140_000,
    desc: "A small bathroom, an open kitchen and living room, and two bedrooms down the right side.",
    walls: n => {
      const a = Math.floor(n * 0.6), m = Math.floor(n / 2);
      return [
        ...V(3, 0, 2), ...H(2, 0, 3, [1]),                                   // bathroom, top left
        ...V(a, 0, n, [Math.max(2, m - 3), m + 1]),                        // the wall between the open rooms and the bedrooms
        ...H(m, a, n, [a + 1]),                                            // between the two bedrooms
      ];
    },
    floors: { Kitchen: "tile", Bathroom: "tile", "Living room": "oak", Bedroom: "carpet", Study: "carpet" },
  },
  {
    id: "family", emoji: "🏡", name: "Family home", price: 260_000,
    desc: "A kitchen, a living room and three bedrooms around a central passage. Space for everyone.",
    walls: n => {
      const a = Math.floor(n * 0.55), t = Math.floor(n / 3);
      return [
        ...V(a, 0, n, [1, t + 1, 2 * t + 1]),                              // passage side, one doorway per bedroom
        ...H(t, a, n, [a + 1]), ...H(2 * t, a, n, [a + 1]),               // three bedrooms stacked on the right
        ...H(t, 0, a, [1]),                                                // kitchen across the top
        ...V(2, 0, t, [Math.max(0, t - 1)]),                               // a pantry beside it
      ];
    },
    floors: { Kitchen: "tile", Bathroom: "tile", "Living room": "wood", Bedroom: "carpet", Study: "carpet", "Guest room": "carpet", "Dining area": "oak" },
  },
  {
    id: "suite", emoji: "🏰", name: "Executive suite", price: 520_000,
    desc: "A master suite with its own bathroom, a study, a guest room and a big open living and dining space.",
    walls: n => {
      const w = n - 4, m = Math.floor(n / 2);
      return [
        ...V(w, 0, m, [1]), ...H(m, w, n, [w + 1]),                       // master suite, top right
        ...V(n - 2, 0, 2), ...H(2, n - 2, n, [n - 1]),                     // its bathroom
        ...V(w, m, n, [m + 1]),                                            // study and guest room below
        ...H(m + Math.floor((n - m) / 2), w, n, [w + 1]),                  // between them
        ...H(2, 0, 3, [1]), ...V(3, 0, 2),                                 // a bathroom, top left
      ];
    },
    floors: { Kitchen: "marble", Bathroom: "marble", "Living room": "oak", Bedroom: "carpet", Study: "wood", "Guest room": "carpet", "Dining area": "marble" },
  },
];

export const blueprintById = (id: string) => BLUEPRINTS.find(b => b.id === id);
