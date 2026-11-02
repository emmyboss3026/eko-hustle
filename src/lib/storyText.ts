// Mission tasks and qualifications in words, in the player's language.

import type { T } from "../i18n/core";
import type { Text } from "../i18n/text";
import type { Task } from "../data/story/types";
import { taskKind } from "../data/story/types";
import { actionById } from "../data/actions";
import { careers } from "../data/careers";
import { CATALOG } from "../data/home";
import { naira } from "../engine/economy";
import type { SpotId } from "../data/spots";

const COUNTERS = ["work", "earned", "travel", "walk", "call", "invite", "buy", "greet", "enter", "invest", "business", "rentPaid", "promotions", "shifts", "sentHome"];

/** "Cook egusi", "Work 2 shifts", "Have ₦300,000"… */
export function taskLabel(t: T, tx: Text, task: Task): string {
  const x = task as Record<string, unknown>;
  switch (taskKind(task)) {
    case "do": {
      const names = (x.do as string).split("|").map(id => actionById(id)).filter(Boolean).slice(0, 2).map(a => tx.action(a!));
      const n = (x.n as number) ?? 1;
      return n > 1 ? t("task.doTimes", { what: names.join(t("word.or")), n }) : names.join(t("word.or"));
    }
    case "count": case "total": {
      const key = (x.count ?? x.total) as string;
      const n = x.n as number;
      if (key === "earned") return t("task.earn", { money: naira(n) });
      const name = key.includes("travel") || key === "walk" ? "travel" : COUNTERS.includes(key) ? key : "other";
      return t(`task.counter.${name}${n === 1 ? "1" : ""}`, { n });
    }
    case "visit": return t("task.visit", { place: tx.spot(x.visit as SpotId) });
    case "skill": return t("task.skill", { skill: tx.skill(x.skill as never), n: x.min as number });
    case "anySkill": return t("task.anySkill", { n: x.anySkill as number });
    case "money": return t("task.money", { money: naira(x.money as number) });
    case "worth": return t("task.worth", { money: naira(x.worth as number) });
    case "rep": return t("task.rep", { n: x.rep as number });
    case "bond": return t("task.bond", { name: t(`contact.${x.bond}.name`), n: x.min as number });
    case "career": {
      const id = x.career as keyof typeof careers;
      const level = (x.level as number) ?? 0;
      return level > 0 ? t("task.careerLevel", { title: tx.title(id, level) }) : t("task.career", { job: tx.career(id) });
    }
    case "anyJob": return t("task.anyJob");
    case "biz": return t((x.biz as number) > 1 ? "task.bizMany" : "task.biz", { n: x.biz as number });
    case "bizId": return t("task.bizId", { biz: t(`biz.${x.bizId}.name`) }) + ((x.level as number) > 1 ? ` (${t("task.level", { n: x.level as number })})` : "");
    case "bizLevel": return t("task.bizLevel", { n: x.bizLevel as number });
    case "invested": return t("task.invested", { money: naira(x.invested as number) });
    case "item": return t("task.item", { item: tx.furniture(x.item as keyof typeof CATALOG) });
    case "flag": return t("task.flag");
    case "days": return t((x.days as number) > 1 ? "task.days" : "task.day", { n: x.days as number });
    case "pay": return t("task.pay", { money: naira(x.pay as number) });
  }
}

/** Show progress as money for money tasks, plain numbers otherwise. */
export function progressText(task: Task, have: number, need: number): string {
  const k = taskKind(task);
  const money = k === "money" || k === "worth" || k === "invested" || ((k === "count" || k === "total") && (task as { count?: string; total?: string }).count === "earned");
  if (need <= 1) return "";
  return money ? `${naira(have)} / ${naira(need)}` : `${have} / ${need}`;
}

/** Qualifications and milestones from the story, for the 👤 Me tab. */
export const QUALIFICATIONS = [
  "registered", "medstudent", "mbbs", "nysc", "primaries", "fellowship", "lawstudent", "llb", "lawschool", "bar", "partner", "san",
  "founder", "creator", "demo", "artist", "headliner", "property", "cole_partner", "clinic_ready", "own_chambers", "own_label",
] as const;

/** Every career's first qualification, so the Jobs tab can say what's missing. */
export const careerQualification = (id: keyof typeof careers) => careers[id].levels[0].flag ?? careers[id].flag;
