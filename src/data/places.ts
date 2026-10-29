export type DistrictId = "mushin" | "yaba" | "island" | "ikeja";

export const districts: Record<DistrictId, { name: string; blurb: string }> = {
  mushin: { name: "Mushin", blurb: "Your self-contain. Cheap food, loud neighbours, and NEPA does as it likes." },
  yaba: { name: "Yaba", blurb: "Tech hubs, POS stands and the okada park. This is where the hustle is." },
  island: { name: "The Island", blurb: "Beach, lounges and big money. Everything costs more here." },
  ikeja: { name: "Ikeja", blurb: "Computer Village, the big mall and the airport. Your gateway out." },
};

// Road distance between districts, in km
const km: Record<string, number> = {
  "mushin-yaba": 6, "yaba-island": 10, "mushin-island": 15,
  "mushin-ikeja": 8, "yaba-ikeja": 13, "island-ikeja": 22,
};

export function distanceKm(a: DistrictId, b: DistrictId): number {
  if (a === b) return 0;
  return km[`${a}-${b}`] ?? km[`${b}-${a}`];
}

export type Mode = {
  id: string;
  label: string;
  emoji: string;
  kmPerHour: number;   // normal speed
  nairaPerKm: number;
  minFare: number;
  energyPerKm: number;
  trafficHit: number;  // speed multiplier in rush hour (lower = worse go-slow)
};

export const modes: Mode[] = [
  { id: "trek", label: "Trek", emoji: "🚶", kmPerHour: 5, nairaPerKm: 0, minFare: 0, energyPerKm: 3, trafficHit: 1 },
  { id: "danfo", label: "Danfo", emoji: "🚌", kmPerHour: 18, nairaPerKm: 40, minFare: 200, energyPerKm: 0.5, trafficHit: 0.4 },
  { id: "keke", label: "Keke", emoji: "🛺", kmPerHour: 22, nairaPerKm: 70, minFare: 300, energyPerKm: 0.5, trafficHit: 0.6 },
  { id: "okada", label: "Okada", emoji: "🏍️", kmPerHour: 30, nairaPerKm: 100, minFare: 400, energyPerKm: 1, trafficHit: 0.85 },
];

export function isRushHour(time: number): boolean {
  const h = Math.floor((time % 1440) / 60);
  return (h >= 7 && h < 10) || (h >= 16 && h < 20);
}

// Time, cost and energy for one trip
export function trip(from: DistrictId, to: DistrictId, mode: Mode, time: number) {
  const d = distanceKm(from, to);
  const rush = isRushHour(time);
  const speed = mode.kmPerHour * (rush ? mode.trafficHit : 1);
  return {
    minutes: Math.round((d / speed) * 60),
    cost: Math.max(mode.minFare, Math.round(d * mode.nairaPerKm)),
    energy: Math.round(d * mode.energyPerKm),
    rush,
  };
}