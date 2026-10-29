// Places inside each district: your room, the buka, the market, the gym...
// Some have opening hours. `art` is the picture shown for the place (see src/art/art.js).
// `lot` is where the place stands in the 3D streets (see src/three/world.js), if it's there.

import type { DistrictId } from "./places";

export type SpotId =
  | "home" | "buka" | "market" | "park" | "mushin-street"
  | "hub" | "gym" | "yaba-street"
  | "beach" | "club" | "island-street"
  | "village" | "mall" | "airport"
  | "mamaput" | "jollof" | "bigbite" | "crunchy"
  | "phone";

export type Spot = {
  id: SpotId;
  name: string;
  emoji: string;
  district: DistrictId | "any";
  open?: [number, number];   // [from, to) in hours; `to` may pass midnight, e.g. [21, 4]
  blurb: string;
  art?: string;              // picture id
  lot?: boolean;             // you can walk to it in the 3D streets
};

export const spots: Record<SpotId, Spot> = {
  home: { id: "home", name: "Your room", emoji: "🛋️", district: "mushin", blurb: "Your flat. Tap any furniture to use it.", art: "home", lot: true },
  buka: { id: "buka", name: "Mama Ronke's Buka", emoji: "🍛", district: "mushin", open: [7, 21], blurb: "Plastic chairs, a TV on the wall and the best ewedu on the street.", art: "buka", lot: true },
  market: { id: "market", name: "Oja Tuntun Market", emoji: "🧺", district: "mushin", open: [6, 19], blurb: "Groceries are cheapest here. Trade to grow your Hustle.", art: "market", lot: true },
  park: { id: "park", name: "Unity Park", emoji: "🌳", district: "mushin", open: [6, 20], blurb: "Shade, benches and the loudest draughts players in town.", art: "park", lot: true },
  mamaput: { id: "mamaput", name: "Mama Put Express", emoji: "🍛", district: "mushin", open: [6, 22], blurb: "Fast food, Mushin style: rice, stew and bole to take away. Cheap and quick.", art: "mamaput" },
  "mushin-street": { id: "mushin-street", name: "Mushin streets", emoji: "🛣️", district: "mushin", blurb: "Church, mosque and the corner shops. Always open." },
  hub: { id: "hub", name: "Brainbox Tech Hub", emoji: "💻", district: "yaba", open: [8, 22], blurb: "Fast Wi-Fi and coding classes. Grows your Study skill.", art: "hub", lot: true },
  gym: { id: "gym", name: "Iron Gate Gym", emoji: "🏋🏾", district: "yaba", open: [5, 22], blurb: "Rusty plates, loud music, serious people. Grows Fitness.", art: "gym", lot: true },
  jollof: { id: "jollof", name: "Jollof Junction", emoji: "🍗", district: "yaba", open: [8, 23], blurb: "Fast-food chain famous for party jollof and spicy chicken. They're hiring!", art: "jollof" },
  "yaba-street": { id: "yaba-street", name: "Yaba streets", emoji: "🛣️", district: "yaba", blurb: "Suya spots, barbers, the library and street football." },
  beach: { id: "beach", name: "Sunset Beach", emoji: "🏖️", district: "island", open: [8, 20], blurb: "Far, but worth it. Waves, horses and grilled fish.", art: "beach", lot: true },
  club: { id: "club", name: "The Pulse", emoji: "🪩", district: "island", open: [21, 4], blurb: "Opens at nine at night. Gets serious after midnight.", art: "club", lot: true },
  bigbite: { id: "bigbite", name: "Big Bite Burgers", emoji: "🍔", district: "island", open: [10, 24], blurb: "Burgers, chips and milkshakes. Open until midnight.", art: "bigbite" },
  "island-street": { id: "island-street", name: "Island streets", emoji: "🛣️", district: "island", blurb: "Lounges, short-lets and networking with big men." },
  village: { id: "village", name: "Computer Village", emoji: "📲", district: "ikeja", open: [8, 19], blurb: "Phones, laptops and fast deals." },
  mall: { id: "mall", name: "Ikeja City Mall", emoji: "🛍️", district: "ikeja", open: [10, 22], blurb: "Air conditioning, shawarma and window-shopping." },
  crunchy: { id: "crunchy", name: "Crunchy Chicken", emoji: "🍟", district: "ikeja", open: [9, 22], blurb: "Fried chicken buckets inside the mall. Great for sharing.", art: "crunchy" },
  airport: { id: "airport", name: "Murtala Muhammed Airport", emoji: "🛫", district: "ikeja", blurb: "Your gateway out. Flights are booked in the ✈️ Goals tab." },
  phone: { id: "phone", name: "Your phone", emoji: "📱", district: "any", blurb: "Works anywhere: call home, hustle on WhatsApp, order delivery." },
};

export const spotList = Object.values(spots);

/** Is a place open at this in-game time? Places without hours are always open. */
export function spotOpen(id: SpotId, time: number): boolean {
  const open = spots[id].open;
  if (!open) return true;
  const h = (time % 1440) / 60;
  const [from, to] = open;
  return from < to ? h >= from && h < to : h >= from || h < to;
}

export const hourText = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;

export function openText(id: SpotId): string {
  const open = spots[id].open;
  return open ? `Open ${hourText(open[0])}–${hourText(open[1])}` : "Always open";
}
