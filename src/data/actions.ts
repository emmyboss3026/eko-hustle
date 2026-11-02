import type { Needs } from "../engine/needs";
import type { DistrictId } from "./places";
import type { SkillId, Skills } from "./skills";
import type { FurnitureType } from "./home";
import type { SpotId } from "./spots";
import type { MoodletId } from "./moodlets";

export type Category = "home" | "food" | "rest" | "fun" | "care" | "learn" | "money" | "phone";

export type Action = {
  id: string;
  label: string;
  emoji: string;
  minutes: number;
  cost: number;
  pay?: number;             // fixed money earned (before trait bonus)
  earn?: { base: number; per: number; skill: SkillId }; // pays base + per × your skill level
  category: Category;
  where: DistrictId | "any";
  spot: SpotId;             // which place it happens at (see spots.ts)
  effect: Partial<Needs>;
  skill?: Partial<Skills>;  // skills gained
  boost?: SkillId;          // this skill makes the action's good effects stronger (+5% per level)
  req?: Partial<Skills>;    // skill levels you need first
  asleep?: boolean;         // needs drain much slower during this action
  uses?: FurnitureType[];   // you must own one of these (in your room)
  power?: boolean;          // needs light: the grid or your generator
  food?: number;            // meal packs it uses up from your groceries
  stock?: { food?: number; fuel?: number }; // supplies it adds at home
  mood?: MoodletId;         // a mood you get afterwards
  flag?: string;            // only once this has happened in the story (e.g. "medstudent")
};

export const categoryInfo: Record<Category, { name: string; emoji: string }> = {
  home: { name: "Supplies", emoji: "🧺" },
  food: { name: "Food", emoji: "🍲" },
  rest: { name: "Rest", emoji: "😴" },
  fun: { name: "Fun & friends", emoji: "🎉" },
  care: { name: "Care", emoji: "🛁" },
  learn: { name: "Learn & grow", emoji: "📚" },
  money: { name: "Side hustles", emoji: "💰" },
  phone: { name: "Phone", emoji: "📱" },
};

export const categories = Object.keys(categoryInfo) as Category[];

