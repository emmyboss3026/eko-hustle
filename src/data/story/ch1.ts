// Chapter 1 — Humble Beginnings (missions 1-10). Mushin: a rented flat, small money, first people.

import type { StoryMission } from "./types";

export const ch1: StoryMission[] = [
  {
    id: "s01-keys", chapter: 1, n: 1, emoji: "🔑", title: "Keys in Your Hand", place: "Your flat, Mushin",
    who: ["Mr Bakare (landlord)"],
    intro: "The keys are still warm from Mr Bakare's pocket. One room, one burner, a bucket that has seen things. It is yours for now, and rent is due every seventh day.",
    dialogue: [
      ["Mr Bakare", "Rent is ₦15,000 on the seventh day. No story, no 'my uncle is sending it'."],
      ["You", "Understood, sir. Thank you for the room."],
      ["Mr Bakare", "The tap drips at night. Everybody's tap drips. Settle in."],
    ],
    tasks: [{ text: "Cook a first pot in your kitchen corner", cond: { do: "cook" } }],
    choice: {
      prompt: "The tap really does drip. How do you handle Mr Bakare on day one?",
      options: [
        { label: "Greet him warmly and say nothing", result: "He nods. A landlord who likes you fixes things faster.", effect: { bond: ["landlord", 8], rep: 1, flag: ["landlord", "friendly"] } },
        { label: "Raise the tap politely, with a deadline", result: "He frowns, then writes it in a notebook. Respect, but no warmth.", effect: { flag: ["landlord", "tense"], skill: { charisma: 0.2 } } },
      ],
    },
    reward: { money: 500 }, next: "Mummy will want to hear your voice.",
  },
  {
    id: "s02-mummy", chapter: 1, n: 2, emoji: "📞", title: "Mummy Calls", place: "Your flat, Mushin",
    who: ["Mummy"],
    intro: "The phone buzzes before you finish washing the pot. It is Mummy, and she can hear when you are lying.",
    dialogue: [
      ["Mummy", "Have you eaten? Don't say 'yes' if the answer is garri."],
      ["You", "I just cooked, Mummy. Egusi."],
      ["Mummy", "Good. Your father started with less. Remember who you are."],
    ],
    requires: [{ done: "s01-keys" }],
    tasks: [{ text: "Take a bucket bath and get ready for the day", cond: { do: "bath" } }],
    choice: {
      prompt: "Mummy asks how things really are.",
      options: [
        { label: "\"I'm fine. Doing well.\" (keep your pride)", result: "She believes half of it. You feel the weight of the other half.", effect: { flag: ["mummy", "proud"], rep: 1 } },
        { label: "\"It's tight. Can you help a little?\"", result: "She sends ₦5,000 and a long blessing. You promise to repay her.", effect: { money: 5_000, bond: ["mummy", 6], flag: ["mummy", "honest"] } },
      ],
    },
    reward: { money: 500 }, next: "Time to earn your first small money.",
  },
  {
    id: "s03-small-money", chapter: 1, n: 3, emoji: "💰", title: "Small Money, Big Pride", place: "Streets of Mushin",
    who: ["Tunde"],
    intro: "Tunde leans on a pole outside the gate. 'Small money is still money,' he says. 'Pure water, loads, a WhatsApp customer. Just start.'",
    dialogue: [
      ["Tunde", "Nobody remembers who started small. Everybody remembers who quit."],
      ["You", "Then I'll start today."],
    ],
    requires: [{ done: "s02-mummy" }],
    tasks: [{ text: "Earn ₦1,500 from side hustles", cond: { do: "earned", n: 1_500 } }],
    days: 4, fail: "The week slipped by. Tunde shrugs: 'Try again, the street is not going anywhere.'",
    choice: {
      prompt: "Your first real earnings are in your pocket.",
      options: [
        { label: "Treat yourself to puff-puff and a cold drink", result: "Warm, sweet, and worth it. You feel like a person again.", effect: { money: -500, mood: "goodGist" } },
        { label: "Keep it all. The first naira stays", result: "You fold it away. Discipline feels heavier than hunger, but it will pay.", effect: { rep: 1, flag: ["saver", "yes"] } },
      ],
    },
    reward: { money: 1_000, skill: { hustle: 0.3 } },
  },
  {
    id: "s04-oja", chapter: 1, n: 4, emoji: "🧺", title: "Oja Tuntun", place: "Oja Tuntun Market, Mushin",
    who: ["Mama Ronke (cook)"],
    intro: "The market is loud: pepper, fish, phone chargers, prayers. Mama Ronke eyes you from behind a mountain of tomatoes. She has the best prices and the sharpest tongue.",
    dialogue: [
      ["Mama Ronke", "Oya, what do you want? Don't touch the tomatoes if you won't buy."],
      ["You", "Mama, I'm buying. Last price?"],
      ["Mama Ronke", "Haha. Last price for a new face is still first price."],
    ],
    requires: [{ done: "s03-small-money" }],
    tasks: [{ text: "Buy groceries at the market", cond: { do: "groceries" } }],
    choice: {
      prompt: "How do you deal with Mama Ronke?",
      options: [
        { label: "Haggle hard, every kobo", result: "You get a good price and a respectful nod. She does not offer you a stool.", effect: { skill: { hustle: 0.4 }, flag: ["market", "hard"] } },
        { label: "Pay what she asks and chat a while", result: "She tells you which stalls to avoid. A regular is worth more than a discount.", effect: { money: -500, bond: ["ronke", 10], flag: ["market", "loyal"] } },
      ],
    },
    reward: { money: 500 },
  },
  {
    id: "s05-gate", chapter: 1, n: 5, emoji: "🗣️", title: "Gist at the Gate", place: "Your compound, Mushin",
    who: ["Funke (neighbour)"],
    intro: "In a compound everybody knows everybody's business. Funke, your neighbour, sets her pot down and decides whether you are friend or trouble.",
    dialogue: [
      ["Funke", "You're the new one in the back room. Do you cook loud? Do you play music?"],
      ["You", "Only when I'm happy."],
      ["Funke", "Good. Be happy quietly."],
    ],
    requires: [{ done: "s04-oja" }],
    tasks: [{ text: "Greet people around your area three times", cond: { do: "greet", n: 3 } }],
    choice: {
      prompt: "Funke is carrying a heavy bucket up the stairs.",
      options: [
        { label: "Take it from her and climb", result: "She says nothing, but leaves you a plate of rice at the door later.", effect: { bond: ["funke", 12], rep: 1, flag: ["neighbour", "helpful"] } },
        { label: "Mind your business", result: "You keep to yourself. The compound keeps notes.", effect: { flag: ["neighbour", "distant"] } },
      ],
    },
    reward: { money: 500, rep: 1 },
  },
  {
    id: "s06-cv", chapter: 1, n: 6, emoji: "📋", title: "CV and Courage", place: "Yaba job boards, via your phone",
    who: ["Kunle (older cousin)"],
    intro: "Kunle reads your CV out loud like a judge. 'This is two lines,' he says. 'Even a danfo conductor writes more.' You are going to apply anyway.",
    dialogue: [
      ["Kunle", "People will ask 'what experience?' and you will say 'I am willing'. Say it with your chest."],
    ],
    requires: [{ done: "s05-gate" }],
    tasks: [{ text: "Apply for a job", cond: { job: true } }],
    days: 6, fail: "Applications unsent, days gone. Kunle texts: 'Move. Today.'",
    choice: {
      prompt: "How do you sell yourself in the interview?",
      options: [
        { label: "Be honest: 'I'm new but I learn fast'", result: "The interviewer likes your directness. Honest people are rarer than skilled ones.", effect: { skill: { charisma: 0.3 }, flag: ["cv", "honest"] } },
        { label: "Stretch it a little: 'I have done this before'", result: "It works today. You will have to live up to it.", effect: { rep: -1, flag: ["cv", "stretch"] } },
      ],
    },
    reward: { money: 1_000 },
  },
  {
    id: "s07-day-one", chapter: 1, n: 7, emoji: "💼", title: "Day One", place: "Your first workplace",
    who: ["Your supervisor"],
    intro: "Shirt pressed with a hot pot, shoes wiped with a tissue. Your supervisor does not smile, but does not frown either. 'Let's see what you are made of.'",
    dialogue: [
      ["Supervisor", "Closing is 6. People who leave at 6:01 explain themselves."],
      ["You", "I'll be here."],
    ],
    requires: [{ done: "s06-cv" }, { job: true }],
    tasks: [{ text: "Work your first shift", cond: { do: "work" } }],
    choice: {
      prompt: "The shift is over and boxes are still stacked in the corner.",
      options: [
        { label: "Stay thirty minutes extra", result: "Your supervisor notices. It is remembered.", effect: { rep: 2, skill: { hustle: 0.2 } } },
        { label: "Leave on time and rest", result: "Rest is also work. You sleep like a stone.", effect: { mood: "wellRested" } },
      ],
    },
    reward: { money: 1_500 },
  },
  {
    id: "s08-rent", chapter: 1, n: 8, emoji: "🏠", title: "Rent Is Coming", place: "Your flat, Mushin",
    who: ["Mr Bakare"],
    intro: "Day seven is circled in your head. Mr Bakare's footsteps are already in your imagination.",
    dialogue: [
      ["Mr Bakare", "Nothing personal. I also pay my own bills. See you on the seventh."],
    ],
    requires: [{ done: "s07-day-one" }, { day: 3 }],
    tasks: [{ text: "Have ₦16,000 ready for rent day", cond: { money: 16_000 } }],
    days: 6, fail: "Rent day came and went with the money not ready. Mr Bakare is patient once. Try again.",
    choice: {
      prompt: "You have the money. What do you tell Mr Bakare?",
      options: [
        { label: "Hand it over early with a thank-you", result: "He raises one eyebrow. In Mushin that is a standing ovation.", effect: { bond: ["landlord", 10], rep: 2 } },
        { label: "Keep it until the seventh like everyone else", result: "Nobody can fault you. The money stays safe a few days longer.", effect: { flag: ["rent", "on-time"] } },
      ],
    },
    reward: { money: 1_000, rep: 1 },
  },
  {
    id: "s09-nepa", chapter: 1, n: 9, emoji: "🔦", title: "NEPA Took the Light", place: "Your flat, Mushin",
    who: ["Funke"],
    intro: "The fan dies mid-turn. The street goes dark house by house like a slow clap. Somewhere a generator coughs awake. Funke knocks: 'You have a torch?'",
    dialogue: [
      ["Funke", "Light will come back. It always comes back. Just never when you expect it."],
    ],
    requires: [{ done: "s08-rent" }, { day: 4 }],
    tasks: [{ text: "Buy a piece of furniture to make the flat yours", cond: { do: "buy" } }],
    choice: {
      prompt: "The flat is hot and dark. What do you do tonight?",
      options: [
        { label: "Sit outside with the neighbours", result: "Stories, suya smoke, a stranger's laugh. The dark was easier together.", effect: { bond: ["funke", 6], mood: "goodGist" } },
        { label: "Stay in and study by candle", result: "You read until your eyes sting. It is quiet, and it counts.", effect: { skill: { study: 0.5 } } },
      ],
    },
    reward: { money: 500 },
  },
  {
    id: "s10-friday", chapter: 1, n: 10, emoji: "🌆", title: "First Friday", place: "Mushin, evening",
    who: ["Tunde", "Ify", "Sule"],
    intro: "Your first week in Lagos ends on a Friday. The streets are full: generators, music, grills. Three people you have met want three different things from you.",
    dialogue: [
      ["Tunde", "Come and see how money moves in this city. I'm doing a small thing tomorrow."],
      ["Ify", "Or come and learn something that will still pay you in five years."],
      ["Sule", "Or run with me at 5 a.m. and fix your body first."],
    ],
    requires: [{ done: "s09-nepa" }],
    tasks: [{ text: "Be known on your street (reputation 2)", cond: { rep: 2 } }],
    choice: {
      prompt: "Where do you put your energy as Chapter 2 begins?",
      options: [
        { label: "Follow Tunde into the hustle", result: "You choose movement over certainty. Business sense will carry you.", effect: { bond: ["tunde", 10], flag: ["lane", "hustle"] } },
        { label: "Follow Ify into books and code", result: "You choose a slower road. It may be the better one.", effect: { bond: ["ify", 10], flag: ["lane", "study"] } },
        { label: "Run with Sule and meet people", result: "You choose strength and a wide circle. Doors open to the friendly.", effect: { bond: ["sule", 10], flag: ["lane", "social"] } },
      ],
    },
    reward: { money: 2_000, rep: 2 }, next: "Chapter 2: the mainland, and the world beyond Mushin.",
  },
];
