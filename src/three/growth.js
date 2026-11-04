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
    note: 'Third growth: a chapel and a library on the south edge, a fashion plaza and an arcade on the west edge, a clinic on the east edge.',
    places: {
      chapel: { cx: -90, cz: 330, face: 'n', solids: [[0, -2, 18, 22, 8]] },
      library: { cx: 150, cz: 330, face: 'n', solids: [[0, -2, 24, 16, 8]] },
      plaza: { cx: -330, cz: -90, face: 'e', solids: [[0, -4, 26, 16, 7]] },
      arcade: { cx: -330, cz: 150, face: 'e', solids: [[0, -2, 22, 14, 6]] },
      clinic: { cx: 330, cz: -150, face: 'w', solids: [[0, 0, 22, 18, 7]] },
    },
  },
  {
    level: 4,
    note: 'Fourth growth: a kart track and a dance hall on the south edge, a skate park on the north, a bakery on the east and a water park on the west.',
    places: {
      kart: { cx: -150, cz: 390, face: 'n', solids: [[0, 6, 20, 10, 5]] },
      dancehall: { cx: 90, cz: 390, face: 'n', solids: [[0, -2, 24, 18, 8]] },
      skate: { cx: 30, cz: -390, face: 's', solids: [[0, 8, 14, 8, 3]] },
      bakery: { cx: 390, cz: -30, face: 'w', solids: [[0, 0, 18, 14, 6]] },
      waterpark: { cx: -390, cz: 210, face: 'e', solids: [[0, 6, 20, 12, 6]] },
    },
  },
  {
    level: 5,
    note: 'Fifth growth: a salon and a suya grill on the south edge, a co-working hub and a travel agency on the north, a football pitch on the east.',
    places: {
      salon: { cx: 30, cz: 450, face: 'n', solids: [[0, -2, 18, 14, 6]] },
      suya: { cx: -210, cz: 450, face: 'n', solids: [[0, -4, 16, 10, 4]] },
      cowork: { cx: -90, cz: -450, face: 's', solids: [[0, 4, 24, 16, 9]] },
      travel: { cx: 150, cz: -450, face: 's', solids: [[0, 4, 20, 14, 7]] },
      pitch: { cx: 450, cz: 90, face: 'w', solids: [[0, 10, 16, 6, 4]] },
    },
  },
  {
    level: 6,
    note: 'Sixth growth: a museum and a night market on the south edge, a ferry terminal and a bowling alley on the north, a car wash on the east.',
    places: {
      museum: { cx: -30, cz: 510, face: 'n', solids: [[0, -2, 26, 16, 9]] },
      nightmarket: { cx: 210, cz: 510, face: 'n', solids: [[0, -4, 24, 8, 4]] },
      ferry: { cx: -210, cz: -510, face: 's', solids: [[0, 6, 20, 10, 6]] },
      bowling: { cx: 90, cz: -510, face: 's', solids: [[0, 4, 24, 16, 7]] },
      carwash: { cx: 510, cz: -90, face: 'w', solids: [[0, 0, 14, 14, 5]] },
    },
  },
  {
    level: 7, // the seventh ring of land and roads
    note: 'Seventh growth: a zoo and a rooftop lounge on the south edge, a police station and an evening school on the north, a gallery on the east.',
    places: {
      zoo: { cx: -150, cz: 570, face: 'n', solids: [[0, 6, 24, 10, 4]] }, // south edge, door faces the inner road
      lounge: { cx: 90, cz: 570, face: 'n', solids: [[0, -2, 22, 14, 10]] }, // tall building with a roof terrace
      police: { cx: -30, cz: -570, face: 's', solids: [[0, 4, 22, 14, 7]] }, // north edge
      school: { cx: 210, cz: -570, face: 's', solids: [[0, 4, 26, 14, 7]] }, // north edge
      gallery: { cx: 570, cz: 30, face: 'w', solids: [[0, 0, 20, 16, 7]] }, // east edge
    },
  },
];

/** How many times the map has grown. */
export const MAP_LEVEL = GROWTH.length;

/** Every place added by growth, with its lot. */
export const GROWN_PLACES = Object.assign({}, ...GROWTH.map((g) => g.places));
