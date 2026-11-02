// Your property and your cars. Upgrades change what your home lot looks like in the streets (the 3D view
// draws them from `Property`), and cars you buy are real vehicles you can drive and park (see three/vehicles.ts).
// Prices fit the game's money: a chapter-4 player has tens of thousands, a chapter-8 player has millions.

import { PLACE_LOTS, toWorld } from "../three/world.js";

export type UpgradeId = "driveway" | "gate" | "garden" | "garage" | "balcony" | "floor2" | "pool" | "wing" | "wing2" | "wing3" | "wing4" | "wing5" | "wing6";
/** What you have built, and the plot of land you own (0 or missing: you rent the old flat). */
export type Property = Partial<Record<UpgradeId, boolean>> & { land?: number };

export type Upgrade = { id: UpgradeId; emoji: string; name: string; desc: string; price: number; needs?: UpgradeId[]; land?: number };   // land: the plot tier it needs

export const UPGRADES: Upgrade[] = [
  { id: "driveway", emoji: "🛣️", name: "Driveway and front parking", desc: "A paved drive through the gate into your front yard, with a marked parking space.", price: 80_000 },
  { id: "gate", emoji: "🚧", name: "Compound wall and gate", desc: "A painted wall along the road with an iron gate. Keeps the yard private.", price: 150_000 },
  { id: "garden", emoji: "🌳", name: "Garden", desc: "Lawn, flower beds, shrubs and a shade tree in the yard.", price: 60_000 },
  { id: "garage", emoji: "🏠", name: "Garage", desc: "A covered garage beside the house with its own parking space.", price: 400_000, needs: ["driveway"] },
  { id: "balcony", emoji: "🪟", name: "Balcony", desc: "A balcony with a railing over your front door.", price: 250_000 },
  { id: "floor2", emoji: "🏢", name: "Second floor", desc: "Build a whole new floor on top of the house. Duplex living.", price: 1_500_000, needs: ["balcony"] },
  { id: "wing", emoji: "🧱", name: "Extension: study and guest room", desc: "Build new rooms onto your flat: a study, a guest room and a dining area. The flat grows from 8 x 8 to 10 x 10 tiles.", price: 700_000 },
  { id: "wing2", emoji: "🏗️", name: "Second extension", desc: "Extend the new rooms again, up to 12 x 12 tiles. Room for a lot of furniture.", price: 2_500_000, needs: ["wing"] },
  { id: "wing3", emoji: "🧱", name: "Third extension", desc: "More rooms: the house grows to 14 x 14 tiles. Needs your own land.", price: 5_000_000, needs: ["wing2"], land: 1 },
  { id: "wing4", emoji: "🧱", name: "Fourth extension", desc: "The house grows to 16 x 16 tiles. Needs at least a half plot.", price: 9_000_000, needs: ["wing3"], land: 2 },
  { id: "wing5", emoji: "🧱", name: "Fifth extension", desc: "The house grows to 18 x 18 tiles. Needs at least a full plot.", price: 16_000_000, needs: ["wing4"], land: 3 },
  { id: "wing6", emoji: "🏛️", name: "Grand wing", desc: "The biggest house: 20 x 20 tiles. Needs the whole estate.", price: 30_000_000, needs: ["wing5"], land: 4 },
  { id: "pool", emoji: "🏊🏾", name: "Swimming pool", desc: "A tiled pool in the back garden.", price: 900_000, needs: ["garden"] },
];

export const upgradeById = (id: string) => UPGRADES.find(u => u.id === id);

/** What kind of home you have, from what you've built. */
export function homeTier(p: Property | undefined): "apartment" | "house" | "duplex" | "mansion" {
  const n = UPGRADES.filter(u => p?.[u.id]).length;
  if (p?.floor2 && p?.pool && p?.garage) return "mansion";
  if (p?.floor2) return "duplex";
  return n >= 2 ? "house" : "apartment";
}

// ------------------------------------------------------------------ land

/** Plots of land on the estate, bigger the more you spend. Buying one moves you out of the flat: no more rent, a walled compound
 *  of your own, lawn parking, and room to extend the house further. Buying a bigger plot later gives back 60% of the old one. */
