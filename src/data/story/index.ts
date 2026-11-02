import type { Chapter, StoryMission } from "./types";
import { ch1 } from "./ch1";
import { ch2 } from "./ch2";
import { ch3 } from "./ch3";
import { ch4 } from "./ch4";
import { ch5 } from "./ch5";
import { ch6 } from "./ch6";

/** All ten chapters of the planned 100-mission story. Only the ones with missions below are playable so far. */
export const CHAPTERS: Chapter[] = [
  { n: 1, emoji: "🌱", title: "Humble Beginnings", focus: "Basic survival and first opportunities", planned: [1, 10] },
  { n: 2, emoji: "🧭", title: "Finding Your Feet", focus: "Education, work, friendships and early decisions", planned: [11, 20] },
  { n: 3, emoji: "🔥", title: "The Hustle", focus: "Earning money, building skills, managing challenges", planned: [21, 30] },
  { n: 4, emoji: "🎯", title: "Choosing Your Future", focus: "Career selection and long-term ambitions", planned: [31, 40] },
  { n: 5, emoji: "🌟", title: "Building a Reputation", focus: "Career advancement, relationships, social standing", planned: [41, 50] },
  { n: 6, emoji: "💹", title: "Bigger Opportunities", focus: "Investments, professional growth, major decisions", planned: [51, 60] },
  { n: 7, emoji: "⚖️", title: "The Price of Success", focus: "Competition, setbacks, ethical dilemmas", planned: [61, 70] },
  { n: 8, emoji: "🏛️", title: "Making Your Mark", focus: "Leadership, influence, wealth", planned: [71, 80] },
  { n: 9, emoji: "🏔️", title: "At the Top", focus: "Major achievements and high-stakes decisions", planned: [81, 90] },
  { n: 10, emoji: "👑", title: "Your Legacy", focus: "Long-term accomplishments and future ambitions", planned: [91, 100] },
];

export const STORY: StoryMission[] = [...ch1, ...ch2, ...ch3, ...ch4, ...ch5, ...ch6];

export const storyById = (id: string) => STORY.find(m => m.id === id);
