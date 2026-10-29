export type TraitId = "hustler" | "foodie" | "sharp" | "charmer" | "bookworm";

export const traits: Record<TraitId, { name: string; emoji: string; desc: string }> = {
  hustler: { name: "Hustler", emoji: "💼", desc: "Earns 25% more from every job and trade." },
  foodie: { name: "Foodie", emoji: "🍲", desc: "Food fills you 30% more." },
  sharp: { name: "Sharp guy", emoji: "🧠", desc: "Haggles every fare: transport costs 30% less." },
  charmer: { name: "Charmer", emoji: "😎", desc: "Fun and social give 30% more; charisma grows 50% faster." },
  bookworm: { name: "Bookworm", emoji: "🤓", desc: "Study grows 50% faster. Great for tech and IELTS." },
};

export const avatars = ["🧑🏾", "👩🏾", "🧔🏾", "👩🏾‍🦱", "🧑🏿", "👩🏿‍🦳", "👨🏾‍🦲", "🧕🏾"];

// Cosmetic looks for players who support the game. They change nothing in gameplay.
export const supporterAvatars = ["🤴🏾", "👸🏾", "🧑🏾‍🚀", "🧑🏾‍🎤", "🦸🏾", "🧑🏾‍🍳", "👨🏾‍🎓", "💃🏾"];

export type Sim = { name: string; trait: TraitId; avatar: string };

export const payBonus = (trait: TraitId) => (trait === "hustler" ? 1.25 : 1);
export const fareFor = (cost: number, trait: TraitId) => (trait === "sharp" ? Math.round(cost * 0.7) : cost);
