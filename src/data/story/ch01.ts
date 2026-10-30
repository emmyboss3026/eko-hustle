// Chapter 1 — Humble Beginnings (missions 1–10). Everyone plays these.
// They teach the game step by step (the `steps`), and each ends with a small scene and a choice.

import type { StoryMission } from "./types";

export const ch01: StoryMission[] = [
  {
    id: "bath", ch: 1, emoji: "🪣", title: "Freshen up", place: "home", cast: ["landlord"],
    intro: "You step off the bus from Abeokuta with one bag and Mummy's prayers. Baba Landlord hands you the key to a small room in Mushin and looks you up and down.",
    goal: "Take a bucket bath at home.",
    tasks: [{ do: "bath|shower|gym-shower" }],
    steps: [
      "Be at home in Mushin: your flat fills the screen.",
      "Tap the blue bucket in the bathroom (top right of the flat). Or tap 👉 Show me.",
      "Tap 🪣 Bucket bath.",
    ],
    tab: "home", furniture: "bucket",
    lines: [
      { who: "landlord", text: "Welcome, my pikin. Water runs in the morning, NEPA does as it likes, and rent is every seven days." },
      { who: "you", text: "Thank you, sir. I came to Lagos to make it." },
      { who: "landlord", text: "Everybody came to make it. Keep your room clean and your rent ready, and we will be friends." },
    ],
    choices: [
      { label: "Promise you'll never be late with rent", result: "Baba Landlord nods slowly. \"We'll see.\" But he's smiling.", fx: { bond: { landlord: 5 }, flag: "promise_rent" } },
      { label: "Ask if rent can be paid monthly instead", result: "He laughs until he coughs. \"This is Lagos!\" Still, he likes that you asked.", fx: { skill: { charisma: 0.1 } } },
    ],
    reward: { money: 500, xp: 50 },
  },
  {
    id: "cook", ch: 1, emoji: "🍳", title: "Cook your first meal", place: "home", cast: ["mummy"],
    intro: "Your phone rings before you've unpacked. It's Mummy. Buka food every day will finish your money; your gas burner and three meal packs are waiting.",
    goal: "Cook egusi on your gas burner.",
    tasks: [{ do: "cook" }],
    steps: [
      "At home, tap the gas burner in the kitchen (top left of the flat). Or tap 👉 Show me.",
      "Tap 🍳 Cook egusi. It uses 1 meal pack (you start with 3).",
    ],
    tab: "home", furniture: "burner",
    lines: [
      { who: "mummy", text: "Have you eaten? Don't let Lagos food finish your money." },
      { who: "you", text: "I'm cooking egusi right now, Ma. It smells like home." },
      { who: "mummy", text: "That's my child. And greet your landlord well. Respect opens doors." },
    ],
    choices: [
      { label: "Promise to call her every week", result: "\"Every week. I'm counting,\" she says, and you know she is.", fx: { bond: { mummy: 6 }, flag: "call_weekly" } },
      { label: "Make her laugh about your noisy neighbours", result: "She laughs so hard she has to sit down. You feel lighter.", fx: { bond: { mummy: 3 }, mood: "goodGist" } },
    ],
    reward: { money: 500, xp: 50 },
  },
  {
    id: "first-naira", ch: 1, emoji: "💰", title: "Make your first naira", place: "phone", cast: ["tunde"],
    intro: "Tunde from the next street has a phone full of customers and a mouth full of ideas. \"Lagos doesn't wait for anybody,\" he says, scrolling through orders.",
    goal: "Earn money from a side hustle.",
    tasks: [{ count: "earned", n: 1 }],
    steps: [
      "Tap 📍 Places at the bottom of the screen.",
      "Scroll down to 📱 Your phone.",
      "Tap 💬 WhatsApp hustle. Buttons that earn money have a 💰 tag.",
    ],
    tab: "do", hint: "phone",
    lines: [
      { who: "tunde", text: "See? I sell anything on WhatsApp: shoes, perfume, phone cases. Small profit, every day." },
      { who: "tunde", text: "Or... my guy has a forex app that doubles your money in one week. Guaranteed." },
      { who: "you", text: "Doubles it? In one week?" },
    ],
    choices: [
      { label: "Stick to honest WhatsApp sales", result: "Tunde shrugs. \"Slow and steady. I respect it.\" You make two more sales before dark.", fx: { skill: { hustle: 0.2 }, bond: { tunde: 3 }, flag: "honest_start" } },
      { label: "Put ₦2,000 into the forex app", result: "Tunde's guy says your money is \"working\". The app is very shiny. You hope it's real.", fx: { cost: 2_000, flag: "forex_scam" } },
    ],
    reward: { money: 1_000, xp: 60 },
  },
  {
    id: "groceries", ch: 1, emoji: "🧺", title: "Fill the kitchen", place: "market", cast: ["funke"],
    intro: "Oja Tuntun Market wakes up before the sun. Aunty Funke has sold foodstuff from the same corner for twenty years, and she knows a new face when she sees one.",
    goal: "Buy groceries so you can keep cooking.",
    tasks: [{ do: "groceries|order-groceries" }],
    steps: [
      "Tap 📍 Places at the bottom.",
      "Find 🧺 Oja Tuntun Market (open 06:00–19:00).",
      "Tap 🧺 Buy groceries. Too late? Order delivery from 📱 Your phone instead (it costs more).",
    ],
    tab: "do", hint: "market",
    lines: [
      { who: "funke", text: "Fresh tomatoes, pepper, rice! For you, special price." },
      { who: "you", text: "Aunty, is this the special price or the Lagos price?" },
      { who: "funke", text: "Ehen! This one has sense. Come, let me show you how we do it here." },
    ],
    choices: [
      { label: "Haggle hard", result: "You get a discount and a long lecture about young people today.", fx: { money: 500, skill: { hustle: 0.2 }, bond: { funke: -2 } } },
      { label: "Pay her price and greet her properly", result: "\"Your mother trained you well.\" She adds two extra tomatoes and remembers your name.", fx: { bond: { funke: 8 }, flag: "funke_friend" } },
    ],
    reward: { money: 500, xp: 50 },
  },
  {
    id: "job", ch: 1, emoji: "📋", title: "Get a job", place: "yaba-street", cast: ["tunde"],
    intro: "Side hustles alone won't pay rent. Yaba is full of signs: POS attendant wanted, riders wanted, crew wanted at Jollof Junction.",
    goal: "Apply for any job.",
    tasks: [{ anyJob: true }],
    steps: [
      "Tap 💼 Jobs at the bottom.",
      "Pick a job that doesn't show 🔒. POS business is the easiest start.",
      "Tap Apply.",
    ],
    tab: "work",
    lines: [
      { who: "you", text: "I need steady money, Tunde. Something every week." },
      { who: "tunde", text: "Start where they'll take you. Nobody in Lagos starts at the top. Not even the big men." },
    ],
    choices: [
      { label: "Any honest work is a start", result: "You walk in with your head high. The first day is hard, but it's yours.", fx: { skill: { charisma: 0.1 }, flag: "humble" } },
      { label: "Take it, but start studying for something bigger", result: "You buy a second-hand notebook on the way home. Plans go in the back pages.", fx: { skill: { study: 0.3 }, flag: "ambitious" } },
    ],
    reward: { money: 1_000, xp: 60 },
  },
  {
    id: "ride", ch: 1, emoji: "🚌", title: "Take a ride", place: "mushin-street", cast: ["conductor"],
    intro: "Lagos is big and the go-slow is bigger. Danfo, keke, okada or your own two legs: every ride has a price, in naira or in sweat.",
    goal: "Travel to another part of Lagos.",
    tasks: [{ count: "travel|walk", n: 1 }],
    steps: [
      "Tap 🚌 Travel at the bottom.",
      "Pick where to go. POS and okada jobs are in Yaba.",
      "Tap a ride: 🚌 Danfo is cheap, 🏍️ Okada is fast, 🚶 Trek is free but slow.",
    ],
    tab: "go",
    lines: [
      { who: "conductor", text: "Yaba! Yaba! Enter with your change o, no big notes this morning!" },
      { who: "you", text: "I have exact change. Can I get a seat by the window?" },
      { who: "conductor", text: "Window? My friend, enter first. Lagos will teach you." },
    ],
    choices: [
      { label: "Squeeze in and enjoy the ride", result: "You learn the ancient art of sitting on a quarter of a seat. The city rolls past the window.", fx: { mood: "goodGist" } },
      { label: "Argue about the fare", result: "You win back ₦50 and lose ten minutes. The whole bus has an opinion.", fx: { money: 50, skill: { charisma: 0.1 } } },
    ],
    reward: { money: 500, xp: 40 },
  },
  {
    id: "shift", ch: 1, emoji: "💼", title: "Work your first shift", place: "yaba-street", cast: ["boss"],
    intro: "Your new supervisor, Mr Okon, has worked here for fifteen years and has never once been late. He expects the same from you.",
    goal: "Go to your job and work one shift.",
    tasks: [{ count: "work", n: 1 }],
    steps: [
      "Tap 💼 Jobs to see where your job is.",
      "Go there with 🚌 Travel if you're not there yet.",
      "Tap the big 💼 Go to work button. You need ⚡ Energy above 15, so sleep first if you're tired.",
    ],
    tab: "work",
    lines: [
      { who: "boss", text: "You came on time. Good. Here, time is money and money is time." },
      { who: "you", text: "Where should I start, sir?" },
      { who: "boss", text: "Watch, learn, and don't touch the cash box until I say so." },
    ],
    choices: [
      { label: "Stay late to learn more", result: "Mr Okon notices. \"This one is serious.\" Your feet hurt, but your head is full.", fx: { skill: { hustle: 0.2, charisma: 0.1 }, flag: "hard_worker" } },
      { label: "Leave on time and rest well", result: "You sleep like a baby. Tomorrow you'll be sharp.", fx: { mood: "wellRested" } },
    ],
    reward: { money: 1_500, xp: 70 },
  },
  {
    id: "streets", ch: 1, emoji: "🚶🏾", title: "Walk the streets", place: "park", cast: ["femi"],
    intro: "You only really know a street when you've walked it. Under the trees of Unity Park, old men slam draughts pieces like thunder.",
    goal: "Walk around town in 3D and go into a place.",
    tasks: [{ count: "enter", n: 1 }],
    steps: [
      "Tap the 🚶🏾 Walk outside button (bottom right).",
      "Walk with the thumbstick or arrow keys, or just tap a building. 📍 Where to? walks you there.",
      "At a door, tap 🚪 Go into…",
    ],
    tab: "go",
    lines: [
      { who: "femi", text: "You walk like someone looking for something. Sit. Play one game with an old man." },
      { who: "you", text: "I'm not very good, Baba." },
      { who: "femi", text: "Good. Then you can still learn. The ones who think they're good, they've stopped." },
    ],
    choices: [
      { label: "Play draughts with Baba Femi", result: "He beats you in eleven moves and explains every one. You'll be back.", fx: { skill: { charisma: 0.1, study: 0.1 }, flag: "femi_friend" } },
      { label: "Thank him and keep exploring", result: "\"Go on then. The park will be here.\" You find a suya spot you'll never forget.", fx: { mood: "goodGist" } },
    ],
    reward: { money: 1_000, xp: 60 },
  },
  {
    id: "skill", ch: 1, emoji: "📈", title: "Learn a skill", place: "hub", cast: ["ify"],
    intro: "At Brainbox Tech Hub you meet Ify, a developer who started on a borrowed laptop and now builds apps for banks. She gives free advice and no excuses.",
    goal: "Reach level 1 in any skill.",
    tasks: [{ anySkill: 1 }],
    steps: [
      "Tap 📍 Places and look for the 📈 tag: those actions train a skill.",
      "Good starters: 📖 Study at the library (Yaba), 🏃🏾 Jog round the park (Mushin), 🍲 Help in the kitchen (Buka).",
      "Check your levels in 👤 Me.",
    ],
    tab: "do",
    lines: [
      { who: "ify", text: "Skills are the only thing nobody can take from you. Not the landlord, not NEPA, not anybody." },
      { who: "you", text: "How did you start?" },
      { who: "ify", text: "One hour every night after work, for two years. Boring, but it works." },
    ],
    choices: [
      { label: "Ask Ify to teach you to code one day", result: "\"Come to my Saturday class. Bring a notebook and patience.\"", fx: { bond: { ify: 6 }, flag: "ify_code" } },
      { label: "Ask how she got her first job", result: "\"I fixed a bank's website for free. Then they paid me to fix the rest.\"", fx: { bond: { ify: 3 }, skill: { charisma: 0.1 } } },
    ],
    reward: { money: 1_500, xp: 70 },
  },
  {
    id: "furniture", ch: 1, emoji: "🛒", title: "Make it home", place: "home", cast: ["kunle"],
    intro: "Your cousin Kunle visits on Sunday, looks around your room and laughs. \"Cousin, this place echoes!\"",
    goal: "Buy a piece of furniture.",
    tasks: [{ count: "buy", n: 1 }],
    steps: [
      "Be at home in Mushin and tap 🛒 Shop at the bottom.",
      "Pick something. 📻 Radio (₦8,000) is cheap.",
      "Tap the floor where it should go, then tap Buy.",
    ],
    tab: "home",
    lines: [
      { who: "kunle", text: "You need at least something. A radio, a chair, anything. Even a plant!" },
      { who: "you", text: "Rent first, Kunle. Then comfort." },
      { who: "kunle", text: "Wise. But a man can't sit on wisdom." },
    ],
    choices: [
      { label: "Buy only what you need", result: "Kunle shakes his head, but he respects it. Your room looks a little more like yours.", fx: { flag: "frugal" } },
      { label: "Treat Kunle to small chops while you're out", result: "He eats like he hasn't seen food in a week, and tells you all the family gist.", fx: { cost: 1_500, bond: { kunle: 8 } } },
    ],
    reward: { money: 2_000, xp: 80 },
  },
];
