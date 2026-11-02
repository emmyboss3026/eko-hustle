// Gidi Hustle — the open-world town layout. Pure data and maths (no Three.js),
// so the rules, the 3D view and the tests all agree on where things are.
//
// The town is a grid: roads run along x and z every 60 units, from -180 to 180.
// Between them are 6 × 6 blocks ("lots"), each 48 × 48. Every place sits on its
// own lot with its door facing a road. The lagoon lies past the east and south
// edges; the beach lot touches it.

export const ROAD_SPACING = 60;
export const ROAD_LINES = [-180, -120, -60, 0, 60, 120, 180];
export const ROAD_HALF = 4;          // tarmac is 8 wide
export const LOT_HALF = 24;          // a lot runs from road line + 6 to the next line − 6
export const LAND_HALF = 186;        // the land ends just past the outer roads
export const ENTER_RADIUS = 5;       // how close you must be to a door to go in
export const WALK_SPEED = 7;         // world units per real second
export const RUN_SPEED = 12;
export const PLAYER_RADIUS = 0.7;

/** World units per town-map unit (the map is 0–100 across). */
export const MAP_SCALE = 3.6;
export const worldToMap = (x, z) => [x / MAP_SCALE + 50, z / MAP_SCALE + 50];
export const mapToWorld = (mx, my) => [(mx - 50) * MAP_SCALE, (my - 50) * MAP_SCALE];

/** Which lot each place (and home) stands on, and which side its door faces:
 *  n = towards −z, s = +z, e = +x, w = −x. */
export const PLACE_LOTS = {
  home:   { cx: -90,  cz: 30,   face: 'n' },
  buka:   { cx: -30,  cz: 30,   face: 'n' },
  market: { cx: 30,   cz: 90,   face: 'n' },
  hub:    { cx: -90,  cz: -90,  face: 's' },
  gym:    { cx: 30,   cz: -90,  face: 's' },
  park:   { cx: -150, cz: 30,   face: 'e' },
  beach:  { cx: 150,  cz: 150,  face: 'n' },
  club:   { cx: 90,   cz: -30,  face: 'w' },
};

// ---------------------------------------------------------------- the estate: land you can buy
// Four blocks on the east side are left empty of buildings (for everyone, so the server agrees). The land for sale is here.
// Buying a plot moves your home onto it: PLACE_LOTS.home and DOORS.home point at the estate, and the old flat stays where it
// was as the place 'flats' (its walls are in COLLIDERS for good, so the server and every player agree about them).
export const ESTATE_CELLS = [[150, -150], [150, -90], [150, -30], [150, 30]];
export const ESTATE_LOT = { cx: 150, cz: -60, face: 'w' };
const OLD_HOME_LOT = { ...PLACE_LOTS.home };

/** Lot-local → world. Local −z is the front (the door side). */
export function toWorld(lot, lx, lz) {
  switch (lot.face) {
    case 's': return [lot.cx - lx, lot.cz - lz];
    case 'e': return [lot.cx - lz, lot.cz + lx];
    case 'w': return [lot.cx + lz, lot.cz - lx];
    default: return [lot.cx + lx, lot.cz + lz];
  }
}

/** The direction the door looks out to, as a yaw (rotation about y). */
export function faceYaw(face) {
  return { n: Math.PI, s: 0, e: Math.PI / 2, w: -Math.PI / 2 }[face] ?? 0;
}

/** Where you stand to go in: on the pavement in front of the lot's gate. */
const doorOf = (id, lot) => {
  const [x, z] = toWorld(lot, 0, -LOT_HALF - 1.5);
  return { id, x, z, face: lot.face };
};
export const DOORS = Object.fromEntries(Object.entries(PLACE_LOTS).map(([id, lot]) => [id, doorOf(id, lot)]));

// --------------------------------------------------------------- colliders

/** Solid shapes on each place's lot, in lot-local coordinates (front = −z):
 *  [lx, lz, width, depth, height]. Width/depth swap when the lot faces e/w. */
