// Your room in Mushin: the floor plan, the furniture you can buy, power and supplies.
// Change numbers freely. Furniture actions live in actions.ts (look for `uses`).

export type FurnitureType =
  | "mattress" | "bed" | "bucket" | "shower" | "burner" | "fridge" | "tv" | "radio"
  | "chair" | "sofa" | "fan" | "plant" | "generator" | "rug" | "toilet"
  | "mirror" | "dumbbells" | "desk" | "bookshelf";

export type Furniture = {
  name: string;
  emoji: string;
  price: number;
  w: number;            // footprint in tiles, before turning
  d: number;
  power?: boolean;      // needs light (grid or generator) to use
  walkable?: boolean;   // you can walk over it (rugs)
  fixed?: boolean;      // part of the room: can't be sold, moved or bought
  blurb: string;
};

export type Placed = { uid: number; type: FurnitureType; x: number; y: number; rot: number };

/** Walls are lines between tiles. axis "v" = vertical line at x = `at` covering rows from..to-1.
 *  axis "h" = horizontal line at y = `at` covering columns from..to-1. `doors` are openings. */
export type Wall = { axis: "v" | "h"; at: number; from: number; to: number; doors: number[] };

export type HomePlan = {
  name: string;
  size: number;
  walls: Wall[];
  rooms: { name: string; x0: number; y0: number; x1: number; y1: number; floor: string; floor2: string }[];
  floor: string;
  floor2: string;
  wall: string;
  door: { x: number; y: number };   // where you stand when you come home
};

// Three rooms: kitchen and living room on the left, bathroom and bedroom on the right.
// The front door is in the front wall, into the living room.
export const HOME: HomePlan = {
  name: "Self-contain, Mushin",
  size: 8,
  walls: [
    { axis: "v", at: 5, from: 0, to: 3, doors: [1] },   // kitchen | bathroom
    { axis: "h", at: 3, from: 5, to: 8, doors: [] },    // bathroom | bedroom
    { axis: "v", at: 5, from: 3, to: 8, doors: [5] },   // living room | bedroom
  ],
  rooms: [
    { name: "Kitchen",  x0: 0, y0: 0, x1: 5, y1: 3, floor: "#e3d7bf", floor2: "#d4c6a8" },
    { name: "Bathroom", x0: 5, y0: 0, x1: 8, y1: 3, floor: "#8fbcc9", floor2: "#a7cfda" },
    { name: "Bedroom",  x0: 5, y0: 3, x1: 8, y1: 8, floor: "#a8795a", floor2: "#a8795a" },
  ],
  floor: "#c9a27a",   // living room
  floor2: "#bf9670",
  wall: "#efe4d0",
  door: { x: 2, y: 7 },
};

/** Which room a tile is in (for labels). */
export const roomAt = (x: number, y: number) =>
  HOME.rooms.find(r => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1)?.name ?? "Living room";

export const CATALOG: Record<FurnitureType, Furniture> = {
  mattress:  { name: "Foam mattress",        emoji: "🛏️", price: 18_000,  w: 1, d: 2, blurb: "Sleep and nap." },
  bed:       { name: "Bed frame + mattress", emoji: "🛌", price: 65_000,  w: 2, d: 2, blurb: "Sleep faster and wake up happier." },
  bucket:    { name: "Bucket & bowl",        emoji: "🪣", price: 3_000,   w: 1, d: 1, blurb: "Bucket bath. No light needed." },
  shower:    { name: "Electric shower",      emoji: "🚿", price: 45_000,  w: 1, d: 1, power: true, blurb: "Quick, full clean. Needs light." },
  burner:    { name: "Gas burner",           emoji: "🍳", price: 15_000,  w: 1, d: 1, blurb: "Cook a pot of food from your groceries." },
  fridge:    { name: "Fridge",               emoji: "🧊", price: 85_000,  w: 1, d: 1, power: true, blurb: "Quick snack from your groceries. Needs light." },
  tv:        { name: "Flat-screen TV",       emoji: "📺", price: 70_000,  w: 2, d: 1, power: true, blurb: "Nollywood on a big screen. Needs light." },
  radio:     { name: "Radio",                emoji: "📻", price: 8_000,   w: 1, d: 1, blurb: "Battery radio. Works when NEPA takes light." },
  chair:     { name: "Plastic chair",        emoji: "🪑", price: 4_500,   w: 1, d: 1, blurb: "Sit and cool down." },
  sofa:      { name: "Two-seater sofa",      emoji: "🛋️", price: 55_000,  w: 2, d: 1, blurb: "Lounge, nap and host friends." },
  fan:       { name: "Standing fan",         emoji: "🌀", price: 15_000,  w: 1, d: 1, power: true, blurb: "Beat the heat. Needs light." },
  plant:     { name: "Potted plant",         emoji: "🪴", price: 4_000,   w: 1, d: 1, blurb: "A little green. Small joy." },
  generator: { name: "Small generator",      emoji: "⚡", price: 120_000, w: 1, d: 1, blurb: "Gives light during power cuts. Burns fuel." },
  rug:       { name: "Rug",                  emoji: "🟪", price: 9_000,   w: 2, d: 2, walkable: true, blurb: "Pure style. Walk on it, put things on it." },
  toilet:    { name: "Toilet",               emoji: "🚽", price: 0,       w: 1, d: 1, fixed: true, blurb: "Comes with the room." },
  mirror:    { name: "Standing mirror",      emoji: "🪞", price: 9_000,   w: 1, d: 1, blurb: "Practise speeches: grows Charisma." },
  dumbbells: { name: "Dumbbell rack",        emoji: "🏋🏾", price: 14_000,  w: 1, d: 1, blurb: "Work out at home: grows Fitness." },
  desk:      { name: "Desk + laptop",        emoji: "💻", price: 160_000, w: 2, d: 1, power: true, blurb: "Learn to code and do freelance gigs from home. Needs light." },
  bookshelf: { name: "Bookshelf",            emoji: "📚", price: 12_000,  w: 1, d: 1, blurb: "Read books: grows Study." },
};

export const shopList = (Object.keys(CATALOG) as FurnitureType[]).filter(t => !CATALOG[t].fixed);

/** What the room comes with. */
export const START_OBJECTS: Omit<Placed, "uid">[] = [
  { type: "mattress", x: 7, y: 4, rot: 0 },   // bedroom
  { type: "bucket",   x: 6, y: 0, rot: 0 },   // bathroom
  { type: "toilet",   x: 7, y: 1, rot: 0 },
  { type: "burner",   x: 2, y: 0, rot: 0 },   // kitchen
  { type: "chair",    x: 1, y: 4, rot: 0 },   // living room
  { type: "plant",    x: 4, y: 7, rot: 0 },
];

export const SELL_BACK = 0.5;     // you get half the price back when you sell

export const POWER = {
  outagePerHour: 0.07,            // chance per in-game hour that NEPA takes light
  outageHours: [2, 10] as const,  // how long a cut lasts (inclusive)
  fuelPerHour: 1,                 // litres the generator burns
};

export const START_SUPPLIES = { food: 3, fuel: 0 };

// Rent you can't pay piles up. Owe this many weeks and you're evicted.
export const EVICT_AFTER_WEEKS = 2;
