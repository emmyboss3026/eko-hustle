// Playable characters: ready-made people from all over Nigeria (and beyond),
// plus the pieces you can mix to make your own look.
// The look is used by the 3D figure in your room and on the streets.

import type { TraitId } from "./traits";

export type HairId = "short" | "afro" | "braids" | "bald" | "gele" | "hijab" | "kufi" | "locs";
export type Build = "m" | "f";

export type Look = {
  skin: string;     // a colour from skinTones
  hair: HairId;
  hairColor: string;
  outfit: string;   // top colour
  bottom: string;   // trousers or wrapper colour
  build: Build;     // "f" adds a wrapper skirt
};

export const skinTones = ["#3b2219", "#5a3825", "#7b4a2d", "#9c6644", "#c68a5e", "#e0b48c"];
export const hairColors = ["#1e1e1e", "#3d2314", "#6b4423", "#b5651d", "#d9d9d9"];
export const outfitColors = ["#e67e22", "#2ecc71", "#2980b9", "#8e44ad", "#e84393", "#f1c40f", "#c0392b", "#16a085", "#ecf0f1", "#2d3436"];
export const bottomColors = ["#34495e", "#2c3e50", "#7f8c8d", "#6d4c41", "#1e3799", "#b33939"];

export const hairStyles: { id: HairId; emoji: string }[] = [
  { id: "short", emoji: "💇🏾" },
  { id: "afro", emoji: "🧑🏾‍🦱" },
  { id: "braids", emoji: "👩🏾‍🦱" },
  { id: "locs", emoji: "🧔🏿" },
  { id: "bald", emoji: "👨🏾‍🦲" },
  { id: "gele", emoji: "👳🏾‍♀️" },
  { id: "hijab", emoji: "🧕🏾" },
  { id: "kufi", emoji: "👲🏾" },
];

export type Preset = {
  id: string;
  name: string;
  avatar: string;     // emoji for the top bar
  from: string;       // where they're from
  story: string;      // one line about them (English; translated in i18n)
  trait: TraitId;
  look: Look;
};

export const presets: Preset[] = [
  {
    id: "tolu", name: "Tolu", avatar: "👩🏾‍🦱", from: "Ibadan", trait: "hustler",
    story: "Sold pure water at 12. Now she wants her own business empire.",
    look: { skin: "#7b4a2d", hair: "braids", hairColor: "#1e1e1e", outfit: "#e67e22", bottom: "#34495e", build: "f" },
  },
  {
    id: "chidi", name: "Chidi", avatar: "🧑🏾", from: "Onitsha", trait: "sharp",
    story: "Grew up in his uncle's spare-parts shop. Knows the price of everything.",
    look: { skin: "#5a3825", hair: "short", hairColor: "#1e1e1e", outfit: "#2980b9", bottom: "#2c3e50", build: "m" },
  },
  {
    id: "amina", name: "Amina", avatar: "🧕🏾", from: "Kano", trait: "bookworm",
    story: "Top of her class. Dreams of a master's degree in Canada.",
    look: { skin: "#9c6644", hair: "hijab", hairColor: "#16a085", outfit: "#16a085", bottom: "#2c3e50", build: "f" },
  },
  {
    id: "ebi", name: "Ebi", avatar: "🧔🏿", from: "Yenagoa", trait: "foodie",
    story: "A fisherman's son from the creeks. His pepper soup is legendary.",
    look: { skin: "#3b2219", hair: "locs", hairColor: "#1e1e1e", outfit: "#c0392b", bottom: "#6d4c41", build: "m" },
  },
  {
    id: "ngozi", name: "Ngozi", avatar: "👩🏾", from: "Enugu", trait: "charmer",
    story: "Church choir leader. Everyone in Mushin already knows her name.",
    look: { skin: "#7b4a2d", hair: "gele", hairColor: "#8e44ad", outfit: "#8e44ad", bottom: "#b33939", build: "f" },
  },
  {
    id: "musa", name: "Musa", avatar: "👲🏾", from: "Kaduna", trait: "hustler",
    story: "Drove a keke for five years. Saving every naira for a fleet of his own.",
    look: { skin: "#5a3825", hair: "kufi", hairColor: "#ecf0f1", outfit: "#ecf0f1", bottom: "#7f8c8d", build: "m" },
  },
  {
    id: "zainab", name: "Zainab", avatar: "👩🏽", from: "Jos", trait: "bookworm",
    story: "Fulani roots, coding brain. Taught herself JavaScript on her phone.",
    look: { skin: "#c68a5e", hair: "afro", hairColor: "#3d2314", outfit: "#f1c40f", bottom: "#1e3799", build: "f" },
  },
  {
    id: "daniel", name: "Daniel", avatar: "🧑🏽", from: "Lagos & London", trait: "charmer",
    story: "Half Nigerian, half British. Came back to find his roots and a hustle.",
    look: { skin: "#e0b48c", hair: "short", hairColor: "#6b4423", outfit: "#2ecc71", bottom: "#34495e", build: "m" },
  },
  {
    id: "mama", name: "Iya Bisi", avatar: "👵🏾", from: "Abeokuta", trait: "foodie",
    story: "Widow, grandmother, and not done yet. Starting over at 58.",
    look: { skin: "#7b4a2d", hair: "gele", hairColor: "#d9d9d9", outfit: "#e84393", bottom: "#b33939", build: "f" },
  },
  {
    id: "femi", name: "Femi", avatar: "👨🏾‍🦲", from: "Akure", trait: "sharp",
    story: "Ex-banker who lost his job. Calm, clever and very good with numbers.",
    look: { skin: "#3b2219", hair: "bald", hairColor: "#1e1e1e", outfit: "#2d3436", bottom: "#2c3e50", build: "m" },
  },
];

export const defaultLook: Look = presets[0].look;
