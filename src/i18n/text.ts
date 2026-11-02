// Game content in the player's language. Each function takes the English from src/data
// and looks up the German or Pidgin version by key. `contentEntries()` lists every key
// with its English text (used by the translation test and to write new translations).

import { content, type Lang } from "./core";
import { actions, categoryInfo, type Action, type Category } from "../data/actions";
import { spots, type SpotId } from "../data/spots";
import { districts, modes, type DistrictId } from "../data/places";
import { careers, type CareerId } from "../data/careers";
import { events, type GameEvent } from "../data/events";
import { STORY, CHALLENGES, WEEKS, type Challenge, type WeekEvent } from "../data/story";
import { CAST, CHAPTERS, ROUTES, castById } from "../data/story/cast";
import type { RouteId, StoryMission } from "../data/story/types";
import { moodlets, type MoodletId } from "../data/moodlets";
import { traits, type TraitId } from "../data/traits";
import { skillInfo, type SkillId, type Skills } from "../data/skills";
import { CATALOG, HOME, type FurnitureType } from "../data/home";
import { goalSteps, type GoalStepId } from "../data/goals";
import { presets } from "../data/characters";

const needNames = { hunger: "Hunger", energy: "Energy", fun: "Fun", social: "Social", hygiene: "Hygiene", bladder: "Bladder" };
export type NeedKey = keyof typeof needNames;

/** All game content in one language. */
export function text(lang: Lang) {
  const c = (key: string, en: string, vars?: Record<string, string | number>) => content(lang, key, en, vars);
  const skill = (id: SkillId) => c(`skill.${id}.name`, skillInfo[id].name);
  return {
    lang,
    action: (a: Action) => c(`action.${a.id}`, a.label),
    category: (k: Category) => c(`category.${k}`, categoryInfo[k].name),
    spot: (id: SpotId) => c(`spot.${id}.name`, spots[id].name),
    spotBlurb: (id: SpotId) => c(`spot.${id}.blurb`, spots[id].blurb),
    district: (id: DistrictId) => c(`district.${id}.name`, districts[id].name),
    districtBlurb: (id: DistrictId) => c(`district.${id}.blurb`, districts[id].blurb),
    mode: (id: string) => c(`mode.${id}`, modes.find(m => m.id === id)?.label ?? id),
    career: (id: CareerId) => c(`career.${id}.name`, careers[id].name),
    title: (id: CareerId, level: number) => c(`career.${id}.${level}`, careers[id].levels[level]?.title ?? ""),
    event: (e: GameEvent) => ({
      title: c(`event.${e.id}.title`, e.title),
      text: c(`event.${e.id}.text`, e.text),
      choice: (i: number) => c(`event.${e.id}.c${i}`, e.choices[i].label),
      result: (i: number, won: boolean) =>
        won && e.choices[i].chance
          ? c(`event.${e.id}.c${i}.win`, e.choices[i].chance!.win.result)
          : c(`event.${e.id}.c${i}.result`, e.choices[i].result),
    }),
    mission: (m: StoryMission) => ({
      title: c(`mission.${m.id}.title`, m.title),
      goal: c(`mission.${m.id}.goal`, m.goal),
      steps: (m.steps ?? []).map((s, i) => c(`mission.${m.id}.step${i}`, s)),
    }),
    story: (m: StoryMission) => ({
      title: c(`mission.${m.id}.title`, m.title),
      goal: c(`mission.${m.id}.goal`, m.goal),
      intro: c(`mission.${m.id}.intro`, m.intro),
      steps: (m.steps ?? []).map((s, i) => c(`mission.${m.id}.step${i}`, s)),
      line: (i: number) => c(`mission.${m.id}.line${i}`, m.lines[i]?.text ?? ""),
      choice: (i: number) => c(`mission.${m.id}.choice${i}`, m.choices?.[i]?.label ?? ""),
      result: (i: number) => c(`mission.${m.id}.result${i}`, m.choices?.[i]?.result ?? ""),
      win: (i: number) => c(`mission.${m.id}.win${i}`, m.choices?.[i]?.chance?.win ?? ""),
      fail: c(`mission.${m.id}.fail`, m.fail?.text ?? ""),
    }),
    castName: (id: string) => c(`cast.${id}.name`, castById(id)?.name ?? id),
    castRole: (id: string) => c(`cast.${id}.role`, castById(id)?.role ?? ""),
    chapter: (n: number) => {
      const ch = CHAPTERS.find(x => x.n === n) ?? CHAPTERS[0];
      return { title: c(`chapter.${ch.n}.title`, ch.title), blurb: c(`chapter.${ch.n}.blurb`, ch.blurb) };
    },
    route: (id: RouteId) => {
      const r = ROUTES.find(x => x.id === id)!;
      return { name: c(`route.${id}.name`, r.name), blurb: c(`route.${id}.blurb`, r.blurb) };
    },
    challenge: (ch: Challenge) => c(`challenge.${ch.id}`, ch.title),
    week: (w: WeekEvent) => ({ title: c(`week.${w.id}.title`, w.title), desc: c(`week.${w.id}.desc`, w.desc) }),
    mood: (id: MoodletId) => ({ label: c(`mood.${id}.label`, moodlets[id].label), desc: c(`mood.${id}.desc`, moodlets[id].desc) }),
    trait: (id: TraitId) => ({ name: c(`trait.${id}.name`, traits[id].name), desc: c(`trait.${id}.desc`, traits[id].desc) }),
    skill,
    skillDesc: (id: SkillId) => c(`skill.${id}.desc`, skillInfo[id].desc),
    req: (req: Partial<Skills> | undefined) =>
      req ? (Object.keys(req) as SkillId[]).map(id => `${skillInfo[id].emoji} ${skill(id)} ${req[id]}`).join(", ") : "",
    need: (k: NeedKey) => c(`need.${k}`, needNames[k]),
    furniture: (t: FurnitureType) => c(`furniture.${t}.name`, CATALOG[t].name),
    furnitureBlurb: (t: FurnitureType) => c(`furniture.${t}.blurb`, CATALOG[t].blurb),
    room: (name: string) => c(`room.${name}`, name),
    homeName: () => c("home.name", HOME.name),
    goal: (id: GoalStepId) => ({
      name: c(`goal.${id}.name`, goalSteps[id].name),
      desc: c(`goal.${id}.desc`, goalSteps[id].desc),
      place: c(`goal.${id}.place`, goalSteps[id].place),
    }),
    presetStory: (id: string) => c(`preset.${id}.story`, presets.find(p => p.id === id)?.story ?? ""),
    presetFrom: (id: string) => c(`preset.${id}.from`, presets.find(p => p.id === id)?.from ?? ""),
  };
}

