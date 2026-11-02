// Your room in Mushin: the floor plan, the furniture you can buy, power and supplies.
// Change numbers freely. Furniture actions live in actions.ts (look for `uses`).

export type FurnitureType =
  | "mattress" | "bed" | "bucket" | "shower" | "burner" | "fridge" | "tv" | "radio"
  | "chair" | "sofa" | "fan" | "plant" | "generator" | "rug" | "toilet"
  | "mirror" | "dumbbells" | "desk" | "bookshelf"
  | "wardrobe" | "dining" | "lamp" | "art" | "curtain" | "armchair" | "aircon" | "leathersofa"
  | "tvstand" | "coffeetable" | "sidetable" | "kingbed" | "dresser" | "island" | "shoerack" | "washer" | "ottoman" | "cabinet" | "vase" | "grandclock" | "frames" | "candles" | "basket" | "trophy" | "globe" | "speaker" | "lantern" | "cactus" | "runner" | "doormat";

export type Furniture = {
  name: string;
  emoji: string;
  price: number;
  w: number;            // footprint in tiles, before turning
  d: number;
  power?: boolean;      // needs light (grid or generator) to use
  walkable?: boolean;   // you can walk over it (rugs)
  fixed?: boolean;      // part of the room: can't be sold, moved or bought
  decor?: boolean;      // an accessory: sold on the Accessories tab, only for looks
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
    { name: "Kitchen",  x0: 0, y0: 0, x1: 5, y1: 3, floor: "#eef2f5", floor2: "#d9e2e8" },
    { name: "Bathroom", x0: 5, y0: 0, x1: 8, y1: 3, floor: "#8fd6e4", floor2: "#aee6f0" },
    { name: "Bedroom",  x0: 5, y0: 3, x1: 8, y1: 8, floor: "#d9b88f", floor2: "#cdab80" },
  ],
  floor: "#e6c79a",   // living room: light wood
  floor2: "#dcbb8c",
  wall: "#fffaf0",
  door: { x: 2, y: 7 },
};

/** Extra rooms you can build onto the flat. The room grows right and down, so tiles you already filled never move.
 *  wing: 8 x 8 becomes 10 x 10. wing2: 12 x 12. */
export const EXTRA_ROOMS = ["Study", "Guest room", "Dining area"] as const;
export const MAX_SIZE = 20;

export const MAX_WING = 6;
const WING_KEYS = ["wing", "wing2", "wing3", "wing4", "wing5", "wing6"] as const;
/** How many extensions are built, in order: each one needs the one before it. */
export function wingLevel(p?: Partial<Record<(typeof WING_KEYS)[number], boolean>>): number {
  let n = 0;
  while (n < MAX_WING && p?.[WING_KEYS[n]]) n++;
  return n;
}

/** Walls you can move are kept as single edges between two tiles: "v:5:2" is the vertical line at x = 5 beside row 2,
 *  "h:3:6" the horizontal line at y = 3 beside column 6. */
export const WALL_PRICE = 6_000;
export const edgeKey = (axis: "v" | "h", at: number, i: number) => `${axis}:${at}:${i}`;

export function wallsToEdges(walls: Wall[]): string[] {
  const out: string[] = [];
  for (const w of walls) for (let i = w.from; i < w.to; i++) if (!w.doors.includes(i)) out.push(edgeKey(w.axis, w.at, i));
  return out;
}

export function edgesToWalls(edges: string[]): Wall[] {
  const walls: Wall[] = [];
  for (const e of edges) {
    const [axis, at, i] = e.split(":");
    if ((axis !== "v" && axis !== "h") || !Number.isInteger(+at) || !Number.isInteger(+i)) continue;
    walls.push({ axis, at: +at, from: +i, to: +i + 1, doors: [] });
  }
  return walls;
}

/** The walls a flat comes with at this wing level, as edges. */
export const defaultEdges = (level: number) => wallsToEdges(basePlan(level).walls);

