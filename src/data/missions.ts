// The mission you're on now, and which buttons, places and furniture get a 🎯 tag.
// The missions themselves live in src/data/story (chapters, routes, dialogue and choices).

import type { GameState } from "../engine/game";
import { currentStory, storyOf } from "../engine/story";
import type { StoryMission } from "./story/types";
import { taskKind } from "./story/types";
import type { SpotId } from "./spots";
import type { FurnitureType } from "./home";
import { actionById } from "./actions";

export type TabId = "home" | "do" | "go" | "work" | "goals" | "me";
export type Mission = StoryMission;

export const currentMission = (s: GameState): StoryMission | null => currentStory(storyOf(s));

/** Is this action, place, tab or furniture part of the current mission? (for 🎯 tags) */
export function missionTags(s: GameState) {
  const m = currentMission(s);
  const actions = new Set<string>();
  let spot: SpotId | null = m?.hint ?? null;
  let furniture: FurnitureType | null = m?.furniture ?? null;
  for (const t of m?.tasks ?? []) {
    const x = t as Record<string, unknown>;
    if (taskKind(t) === "do") {
      for (const id of (x.do as string).split("|")) {
        const a = actionById(id);
        if (!a) continue;
        actions.add(id);
        if (!spot && a.spot !== "home") spot = a.spot;
      }
    }
    if (taskKind(t) === "visit" && !spot) spot = x.visit as SpotId;
    if (taskKind(t) === "item" && !furniture) furniture = x.item as FurnitureType;
  }
  return { tab: (m?.tab ?? null) as TabId | null, actions, spot, furniture };
}
