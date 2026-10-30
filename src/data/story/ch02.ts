// Chapter 2 — Finding Your Feet (missions 11–20). Rent, a promotion, family duty,
// and the five people who will each show you a different future.

import type { StoryMission } from "./types";

export const ch02: StoryMission[] = [
  {
    id: "rent", ch: 2, emoji: "🏠", title: "Pay your rent", place: "home", cast: ["landlord"],
    intro: "Seven days go fast in Lagos. Baba Landlord doesn't knock on doors, he just stands in the compound and clears his throat very loudly.",
    goal: "Have ₦15,000 ready when rent day comes.",
    tasks: [{ total: "rentPaid", n: 1 }],
    steps: [
      "The top bar shows \"Rent in X days\". Rent comes out by itself on rent day.",
      "Keep at least ₦15,000 by then. Work and hustle to get it.",
      "Short? You'll owe the landlord. Tap Pay on the red bar to clear it, or you'll be evicted next rent day.",
    ],
    tab: "work",
    lines: [
      { who: "landlord", text: "Rent day, and you paid without me chasing you. You're one of the few." },
      { who: "landlord", if: "promise_rent", text: "You kept your promise. In Lagos, a person who keeps promises is rarer than constant light." },
      { who: "you", text: "Sir, while you're here... the roof leaks over my mattress when it rains." },
    ],
    choices: [
      { label: "Ask him politely to fix the roof", result: "\"I'll send the carpenter.\" Three days later, he actually does.", fx: { bond: { landlord: 4 }, flag: "roof_fixed" } },
      { label: "Fix it yourself with a nylon sheet", result: "It's not pretty, but it's dry. Baba Landlord is impressed you didn't complain.", fx: { bond: { landlord: 6 }, skill: { fitness: 0.1 } } },
    ],
    reward: { money: 2_000, xp: 100, rep: 1 },
  },
  {
    id: "c2-fees", ch: 2, emoji: "📝", title: "Kunle's exam fees", place: "phone", cast: ["mummy", "kunle"],
    intro: "Mummy calls, worried. Kunle finished secondary school, but his registration for the university entrance exam (JAMB) isn't paid, and the portal closes soon.",
    goal: "Call Mummy and decide how to help.",
    tasks: [{ do: "call-mummy" }],
    lines: [
      { who: "mummy", text: "The boy reads day and night. If he misses this exam, it's another full year at home." },
      { who: "kunle", text: "Cousin, I don't want to beg. I'll pay you back when I start earning, I swear." },
      { who: "you", text: "Let me think about what I can do." },
    ],
    choices: [
      { label: "Pay the full ₦8,000 for Kunle's registration", result: "Kunle sends ten voice notes of thanks. Mummy prays for you in three languages.", fx: { cost: 8_000, bond: { kunle: 15, mummy: 10 }, rep: 2, flag: "paid_kunle" } },
      { label: "Send ₦3,000 and promise the rest soon", result: "It's not enough yet, but it's something. Kunle starts washing cars to make up the rest.", fx: { cost: 3_000, bond: { kunle: 6, mummy: 4 }, flag: "half_kunle" } },
      { label: "Tell Mummy to ask Uncle Jide instead", result: "There's a long silence. \"I'll ask him,\" Mummy says. You feel the distance on the line.", fx: { bond: { mummy: -5, kunle: -5 }, flag: "jide_asked" } },
    ],
    reward: { xp: 100 },
  },
  {
    id: "c2-ajo", ch: 2, emoji: "🤝🏾", title: "The ajo", place: "market", cast: ["funke"],
    intro: "Aunty Funke runs an ajo: twelve traders each put the same amount in every week, and each week one person takes it all home. No bank, no interest, only trust.",
    goal: "Trade at the market twice and talk to Aunty Funke.",
    tasks: [{ do: "market-trade|haggle", n: 2 }],
    lines: [
      { who: "funke", text: "In the ajo, your turn comes once. On that day, you have enough money to do something big." },
      { who: "funke", text: "But if one person runs away with the money, everybody suffers. So I only invite people I trust." },
      { who: "funke", if: "funke_friend", text: "And you, I trust. You greeted me well that first day." },
    ],
    choices: [
      { label: "Join the ajo with ₦5,000 a week", result: "Aunty Funke writes your name in her old exercise book. \"Your turn will come.\"", fx: { cost: 5_000, bond: { funke: 8 }, flag: "ajo" } },
      { label: "Keep your savings in the bank app instead", result: "\"Modern people,\" she sighs. \"Fine. But the bank won't bring you pepper soup when you're sick.\"", fx: { skill: { hustle: 0.2 }, flag: "bank_saver" } },
    ],
    reward: { money: 1_500, xp: 100 },
  },
  {
    id: "promotion", ch: 2, emoji: "🎉", title: "Get promoted", place: "yaba-street", cast: ["boss"],
    intro: "Mr Okon has been watching. \"Work hard, learn the skill, and I'll put your name forward,\" he said on your first day. Time to make him keep his word.",
    goal: "Earn your first promotion.",
    tasks: [{ total: "promotions", n: 1 }],
    steps: [
      "Tap 💼 Jobs to see what your next promotion needs: a number of shifts and a skill level.",
      "Keep working shifts.",
      "Train the skill it asks for (look for 📈 in 📍 Places).",
    ],
    tab: "work",
    lines: [
      { who: "boss", text: "Congratulations. New title, small raise, bigger headache." },
      { who: "boss", if: "hard_worker", text: "I knew from the first week. You stayed when others ran home." },
      { who: "you", text: "Thank you, sir. I won't let you down." },
    ],
    choices: [
      { label: "Treat your co-workers to suya", result: "The whole team cheers. Next time you need a favour, everyone remembers the suya.", fx: { cost: 3_000, rep: 3, mood: "goodGist" } },
      { label: "Put the raise straight into savings", result: "Quiet celebration: you watch the number in your account grow. It feels good.", fx: { flag: "saver", skill: { hustle: 0.1 } } },
    ],
    reward: { money: 5_000, xp: 150, rep: 1 },
  },
  {
    id: "c2-class", ch: 2, emoji: "🎓", title: "Night class", place: "campus", cast: ["adewale", "chiamaka"],
    intro: "Lagoon University in Yaba runs free public lectures. Tonight Prof. Adewale is speaking on \"Lagos: City of a Thousand Hustles\". The hall is packed.",
    goal: "Go to Lagoon University and sit in on a public lecture.",
    tasks: [{ do: "lecture" }],
    lines: [
      { who: "adewale", text: "Every great Lagos story starts with someone who refused to stay small. Education is one road. It is not the only road. But it is a good one." },
      { who: "chiamaka", text: "Hi! I'm Chiamaka. I come every week. Do you want to study together sometimes?" },
      { who: "you", text: "I'd like that. I need someone to keep me serious." },
    ],
    choices: [
      { label: "Swap numbers with Chiamaka", result: "She sends you a list of free online courses before you even get home.", fx: { flag: "chiamaka_friend", skill: { study: 0.2 } } },
      { label: "Ask Prof. Adewale about admission", result: "\"Come to my office hours. Bring your results and your questions.\"", fx: { flag: "asked_admission", skill: { study: 0.3 } } },
    ],
    reward: { money: 2_000, xp: 120 },
  },
  {
    id: "c2-clinic", ch: 2, emoji: "🏥", title: "The clinic", place: "hospital", cast: ["tunde", "ngozi"],
    intro: "Tunde twisted his ankle playing street football. At Mainland General the queue is long and the nurses are tired, but one doctor moves like she has ten hands.",
    goal: "Take Tunde to Mainland General Hospital in Yaba and stay with him.",
    tasks: [{ do: "visit-patient" }],
    lines: [
      { who: "ngozi", text: "Sprain, not a fracture. Ice, rest, and no football for two weeks. Two weeks, Tunde. I'll know." },
      { who: "tunde", text: "Doctor, one small match won't..." },
      { who: "ngozi", text: "No. And you, you stayed with him the whole time. This place needs more people like that." },
    ],
    choices: [
      { label: "Ask her what it takes to become a doctor", result: "\"Six years of medical school, a year of house job, a year of service, then years more. It's long. It's worth it.\"", fx: { flag: "ngozi_met", skill: { study: 0.2 } } },
      { label: "Offer to volunteer at the clinic on weekends", result: "She hands you a form and a pen. \"Saturdays, eight o'clock. Don't be late.\"", fx: { flag: ["ngozi_met", "volunteer"], rep: 2, bond: { tunde: 5 } } },
    ],
    reward: { money: 2_000, xp: 120 },
  },
  {
    id: "c2-tenancy", ch: 2, emoji: "📜", title: "Notice to quit", place: "chambers", cast: ["emeka", "landlord"],
    intro: "An agent tells the family next door to leave by Friday or he'll throw their things outside. They have nowhere to go. Someone mentions a free legal clinic on the Island.",
    goal: "Go to Nwosu & Partners on the Island and help at the free legal clinic.",
    tasks: [{ do: "legal-clinic" }],
    lines: [
      { who: "emeka", text: "In Lagos, nobody can throw a tenant out without proper notice and a court order. Breaking down doors is not the law. It's lawlessness." },
      { who: "emeka", text: "Write a letter, keep copies of every receipt, and if he comes back, the family should not fight. They should call us." },
      { who: "landlord", text: "Even I know you can't just throw people out. That agent is spoiling our name." },
    ],
    choices: [
      { label: "Help the family write their reply letter", result: "The agent reads the letter, goes quiet, and stops coming. The family brings you a plate of jollof.", fx: { flag: "emeka_met", rep: 3, skill: { charisma: 0.2 } } },
      { label: "Ask Barrister Emeka how to become a lawyer", result: "\"Five years for a law degree, a year at Law School, then you're called to the Bar. Bring your brain and your patience.\"", fx: { flag: "emeka_met", skill: { study: 0.3 } } },
    ],
    reward: { money: 2_500, xp: 130, rep: 1 },
  },
  {
    id: "c2-studio", ch: 2, emoji: "🎬", title: "Lights, camera", place: "studio", cast: ["kola", "tunde"],
    intro: "Tunde's cousin is K-Wave, a producer at Afrowave Studios in Ikeja. He's shooting a music video today and needs extras with energy.",
    goal: "Go to Afrowave Studios in Ikeja and shoot some content.",
    tasks: [{ do: "shoot-content" }],
    lines: [
      { who: "kola", text: "Energy! More energy! You there, you have a face for the camera." },
      { who: "tunde", text: "I told you my cousin is a big man. Look at all these lights!" },
      { who: "kola", text: "Music and film are business too. The talent is the start. Discipline is the rest." },
    ],
    choices: [
      { label: "Freestyle a verse on the mic", result: "The room goes quiet, then everyone shouts. K-Wave writes down your number.", fx: { flag: "kola_met", skill: { charisma: 0.3 } }, chance: { odds: 0.5, win: "The room goes wild. K-Wave posts a clip and it gets ten thousand views overnight.", winFx: { flag: "kola_met", rep: 3, skill: { charisma: 0.3 } } } },
      { label: "Help with the lights and cables", result: "\"Someone who actually works! Come back anytime.\" You learn how a shoot really runs.", fx: { flag: "kola_met", skill: { hustle: 0.2 } } },
    ],
    reward: { money: 2_000, xp: 120 },
  },
  {
    id: "c2-cole", ch: 2, emoji: "🚙", title: "Chief Bisola", place: "market", cast: ["bisola", "funke"],
    intro: "A big SUV stops at Oja Tuntun. Chief Bisola Cole, who supplies half the market with rice and oil, started right here, at Aunty Funke's corner, with one basin of tomatoes.",
    goal: "Trade at the market and get close to Aunty Funke.",
    tasks: [{ do: "market-trade", n: 2 }, { bond: "funke", min: 30 }],
    lines: [
      { who: "funke", text: "This one counts money faster than my calculator, Chief." },
      { who: "bisola", text: "Business is simple. Buy well, sell well, keep records, keep promises. Most people forget the last two." },
      { who: "you", text: "How did you go from a basin to all this?" },
      { who: "bisola", text: "One customer at a time, for thirty years. And I never once cheated anybody on the scale." },
    ],
    choices: [
      { label: "Ask for advice on starting small", result: "\"Start with what people buy every day, not what you think is fancy.\" You write it on your hand.", fx: { flag: "bisola_met", skill: { hustle: 0.3 } } },
      { label: "Offer to help at her warehouse on Saturdays", result: "She raises an eyebrow, then smiles. \"Six o'clock. If you're late, don't come.\"", fx: { flag: ["bisola_met", "warehouse"], rep: 2 } },
    ],
    reward: { money: 3_000, xp: 130 },
  },
  {
    id: "c2-hub", ch: 2, emoji: "⌨️", title: "Ify's challenge", place: "hub", cast: ["ify"],
    intro: "Ify is running a free beginners' coding class at Brainbox. \"Build a simple web page by Friday,\" she tells the class, \"and I'll show the best one on the big screen.\"",
    goal: "Take coding classes at Brainbox and reach Study level 2.",
    tasks: [{ do: "bootcamp|learn-code", n: 2 }, { skill: "study", min: 2 }],
    lines: [
      { who: "ify", text: "It works! It's ugly, but it works. Every product in the world started exactly like this." },
      { who: "ify", if: "ify_code", text: "You actually came to the Saturday class. Most people just talk." },
      { who: "you", text: "Is it really possible to get a tech job from here?" },
      { who: "ify", text: "Half the people in this room will. The other half will give up in two weeks." },
    ],
    choices: [
      { label: "Sign up for the next hackathon", result: "\"Good. You'll lose. Then you'll learn. Then you'll win.\"", fx: { flag: ["ify_met", "hackathon"], bond: { ify: 6 } } },
      { label: "Ask what tech jobs pay", result: "She tells you. You go home and study for three hours straight.", fx: { flag: "ify_met", skill: { study: 0.3 } } },
    ],
    reward: { money: 3_000, xp: 140 },
  },
];
