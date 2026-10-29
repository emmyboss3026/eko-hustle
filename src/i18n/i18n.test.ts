import { describe, expect, it } from "vitest";
import { en } from "./en";
import { de } from "./de";
import { pcm } from "./pcm";
import { translate, type Dict } from "./core";
import { contentEntries, text } from "./text";
import { actions } from "../data/actions";
import { newGame, reduce } from "../engine/game";

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
const bold = (s: string) => s.split("**").length;

describe.each([["de", de], ["pcm", pcm]] as [string, Dict][])("%s translation", (_lang, dict) => {
  const all: [string, string][] = [...Object.entries(en), ...contentEntries()];

  it("has every UI and content key", () => {
    const missing = all.map(([k]) => k).filter(k => !(k in dict));
    expect(missing).toEqual([]);
  });

  it("has no keys that don't exist in English", () => {
    const known = new Set(all.map(([k]) => k));
    expect(Object.keys(dict).filter(k => !known.has(k))).toEqual([]);
  });

  it("keeps the same {placeholders} and **bold** marks", () => {
    const bad = all.filter(([k, v]) => k in dict && (placeholders(v) !== placeholders(dict[k]) || bold(v) !== bold(dict[k])));
    expect(bad.map(([k]) => k)).toEqual([]);
  });

  it("has no empty strings", () => {
    expect(Object.entries(dict).filter(([, v]) => !v.trim()).map(([k]) => k)).toEqual([]);
  });
});

describe("language", () => {
  it("translates UI text and fills placeholders", () => {
    expect(translate("de", "hud.day", { day: 3 })).toBe("Tag 3");
    expect(translate("pcm", "hud.day", { day: 3 })).toBe("Day 3");
    expect(translate("en", "dock.do")).toBe("Places");
  });

  it("translates game content", () => {
    const cook = actions.find(a => a.id === "cook")!;
    expect(text("de").action(cook)).toBe("Egusi kochen");
    expect(text("en").action(cook)).toBe("Cook egusi");
  });

  it("writes the game log in the chosen language", () => {
    const sim = { name: "Ada", trait: "hustler" as const, avatar: "👩🏾" };
    const s = newGame(sim, "de");
    expect(s.lang).toBe("de");
    expect(s.log[0]).toContain("kommt mit");
    const switched = reduce(s, { type: "lang", lang: "pcm" });
    expect(switched.lang).toBe("pcm");
  });
});

describe("phone text", () => {
  it("every fund, business, invitation, contact, achievement, status and app has its English text", async () => {
    const { FUNDS } = await import("../data/invest");
    const { BUSINESSES } = await import("../data/business");
    const { INVITES } = await import("../data/invites");
    const { CONTACTS } = await import("../data/contacts");
    const { ACHIEVEMENTS, STATUS } = await import("../engine/progress");
    const { APPS } = await import("../components/phone/Phone");
    const keys = [
      ...FUNDS.flatMap(f => [`fund.${f.id}.name`, `fund.${f.id}.desc`]),
      ...BUSINESSES.flatMap(b => [`biz.${b.id}.name`, `biz.${b.id}.desc`]),
      ...INVITES.flatMap(i => [`invite.${i.id}.name`, `invite.${i.id}.desc`, `invites.kind.${i.kind}`]),
      ...CONTACTS.flatMap(c => ["name", "role", "about", "helps"].map(p => `contact.${c.id}.${p}`).concat(`help.from.${c.id}`)),
      ...ACHIEVEMENTS.flatMap(a => [`ach.${a.id}.name`, `ach.${a.id}.desc`]),
      ...STATUS.map(s => s.key),
      ...APPS.map(a => `app.${a.id}`),
      ...["work", "hustle", "mission", "reward", "event", "family", "food", "home", "rent", "transport", "goals", "invest", "business", "social", "other"].map(c => `bank.cat.${c}`),
    ];
    expect(keys.filter(k => !(k in en))).toEqual([]);
  });
});

describe("sound and street chatter", () => {
  it("every passer-by line exists, and every action has a sound", async () => {
    const { chatterKeys, chatterKey, PERSONAS } = await import("../data/chatter");
    const { soundForAction } = await import("../data/sounds");
    expect(chatterKeys().filter(k => !(k in en))).toEqual([]);
    const s = newGame({ name: "Ada", trait: "hustler", avatar: "👩🏾" });
    for (const p of PERSONAS) for (const r of [0, 0.5, 0.99]) expect(chatterKeys()).toContain(chatterKey(s, p.id, r, r));
    for (const a of actions) expect(typeof soundForAction(a)).toBe("string");
  });

  it("music matches the language unless the player picks a tune", async () => {
    const { trackFor } = await import("../lib/audio");
    expect(trackFor("auto", "pcm")).toBe("afrobeat");
    expect(trackFor("auto", "de")).toBe("waltz");
    expect(trackFor("auto", "en")).toBe("highlife");
    expect(trackFor("lofi", "de")).toBe("lofi");
    expect(trackFor("off", "en")).toBeNull();
  });

  it("answering a passer-by is a small social boost", () => {
    const s = newGame({ name: "Ada", trait: "hustler", avatar: "👩🏾" });
    const n = reduce(s, { type: "greet" });
    expect(n.needs.social).toBeGreaterThan(s.needs.social - 1);
    expect(n.counts.greet).toBe(1);
  });
});
