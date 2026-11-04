// Furnished home designs: a wall layout, floors AND furniture, sold as one package (like a showroom home).
// Each design lists what goes in which part of the flat; src/engine/designs.ts places every piece so it fits at any size,
// downstairs and (if you have built the second floor) upstairs. The price is the furniture at shop prices plus the designer's fee.

import { blueprintById } from "./blueprints";
import { edgeKey, type FurnitureType } from "./home";

/** A part of the flat, as a fraction of its width and height: the whole thing, a half, a quarter or the middle. */
export type Zone = "all" | "top" | "bottom" | "left" | "right" | "tl" | "tr" | "bl" | "br" | "mid";
export const ZONES: Record<Zone, [number, number, number, number]> = {
  all: [0, 0, 1, 1], top: [0, 0, 1, 0.5], bottom: [0, 0.5, 1, 1], left: [0, 0, 0.5, 1], right: [0.5, 0, 1, 1],
  tl: [0, 0, 0.5, 0.5], tr: [0.5, 0, 1, 0.5], bl: [0, 0.5, 0.5, 1], br: [0.5, 0.5, 1, 1], mid: [0.25, 0.25, 0.75, 0.75],
};

export type Design = {
  id: string;
  emoji: string;
  /** The smallest extension level (0 to 5) the design fits in: its furniture needs the room. */
  minLevel: number;
  /** The designer's fee on top of the furniture. */
  fee: number;
  walls: (n: number) => string[];
  floors: Record<string, string>;
  ground: [Zone, FurnitureType[]][];
  /** Upstairs furniture (used when the second floor is built). */
  upper?: [Zone, FurnitureType[]][];
};

const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a) }, (_, k) => a + k);
const V = (at: number, from: number, to: number, gaps: number[] = []) => range(from, to).filter(i => !gaps.includes(i)).map(i => edgeKey("v", at, i));
const H = (at: number, from: number, to: number, gaps: number[] = []) => range(from, to).filter(i => !gaps.includes(i)).map(i => edgeKey("h", at, i));
const layout = (id: string) => blueprintById(id)!.walls;

/** Four rooms in the corners round an open middle, each with a doorway to the middle. */
const quad = (n: number) => {
  const a = Math.floor(n * 0.4), b = n - a;
  return [...V(a, 0, a, [Math.floor(a / 2)]), ...H(a, 0, a, [Math.floor(a / 2)]), ...V(b, 0, a, [Math.floor(a / 2)]), ...H(a, b, n, [b + Math.floor(a / 2)]),
    ...V(a, b, n, [b + Math.floor(a / 2)]), ...H(b, 0, a, [Math.floor(a / 2)]), ...V(b, b, n, [b + Math.floor(a / 2)]), ...H(b, b, n, [b + Math.floor(a / 2)])];
};
/** A bedroom block down the left, the living space open on the right. */
const wingLeft = (n: number) => {
  const a = Math.floor(n * 0.35), m = Math.floor(n / 2);
  return [...V(a, 0, n, [1, m + 1]), ...H(m, 0, a, [1]), ...V(a, 0, 0)];
};
/** A kitchen and bathroom strip along the top, everything else open. */
const strip = (n: number) => {
  const t = Math.max(3, Math.floor(n / 4));
  return [...H(t, 0, n, [1, Math.floor(n / 2) + 1]), ...V(Math.floor(n / 2), 0, t, [1])];
};


