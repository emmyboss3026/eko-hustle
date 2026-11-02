// Chapter 10 — Your Legacy (missions 91-100). Long-term accomplishments, relationships and what comes next.
// Slot 92 has four versions (business, tech, creative, professional).
// Slot 95 has three, picked by how you gave back in Chapter 8 (mission 73).
// Slot 98 has three, picked by the value you committed to in Chapter 7 (mission 69).

import type { StoryMission } from "./types";

const on = (path: string) => [{ flag: "path", is: path }] as const;
const gave = (v: string) => [{ flag: "giving", is: v }] as const;
const val = (v: string) => [{ flag: "values", is: v }] as const;

// Mission 100 is "s99z-legacy": its id keeps the two-digit pattern the database accepts (see supabase/update-2026-11-story.sql).
export const ch10: StoryMission[] = [
  {
    id: "s91-stock", chapter: 10, n: 91, emoji: "🗓️", title: "Taking Stock", place: "Your flat in Mushin, still",
    who: ["You", "Funke"],
    intro: "You could live anywhere. You still keep the small flat in Mushin, the one with the bucket and the leaky tap, because Funke says it keeps you honest. On the anniversary of the day you arrived, you sit on the floor with a notebook and count what you really have.",
    dialogue: [["Funke", "Money is one way to count. People are another. Do both."]],
    requires: [{ done: "s90-top" }],
    tasks: [{ text: "Hold ₦420,000 in cash", cond: { money: 420_000 } }, { text: "Hold a respected name (reputation 50)", cond: { rep: 50 } }],
    choice: {
      prompt: "What counts as success to you now?",
      options: [
        { label: "The people whose lives are better because I was there", result: "You write a list of names. It is longer than the list of numbers.", effect: { rep: 3, bond: ["funke", 8], flag: ["measure", "people"] } },
        { label: "The work that will still exist after me", result: "You sketch plans on the back of a bill. They feel like a promise.", effect: { rep: 2, skill: { study: 0.3 }, flag: ["measure", "work"] } },
        { label: "The freedom to choose what I do next", result: "A calm answer. You realise it is also the hardest to earn.", effect: { rep: 2, skill: { hustle: 0.3 }, flag: ["measure", "freedom"] } },
      ],
    },
    reward: { money: 3_000 },
  },

  // ----- Mission 92: your life's work -----
  {
    id: "s92a-foundation", alt: true, chapter: 10, n: 92, emoji: "🏗️", title: "The Business Academy", place: "A training hall, Lagos",
    who: ["Tunde", "A hundred young traders"],
    intro: "A hall of young traders with notebooks and borrowed shoes. You built a business out of a bucket and a stall. Now you teach them what you wish someone had written down: pricing, cash, trust, and how to survive a bad month.",
    dialogue: [["Tunde", "You are teaching them to be better than us. Good."]],
    requires: [{ done: "s91-stock" }, ...on("business")],
    tasks: [{ text: "Earn ₦70,000 to run the first year", cond: { do: "earned", n: 70_000 } }],
    choice: {
      prompt: "How do you run the academy?",
      options: [
        { label: "Free for those who cannot pay, funded by those who can", result: "A cross-subsidy that works. Alumni come back to teach.", effect: { money: -10_000, rep: 4, flag: ["legacy", "free"] } },
        { label: "Charge fairly and keep it self-sustaining", result: "Steady, small and durable. It will outlast your interest.", effect: { rep: 2, skill: { hustle: 0.3 }, flag: ["legacy", "fair"] } },
      ],
    },
    reward: { money: 5_000, flag: ["s92", "done"] },
  },
  {
    id: "s92b-code", alt: true, chapter: 10, n: 92, emoji: "🧑🏾‍🏫", title: "A Country That Codes", place: "A school hall",
    who: ["Ify", "Teachers"],
    intro: "Ify has a plan: free curriculum, teachers trained in every state, offline-first lessons for places with no steady power. 'You would be the name on it,' she says. 'But the work will be mine, and a thousand teachers'.'",
    dialogue: [["Ify", "We are not building a company. We are building a habit."]],
    requires: [{ done: "s91-stock" }, ...on("tech")],
    tasks: [{ text: "Earn ₦70,000 to fund the first year", cond: { do: "earned", n: 70_000 } }],
    choice: {
      prompt: "How do you run it?",
      options: [
        { label: "Open-source the curriculum and train teachers locally", result: "It spreads faster than you can track. Teachers adapt it in ways you never imagined.", effect: { money: -10_000, rep: 4, flag: ["legacy", "open"] } },
        { label: "Keep tight control of quality and a single standard", result: "Cleaner, slower, more consistent. It reaches fewer people, more reliably.", effect: { rep: 2, skill: { study: 0.3 }, flag: ["legacy", "tight"] } },
      ],
    },
    reward: { money: 5_000, flag: ["s92", "done"] },
  },
  {
    id: "s92c-retro", alt: true, chapter: 10, n: 92, emoji: "🖼️", title: "The Retrospective", place: "A museum hall, Lagos",
    who: ["Mama Bisi", "A curator", "Your apprentices"],
    intro: "Thirty years of work on a wall: the first crooked dress, the collection that changed your career, the piece you made for Mummy. Mama Bisi stands in front of the first one for a long time, then says only, 'Keep it. It was honest.'",
    dialogue: [["Curator", "We usually do this after someone is gone. I am glad we did not wait."]],
    requires: [{ done: "s91-stock" }, ...on("creative")],
    tasks: [{ text: "Earn ₦70,000 to fund the exhibition", cond: { do: "earned", n: 70_000 } }],
    choice: {
      prompt: "What happens to the work when the show ends?",
      options: [
        { label: "Donate the key pieces to a public collection", result: "Strangers will see it for free for fifty years. It feels like planting a tree.", effect: { money: -10_000, rep: 4, flag: ["legacy", "donated"] } },
        { label: "Keep control of it for your family and studio", result: "A private legacy, close to home. It may be seen less and understood better.", effect: { rep: 2, skill: { charisma: 0.3 }, flag: ["legacy", "kept"] } },
      ],
    },
    reward: { money: 5_000, flag: ["s92", "done"] },
  },
  {
    id: "s92d-institute", alt: true, chapter: 10, n: 92, emoji: "🏫", title: "The Institute", place: "A new building, Lagos",
    who: ["A mentor, retired", "Trainees"],
    intro: "A building with your mentor's name on the front and yours on a smaller plaque beneath. It trains the next two hundred professionals a year, in a city that badly needs them. Your mentor cuts the ribbon with shaking hands and says, 'You did this. I only started it.'",
    dialogue: [["Mentor", "A profession is a promise passed from hand to hand."]],
    requires: [{ done: "s91-stock" }, ...on("professional")],
    tasks: [{ text: "Earn ₦70,000 to fund the first year", cond: { do: "earned", n: 70_000 } }],
    choice: {
      prompt: "How do you run it?",
      options: [
        { label: "Prioritise places for students from poorer homes", result: "The first cohort includes a girl who sold sachet water on a roadside. Her results top the class.", effect: { money: -10_000, rep: 4, flag: ["legacy", "access"] } },
        { label: "Prioritise strict standards and a high bar", result: "Graduates are respected everywhere. Fewer are admitted.", effect: { rep: 2, skill: { study: 0.3 }, flag: ["legacy", "standards"] } },
      ],
    },
    reward: { money: 5_000, flag: ["s92", "done"] },
  },
  {
    id: "s93-mummy", chapter: 10, n: 93, emoji: "🎂", title: "Mummy's Seventy-Fifth", place: "The compound, Mushin",
    who: ["Mummy", "Kunle", "Funke", "Mr Bakare"],
    intro: "The whole compound is decorated with balloons and borrowed plastic chairs. Mummy sits in the middle, in a gele that took two neighbours to tie. She looks at the people around her, then at you, and the noise falls away for a moment.",
    dialogue: [["Mummy", "I asked God for one thing: that you would be happy and that you would not forget where you came from."]],
    requires: [{ flag: "s92", is: "done" }],
    tasks: [{ text: "Be close to Mummy (relationship 85)", cond: { bond: "mummy", n: 85 } }],
    choice: {
      prompt: "What do you say when they hand you the microphone?",
      options: [
        { label: "Thank her with a story from the first week in the flat", result: "The compound laughs and then cries. Mr Bakare 'has something in his eye'.", effect: { bond: ["mummy", 10], rep: 3, mood: "mummyLove", flag: ["toast", "story"] } },
        { label: "Keep it short and give her a gift she did not ask for", result: "A small gold chain, handed over quietly. She wears it every day.", effect: { money: -6_000, bond: ["mummy", 8], rep: 2, flag: ["toast", "gift"] } },
      ],
    },
    reward: { money: 2_000 },
  },
  {
    id: "s94-keys", chapter: 10, n: 94, emoji: "🔑", title: "Mr Bakare's Keys", place: "The compound, Mushin",
    who: ["Mr Bakare", "The tenants"],
    intro: "Mr Bakare has a heavy ring of keys and an unusual look: nervous. He says he is retiring, his children have their own lives, and the compound is for sale. 'I will sell it to anyone,' he says. 'But I would rather it was someone who understands that tenants are people.'",
    dialogue: [["Mr Bakare", "The first time you walked in, I was rude to you on purpose. Do not take it personally. It is my job."]],
    requires: [{ done: "s93-mummy" }],
    tasks: [{ text: "Hold ₦450,000 in cash", cond: { money: 450_000 } }],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Buy the compound and keep rents fair", result: "You own the keys, and the leaking tap gets fixed. The tenants throw you a small party.", effect: { money: -40_000, bond: ["landlord", 15], rep: 4, flag: ["compound", "bought"] } },
        { label: "Help the tenants buy it together as a co-operative", result: "Harder, slower, and theirs. Mr Bakare signs with a grin.", effect: { money: -12_000, bond: ["landlord", 12], rep: 4, flag: ["compound", "coop"] } },
        { label: "Wish him well and leave it to the market", result: "A kind goodbye. Whoever buys it will make their own choices.", effect: { bond: ["landlord", 5], flag: ["compound", "sold"] } },
      ],
    },
    reward: { money: 2_000, flag: ["s94", "done"] },
  },

  // ----- Mission 95: how you gave back (picked by mission 73) -----
  {
    id: "s95a-graduates", alt: true, chapter: 10, n: 95, emoji: "🎓", title: "The First Graduates", place: "A school hall, Mushin",
    who: ["Ade", "The first scholars"],
    intro: "The scholarship you started in a dusty hall has produced its first university graduates. They wear borrowed gowns and speak shyly. One of them hands you a card that says, in careful capitals, 'THANK YOU FOR THE BOOKS'.",
    dialogue: [["Scholar", "I did not know that someone could care without knowing me."]],
    requires: [{ flag: "s94", is: "done" }, ...gave("scholarship")],
    tasks: [],
    choice: {
      prompt: "What do you do next?",
      options: [
        { label: "Endow the scholarship so it never depends on you", result: "A permanent fund and a board with a majority of former scholars.", effect: { money: -20_000, rep: 4, flag: ["gift", "endowed"] } },
        { label: "Keep funding it yearly, and keep meeting each cohort", result: "A personal relationship that costs time and keeps you grounded.", effect: { money: -8_000, bond: ["funke", 5], rep: 3, flag: ["gift", "yearly"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s95", "done"] },
  },
  {
    id: "s95b-interns", alt: true, chapter: 10, n: 95, emoji: "🧑🏾‍🤝‍🧑🏿", title: "The Interns Come Back", place: "Your office",
    who: ["Ten former interns"],
    intro: "The ten students you mentored return, now with titles and business cards, to sit around your table and tell you, laughing, how badly you once explained margin. Two of them have started companies. One of them has hired you a consultant.",
    dialogue: [["Intern", "You opened a door. We just walked through it."]],
    requires: [{ flag: "s94", is: "done" }, ...gave("mentor")],
    tasks: [],
    choice: {
      prompt: "What do you do next?",
      options: [
        { label: "Form a standing circle that meets every quarter", result: "A mentoring web that no longer depends on a single person.", effect: { rep: 4, skill: { charisma: 0.4 }, flag: ["gift", "circle"] } },
        { label: "Back their companies with real money", result: "A risk for you and a bet on them. Two of the five grow.", effect: { money: -20_000, rep: 3, flag: ["gift", "backed"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s95", "done"] },
  },
  {
    id: "s95c-second", alt: true, chapter: 10, n: 95, emoji: "🌱", title: "A Second Chance at Giving", place: "A small community hall",
    who: ["Funke", "A local organiser"],
    intro: "Years ago you gave a modest amount and moved on. A local organiser stops you after a talk, not to ask for money, but to show you what it became: a reading corner with six shelves. 'I have thought about you,' she says. 'Even though you did not stay.'",
    dialogue: [["Organiser", "Small things grow too. They just need someone to come back."]],
    requires: [{ flag: "s94", is: "done" }, ...gave("small")],
    tasks: [],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Commit a meaningful gift, and visit each year", result: "A reading corner becomes a library. You promise to keep turning up.", effect: { money: -12_000, rep: 4, flag: ["gift", "committed"] } },
        { label: "Give your time instead, and teach one evening a week", result: "Not money. Hours. It changes a few kids and it changes you.", effect: { rep: 3, skill: { charisma: 0.3 }, flag: ["gift", "time"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s95", "done"] },
  },
  {
    id: "s96-ade", chapter: 10, n: 96, emoji: "🧑🏾‍🚀", title: "Ade Grows Up", place: "A café near Yaba",
    who: ["Ade"],
    intro: "Ade orders for you this time, and pays. He is twenty-nine, wears a tailored shirt, and says he has been offered a job on a team that will take him abroad. He asks what you think, and you notice he really means it.",
    dialogue: [["Ade", "You told me once that nobody makes it alone. I am only here because someone made time."]],
    requires: [{ flag: "s95", is: "done" }],
    tasks: [],
    choice: {
      prompt: "What do you say?",
      options: [
        { label: "Encourage him to go, and promise to host him whenever he returns", result: "He grips your hand tight. A year later he sends a photo from a snowy street with the caption 'still learning'.", effect: { rep: 3, flag: ["ade", "sent"] } },
        { label: "Offer him a senior role in your organisation so he can stay", result: "He thinks about it for two weeks and accepts. The org gets better.", effect: { money: -6_000, rep: 3, flag: ["ade", "stayed"] } },
        { label: "Tell him it is his call, and that either way you are proud", result: "Quiet and honest. He picks a third option you had not thought of.", effect: { rep: 2, flag: ["ade", "own"] } },
      ],
    },
    reward: { money: 1_500 },
  },
  {
    id: "s97-japa", chapter: 10, n: 97, emoji: "🛫", title: "The Door Opens Again", place: "Murtala Muhammed Airport",
    who: ["Kunle", "Mummy", "Ify"],
    intro: "An invitation arrives: a fellowship abroad, with housing, a stipend and a title you would have sold a kidney for at twenty-five. Kunle drives you to the airport to talk it over, because the airport is where Lagos people say what they really mean.",
    dialogue: [["Kunle", "Some people leave to find themselves. Some leave to be missed. Which are you?"]],
    requires: [{ done: "s96-ade" }],
    tasks: [{ text: "Hold ₦470,000 in cash", cond: { money: 470_000 } }],
    choice: {
      prompt: "What do you decide?",
      options: [
        { label: "Stay: your work is here", result: "You turn around and drive home. The harmattan is dry, and your chest is full.", effect: { rep: 3, bond: ["mummy", 6], flag: ["door", "stay"] } },
        { label: "Go for a year, and come back", result: "A year abroad, carrying everything you learn home. The compound waits.", effect: { skill: { study: 0.5 }, rep: 2, flag: ["door", "year"] } },
        { label: "Split your time between here and there", result: "More flights, more strangers, more perspective. A hard rhythm that suits you.", effect: { money: -5_000, skill: { charisma: 0.4 }, flag: ["door", "split"] } },
      ],
    },
    reward: { money: 2_000, flag: ["s97", "done"] },
  },

  // ----- Mission 98: your values, judged (picked by mission 69) -----
  {
    id: "s98a-people", alt: true, chapter: 10, n: 98, emoji: "🫶", title: "People Before Profit, Remembered", place: "A packed hall",
    who: ["Everyone you ever put first"],
    intro: "You promised years ago to put people first. A hall fills with people who remember it: a former employee who kept her job, a neighbour you helped, a student you never taught but who read your story. They are not asking for anything. They want to say it back.",
    dialogue: [["Former employee", "You paid a price we never saw. Thank you for paying it."]],
    requires: [{ flag: "s97", is: "done" }, ...val("people")],
    tasks: [],
    choice: {
      prompt: "What do you say?",
      options: [
        { label: "Share the credit with everyone in the room", result: "It takes an hour. Nobody wants to leave.", effect: { rep: 4, flag: ["judge", "shared"] } },
        { label: "Keep it short: 'It was worth it'", result: "Simple and true. People sit in silence for a moment before applauding.", effect: { rep: 3, flag: ["judge", "short"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s98", "done"] },
  },
  {
    id: "s98b-durable", alt: true, chapter: 10, n: 98, emoji: "🏛️", title: "It Outlasted You", place: "Your old office",
    who: ["Your deputy", "An auditor"],
    intro: "You ask your deputy to run the company for six months while you disappear on a trip you have owed yourself. When you come back, the numbers are better. She has made three decisions you would not have made, and she was right about two.",
    dialogue: [["Deputy", "You built the thing so it did not need you. You should be proud, and a little sad."]],
    requires: [{ flag: "s97", is: "done" }, ...val("durable")],
    tasks: [],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Step back further and let her lead openly", result: "A clean handover. You take a long breath.", effect: { rep: 4, flag: ["judge", "handed"] } },
        { label: "Stay on as an advisor, only when asked", result: "A soft landing. You keep a line to the work you love.", effect: { rep: 3, flag: ["judge", "advisor"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s98", "done"] },
  },
  {
    id: "s98c-winning", alt: true, chapter: 10, n: 98, emoji: "🥇", title: "What Winning Costs", place: "A quiet room",
    who: ["An old rival", "A journalist"],
    intro: "You decided long ago to keep winning. A journalist asks a better question than anyone has: 'What did winning cost you, and what would you do differently?' You answer honestly, to your own surprise.",
    dialogue: [["Journalist", "You have won more than most. Was it all worth it?"]],
    requires: [{ flag: "s97", is: "done" }, ...val("winning")],
    tasks: [],
    choice: {
      prompt: "What do you say?",
      options: [
        { label: "Admit what it cost, and what you would do differently", result: "The interview is quoted for years, and a hundred young competitors ease off the throttle.", effect: { rep: 4, flag: ["judge", "honest"] } },
        { label: "Defend your choices and your record", result: "A fair answer. People can see you meant it.", effect: { rep: 2, flag: ["judge", "defended"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s98", "done"] },
  },
  {
    id: "s99-word", chapter: 10, n: 99, emoji: "📜", title: "What You Will Leave", place: "A lawyer's office",
    who: ["A lawyer", "Mummy", "Kunle"],
    intro: "The lawyer's desk is clean and the pen is heavy. She asks, in a calm voice, who and what you want to look after when you are no longer there to do it. You answer slowly, naming people, then places, then ideas.",
    dialogue: [["Lawyer", "A will is not about death. It is a letter about what mattered."]],
    requires: [{ flag: "s98", is: "done" }],
    tasks: [{ text: "Hold ₦480,000 in cash", cond: { money: 480_000 } }],
    choice: {
      prompt: "How do you set it up?",
      options: [
        { label: "A foundation for the causes you built, plus provision for family", result: "A structure that lasts. The paperwork is long, and the peace is longer.", effect: { money: -15_000, rep: 4, flag: ["will", "foundation"] } },
        { label: "Mostly for family and close friends", result: "A warm, personal plan. The people who loved you are looked after.", effect: { bond: ["mummy", 8], rep: 2, flag: ["will", "family"] } },
        { label: "Mostly for causes, with smaller gifts to family", result: "A bold plan, and an honest talk with your family about why.", effect: { rep: 3, flag: ["will", "causes"] } },
      ],
    },
    reward: { money: 1_500 },
  },
  {
    id: "s99z-legacy", chapter: 10, n: 100, emoji: "👑", title: "Your Legacy", place: "The rooftop in Yaba, again",
    who: ["Everyone who was there at the start, and everyone who came after"],
    intro: "The rooftop is the same one. The same concrete, the same view of generators and satellite dishes. Tunde, Ify, Sule and Funke are here, older. A younger group is at the other end, arguing about a business idea over plastic cups. You realise they are the ones who will tell the story next.",
    dialogue: [
      ["Ify", "So what now?"],
      ["You", "Now we do it again, but better, and with more of us."],
    ],
    requires: [{ done: "s99-word" }],
    tasks: [{ text: "Hold ₦500,000 in cash", cond: { money: 500_000 } }, { text: "Hold a name that will be remembered (reputation 50)", cond: { rep: 50 } }],
    reward: { money: 25_000, rep: 5, skill: { hustle: 0.3, study: 0.3, charisma: 0.3 }, flag: ["story", "complete"] },
    next: "The main story is complete. Your life in Lagos carries on: keep working, building and helping.",
  },
];