/** Is this a wall edge inside a flat of this size? (Outer walls are not edges; they are fixed.) */
export function validEdge(e: string, size: number): boolean {
  const m = /^([vh]):(\d{1,2}):(\d{1,2})$/.exec(e);
  return !!m && +m[2] >= 1 && +m[2] < size && +m[3] >= 0 && +m[3] < size;
}

/** Take out the pieces of wall that do nothing. Walls that join up form one piece of structure; if none of it touches the outer
 *  wall it floats in the middle of a room, divides nothing and wastes space, so it goes. A wall (or a half-wall) joined to the outer
 *  wall, directly or through other walls, stays. Also drops edges outside the flat and duplicates. */
export function tidyEdges(edges: string[], size: number): string[] {
  const all = [...new Set(edges.filter(e => validEdge(e, size)))];
  const ends = (e: string): [string, string] => {
    const [axis, at, i] = e.split(":");
    return axis === "v" ? [`${at},${i}`, `${at},${+i + 1}`] : [`${i},${at}`, `${+i + 1},${at}`];
  };
  const onEdge = (v: string) => {
    const [x, y] = v.split(",").map(Number);
    return x === 0 || y === 0 || x === size || y === size;
  };
  // Start from the vertices on the outer wall and spread along touching walls
  const reached = new Set<string>();
  const keep = new Set<string>();
  const byVertex = new Map<string, string[]>();
  for (const e of all) for (const v of ends(e)) byVertex.set(v, [...(byVertex.get(v) ?? []), e]);
  // A one-tile doorway does not break a wall: the pieces either side of it belong together
  const linked = new Map<string, string[]>();
  const set = new Set(all);
  for (const e of all) {
    const [axis, at, i] = e.split(":");
    if (set.has(`${axis}:${at}:${+i + 1}`) || !set.has(`${axis}:${at}:${+i + 2}`)) continue;
    const [, from] = ends(e);
    const [to] = ends(`${axis}:${at}:${+i + 2}`);
    linked.set(from, [...(linked.get(from) ?? []), to]);
    linked.set(to, [...(linked.get(to) ?? []), from]);
  }
  const queue = [...byVertex.keys()].filter(onEdge);
  for (const v of queue) reached.add(v);
  for (let q = 0; q < queue.length; q++) {
    for (const v of linked.get(queue[q]) ?? []) if (!reached.has(v)) { reached.add(v); queue.push(v); }
    for (const e of byVertex.get(queue[q]) ?? []) {
      keep.add(e);
      for (const v of ends(e)) if (!reached.has(v)) { reached.add(v); queue.push(v); }
    }
  }
  return all.filter(e => keep.has(e));
}

/** Floors you can lay in a room (two shades make the chequer). Keys of Home.floors are room names, "Living room" for the rest. */
export const FLOORS = [
  { id: "wood", a: "#d8a878", b: "#cc9c6c" },
  { id: "oak", a: "#ead2ac", b: "#dfc49a" },
  { id: "tile", a: "#eef2f5", b: "#d9e2e8" },
  { id: "marble", a: "#f3ead8", b: "#e6dcc6" },
  { id: "carpet", a: "#79c6bd", b: "#6bb9b0" },
  { id: "slate", a: "#6b7480", b: "#5f6874" },
  { id: "terracotta", a: "#d98a63", b: "#cc7d57" },
] as const;
export const FLOOR_PRICE = 20_000;   // per room
export const floorById = (id: string) => FLOORS.find(f => f.id === id);
export type Floors = Record<string, string>;

/** Every room name a floor can be laid in. */
export const roomNames = (plan: HomePlan) => [...plan.rooms.map(r => r.name), "Living room"];

/** The flat for this wing level. `edges`: the walls you have moved; `floors`: the floors you have laid (otherwise what it came with). */
export function homePlan(level: number, edges?: string[], floors?: Floors): HomePlan {
  let plan = basePlan(level);
  if (edges) plan = { ...plan, walls: edgesToWalls(edges) };
  if (floors) {
    const pick = (room: string) => floorById(floors[room] ?? "");
    const living = pick("Living room");
    plan = {
      ...plan,
      floor: living?.a ?? plan.floor,
      floor2: living?.b ?? plan.floor2,
      rooms: plan.rooms.map(r => {
        const f = pick(r.name);
        return f ? { ...r, floor: f.a, floor2: f.b } : r;
      }),
    };
  }
  return plan;
}