export const DESIGNS: Design[] = [
  {
    id: "starter", emoji: "🌱", minLevel: 0, fee: 60_000, walls: layout("studio"),
    floors: { Kitchen: "tile", Bathroom: "tile", "Living room": "wood", Bedroom: "carpet" },
    ground: [["top", ["fridge", "burner", "shower"]], ["bl", ["bed", "wardrobe"]], ["br", ["sofa", "tv", "fan"]], ["mid", ["rug", "plant"]]],
  },
  {
    id: "bachelor", emoji: "🎮", minLevel: 0, fee: 120_000, walls: layout("loft"),
    floors: { Kitchen: "tile", Bathroom: "tile", "Living room": "oak", Bedroom: "oak" },
    ground: [["top", ["fridge", "burner", "shower", "mirror"]], ["bl", ["kingbed", "wardrobe", "lamp"]], ["right", ["sofa", "tvstand", "tv", "coffeetable", "armchair"]], ["mid", ["rug", "speaker"]]],
  },
  {
    id: "lagosloft", emoji: "🏙️", minLevel: 1, fee: 260_000, walls: strip,
    floors: { Kitchen: "marble", Bathroom: "marble", "Living room": "oak", Bedroom: "oak", "Dining area": "oak" },
    ground: [["top", ["fridge", "burner", "island", "shower", "mirror"]], ["bl", ["kingbed", "wardrobe", "dresser", "lamp"]], ["br", ["leathersofa", "tvstand", "tv", "coffeetable", "aircon"]], ["bottom", ["dining", "plant", "art", "rug"]]],
    upper: [["left", ["kingbed", "wardrobe", "lamp"]], ["right", ["desk", "bookshelf", "armchair", "plant"]]],
  },
  {
    id: "workhome", emoji: "💼", minLevel: 1, fee: 300_000, walls: layout("twobed"),
    floors: { Kitchen: "tile", Bathroom: "tile", "Living room": "wood", Bedroom: "carpet", Study: "wood" },
    ground: [["left", ["fridge", "burner", "sofa", "tv", "coffeetable", "plant"]], ["tr", ["desk", "bookshelf", "armchair", "lamp"]], ["br", ["bed", "wardrobe", "sidetable"]], ["mid", ["rug"]]],
    upper: [["left", ["desk", "desk", "bookshelf", "bookshelf", "lamp"]], ["right", ["bed", "wardrobe", "plant"]]],
  },
  {
    id: "creator", emoji: "🎨", minLevel: 1, fee: 340_000, walls: wingLeft,
    floors: { Kitchen: "tile", Bathroom: "tile", "Living room": "wood", Bedroom: "carpet" },
    ground: [["left", ["bed", "wardrobe", "shoerack", "mirror"]], ["tr", ["desk", "speaker", "bookshelf", "art", "art"]], ["br", ["fridge", "burner", "sofa", "armchair", "tv", "lamp"]], ["mid", ["rug", "plant"]]],
    upper: [["all", ["desk", "speaker", "art", "art", "armchair", "bookshelf", "lamp", "plant"]]],
  },
  {
    id: "fitness", emoji: "🏋🏾", minLevel: 1, fee: 280_000, walls: layout("studio"),
    floors: { Kitchen: "tile", Bathroom: "tile", "Living room": "wood", Bedroom: "wood" },
    ground: [["top", ["fridge", "burner", "shower", "mirror"]], ["bl", ["bed", "wardrobe"]], ["right", ["dumbbells", "dumbbells", "mirror", "rug", "fan", "speaker"]], ["mid", ["sofa", "tv"]]],
    upper: [["all", ["dumbbells", "dumbbells", "mirror", "mirror", "rug", "aircon", "speaker"]]],
  },
  {
    id: "family", emoji: "🏡", minLevel: 2, fee: 520_000, walls: layout("family"),
    floors: { Kitchen: "tile", Bathroom: "tile", "Living room": "wood", Bedroom: "carpet", Study: "carpet", "Guest room": "carpet", "Dining area": "oak" },
    ground: [["tl", ["fridge", "burner", "island", "dining"]], ["bl", ["sofa", "armchair", "tv", "coffeetable", "plant", "rug"]], ["tr", ["bed", "wardrobe", "sidetable"]], ["mid", ["bed", "wardrobe"]], ["br", ["bed", "wardrobe", "lamp"]]],
    upper: [["left", ["kingbed", "wardrobe", "dresser", "lamp", "plant"]], ["right", ["bed", "bed", "wardrobe", "desk", "bookshelf"]]],
  },
  {
    id: "party", emoji: "🪩", minLevel: 2, fee: 560_000, walls: strip,
    floors: { Kitchen: "tile", Bathroom: "tile", "Living room": "oak", Bedroom: "oak", "Dining area": "marble" },
    ground: [["top", ["fridge", "burner", "island", "fridge", "shower"]], ["bl", ["leathersofa", "sofa", "armchair", "armchair", "tvstand", "tv", "speaker"]], ["br", ["dining", "speaker", "lantern", "plant", "plant"]], ["mid", ["rug", "rug", "lamp"]]],
    upper: [["left", ["kingbed", "wardrobe", "dresser"]], ["right", ["bed", "wardrobe", "sofa", "tv"]]],
  },
  {
    id: "zen", emoji: "🧘🏾", minLevel: 2, fee: 450_000, walls: quad,
    floors: { Kitchen: "wood", Bathroom: "marble", "Living room": "oak", Bedroom: "oak", Study: "oak", "Guest room": "oak" },
    ground: [["tl", ["bed", "wardrobe", "lamp"]], ["tr", ["desk", "bookshelf", "plant"]], ["bl", ["fridge", "burner", "island"]], ["br", ["dining", "vase", "plant"]], ["mid", ["armchair", "armchair", "coffeetable", "rug", "plant", "lantern"]]],
    upper: [["left", ["kingbed", "wardrobe", "lamp", "plant"]], ["right", ["bed", "wardrobe", "candles"]]],
  },
  {
    id: "cottage", emoji: "🌿", minLevel: 2, fee: 400_000, walls: layout("family"),
    floors: { Kitchen: "wood", Bathroom: "tile", "Living room": "wood", Bedroom: "carpet", Study: "wood", "Guest room": "carpet", "Dining area": "wood" },
    ground: [["tl", ["fridge", "burner", "dining", "basket"]], ["bl", ["sofa", "armchair", "tv", "plant", "plant", "plant", "cactus", "rug"]], ["tr", ["bed", "wardrobe", "vase"]], ["mid", ["bed", "wardrobe", "calabash"]], ["br", ["bed", "wardrobe", "lantern"]]],
    upper: [["all", ["kingbed", "wardrobe", "plant", "plant", "armchair", "bookshelf", "lamp", "vase"]]],
  },
  {
    id: "executive", emoji: "🏰", minLevel: 3, fee: 1_100_000, walls: layout("suite"),
    floors: { Kitchen: "marble", Bathroom: "marble", "Living room": "oak", Bedroom: "carpet", Study: "wood", "Guest room": "carpet", "Dining area": "marble" },
    ground: [["tr", ["kingbed", "wardrobe", "dresser", "aircon", "lamp", "armchair"]], ["br", ["bed", "wardrobe", "desk", "bookshelf", "aircon"]], ["tl", ["fridge", "burner", "island", "shower", "mirror"]], ["bl", ["leathersofa", "armchair", "tvstand", "tv", "coffeetable", "aircon", "art", "grandclock", "rug"]], ["mid", ["dining", "vase", "plant"]]],
    upper: [["left", ["kingbed", "wardrobe", "dresser", "aircon", "lamp", "trophy"]], ["right", ["desk", "desk", "bookshelf", "bookshelf", "armchair", "globe", "aircon"]]],
  },
  {
    id: "mansion", emoji: "🏛️", minLevel: 4, fee: 2_400_000, walls: layout("suite"),
    floors: { Kitchen: "marble", Bathroom: "marble", "Living room": "marble", Bedroom: "carpet", Study: "oak", "Guest room": "carpet", "Dining area": "marble" },
    ground: [["tr", ["kingbed", "wardrobe", "dresser", "aircon", "armchair", "lamp", "art", "vase"]], ["br", ["kingbed", "wardrobe", "desk", "aircon", "bookshelf", "globe"]], ["tl", ["fridge", "fridge", "burner", "island", "shower", "mirror", "generator"]], ["bl", ["leathersofa", "leathersofa", "armchair", "armchair", "tvstand", "tv", "coffeetable", "aircon", "grandclock", "trophy", "art", "speaker", "rug"]], ["mid", ["dining", "vase", "lantern", "plant", "plant"]]],
    upper: [["left", ["kingbed", "wardrobe", "dresser", "aircon", "armchair", "lamp", "art", "vase"]], ["right", ["kingbed", "wardrobe", "desk", "bookshelf", "aircon", "globe", "trophy"]]],
  },
];