export type Plot = { tier: number; emoji: string; name: string; desc: string; price: number; width: number; lawn: number; house: number };
export const PLOTS: Plot[] = [
  { tier: 1, emoji: "🌱", name: "Quarter plot", desc: "A small walled plot of your own. Room for two cars on the lawn and a house up to 14 x 14.", price: 2_500_000, width: 48, lawn: 2, house: 14 },
  { tier: 2, emoji: "🌿", name: "Half plot", desc: "Twice as wide. Four lawn spaces, a bigger garden and a house up to 16 x 16.", price: 8_000_000, width: 96, lawn: 4, house: 16 },
  { tier: 3, emoji: "🌳", name: "Full plot", desc: "A wide compound with six lawn spaces and a house up to 18 x 18.", price: 25_000_000, width: 144, lawn: 6, house: 18 },
  { tier: 4, emoji: "🏞️", name: "Estate", desc: "The whole estate: eight lawn spaces, a huge walled compound and a house up to 20 x 20.", price: 80_000_000, width: 192, lawn: 8, house: 20 },
];
export const plotById = (tier: number) => PLOTS.find(p => p.tier === tier);
export const plotWidth = (p: Property | undefined) => plotById(plotTier(p))?.width ?? 48;
export const LAND_RESALE = 0.6;
/** What a plot costs you now: its price less what you get back for the plot you have. */
export const landCost = (have: number, tier: number) => (plotById(tier)?.price ?? 0) - Math.round((plotById(have)?.price ?? 0) * LAND_RESALE);

// ------------------------------------------------------------------ cars

export type CarId = "compact" | "sedan" | "suv" | "luxury" | "sports" | "pickup" | "bike";

export type CarSpec = {
  id: CarId; emoji: string; name: string; kind: string; price: number; topKmh: number; seats: number; desc: string; colors: string[];
};

export const CARS: CarSpec[] = [
  { id: "bike", emoji: "🏍️", name: "Roadster 150", kind: "Motorcycle", price: 250_000, topKmh: 110, seats: 2, desc: "Quick through the go-slow. Rider and one passenger.", colors: ["#e63946", "#1d3557", "#2a9d8f", "#f4a261", "#222831"] },
  { id: "compact", emoji: "🚗", name: "Kekere Hatch", kind: "Compact car", price: 600_000, topKmh: 140, seats: 4, desc: "Small, thrifty and easy to park.", colors: ["#f1c40f", "#e74c3c", "#3498db", "#ecf0f1", "#2ecc71"] },
  { id: "sedan", emoji: "🚙", name: "Lagos Saloon", kind: "Sedan", price: 1_500_000, topKmh: 170, seats: 5, desc: "A proper family saloon with a quiet cabin.", colors: ["#2d3436", "#b2bec3", "#0984e3", "#c0392b", "#ecf0f1"] },
  { id: "pickup", emoji: "🛻", name: "Hilux Trader", kind: "Pickup truck", price: 2_200_000, topKmh: 160, seats: 3, desc: "Open bed for market loads and building materials.", colors: ["#6d4c41", "#2d3436", "#ecf0f1", "#27ae60", "#d35400"] },
  { id: "suv", emoji: "🚘", name: "Island SUV", kind: "SUV", price: 3_000_000, topKmh: 175, seats: 6, desc: "High seat, big boot, handles the flooded roads.", colors: ["#1e272e", "#ecf0f1", "#7f8c8d", "#2c3e50", "#8e44ad"] },
  { id: "luxury", emoji: "🏎️", name: "Eko Sovereign", kind: "Luxury car", price: 8_000_000, topKmh: 210, seats: 5, desc: "Leather, chrome and the road to yourself.", colors: ["#0b0b0f", "#f5f0e6", "#5b2333", "#1b3a57", "#c9a227"] },
  { id: "sports", emoji: "🏁", name: "Marina GT", kind: "Sports car", price: 12_000_000, topKmh: 290, seats: 2, desc: "Low, loud and fast. Two seats and no apologies.", colors: ["#ff3b30", "#ffcc00", "#0a84ff", "#34c759", "#1c1c1e"] },
];

export const carById = (id: string) => CARS.find(c => c.id === id);
export const CAR_RESALE = 0.6;
export const REPAINT_PRICE = 15_000;

/** A car you own, and where it is parked. */
export type Vehicle = { uid: number; model: CarId; color: string; x: number; z: number; yaw: number };

// ------------------------------------------------------- parking at home
// The home lot (see PLACE_LOTS.home) faces the road at its −z side. Slots are given in lot-local metres
// (front = −z) and turned into world coordinates here, so they stay right whichever way the lot faces.

export type SlotId = "curb" | "drive" | "garage" | `lawn${number}`;
// Where your home is changes when you buy land (PLACE_LOTS.home moves), so everything below reads the lot when it is used.
const slotAt = (lx: number, lz: number, yawLocal: number) => {
  const lot = PLACE_LOTS.home;
  const [x, z] = toWorld(lot, lx, lz);
  const yaw = ({ n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 } as Record<string, number>)[lot.face] + yawLocal;
  return { x, z, yaw };
};