function basePlan(level: number): HomePlan {
  if (level <= 0) return HOME;
  const size = HOME.size + 2 * Math.min(MAX_WING, level);
  return {
    ...HOME,
    name: level > 1 ? "Large home, Mushin" : "Extended flat, Mushin",
    size,
    walls: [
      ...HOME.walls,
      { axis: "v", at: HOME.size, from: 0, to: size, doors: [6] },              // old flat | new wing
      { axis: "h", at: 5, from: HOME.size, to: size, doors: [HOME.size + 1] },  // study | guest room
    ],
    rooms: [
      ...HOME.rooms,
      { name: "Study",       x0: HOME.size, y0: 0, x1: size, y1: 5,    floor: "#c9d6e8", floor2: "#bccbe0" },
      { name: "Guest room",  x0: HOME.size, y0: 5, x1: size, y1: size, floor: "#e8d3c0", floor2: "#dcc4ae" },
      { name: "Dining area", x0: 0, y0: HOME.size, x1: HOME.size, y1: size, floor: "#e9cf9f", floor2: "#ddc08c" },
    ],
    door: { x: HOME.door.x, y: size - 1 },
  };
}

/** The wing a visitor should see, worked out from where the owner's furniture stands (visitors are not told the upgrades). */
export const levelForObjects = (objs: { x: number; y: number }[]) => {
  const far = Math.max(0, ...objs.map(o => Math.max(o.x, o.y)));
  return far < HOME.size ? 0 : Math.min(MAX_WING, Math.floor((far - HOME.size) / 2) + 1);
};

