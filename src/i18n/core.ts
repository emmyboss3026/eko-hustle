// Translations. English (UK) is the source: UI text lives in en.ts, and game content
// (actions, places, missions, events…) is written in English in src/data.
// de.ts and pcm.ts hold German and Nigerian Pidgin for both. Missing text falls back to English.

import { en } from "./en";
import { de } from "./de";
import { pcm } from "./pcm";

export type Lang = "en" | "de" | "pcm";

export const LANGS: { id: Lang; label: string; flag: string; hint: string }[] = [
  { id: "en", label: "English", flag: "🇬🇧", hint: "UK English" },
  { id: "de", label: "Deutsch", flag: "🇩🇪", hint: "German" },
  { id: "pcm", label: "Naija Pidgin", flag: "🇳🇬", hint: "Pidgin English" },
];

export type Dict = Record<string, string>;
const dicts: Record<Lang, Dict> = { en, de, pcm };

export const isLang = (x: unknown): x is Lang => x === "en" || x === "de" || x === "pcm";

/** Fill {name} placeholders. */
export function fill(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** UI text by key, e.g. t("en", "dock.places"). */
export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const text = dicts[lang]?.[key] ?? en[key] ?? key;
  return fill(text, vars);
}

/** Game content by key, with the English from the data files as the fallback. */
export function content(lang: Lang, key: string, english: string, vars?: Record<string, string | number>): string {
  const text = lang === "en" ? english : dicts[lang]?.[key] ?? english;
  return fill(text, vars);
}

export type T = (key: string, vars?: Record<string, string | number>) => string;
export const tFor = (lang: Lang): T => (key, vars) => translate(lang, key, vars);

export const dictionaries = dicts;