export const designById = (id: string) => DESIGNS.find(d => d.id === id);

/** The English text of each design (other languages are in src/i18n). */
export const DESIGN_TEXT: Record<string, { name: string; desc: string }> = {
  starter: { name: "Starter Studio", desc: "A sleeping nook, a little kitchen and a sofa with a TV. Everything you need to start, nothing you do not." },
  bachelor: { name: "Bachelor Pad", desc: "An open loft with a big bed, a sound system and a proper TV corner for game nights." },
  lagosloft: { name: "Lagos Loft", desc: "Marble kitchen with an island, a leather sofa lounge, dining space and air conditioning. Upstairs: a bedroom and a study." },
  workhome: { name: "Work-from-Home Pro", desc: "Two bedrooms and a real study with a desk and bookshelves. Upstairs: two desks for a home office." },
  creator: { name: "Creator Studio", desc: "A bedroom block, a desk with a speaker and gallery art, and an open lounge. Upstairs becomes a full studio." },
  fitness: { name: "Fitness Home", desc: "A bedroom, a small kitchen and a gym corner with dumbbells and mirrors. Upstairs is a full workout room." },
  family: { name: "Family Home", desc: "A kitchen with a dining table, a big living room, and three bedrooms. Upstairs: a master bedroom and kids rooms." },
  party: { name: "Party House", desc: "A huge lounge with sofas, speakers and a dining area for the owambe. Upstairs: two quiet bedrooms." },
  zen: { name: "Zen Retreat", desc: "Four calm rooms around an open middle: a bedroom, a study, a kitchen, a dining corner and a quiet seating area." },
  cottage: { name: "Garden Cottage", desc: "Warm wood floors, baskets, calabashes and plants everywhere. A cosy home that feels like a village compound." },
  executive: { name: "Executive Suite", desc: "Marble finishes, a master suite, a study, a guest room, air conditioning everywhere and a grandfather clock." },
  mansion: { name: "Grand Mansion", desc: "The full showroom: two king suites, a generator, leather lounges, a trophy room and a globe. Money no object." },
};
