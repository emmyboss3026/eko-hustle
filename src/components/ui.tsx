import type { Needs } from "../engine/needs";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";
import type { T } from "../i18n/core";

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

/** Translate a message that may be a key (e.g. from lib code), or show it as it is. */
export const tmsg = (t: T, m: string) => t(m);

// Small "+40 Hunger" / "−15 Energy" chips for an effect
export function EffectChips({ effect }: { effect: Partial<Needs> }) {
  const { tx } = useLang();
  const keys = needKeys.filter(k => effect[k]);
  if (keys.length === 0) return null;
  return (
    <span className="chips">
      {keys.map(k => {
        const v = effect[k] ?? 0;
        return (
          <span key={k} className={`chip ${v > 0 ? "up" : "down"}`}>
            {v > 0 ? "+" : "−"}
            {Math.abs(v)} {tx.need(k)}
          </span>
        );
      })}
    </span>
  );
}

export function Price({ cost, pay }: { cost?: number; pay?: number }) {
  const { t } = useLang();
  if (pay) return <span className="row-price earn">+{naira(pay)}</span>;
  if (cost) return <span className="row-price">{naira(cost)}</span>;
  return <span className="row-price">{t("ui.free")}</span>;
}

export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

// ---------- tags: small labels that explain a row at a glance ----------

export type TagKind = "money" | "skill" | "light" | "lock" | "closed" | "mission" | "food" | "open";

export const tagEmoji: Record<TagKind, string> = {
  mission: "🎯", money: "💰", skill: "📈", light: "💡", food: "🧺", lock: "🔒", closed: "🕒", open: "🟢",
};

export function Tag({ kind, text }: { kind: TagKind; text?: string }) {
  const { t } = useLang();
  return (
    <span className={`tag tag-${kind}`} title={t(`tag.${kind}.help`)}>
      {tagEmoji[kind]} {text ?? t(`tag.${kind}`)}
    </span>
  );
}
