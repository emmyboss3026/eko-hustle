export type SkillId = "hustle" | "study" | "charisma" | "fitness" | "cooking";

export type Skills = Record<SkillId, number>;

export const skillInfo: Record<SkillId, { name: string; emoji: string; desc: string }> = {
  hustle: { name: "Hustle", emoji: "💼", desc: "Business sense. Grows from trading and POS work." },
  study: { name: "Study", emoji: "📚", desc: "Book knowledge. Needed for tech jobs and IELTS." },
  charisma: { name: "Charisma", emoji: "😎", desc: "People skills. Helps in service jobs and visa interviews." },
  fitness: { name: "Fitness", emoji: "💪", desc: "Body strength. Needed for okada and physical work." },
  cooking: { name: "Cooking", emoji: "🍳", desc: "Cooking at home is cheaper and fills you more." },
};

export const startSkills: Skills = { hustle: 0, study: 0, charisma: 0, fitness: 0, cooking: 0 };

export const MAX_SKILL = 10;

export function addSkills(skills: Skills, gain: Partial<Skills> | undefined, multiplier = 1): Skills {
  if (!gain) return skills;
  const next = { ...skills };
  for (const id of Object.keys(gain) as SkillId[]) {
    next[id] = Math.min(MAX_SKILL, Math.max(0, next[id] + (gain[id] ?? 0) * multiplier));
  }
  return next;
}

// Does the Sim meet every skill requirement?
export function meets(skills: Skills, req: Partial<Skills> | undefined): boolean {
  if (!req) return true;
  return (Object.keys(req) as SkillId[]).every(id => skills[id] >= (req[id] ?? 0));
}

// Human-readable list of requirements, e.g. "📚 Study 3, 😎 Charisma 2"
export function describeReq(req: Partial<Skills> | undefined): string {
  if (!req) return "";
  return (Object.keys(req) as SkillId[])
    .map(id => `${skillInfo[id].emoji} ${skillInfo[id].name} ${req[id]}`)
    .join(", ");
}