export const PLACE_SOLIDS = {
  home:   [[0, -6, 16, 12, 5]],
  buka:   [[0, -4, 22, 14, 5]],
  market: [[-12, -12, 3, 3, 3], [0, -12, 3, 3, 3], [12, -12, 3, 3, 3],
           [-12, 0, 3, 3, 3], [0, 0, 3, 3, 3], [12, 0, 3, 3, 3],
           [-12, 12, 3, 3, 3], [0, 12, 3, 3, 3], [12, 12, 3, 3, 3]],
  hub:    [[0, 2, 22, 22, 34]],
  gym:    [[0, -2, 24, 16, 9]],
  park:   [[0, 2, 6, 6, 2], [-14, -10, 1, 1, 6], [14, -10, 1, 1, 6], [-14, 14, 1, 1, 6], [14, 14, 1, 1, 6]],
  beach:  [[-10, 6, 1, 1, 4], [10, 6, 1, 1, 4], [0, 14, 1, 1, 4]],
  club:   [[0, -2, 26, 18, 10]],
};

function solidToWorld(lot, [lx, lz, w, d, h], extra = {}) {
  const [x, z] = toWorld(lot, lx, lz);
  const turned = lot.face === 'e' || lot.face === 'w';
  return { x, z, w: turned ? d : w, d: turned ? w : d, h, ...extra };
}

/** Is your home on the estate (you bought land) or in the old flat? Safe to call again and again. The old flat's collider is never
 *  removed; only your own house on the estate is added (and only here, never on the server). */
export function moveHome(onEstate) {
  const now = PLACE_LOTS.home.cx === ESTATE_LOT.cx;
  if (onEstate === now) return;
  const at = onEstate ? ESTATE_LOT : OLD_HOME_LOT;
  PLACE_LOTS.home = { ...at };
  DOORS.home = doorOf('home', PLACE_LOTS.home);
  for (let i = COLLIDERS.length - 1; i >= 0; i--) if (COLLIDERS[i].place === 'home-estate') COLLIDERS.splice(i, 1);
  if (onEstate) {
    PLACE_LOTS.flats = { ...OLD_HOME_LOT };
    PLACE_SOLIDS.flats = PLACE_SOLIDS.home;
    COLLIDERS.push(...PLACE_SOLIDS.home.map((s) => solidToWorld(ESTATE_LOT, s, { place: 'home-estate' })));
  } else {
    delete PLACE_LOTS.flats;
    delete PLACE_SOLIDS.flats;
  }
}

/** Small seeded random so the town is the same on every device. */
function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export const LOT_CENTERS = [];
for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) LOT_CENTERS.push([-150 + i * 60, -150 + j * 60]);

const placeAt = (cx, cz) => Object.keys(PLACE_LOTS).find((id) => PLACE_LOTS[id].cx === cx && PLACE_LOTS[id].cz === cz) ?? null;

const PALETTE = ['#ff9a76', '#ffd166', '#5fd3e6', '#8bd68c', '#c58cf0', '#ff7eb6', '#6ec1ff', '#ffb870', '#b6e07a', '#8e9cff'];
const TOWER_PALETTE = ['#6fa8dc', '#5cc5c1', '#8e9cff', '#7fb6e8'];

/** Every ordinary building in town (not the places). Deterministic. */
export const BUILDINGS = [];
LOT_CENTERS.forEach(([cx, cz], index) => {
  if (placeAt(cx, cz)) return;
  if (ESTATE_CELLS.some(([ex, ez]) => ex === cx && ez === cz)) return;   // left empty: land for sale
  const r = rng(1000 + index);
  const central = Math.abs(cx) <= 90 && Math.abs(cz) <= 90;
  for (const [sx, sz] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) {
    if (r() < 0.14) continue; // an empty yard or a car park
    const w = 10 + Math.floor(r() * 9);
    const d = 10 + Math.floor(r() * 9);
    const tall = central && r() < 0.35;
    const h = tall ? 18 + Math.floor(r() * 22) : 5 + Math.floor(r() * 9);
    BUILDINGS.push({
      x: cx + sx + (r() - 0.5) * 2, z: cz + sz + (r() - 0.5) * 2, w, d, h,
      color: tall ? TOWER_PALETTE[Math.floor(r() * TOWER_PALETTE.length)] : PALETTE[Math.floor(r() * PALETTE.length)],
      roof: r() < 0.5 ? 'zinc' : 'flat', tank: r() < 0.6, kind: tall ? 'tower' : 'house',
    });
  }
});

