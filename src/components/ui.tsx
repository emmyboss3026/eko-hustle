import type { Needs } from "../engine/needs";
import { naira } from "../engine/economy";

export const needInfo: Record<keyof Needs, { name: string; emoji: string }> = {
  hunger: { name: "Hunger", emoji: "🍲" },
  energy: { name: "Energy", emoji: "⚡" },
  fun: { name: "Fun", emoji: "🎉" },
  social: { name: "Social", emoji: "💬" },
  hygiene: { name: "Hygiene", emoji: "🛁" },
  bladder: { name: "Bladder", emoji: "🚻" },
};

export const needKeys = Object.keys(needInfo) as (keyof Needs)[];

export function duration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Small "+40 Hunger" / "−15 Energy" chips for an effect
export function EffectChips({ effect }: { effect: Partial<Needs> }) {
  const keys = needKeys.filter(k => effect[k]);
  if (keys.length === 0) return null;
  return (
    <span className="chips">
      {keys.map(k => {
        const v = effect[k] ?? 0;
        return (
          <span key={k} className={`chip ${v > 0 ? "up" : "down"}`}>
            {v > 0 ? "+" : "−"}
            {Math.abs(v)} {needInfo[k].name}
          </span>
        );
      })}
    </span>
  );
}

export function Price({ cost, pay }: { cost?: number; pay?: number }) {
  if (pay) return <span className="row-price earn">+{naira(pay)}</span>;
  if (cost) return <span className="row-price">{naira(cost)}</span>;
  return <span className="row-price">Free</span>;
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

// ---------- tags: small labels that explain a row at a glance ----------

export type TagKind = "money" | "skill" | "light" | "lock" | "closed" | "mission" | "food" | "open";

export const tagInfo: Record<TagKind, { emoji: string; text: string; help: string }> = {
  mission: { emoji: "🎯", text: "Mission", help: "Do this for your current mission." },
  money: { emoji: "💰", text: "Earns", help: "This earns you money." },
  skill: { emoji: "📈", text: "Skill", help: "This trains a skill." },
  light: { emoji: "💡", text: "Needs light", help: "Needs electricity: NEPA or your generator." },
  food: { emoji: "🧺", text: "Uses 1 meal pack", help: "Uses groceries from your kitchen." },
  lock: { emoji: "🔒", text: "Locked", help: "You need a higher skill first." },
  closed: { emoji: "🕒", text: "Closed", help: "Come back during opening hours." },
  open: { emoji: "🟢", text: "Open", help: "Open now." },
};

export function Tag({ kind, text }: { kind: TagKind; text?: string }) {
  const t = tagInfo[kind];
  return (
    <span className={`tag tag-${kind}`} title={t.help}>
      {t.emoji} {text ?? t.text}
    </span>
  );
}
