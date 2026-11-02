// The town grows with every update. Each entry here is one step of growth: a new ring of land and roads around the
// town, and two new places in it. Add a new entry at the END for each update (see "Growing the map" in CLAUDE.md);
// never reorder or remove old ones, because the town's seeded buildings depend on the order of the lots.
//
// Lots are 60 apart. Ring N has lot centres out to 150 + 60 × N. `face` is the side of the lot the door looks out on:
// n = towards −z, s = +z, e = +x, w = −x. A door must face a road that already exists (the one on the inner side).
// `solids` are [lx, lz, width, depth, height] in lot-local metres (front = −z), like PLACE_SOLIDS in world.js.

export const GROWTH = [
  {
    level: 1,
    note: 'First growth: the town gets a northern and a western edge, with a fuel station and a cinema.',
    places: {
      station: { cx: -30, cz: -210, face: 's', solids: [[0, -8, 14, 8, 4], [0, 8, 6, 6, 3]] },
      cinema: { cx: -210, cz: 30, face: 'e', solids: [[0, -2, 24, 16, 9]] },
    },
  },
  {
    level: 2,
    note: 'Second growth: a supermarket on the north edge and a stadium on the east edge.',
    places: {
      mart: { cx: 90, cz: -270, face: 's', solids: [[0, -4, 28, 14, 6]] },
      stadium: { cx: 270, cz: 90, face: 'w', solids: [[0, 2, 34, 28, 10]] },
    },
  },
  {
    level: 3,
    note: 'Third growth: a chapel on the south edge and a fashion plaza on the west edge.',
    places: {
      chapel: { cx: -90, cz: 330, face: 'n', solids: [[0, -2, 18, 22, 8]] },
      plaza: { cx: -330, cz: -90, face: 'e', solids: [[0, -4, 26, 16, 7]] },
    },
  },
];

/** How many times the map has grown. */
export const MAP_LEVEL = GROWTH.length;

/** Every place added by growth, with its lot. */
export const GROWN_PLACES = Object.assign({}, ...GROWTH.map((g) => g.places));
