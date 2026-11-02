// Your property and your cars. Upgrades change what your home lot looks like in the streets (the 3D view
// draws them from `Property`), and cars you buy are real vehicles you can drive and park (see three/vehicles.ts).
// Prices fit the game's money: a chapter-4 player has tens of thousands, a chapter-8 player has millions.

import { PLACE_LOTS, toWorld } from "../three/world.js";

export type UpgradeId = "driveway" | "gate" | "garden" | "garage" | "balcony" | "floor2" | "pool" | "wing" | "wing2";
export type Property = Partial<Record<UpgradeId, boolean>>;

export type Upgrade = { id: UpgradeId; emoji: string; name: string; desc: string; price: number; needs?: UpgradeId[] };

export const UPGRADES: Upgrade[] = [
  { id: "driveway", emoji: "🛣️", name: "Driveway and front parking", desc: "A paved drive through the gate into your front yard, with a marked parking space.", price: 80_000 },
  { id: "gate", emoji: "🚧", name: "Compound wall and gate", desc: "A painted wall along the road with an iron gate. Keeps the yard private.", price: 150_000 },
  { id: "garden", emoji: "🌳", name: "Garden", desc: "Lawn, flower beds, shrubs and a shade tree in the yard.", price: 60_000 },
  { id: "garage", emoji: "🏠", name: "Garage", desc: "A covered garage beside the house with its own parking space.", price: 400_000, needs: ["driveway"] },
  { id: "balcony", emoji: "🪟", name: "Balcony", desc: "A balcony with a railing over your front door.", price: 250_000 },
  { id: "floor2", emoji: "🏢", name: "Second floor", desc: "Build a whole new floor on top of the house. Duplex living.", price: 1_500_000, needs: ["balcony"] },
  { id: "wing", emoji: "🧱", name: "Extension: study and guest room", desc: "Build new rooms onto your flat: a study, a guest room and a dining area. The flat grows from 8 x 8 to 10 x 10 tiles.", price: 700_000 },
  { id: "wing2", emoji: "🏗️", name: "Second extension", desc: "Extend the new rooms again, up to 12 x 12 tiles. Room for a lot of furniture.", price: 2_500_000, needs: ["wing"] },
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

export type SlotId = "curb" | "drive" | "garage";
const lot = PLACE_LOTS.home;
const slotAt = (lx: number, lz: number, yawLocal: number) => {
  const [x, z] = toWorld(lot, lx, lz);
  const yaw = ({ n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 } as Record<string, number>)[lot.face] + yawLocal;
  return { x, z, yaw };
};

export const SLOTS: Record<SlotId, { x: number; z: number; yaw: number; needs?: UpgradeId }> = {
  curb: { ...slotAt(-11, -26.3, Math.PI / 2) },                  // along the road, outside the compound
  drive: { ...slotAt(0, -17.5, Math.PI), needs: "driveway" },    // in the front yard, nose to the road
  garage: { ...slotAt(15.5, -7.5, Math.PI), needs: "garage" }, // inside the garage, nose out
};

export const SLOT_ORDER: SlotId[] = ["garage", "drive", "curb"];

/** Slots you can use now (built), best first. */
export const slotsFor = (p: Property | undefined) => SLOT_ORDER.filter(id => !SLOTS[id].needs || p?.[SLOTS[id].needs!]);

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
const rectAt = (lx: number, lz: number, w: number, d: number): Rect => {
  const [x, z] = toWorld(lot, lx, lz);
  const turned = lot.face === "e" || lot.face === "w";
  return { x, z, w: turned ? d : w, d: turned ? w : d };
};

export function homeSolids(p: Property | undefined): Rect[] {
  const out: Rect[] = [];
  if (p?.gate) {
    out.push(rectAt(-13.75, -23.6, 20.5, 0.5), rectAt(13.75, -23.6, 20.5, 0.5)); // wall either side of a 7 m gate
  }
  if (p?.garage) {
    out.push(rectAt(15.5, -2.4, 10, 0.4), rectAt(10.5, -7, 0.4, 9), rectAt(20.5, -7, 0.4, 9)); // back and side walls
  }
  if (p?.pool) out.push(rectAt(0, 11, 12, 7));
  return out;
}

export const inRect = (r: Rect, x: number, z: number, pad: number) => Math.abs(x - r.x) < r.w / 2 + pad && Math.abs(z - r.z) < r.d / 2 + pad;