/** Which room a tile is in (for labels). */
export const roomAt = (x: number, y: number, plan: HomePlan = HOME) =>
  plan.rooms.find(r => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1)?.name ?? "Living room";

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
  wardrobe:  { name: "Wardrobe",             emoji: "🚪", price: 90_000,  w: 2, d: 1, blurb: "Two big doors for your clothes. A proper bedroom." },
  dining:    { name: "Dining set",           emoji: "🍽️", price: 120_000, w: 2, d: 2, blurb: "A table with four chairs for family and friends." },
  lamp:      { name: "Floor lamp",           emoji: "💡", price: 20_000,  w: 1, d: 1, power: true, blurb: "Warm light in the corner. Glows when there is light." },
  art:       { name: "Wall artwork",         emoji: "🖼️", price: 15_000,  w: 1, d: 1, blurb: "A bold Nigerian print on a stand. Makes the room yours." },
  curtain:   { name: "Curtains",             emoji: "🪟", price: 18_000,  w: 1, d: 1, blurb: "Ankara curtains on a rail. Colour for the window." },
  armchair:  { name: "Armchair",             emoji: "💺", price: 60_000,  w: 1, d: 1, blurb: "A deep chair for reading and rest." },
  aircon:    { name: "Air conditioner",      emoji: "❄️", price: 220_000, w: 1, d: 1, power: true, blurb: "Cool air all night. Needs light." },
  tvstand: { name: "Furniture", emoji: "\ud83d\udcfa", price: 45000, w: 2, d: 1, blurb: "A low cabinet for the TV, the decoder and the console." },
  coffeetable: { name: "Coffee table", emoji: "\u2615", price: 30000, w: 2, d: 1, blurb: "A low table with a shelf underneath. Drinks, remotes and gist." },
  sidetable: { name: "Bedside table", emoji: "\ud83d\udecf\ufe0f", price: 12000, w: 1, d: 1, blurb: "A small table with a drawer for your phone and your keys." },
  kingbed: { name: "King-size bed", emoji: "\ud83d\udecc", price: 140000, w: 3, d: 2, blurb: "A huge bed with a headboard and two pillows. Sleep like a chief." },
  dresser: { name: "Dresser", emoji: "\ud83d\uddc4\ufe0f", price: 70000, w: 2, d: 1, blurb: "Three drawers and a small mirror on top." },
  island: { name: "Kitchen island", emoji: "\ud83c\udf7d\ufe0f", price: 110000, w: 2, d: 1, blurb: "A dark worktop with two stools. Cook, chat and eat in one place." },
  shoerack: { name: "Shoe rack", emoji: "\ud83d\udc5f", price: 8000, w: 1, d: 1, blurb: "Three shelves for the sneakers, the sandals and the church shoes." },
  washer: { name: "Washing machine", emoji: "\ud83e\uddfa", price: 180000, w: 1, d: 1, power: true, blurb: "Clothes washed at home. No more Saturday at the laundry. Needs light." },
  ottoman: { name: "Ottoman", emoji: "\ud83d\udfe0", price: 15000, w: 1, d: 1, blurb: "A round cushioned seat. Extra seat, footrest or small table." },
  cabinet: { name: "Display cabinet", emoji: "\ud83c\udffa", price: 55000, w: 1, d: 1, blurb: "Glass doors for the good plates, the trophies and the family photos." },
  vase: { name: "Flower vase", emoji: "\ud83d\udc90", price: 6000, w: 1, d: 1, decor: true, blurb: "A tall vase with fresh flowers. The room smells better already." },
  grandclock: { name: "Grandfather clock", emoji: "\ud83d\udd70\ufe0f", price: 85000, w: 1, d: 1, decor: true, blurb: "A tall wooden clock that ticks like a heartbeat." },
  frames: { name: "Photo frames", emoji: "\ud83d\uddbc\ufe0f", price: 7000, w: 1, d: 1, decor: true, blurb: "Three framed photos on a little table. Mummy would approve." },
  candles: { name: "Candles", emoji: "\ud83d\udd6f\ufe0f", price: 4000, w: 1, d: 1, decor: true, blurb: "Three candles on a plate. Soft light for NEPA nights." },
  basket: { name: "Woven basket", emoji: "\ud83e\uddfa", price: 9000, w: 1, d: 1, decor: true, blurb: "A hand-woven basket with a folded wrapper inside." },
  trophy: { name: "Trophy stand", emoji: "\ud83c\udfc6", price: 25000, w: 1, d: 1, decor: true, blurb: "Gold cups on a pedestal. Show what you have won." },
  globe: { name: "Globe", emoji: "\ud83c\udf0d", price: 18000, w: 1, d: 1, decor: true, blurb: "A globe on a wooden stand. For people who plan to japa, or just dream." },
  speaker: { name: "Tower speaker", emoji: "\ud83d\udd0a", price: 60000, w: 1, d: 1, power: true, decor: true, blurb: "Big sound for the owambe at home. Needs light." },
  lantern: { name: "Lantern", emoji: "\ud83c\udfee", price: 12000, w: 1, d: 1, decor: true, blurb: "A brass lantern with a warm glow that needs no electricity." },
  cactus: { name: "Cactus", emoji: "\ud83c\udf35", price: 5000, w: 1, d: 1, decor: true, blurb: "A tough little plant. Water it never, love it always." },
  runner: { name: "Hallway runner", emoji: "\ud83d\udfeb", price: 22000, w: 1, d: 3, walkable: true, decor: true, blurb: "A long striped runner. Walk on it." },
  doormat: { name: "Doormat", emoji: "\ud83d\udeaa", price: 6000, w: 1, d: 1, walkable: true, decor: true, blurb: "Wipe your feet. It says so right on it." },
  leathersofa: { name: "Leather sofa (luxury)", emoji: "🛋️", price: 350_000, w: 3, d: 1, blurb: "A three-seat leather sofa. The room looks richer at once." },
};

export const shopList = (Object.keys(CATALOG) as FurnitureType[]).filter(t => !CATALOG[t].fixed);
export const furnitureList = shopList.filter(t => !CATALOG[t].decor);
export const decorList = shopList.filter(t => CATALOG[t].decor);

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
