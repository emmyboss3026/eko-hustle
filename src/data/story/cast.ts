// The people in the story and the ten chapters. All characters and organisations are fictional.

import type { CastMember, Chapter, RouteId } from "./types";

export const CAST: CastMember[] = [
  // Your people (also in 📇 Contacts)
  { id: "mummy", emoji: "👵🏾", name: "Mummy", role: "Your mother, back home in Abeokuta", contact: "mummy" },
  { id: "kunle", emoji: "🧑🏾‍🎓", name: "Kunle", role: "Your cousin, chasing admission", contact: "kunle" },
  { id: "tunde", emoji: "😎", name: "Tunde", role: "Your hustle partner from the next street", contact: "tunde" },
  { id: "ronke", emoji: "👩🏾‍🍳", name: "Mama Ronke", role: "Owner of the buka", contact: "ronke" },
  { id: "landlord", emoji: "🧔🏾", name: "Baba Landlord", role: "Your landlord", contact: "landlord" },
  { id: "ify", emoji: "👩🏾‍💻", name: "Ify", role: "Developer and mentor at Brainbox", contact: "ify" },
  { id: "sule", emoji: "🏋🏾", name: "Coach Sule", role: "Runs the Iron Gate Gym", contact: "sule" },
  { id: "funke", emoji: "🧕🏾", name: "Aunty Funke", role: "Foodstuff trader at Oja Tuntun", contact: "funke" },
  // People you meet in the story
  { id: "bisola", emoji: "👩🏾‍💼", name: "Chief Bisola Cole", role: "Founder of Cole Trading, Marina" },
  { id: "ngozi", emoji: "👩🏾‍⚕️", name: "Dr Ngozi Okafor", role: "Consultant physician, Mainland General" },
  { id: "emeka", emoji: "👨🏾‍⚖️", name: "Barrister Emeka Nwosu", role: "Senior partner, Nwosu & Partners" },
  { id: "kola", emoji: "🎧", name: "Kola \"K-Wave\" Bankole", role: "Producer at Afrowave Studios" },
  { id: "halima", emoji: "🧕🏽", name: "Halima Yusuf", role: "Investor at Lagoon Ventures" },
  { id: "damola", emoji: "🕶️", name: "Damola Pedro", role: "Smooth talker, always one step ahead" },
  { id: "tobi", emoji: "📐", name: "Tobi Adebayo", role: "Architect you met on the Island" },
  { id: "femi", emoji: "👴🏾", name: "Baba Femi", role: "Draughts champion of Unity Park" },
  { id: "jide", emoji: "🎩", name: "Uncle Jide", role: "Mummy's brother, never misses an owambe" },
  { id: "chiamaka", emoji: "👩🏾‍🦱", name: "Chiamaka", role: "Your friend from night class" },
  { id: "adewale", emoji: "👨🏾‍🏫", name: "Prof. Adewale", role: "Lecturer at Lagoon University" },
  { id: "boss", emoji: "👔", name: "Mr Okon", role: "Your first supervisor" },
  { id: "conductor", emoji: "🚌", name: "Danfo conductor", role: "Shouts the route, collects the fare" },
  { id: "you", emoji: "🙂", name: "You", role: "That's you" },
];

export const castById = (id: string) => CAST.find(c => c.id === id);

export const CHAPTERS: Chapter[] = [
  { n: 1, emoji: "🧳", title: "Humble Beginnings", blurb: "A small room in Mushin, a few naira and a big dream." },
  { n: 2, emoji: "👣", title: "Finding Your Feet", blurb: "Rent, a first job, new friends and the first hard choices." },
  { n: 3, emoji: "💪🏾", title: "The Hustle", blurb: "Money, skills, floods and NEPA. Lagos tests you." },
  { n: 4, emoji: "🛣️", title: "Choosing Your Future", blurb: "Five mentors, five roads. Pick the life you want." },
  { n: 5, emoji: "🌟", title: "Building a Reputation", blurb: "People start to know your name. Keep it clean." },
  { n: 6, emoji: "📈", title: "Bigger Opportunities", blurb: "Investments, promotions and decisions with real weight." },
  { n: 7, emoji: "⚖️", title: "The Price of Success", blurb: "Rivals, setbacks and choices nobody else will see." },
  { n: 8, emoji: "🦅", title: "Making Your Mark", blurb: "Lead people, shape your street, grow your name." },
  { n: 9, emoji: "👑", title: "At the Top", blurb: "The biggest stage of your career. Everything is on the line." },
  { n: 10, emoji: "🏛️", title: "Your Legacy", blurb: "What will Lagos remember about you?" },
];

/** The career routes. Add a route here, give it missions in chapters 4–10, and it appears in the story. */
export const ROUTES: { id: RouteId; emoji: string; name: string; mentor: string; blurb: string }[] = [
  { id: "biz", emoji: "🏪", name: "Business", mentor: "bisola", blurb: "From one stall to a company with your name on the trucks." },
  { id: "med", emoji: "🩺", name: "Medicine", mentor: "ngozi", blurb: "Years of study, long nights on the ward, and lives in your hands." },
  { id: "law", emoji: "⚖️", name: "Law", mentor: "emeka", blurb: "Law degree, Law School, the Bar, and cases that matter." },
  { id: "tech", emoji: "💻", name: "Technology", mentor: "ify", blurb: "Code, ship products, raise money and build a startup." },
  { id: "ent", emoji: "🎤", name: "Entertainment", mentor: "kola", blurb: "Music, film and content. Build an audience and own your work." },
];