// To add content, add a line here. No other code needs to change.
export const actions: Action[] = [
  // ---------------- Your room (Mushin): most need a piece of furniture
  { id: "cook", label: "Cook egusi", emoji: "🍳", minutes: 60, cost: 0, category: "food", where: "mushin", spot: "home", effect: { hunger: 50, fun: 5 }, skill: { cooking: 0.4 }, boost: "cooking", uses: ["burner"], food: 1, mood: "fullTummy" },
  { id: "snack", label: "Eat from the fridge", emoji: "🧊", minutes: 15, cost: 0, category: "food", where: "mushin", spot: "home", effect: { hunger: 30 }, uses: ["fridge"], power: true, food: 1 },
  { id: "sleep", label: "Sleep on the mattress", emoji: "🛏️", minutes: 480, cost: 0, category: "rest", where: "mushin", spot: "home", effect: { energy: 100 }, asleep: true, uses: ["mattress"], mood: "wellRested" },
  { id: "sleep-bed", label: "Sleep in your bed", emoji: "🛌", minutes: 420, cost: 0, category: "rest", where: "mushin", spot: "home", effect: { energy: 100, fun: 10 }, asleep: true, uses: ["bed"], mood: "wellRested" },
  { id: "nap", label: "Nap", emoji: "💤", minutes: 60, cost: 0, category: "rest", where: "mushin", spot: "home", effect: { energy: 20 }, asleep: true, uses: ["mattress", "bed", "sofa"] },
  { id: "floor-sleep", label: "Sleep on the floor", emoji: "🥱", minutes: 480, cost: 0, category: "rest", where: "mushin", spot: "home", effect: { energy: 70, fun: -10 }, asleep: true, mood: "floorSleeper" },
  { id: "nollywood", label: "Watch Nollywood on your phone", emoji: "📱", minutes: 120, cost: 0, category: "fun", where: "mushin", spot: "home", effect: { fun: 30 } },
  { id: "tv", label: "Watch Nollywood on TV", emoji: "📺", minutes: 90, cost: 0, category: "fun", where: "mushin", spot: "home", effect: { fun: 45 }, uses: ["tv"], power: true },
  { id: "radio", label: "Listen to the radio", emoji: "📻", minutes: 40, cost: 0, category: "fun", where: "mushin", spot: "home", effect: { fun: 20 }, uses: ["radio"] },
  { id: "relax", label: "Sit and relax", emoji: "🪑", minutes: 30, cost: 0, category: "fun", where: "mushin", spot: "home", effect: { fun: 10, energy: 5 }, uses: ["chair", "sofa"] },
  { id: "host", label: "Host friends on your sofa", emoji: "🛋️", minutes: 90, cost: 1_000, category: "fun", where: "mushin", spot: "home", effect: { social: 40, fun: 20 }, uses: ["sofa"], skill: { charisma: 0.2 }, mood: "goodGist" },
  { id: "cool-off", label: "Cool off by the fan", emoji: "🌀", minutes: 20, cost: 0, category: "fun", where: "mushin", spot: "home", effect: { fun: 10, energy: 5 }, uses: ["fan"], power: true },
  { id: "plant", label: "Water the plant", emoji: "🪴", minutes: 10, cost: 0, category: "fun", where: "mushin", spot: "home", effect: { fun: 5 }, uses: ["plant"] },
  { id: "bath", label: "Bucket bath", emoji: "🪣", minutes: 25, cost: 0, category: "care", where: "mushin", spot: "home", effect: { hygiene: 60 }, uses: ["bucket"], mood: "squeaky" },
  { id: "shower", label: "Hot shower", emoji: "🚿", minutes: 15, cost: 0, category: "care", where: "mushin", spot: "home", effect: { hygiene: 100, fun: 5 }, uses: ["shower"], power: true, mood: "squeaky" },
  { id: "toilet", label: "Use the toilet", emoji: "🚽", minutes: 5, cost: 0, category: "care", where: "mushin", spot: "home", effect: { bladder: 100 }, uses: ["toilet"] },
  { id: "practise-speech", label: "Practise a speech in the mirror", emoji: "🪞", minutes: 40, cost: 0, category: "learn", where: "mushin", spot: "home", effect: { fun: 4, energy: -4 }, skill: { charisma: 0.3 }, uses: ["mirror"] },
  { id: "home-workout", label: "Work out with dumbbells", emoji: "🏋🏾", minutes: 45, cost: 0, category: "learn", where: "mushin", spot: "home", effect: { energy: -18, hygiene: -22, fun: 6 }, skill: { fitness: 0.3 }, uses: ["dumbbells"], mood: "gymGlow" },
  { id: "learn-code", label: "Learn to code on the laptop", emoji: "👨🏾‍💻", minutes: 90, cost: 0, category: "learn", where: "mushin", spot: "home", effect: { fun: -4, energy: -8 }, skill: { study: 0.6 }, uses: ["desk"], power: true },
  { id: "remote-gig", label: "Do a freelance gig online", emoji: "💻", minutes: 180, cost: 0, earn: { base: 2_000, per: 1_400, skill: "study" }, category: "money", where: "mushin", spot: "home", effect: { energy: -20, fun: -6 }, skill: { study: 0.3 }, req: { study: 2 }, uses: ["desk"], power: true, mood: "hustleWin" },
  { id: "read-book", label: "Read a book", emoji: "📖", minutes: 60, cost: 0, category: "learn", where: "mushin", spot: "home", effect: { fun: 12 }, skill: { study: 0.2, charisma: 0.1 }, uses: ["bookshelf"] },

  // ---------------- Mama Ronke's Buka (Mushin)
  { id: "amala", label: "Amala & ewedu", emoji: "🥘", minutes: 30, cost: 1_500, category: "food", where: "mushin", spot: "buka", effect: { hunger: 50, fun: 6, bladder: -10 }, mood: "fullTummy" },
  { id: "small-chops", label: "Small chops", emoji: "🍢", minutes: 15, cost: 600, category: "food", where: "mushin", spot: "buka", effect: { hunger: 22 } },
  { id: "mama-gist", label: "Gist with Mama Ronke", emoji: "💬", minutes: 25, cost: 0, category: "fun", where: "mushin", spot: "buka", effect: { social: 22, fun: 8 }, skill: { charisma: 0.1 }, mood: "goodGist" },
  { id: "buka-help", label: "Help in the kitchen", emoji: "🍲", minutes: 120, cost: 0, earn: { base: 1_200, per: 250, skill: "cooking" }, category: "money", where: "mushin", spot: "buka", effect: { energy: -14, hygiene: -12, hunger: 10 }, skill: { cooking: 0.8 } },
  { id: "buka-toilet", label: "Use the back toilet", emoji: "🚻", minutes: 6, cost: 50, category: "care", where: "mushin", spot: "buka", effect: { bladder: 100, hygiene: -3 } },

  // ---------------- Oja Tuntun Market (Mushin)
  { id: "groceries", label: "Buy groceries (5 meal packs)", emoji: "🧺", minutes: 30, cost: 4_000, category: "home", where: "mushin", spot: "market", effect: { social: 5 }, stock: { food: 5 } },
  { id: "haggle", label: "Haggle for fun", emoji: "🗣️", minutes: 40, cost: 0, category: "fun", where: "mushin", spot: "market", effect: { fun: 8, social: 10, energy: -4 }, skill: { hustle: 0.2 } },
  { id: "carry-loads", label: "Carry loads for traders", emoji: "📦", minutes: 120, cost: 0, earn: { base: 2_200, per: 200, skill: "fitness" }, category: "money", where: "mushin", spot: "market", effect: { energy: -28, hygiene: -20 }, skill: { fitness: 0.5 } },
  { id: "market-trade", label: "Buy and resell goods", emoji: "🛒", minutes: 180, cost: 2_000, pay: 3_000, category: "money", where: "mushin", spot: "market", effect: { energy: -15, social: 10 }, skill: { hustle: 0.4 }, mood: "hustleWin" },

  // ---------------- Unity Park (Mushin)
  { id: "park-relax", label: "Relax under the trees", emoji: "🌳", minutes: 45, cost: 0, category: "fun", where: "mushin", spot: "park", effect: { fun: 14, energy: 6 } },
  { id: "jog", label: "Jog round the park", emoji: "🏃🏾", minutes: 40, cost: 0, category: "learn", where: "mushin", spot: "park", effect: { energy: -14, hygiene: -15, fun: 6 }, skill: { fitness: 0.25 } },
  { id: "draughts", label: "Play draughts with the old men", emoji: "♟️", minutes: 45, cost: 0, category: "fun", where: "mushin", spot: "park", effect: { social: 20, fun: 12 }, skill: { charisma: 0.1 }, mood: "goodGist" },

  // ---------------- Mushin streets (always open)
  { id: "worship", label: "Go to church or mosque", emoji: "🙏🏾", minutes: 120, cost: 200, category: "fun", where: "mushin", spot: "mushin-street", effect: { social: 30, fun: 10 }, skill: { charisma: 0.2 } },

  // ---------------- Brainbox Tech Hub (Yaba)
  { id: "wifi", label: "Free Wi-Fi and chill", emoji: "📶", minutes: 45, cost: 0, category: "fun", where: "yaba", spot: "hub", effect: { fun: 14 } },
  { id: "bootcamp", label: "Coding class", emoji: "👩🏾‍💻", minutes: 180, cost: 5_000, category: "learn", where: "yaba", spot: "hub", effect: { energy: -15, social: 10 }, skill: { study: 0.9 } },
  { id: "sprint", label: "Freelance sprint", emoji: "⌨️", minutes: 180, cost: 0, earn: { base: 2_500, per: 1_600, skill: "study" }, category: "money", where: "yaba", spot: "hub", effect: { energy: -18, fun: -4, social: 6 }, skill: { study: 0.3 }, req: { study: 2 }, mood: "hustleWin" },
  { id: "meetup", label: "Tech meetup", emoji: "🤝🏾", minutes: 90, cost: 0, category: "fun", where: "yaba", spot: "hub", effect: { social: 28, fun: 10 }, skill: { charisma: 0.35 }, mood: "goodGist" },
  { id: "hub-toilet", label: "Use the toilet", emoji: "🚻", minutes: 6, cost: 0, category: "care", where: "yaba", spot: "hub", effect: { bladder: 100 } },

  // ---------------- Iron Gate Gym (Yaba)
  { id: "gym", label: "Lift weights", emoji: "🏋🏾", minutes: 90, cost: 1_000, category: "learn", where: "yaba", spot: "gym", effect: { energy: -20, hygiene: -25, fun: 10 }, skill: { fitness: 0.5 }, mood: "gymGlow" },
  { id: "aerobics", label: "Group aerobics class", emoji: "🤸🏾", minutes: 60, cost: 1_000, category: "learn", where: "yaba", spot: "gym", effect: { energy: -18, hygiene: -22, social: 18, fun: 10 }, skill: { fitness: 0.4 } },
  { id: "gym-shower", label: "Gym shower", emoji: "🚿", minutes: 15, cost: 200, category: "care", where: "yaba", spot: "gym", effect: { hygiene: 100, bladder: 100 }, mood: "squeaky" },

  // ---------------- Yaba streets (always open)
  { id: "suya", label: "Buy suya", emoji: "🍢", minutes: 20, cost: 1_000, category: "food", where: "yaba", spot: "yaba-street", effect: { hunger: 30, fun: 5 }, mood: "fullTummy" },
  { id: "gist", label: "Gist with friends", emoji: "💬", minutes: 60, cost: 500, category: "fun", where: "yaba", spot: "yaba-street", effect: { social: 40, fun: 10 }, skill: { charisma: 0.15 }, mood: "goodGist" },
  { id: "football", label: "Play street football", emoji: "⚽", minutes: 90, cost: 0, category: "fun", where: "yaba", spot: "yaba-street", effect: { fun: 35, social: 20, energy: -20, hygiene: -20 }, skill: { fitness: 0.3 } },
  { id: "barber", label: "Barber or salon", emoji: "💈", minutes: 60, cost: 1_500, category: "care", where: "yaba", spot: "yaba-street", effect: { hygiene: 30, fun: 10 }, skill: { charisma: 0.1 } },
  { id: "library", label: "Study at the library", emoji: "📖", minutes: 180, cost: 0, category: "learn", where: "yaba", spot: "yaba-street", effect: { energy: -15, fun: -10 }, skill: { study: 0.5 } },

  // ---------------- Sunset Beach (Island)
  { id: "beach", label: "Hang out at the beach", emoji: "🏖️", minutes: 120, cost: 1_000, category: "fun", where: "island", spot: "beach", effect: { fun: 45, social: 30 }, mood: "beachDay" },
  { id: "swim", label: "Swim in the waves", emoji: "🌊", minutes: 45, cost: 0, category: "fun", where: "island", spot: "beach", effect: { fun: 25, energy: -12, hygiene: -8 }, skill: { fitness: 0.25 }, mood: "beachDay" },
  { id: "beach-ball", label: "Beach football", emoji: "🏐", minutes: 60, cost: 0, category: "fun", where: "island", spot: "beach", effect: { fun: 20, social: 22, energy: -18, hygiene: -15 }, skill: { fitness: 0.3 }, mood: "beachDay" },
  { id: "seafood", label: "Grilled fish & cold drink", emoji: "🐟", minutes: 45, cost: 3_500, category: "food", where: "island", spot: "beach", effect: { hunger: 55, fun: 15 }, mood: "fullTummy" },

  // ---------------- The Pulse club (Island)
  { id: "dance", label: "Dance", emoji: "💃🏾", minutes: 90, cost: 2_000, category: "fun", where: "island", spot: "club", effect: { fun: 35, social: 20, energy: -20, hygiene: -10 } },
  { id: "mingle", label: "Mingle at the bar", emoji: "🍸", minutes: 45, cost: 1_500, category: "fun", where: "island", spot: "club", effect: { social: 30, fun: 10 }, skill: { charisma: 0.35 }, mood: "goodGist" },
  { id: "vip", label: "Book a VIP table", emoji: "🍾", minutes: 120, cost: 40_000, category: "fun", where: "island", spot: "club", effect: { fun: 60, social: 40, energy: -15 }, mood: "bigNight" },
  { id: "club-toilet", label: "Queue for the toilet", emoji: "🚻", minutes: 15, cost: 0, category: "care", where: "island", spot: "club", effect: { bladder: 100, fun: -3 } },

  // ---------------- Island streets (always open)
  { id: "hotel-nap", label: "Rent a short-let room for a nap", emoji: "🏨", minutes: 90, cost: 4_000, category: "rest", where: "island", spot: "island-street", effect: { energy: 35, hygiene: 20 }, asleep: true },
  { id: "networking", label: "Attend a networking mixer", emoji: "🥂", minutes: 180, cost: 3_000, category: "fun", where: "island", spot: "island-street", effect: { social: 35, fun: 15, energy: -10 }, skill: { charisma: 0.5, hustle: 0.2 }, mood: "goodGist" },

  // ---------------- Ikeja
  { id: "computer-village", label: "Flip phones for profit", emoji: "📲", minutes: 180, cost: 3_000, pay: 4_500, category: "money", where: "ikeja", spot: "village", effect: { energy: -15, social: 10 }, skill: { hustle: 0.5, study: 0.1 }, mood: "hustleWin" },
  { id: "shawarma", label: "Shawarma at the mall", emoji: "🌯", minutes: 30, cost: 2_000, category: "food", where: "ikeja", spot: "mall", effect: { hunger: 40, fun: 10 }, mood: "fullTummy" },
  { id: "mall", label: "Window-shop at the mall", emoji: "🛍️", minutes: 120, cost: 500, category: "fun", where: "ikeja", spot: "mall", effect: { fun: 35, social: 15 } },

  // ---------------- Fast food (quick, filling, but dearer than cooking)
  { id: "mamaput-rice", label: "Rice and stew takeaway", emoji: "🍛", minutes: 15, cost: 1_200, category: "food", where: "mushin", spot: "mamaput", effect: { hunger: 40 }, mood: "fullTummy" },
  { id: "mamaput-bole", label: "Bole and fish", emoji: "🐟", minutes: 15, cost: 1_000, category: "food", where: "mushin", spot: "mamaput", effect: { hunger: 35, fun: 4 } },
  { id: "jollof-combo", label: "Jollof and chicken combo", emoji: "🍗", minutes: 25, cost: 3_000, category: "food", where: "yaba", spot: "jollof", effect: { hunger: 60, fun: 8 }, mood: "fullTummy" },
  { id: "meat-pie", label: "Meat pie and Chapman", emoji: "🥧", minutes: 15, cost: 1_500, category: "food", where: "yaba", spot: "jollof", effect: { hunger: 25, fun: 8 } },
  { id: "burger-meal", label: "Burger, chips and a drink", emoji: "🍔", minutes: 25, cost: 4_500, category: "food", where: "island", spot: "bigbite", effect: { hunger: 60, fun: 12 }, mood: "fullTummy" },
  { id: "milkshake", label: "Milkshake with friends", emoji: "🥤", minutes: 30, cost: 2_000, category: "fun", where: "island", spot: "bigbite", effect: { fun: 15, social: 15, hunger: 10 }, mood: "goodGist" },
  { id: "chicken-bucket", label: "Share a chicken bucket", emoji: "🍗", minutes: 40, cost: 6_000, category: "food", where: "ikeja", spot: "crunchy", effect: { hunger: 70, social: 15, fun: 10 }, mood: "fullTummy" },
  { id: "chicken-chips", label: "Chicken and chips", emoji: "🍟", minutes: 20, cost: 3_500, category: "food", where: "ikeja", spot: "crunchy", effect: { hunger: 50, fun: 6 } },

  // ---------------- Your phone and the roadside: anywhere
  { id: "call-mummy", label: "Call Mummy", emoji: "👵🏾", minutes: 20, cost: 0, category: "phone", where: "any", spot: "phone", effect: { social: 25, fun: 5 }, mood: "mummyLove" },
  { id: "scroll", label: "Scroll social media", emoji: "🤳🏾", minutes: 30, cost: 0, category: "phone", where: "any", spot: "phone", effect: { fun: 12, social: 6, energy: -2 } },
  { id: "whatsapp-hustle", label: "WhatsApp hustle (sell for others)", emoji: "💬", minutes: 60, cost: 0, earn: { base: 300, per: 350, skill: "hustle" }, category: "money", where: "any", spot: "phone", effect: { fun: -4 }, skill: { hustle: 0.3 } },
  { id: "phone-course", label: "Online course on your phone", emoji: "🎓", minutes: 120, cost: 1_000, category: "learn", where: "any", spot: "phone", effect: { energy: -10, fun: -5 }, skill: { study: 0.3 } },
  { id: "order-groceries", label: "Order groceries delivered (5 packs)", emoji: "🛵", minutes: 5, cost: 5_200, category: "home", where: "any", spot: "phone", effect: {}, stock: { food: 5 } },
  { id: "chopnow-jollof", label: "ChopNow: order jollof delivered", emoji: "🛵", minutes: 40, cost: 4_000, category: "food", where: "any", spot: "phone", effect: { hunger: 55, fun: 5 }, mood: "fullTummy" },
  { id: "chopnow-pizza", label: "ChopNow: order pizza for the gang", emoji: "🍕", minutes: 45, cost: 8_000, category: "food", where: "any", spot: "phone", effect: { hunger: 50, social: 20, fun: 15 }, mood: "goodGist" },
  { id: "fuel", label: "Buy generator fuel (5 litres)", emoji: "⛽", minutes: 15, cost: 5_000, category: "home", where: "any", spot: "phone", effect: {}, stock: { fuel: 5 } },
  { id: "puff-puff", label: "Buy puff-puff from a hawker", emoji: "🍩", minutes: 5, cost: 300, category: "food", where: "any", spot: "phone", effect: { hunger: 15 } },
  { id: "pure-water", label: "Buy pure water", emoji: "💧", minutes: 2, cost: 50, category: "food", where: "any", spot: "phone", effect: { hunger: 3, bladder: -5 } },
  { id: "public-toilet", label: "Public toilet", emoji: "🚻", minutes: 5, cost: 100, category: "care", where: "any", spot: "phone", effect: { bladder: 100 } },
  // ----- story places -----
  { id: "family-lunch", label: "Sunday lunch with the family", emoji: "🍲", minutes: 120, cost: 0, category: "food", where: "mushin", spot: "family", effect: { hunger: 45, social: 30, fun: 10 } },
  { id: "help-jide", label: "Help Uncle Jide fix the house", emoji: "🔨", minutes: 120, cost: 0, category: "fun", where: "mushin", spot: "family", effect: { energy: -20, social: 15, hygiene: -10 }, skill: { fitness: 0.2 } },
  { id: "community-clean", label: "Join the street clean-up", emoji: "🧹", minutes: 120, cost: 0, category: "fun", where: "mushin", spot: "mushin-street", effect: { energy: -20, social: 15, hygiene: -15 }, skill: { fitness: 0.2 } },
  { id: "lecture", label: "Sit in on a public lecture", emoji: "🎓", minutes: 120, cost: 0, category: "learn", where: "yaba", spot: "campus", effect: { energy: -10, fun: -5 }, skill: { study: 0.4 } },
  { id: "study-hall", label: "Revise in the study hall", emoji: "📖", minutes: 180, cost: 0, category: "learn", where: "yaba", spot: "campus", effect: { energy: -15, fun: -10 }, skill: { study: 0.6 }, flag: "student" },
  { id: "campus-gist", label: "Eat and gist at the cafeteria", emoji: "🍛", minutes: 45, cost: 800, category: "food", where: "yaba", spot: "campus", effect: { hunger: 30, social: 20, fun: 5 } },
  { id: "visit-patient", label: "Visit a patient", emoji: "💐", minutes: 60, cost: 0, category: "fun", where: "yaba", spot: "hospital", effect: { social: 10, fun: -5 } },
  { id: "volunteer", label: "Volunteer at the outpatient clinic", emoji: "🩹", minutes: 180, cost: 0, category: "learn", where: "yaba", spot: "hospital", effect: { energy: -20, social: 15 }, skill: { charisma: 0.2, study: 0.2 } },
  { id: "ward-round", label: "Join a ward round", emoji: "🩺", minutes: 180, cost: 0, category: "learn", where: "yaba", spot: "hospital", effect: { energy: -20, fun: -5 }, skill: { study: 0.5, charisma: 0.1 }, flag: "medstudent" },
  { id: "tower-network", label: "Network at the lobby café", emoji: "☕", minutes: 60, cost: 2_500, category: "fun", where: "island", spot: "tower", effect: { social: 15, energy: -5 }, skill: { charisma: 0.3, hustle: 0.2 } },
  { id: "biz-class", label: "Business seminar", emoji: "📊", minutes: 120, cost: 5_000, category: "learn", where: "island", spot: "tower", effect: { energy: -10, fun: -5 }, skill: { hustle: 0.6 } },
  { id: "pitch-deck", label: "Pitch to investors", emoji: "📈", minutes: 120, cost: 0, category: "learn", where: "island", spot: "tower", effect: { energy: -15, fun: 5 }, skill: { hustle: 0.4, charisma: 0.4 }, flag: "founder" },
  { id: "legal-clinic", label: "Help at the free legal clinic", emoji: "📝", minutes: 120, cost: 0, category: "learn", where: "island", spot: "chambers", effect: { energy: -10, social: 10 }, skill: { charisma: 0.3, study: 0.2 } },
  { id: "read-cases", label: "Read law reports in the library", emoji: "📚", minutes: 150, cost: 0, category: "learn", where: "island", spot: "chambers", effect: { energy: -10, fun: -8 }, skill: { study: 0.5 }, flag: "lawstudent" },
  { id: "watch-court", label: "Watch from the public gallery", emoji: "👀", minutes: 120, cost: 0, category: "learn", where: "island", spot: "court", effect: { energy: -5, fun: 5 }, skill: { study: 0.3, charisma: 0.1 } },
  { id: "moot", label: "Argue a moot case", emoji: "🗣️", minutes: 120, cost: 0, category: "learn", where: "island", spot: "court", effect: { energy: -15, fun: 5 }, skill: { charisma: 0.5, study: 0.2 }, flag: "lawstudent" },
  { id: "pool", label: "Relax by the pool", emoji: "🏊🏾", minutes: 90, cost: 0, category: "fun", where: "island", spot: "residences", effect: { fun: 35, energy: 10, hygiene: 10 }, mood: "beachDay", flag: "penthouse" },
  { id: "dinner-party", label: "Host a dinner party", emoji: "🥂", minutes: 180, cost: 20_000, category: "fun", where: "island", spot: "residences", effect: { social: 45, fun: 35, hunger: 30 }, mood: "bigNight", flag: "penthouse" },
  { id: "shoot-content", label: "Shoot content for your page", emoji: "🤳🏾", minutes: 90, cost: 0, category: "money", where: "ikeja", spot: "studio", effect: { fun: 15, energy: -10 }, earn: { base: 1_500, per: 500, skill: "charisma" }, skill: { charisma: 0.2 } },
  { id: "record-demo", label: "Record a demo", emoji: "🎙️", minutes: 180, cost: 10_000, category: "learn", where: "ikeja", spot: "studio", effect: { fun: 20, energy: -15 }, skill: { charisma: 0.5 } },
  { id: "jam", label: "Jam with the band", emoji: "🎸", minutes: 120, cost: 0, category: "fun", where: "ikeja", spot: "studio", effect: { fun: 30, social: 20, energy: -10 }, skill: { charisma: 0.3 }, flag: "artist" },
  { id: "attend-event", label: "Attend an event", emoji: "🎉", minutes: 180, cost: 3_000, category: "fun", where: "ikeja", spot: "pavilion", effect: { fun: 30, social: 30, energy: -10, hunger: 20 } },
  { id: "usher", label: "Work as an event usher", emoji: "🎀", minutes: 240, cost: 0, pay: 6_000, category: "money", where: "ikeja", spot: "pavilion", effect: { energy: -30, social: 10, hunger: 10 }, skill: { charisma: 0.1 } },
  { id: "host-show", label: "Host a show", emoji: "🎤", minutes: 180, cost: 0, category: "money", where: "ikeja", spot: "pavilion", effect: { energy: -30, fun: 20, social: 20 }, earn: { base: 8_000, per: 2_000, skill: "charisma" }, skill: { charisma: 0.3 }, flag: "artist" },
];

export const actionById = (id: string) => actions.find(a => a.id === id);

/** Actions you can do with a piece of furniture. */
export const actionsFor = (type: FurnitureType) => actions.filter(a => a.uses?.includes(type));

/** Actions at one place. */
export const actionsAt = (spot: SpotId) => actions.filter(a => a.spot === spot);