type Slot = { x: number; z: number; yaw: number };
const SLOT_AT: Record<string, () => Slot & { needs?: UpgradeId }> = {
  curb: () => slotAt(-11, -26.3, Math.PI / 2),                             // along the road, outside the compound
  drive: () => ({ ...slotAt(0, -17.5, Math.PI), needs: "driveway" }),      // in the front yard, nose to the road
  garage: () => ({ ...slotAt(15.5, -7.5, Math.PI), needs: "garage" }),     // inside the garage, nose out
};
/** Parking on the lawn of your own land: pairs either side of the drive, nose to the road, 6 m apart (lawn1, lawn2 are the first pair). */
export const lawnSpot = (n: number) => slotAt((n % 2 ? -1 : 1) * (9 + 6 * Math.floor((n - 1) / 2)), -17, Math.PI);

/** A parking space by name, in world coordinates, for wherever your home is now. */
export const SLOTS = new Proxy({} as Record<SlotId, Slot & { needs?: UpgradeId }>, {
  get: (_t, id: string) => (id.startsWith("lawn") ? lawnSpot(Number(id.slice(4))) : SLOT_AT[id]?.()),
});

export const MAX_LAWN = 8;
export const plotTier = (p: Property | undefined) => p?.land ?? 0;

/** Slots you can use now (built, plus the lawn of your own land), best first. */
export const slotsFor = (p: Property | undefined): SlotId[] => [
  ...(p?.garage ? ["garage" as const] : []),
  ...(p?.driveway ? ["drive" as const] : []),
  ...Array.from({ length: Math.min(MAX_LAWN, plotTier(p) * 2) }, (_, i) => `lawn${i + 1}` as SlotId),
  "curb" as const,
];

/** Is something parked in this slot already? */
export const slotTaken = (v: Pick<Vehicle, "x" | "z">[], id: SlotId) => v.some(c => Math.hypot(c.x - SLOTS[id].x, c.z - SLOTS[id].z) < 2.6);

/** The best free slot for a new car, or null. */
export function freeSlot(p: Property | undefined, v: Vehicle[]): SlotId | null {
  return slotsFor(p).find(id => !slotTaken(v, id)) ?? null;
}

/** The slot a car is near (within `r` metres), if any. */
export function slotNear(p: Property | undefined, x: number, z: number, r = 3.2): SlotId | null {
  return slotsFor(p).find(id => Math.hypot(SLOTS[id].x - x, SLOTS[id].z - z) < r) ?? null;
}

// ------------------------------------------- solid parts of your property
// Rectangles (world coordinates) a driven car must not pass through: garage walls, the compound wall, the pool.

export type Rect = { x: number; z: number; w: number; d: number };
export function homeSolids(p: Property | undefined): Rect[] {
  const out: Rect[] = [];
  const lot = PLACE_LOTS.home;
  const rectAt = (lx: number, lz: number, w: number, d: number): Rect => {
    const [x, z] = toWorld(lot, lx, lz);
    const turned = lot.face === "e" || lot.face === "w";
    return { x, z, w: turned ? d : w, d: turned ? w : d };
  };
  if (plotTier(p) > 0) {
    // your own land is walled all round, with a 7 m gap for the gate
    const half = plotWidth(p) / 2, mid = (3.5 + half) / 2, len = half - 3.5;
    out.push(rectAt(-mid, -23.6, len, 0.5), rectAt(mid, -23.6, len, 0.5), rectAt(-half, 0, 0.5, 48), rectAt(half, 0, 0.5, 48), rectAt(0, 24, plotWidth(p), 0.5));
  } else if (p?.gate) {
    out.push(rectAt(-13.75, -23.6, 20.5, 0.5), rectAt(13.75, -23.6, 20.5, 0.5)); // wall either side of a 7 m gate
  }
  if (p?.garage) {
    out.push(rectAt(15.5, -2.4, 10, 0.4), rectAt(10.5, -7, 0.4, 9), rectAt(20.5, -7, 0.4, 9)); // back and side walls
  }
  if (p?.pool) out.push(rectAt(0, 11, 12, 7));
  return out;
}

export const inRect = (r: Rect, x: number, z: number, pad: number) => Math.abs(x - r.x) < r.w / 2 + pad && Math.abs(z - r.z) < r.d / 2 + pad;
