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