/** Everything the player can't walk through. */
export const COLLIDERS = [
  ...BUILDINGS.map((b) => ({ x: b.x, z: b.z, w: b.w, d: b.d })),
  ...Object.entries(PLACE_SOLIDS).flatMap(([id, solids]) => solids.map((s) => solidToWorld(PLACE_LOTS[id], s, { place: id }))),
];

/** The solids of one place, in world coordinates (the 3D view draws from these too). */
export const placeSolids = (id) => (PLACE_SOLIDS[id] ?? []).map((s) => solidToWorld(PLACE_LOTS[id], s));

/** Push a circle out of anything solid and keep it on land. */
export function resolve(x, z, r = PLAYER_RADIUS) {
  for (let pass = 0; pass < 2; pass++) {
    for (const c of COLLIDERS) {
      const hx = c.w / 2 + r;
      const hz = c.d / 2 + r;
      const dx = x - c.x;
      const dz = z - c.z;
      if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
        const px = hx - Math.abs(dx);
        const pz = hz - Math.abs(dz);
        if (px < pz) x = c.x + Math.sign(dx || 1) * hx;
        else z = c.z + Math.sign(dz || 1) * hz;
      }
    }
  }
  const lim = LAND_HALF - r;
  return [Math.max(-lim, Math.min(lim, x)), Math.max(-lim, Math.min(lim, z))];
}

export function blocked(x, z, r = PLAYER_RADIUS) {
  return COLLIDERS.some((c) => Math.abs(x - c.x) < c.w / 2 + r && Math.abs(z - c.z) < c.d / 2 + r);
}

// ------------------------------------------------------------------ routes

const nearestLine = (v) => ROAD_LINES.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
const clampRoad = (v) => Math.max(ROAD_LINES[0], Math.min(ROAD_LINES.at(-1), v));

/** The nearest point on a road centre line, and the two junctions at the ends
 *  of that stretch of road. */
function onRoad(x, z) {
  const rx = nearestLine(x);
  const rz = nearestLine(z);
  if (Math.abs(x - rx) <= Math.abs(z - rz)) {
    const qz = clampRoad(z);
    const lo = Math.max(ROAD_LINES[0], Math.floor(qz / ROAD_SPACING) * ROAD_SPACING);
    const hi = Math.min(ROAD_LINES.at(-1), lo + ROAD_SPACING);
    return { q: [rx, qz], ends: [[rx, lo], [rx, hi]] };
  }
  const qx = clampRoad(x);
  const lo = Math.max(ROAD_LINES[0], Math.floor(qx / ROAD_SPACING) * ROAD_SPACING);
  const hi = Math.min(ROAD_LINES.at(-1), lo + ROAD_SPACING);
  return { q: [qx, rz], ends: [[lo, rz], [hi, rz]] };
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** A walking route from one point to another that keeps to the roads:
 *  out to the road, along the grid, and in to the target. */
export function roadPath(from, to) {
  const A = onRoad(from[0], from[1]);
  const B = onRoad(to[0], to[1]);
  let best = null;
  // Both on the same stretch of road: straight along it.
  const same = (p, q) => p[0] === q[0] && p[1] === q[1];
  if (same(A.ends[0], B.ends[0]) && same(A.ends[1], B.ends[1])) best = [A.q, B.q];
  for (const a of A.ends) for (const b of B.ends) {
    const corner = [b[0], a[1]]; // along x first, then z: both legs are on roads
    const pts = [A.q, a, corner, b, B.q];
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1], pts[i]);
    if (!best || len < best.len) best = Object.assign(pts, { len });
  }
  const out = [from, ...best, to];
  // Drop repeated points.
  return out.filter((p, i) => i === 0 || dist(p, out[i - 1]) > 0.01).map((p) => [p[0], p[1]]);
}

/** The door nearest to a point, if it's within reach. */
export function doorNear(x, z, radius = ENTER_RADIUS) {
  let best = null;
  for (const d of Object.values(DOORS)) {
    const k = Math.hypot(d.x - x, d.z - z);
    if (k <= radius && (!best || k < best.k)) best = { ...d, k };
  }
  return best;
}