export type Text = ReturnType<typeof text>;

/** Every content key with its English text. */
export function contentEntries(): [string, string][] {
  const out: [string, string][] = [];
  const add = (k: string, v: string) => out.push([k, v]);
  for (const a of actions) add(`action.${a.id}`, a.label);
  for (const [k, v] of Object.entries(categoryInfo)) add(`category.${k}`, v.name);
  for (const s of Object.values(spots)) {
    add(`spot.${s.id}.name`, s.name);
    add(`spot.${s.id}.blurb`, s.blurb);
  }
  for (const [id, d] of Object.entries(districts)) {
    add(`district.${id}.name`, d.name);
    add(`district.${id}.blurb`, d.blurb);
  }
  for (const m of modes) add(`mode.${m.id}`, m.label);
  for (const c of Object.values(careers)) {
    add(`career.${c.id}.name`, c.name);
    c.levels.forEach((l, i) => add(`career.${c.id}.${i}`, l.title));
  }
  for (const e of events) {
    add(`event.${e.id}.title`, e.title);
    add(`event.${e.id}.text`, e.text);
    e.choices.forEach((ch, i) => {
      add(`event.${e.id}.c${i}`, ch.label);
      add(`event.${e.id}.c${i}.result`, ch.result);
      if (ch.chance) add(`event.${e.id}.c${i}.win`, ch.chance.win.result);
    });
  }
  for (const m of STORY) {
    add(`mission.${m.id}.title`, m.title);
    add(`mission.${m.id}.goal`, m.goal);
    add(`mission.${m.id}.intro`, m.intro);
    (m.steps ?? []).forEach((s, i) => add(`mission.${m.id}.step${i}`, s));
    m.lines.forEach((l, i) => add(`mission.${m.id}.line${i}`, l.text));
    (m.choices ?? []).forEach((ch, i) => {
      add(`mission.${m.id}.choice${i}`, ch.label);
      add(`mission.${m.id}.result${i}`, ch.result);
      if (ch.chance) add(`mission.${m.id}.win${i}`, ch.chance.win);
    });
    if (m.fail) add(`mission.${m.id}.fail`, m.fail.text);
  }
  for (const p of CAST) {
    add(`cast.${p.id}.name`, p.name);
    add(`cast.${p.id}.role`, p.role);
  }
  for (const ch of CHAPTERS) {
    add(`chapter.${ch.n}.title`, ch.title);
    add(`chapter.${ch.n}.blurb`, ch.blurb);
  }
  for (const r of ROUTES) {
    add(`route.${r.id}.name`, r.name);
    add(`route.${r.id}.blurb`, r.blurb);
  }
  for (const ch of CHALLENGES) add(`challenge.${ch.id}`, ch.title);
  for (const w of WEEKS) {
    add(`week.${w.id}.title`, w.title);
    add(`week.${w.id}.desc`, w.desc);
  }
  for (const [id, m] of Object.entries(moodlets)) {
    add(`mood.${id}.label`, m.label);
    add(`mood.${id}.desc`, m.desc);
  }
  for (const [id, t] of Object.entries(traits)) {
    add(`trait.${id}.name`, t.name);
    add(`trait.${id}.desc`, t.desc);
  }
  for (const [id, s] of Object.entries(skillInfo)) {
    add(`skill.${id}.name`, s.name);
    add(`skill.${id}.desc`, s.desc);
  }
  for (const [k, v] of Object.entries(needNames)) add(`need.${k}`, v);
  for (const [t, f] of Object.entries(CATALOG)) {
    add(`furniture.${t}.name`, f.name);
    add(`furniture.${t}.blurb`, f.blurb);
  }
  for (const r of HOME.rooms) add(`room.${r.name}`, r.name);
  add("room.Living room", "Living room");
  add("home.name", HOME.name);
  for (const [id, g] of Object.entries(goalSteps)) {
    add(`goal.${id}.name`, g.name);
    add(`goal.${id}.desc`, g.desc);
    add(`goal.${id}.place`, g.place);
  }
  for (const p of presets) {
    add(`preset.${p.id}.story`, p.story);
    add(`preset.${p.id}.from`, p.from);
  }
  return out;
}
