// Chapter 6 — Bigger Opportunities (missions 51-60). Investments, professional growth and major decisions.
// Slots 52, 55 and 58 have four versions (business, tech, creative, professional); you play the one for your path.

import type { StoryMission } from "./types";

const on = (path: string) => [{ flag: "path", is: path }] as const;

export const ch6: StoryMission[] = [
  {
    id: "s51-windfall", chapter: 6, n: 51, emoji: "🎁", title: "A Windfall", place: "Your phone, your bank",
    who: ["Kunle", "Tunde"],
    intro: "A payment lands that you were not counting on: a client settles an old invoice, plus a bonus. It is more than you have ever seen at once. Everyone you know suddenly has an idea about what you should do with it.",
    dialogue: [
      ["Tunde", "Put it to work. Idle money is a bad employee."],
      ["Kunle", "Keep some. Windfalls disappear the way they arrive."],
    ],
    requires: [{ done: "s50-recognition" }],
    tasks: [{ text: "Hold ₦140,000 in cash", cond: { money: 140_000 } }],
    choice: {
      prompt: "What do you do with it?",
      options: [
        { label: "Put most of it into something that grows", result: "You choose patience. It is a quiet decision that pays loudly later.", effect: { money: 5_000, skill: { hustle: 0.4 }, flag: ["windfall", "invested"] } },
        { label: "Spend a slice on yourself and save the rest", result: "A good dinner, a proper chair, a new phone. You earned some joy.", effect: { money: -6_000, mood: "bigNight", rep: 1, flag: ["windfall", "balanced"] } },
        { label: "Share a big part with people who helped you", result: "Mummy, Funke, Ify, Mr Bakare: each gets a gift. Your name travels even further.", effect: { money: -10_000, bond: ["mummy", 8], rep: 3, flag: ["windfall", "shared"] } },
      ],
    },
    reward: { money: 3_000 },
  },

  // ----- Mission 52: scale your path -----
  {
    id: "s52a-three", alt: true, chapter: 6, n: 52, emoji: "🏗️", title: "Three Under One Name", place: "Your businesses, Lagos mainland",
    who: ["Tunde", "Your managers"],
    intro: "Three businesses mean three sets of problems, and you cannot be at every counter. You start writing procedures down, for people you have to trust.",
    dialogue: [["Tunde", "You do not scale by working harder. You scale by being replaceable."]],
    requires: [{ done: "s51-windfall" }, ...on("business")],
    tasks: [{ text: "Own three businesses", cond: { biz: 3 } }, { text: "Reach Hustle 5", cond: { skill: "hustle", n: 5 } }],
    reward: { money: 4_000, skill: { hustle: 0.3 }, rep: 1, flag: ["s52", "done"] },
  },
  {
    id: "s52b-lead", alt: true, chapter: 6, n: 52, emoji: "🧑🏾‍💼", title: "Lead the Release", place: "Your tech company",
    who: ["Your team lead", "Two juniors"],
    intro: "You are not just writing code anymore. Two juniors look to you when something breaks, and a product manager looks to you when something is late. Leadership is mostly listening, and then deciding.",
    dialogue: [["Team lead", "If the release slips, it is a team problem. If it ships, it is a team win. Remember which one you say aloud."]],
    requires: [{ done: "s51-windfall" }, ...on("tech")],
    tasks: [{ text: "Reach Study 8", cond: { skill: "study", n: 8 } }, { text: "Earn ₦25,000 across projects and side work", cond: { do: "earned", n: 25_000 } }],
    reward: { money: 4_000, skill: { study: 0.3 }, rep: 1, flag: ["s52", "done"] },
  },
  {
    id: "s52c-label", alt: true, chapter: 6, n: 52, emoji: "🏷️", title: "Your Own Label", place: "A workshop, Yaba",
    who: ["Mama Bisi"],
    intro: "Mama Bisi hands you a roll of tags with nothing printed on them. 'Name it,' she says. A label is not fabric. It is a promise that people will recognise from across a market.",
    dialogue: [["Mama Bisi", "Make sure the name is bigger than your ego and smaller than your work."]],
    requires: [{ done: "s51-windfall" }, ...on("creative")],
    tasks: [{ text: "Reach Charisma 6", cond: { skill: "charisma", n: 6 } }, { text: "Earn ₦25,000 from your trade", cond: { do: "earned", n: 25_000 } }],
    reward: { money: 4_000, skill: { charisma: 0.3 }, rep: 1, flag: ["s52", "done"] },
  },
  {
    id: "s52d-residency", alt: true, chapter: 6, n: 52, emoji: "🏥", title: "Residency Season", place: "A teaching hospital or a firm",
    who: ["A senior mentor", "Other trainees"],
    intro: "The next stage of your profession is competitive and sleepless. Everyone around you is brilliant and tired. You learn to nap standing up and to ask for help sitting down.",
    dialogue: [["Mentor", "Nobody gets through this alone. Find your people early."]],
    requires: [{ done: "s51-windfall" }, ...on("professional")],
    tasks: [{ text: "Reach Study 8", cond: { skill: "study", n: 8 } }, { text: "Study three more sessions", cond: { do: "library", n: 3 } }],
    reward: { money: 4_000, skill: { study: 0.3 }, rep: 1, flag: ["s52", "done"] },
  },
  {
    id: "s53-markets", chapter: 6, n: 53, emoji: "📊", title: "Reading the Market", place: "Your phone, the 📈 app",
    who: ["Tunde", "An analyst friend"],
    intro: "An analyst friend shows you how she reads a market: not predictions, but probabilities. She says most people lose money because they confuse a good story with a good price.",
    dialogue: [["Analyst", "Diversify. If you cannot explain it to your mother, do not buy it."]],
    requires: [{ flag: "s52", is: "done" }],
    tasks: [{ text: "Make at least two investments", cond: { trades: 2 } }],
    choice: {
      prompt: "A hot tip arrives from a stranger in a group chat.",
      options: [
        { label: "Ignore it and stick to your plan", result: "The tip collapses a week later. Discipline looks boring until it looks genius.", effect: { rep: 1, skill: { hustle: 0.3 }, flag: ["tip", "ignored"] } },
        { label: "Put in a small amount you can afford to lose", result: "It goes sideways. A small, cheap lesson.", effect: { money: -3_000, skill: { hustle: 0.3 }, flag: ["tip", "tested"] } },
        { label: "Go big: this one feels different", result: "It does not work. You lose a lot, and you remember it for life.", effect: { money: -12_000, flag: ["tip", "gambled"] } },
      ],
    },
    reward: { money: 2_000 },
  },
  {
    id: "s54-property", chapter: 6, n: 54, emoji: "🏘️", title: "Rent or Own?", place: "A house viewing, Ikeja",
    who: ["An estate agent", "Mr Bakare"],
    intro: "The agent talks fast about a flat on the mainland: a good price, a bad road, and a landlord with strong opinions. Mr Bakare, unprompted, offers advice: 'A tenant becomes a landlord one careful decision at a time.'",
    dialogue: [["Agent", "Prices only go up in this city. Come on, I will show you the kitchen."]],
    requires: [{ done: "s53-markets" }],
    tasks: [{ text: "Hold ₦160,000 in cash", cond: { money: 160_000 } }],
    choice: {
      prompt: "Where does this money want to live?",
      options: [
        { label: "Save towards buying a flat", result: "You open a separate savings pot for it. The number is clear and so is the goal.", effect: { skill: { hustle: 0.3 }, rep: 1, flag: ["home", "saving"] } },
        { label: "Keep renting and put the money into your business or craft", result: "Flexibility has its own value. The business grows faster for it.", effect: { money: 4_000, flag: ["home", "renting"] } },
        { label: "Upgrade your rented flat so it feels like home", result: "A good bed, better light, a proper desk. You sleep better and work better.", effect: { money: -5_000, mood: "wellRested", flag: ["home", "upgraded"] } },
      ],
    },
    reward: { money: 2_000 },
  },

  // ----- Mission 55: the big deal -----
  {
    id: "s55a-chain", alt: true, chapter: 6, n: 55, emoji: "🛒", title: "The Supermarket Contract", place: "A supermarket head office, Ikeja",
    who: ["A procurement manager"],
    intro: "A regional chain wants to stock what you sell, at a volume you have never delivered. The manager is polite and relentless about delivery dates.",
    dialogue: [["Manager", "Miss one delivery and I will remember it forever. Deliver ten and I will forget them all."]],
    requires: [{ done: "s54-property" }, ...on("business")],
    tasks: [{ text: "Earn ₦30,000 to cover the upfront stock", cond: { do: "earned", n: 30_000 } }],
    days: 10, fail: "The deadline passed before the stock was ready. The chain still has your number.",
    choice: {
      prompt: "The manager asks for a 60-day payment term.",
      options: [
        { label: "Accept, but negotiate a smaller first order", result: "A safer start. You prove yourself without risking everything.", effect: { skill: { hustle: 0.3 }, rep: 2, flag: ["deal", "careful"] } },
        { label: "Accept the full order and borrow to cover it", result: "Big risk, big win if you deliver. It is a long sixty days.", effect: { money: 8_000, rep: 1, flag: ["deal", "bold"] } },
        { label: "Decline politely and keep to smaller buyers", result: "You protect your cashflow. Growth is slower, but sleep is better.", effect: { flag: ["deal", "declined"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s55", "done"] },
  },
  {
    id: "s55b-client", alt: true, chapter: 6, n: 55, emoji: "🧾", title: "The Big Client", place: "A bank's innovation lab, the Island",
    who: ["A client executive"],
    intro: "A bank wants a product built by your team, with security checks, audits, and a launch date that does not move. The executive's last vendor disappeared halfway. She is watching you for signs of the same.",
    dialogue: [["Executive", "I do not need genius. I need reliability."]],
    requires: [{ done: "s54-property" }, ...on("tech")],
    tasks: [{ text: "Earn ₦30,000 from tech work", cond: { do: "earned", n: 30_000 } }],
    days: 10, fail: "The window closed before you were ready. The executive says to come back next quarter.",
    choice: {
      prompt: "A security flaw appears two days before launch.",
      options: [
        { label: "Report it immediately and delay the launch", result: "She is annoyed, then relieved. You just earned her trust for years.", effect: { rep: 3, skill: { study: 0.4 }, flag: ["deal", "honest"] } },
        { label: "Patch it quietly and hope nobody notices", result: "It works this time. You will check your code twice from now on.", effect: { money: 3_000, rep: -1, flag: ["deal", "quiet"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s55", "done"] },
  },
  {
    id: "s55c-brand", alt: true, chapter: 6, n: 55, emoji: "🧢", title: "A Brand Wants You", place: "A brand office, Victoria Island",
    who: ["A brand manager"],
    intro: "A national brand wants your face and your style on their campaign. The fee is generous, and so are their demands. The brand manager praises everything and then sends a six-page brief.",
    dialogue: [["Brand manager", "We love your authenticity. Please do it exactly as drafted."]],
    requires: [{ done: "s54-property" }, ...on("creative")],
    tasks: [{ text: "Earn ₦30,000 from your craft and hustles", cond: { do: "earned", n: 30_000 } }],
    days: 10, fail: "The campaign went to someone else. The brand left the door open.",
    choice: {
      prompt: "The campaign asks you to endorse something you don't actually use.",
      options: [
        { label: "Decline and offer a version that fits your style", result: "They are surprised, and then impressed. Authentic is rarer than reach.", effect: { rep: 3, flag: ["deal", "authentic"] } },
        { label: "Take the full fee and do it as written", result: "The money is good. Some followers sense the difference.", effect: { money: 6_000, rep: -1, flag: ["deal", "paid"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s55", "done"] },
  },
  {
    id: "s55d-placement", alt: true, chapter: 6, n: 55, emoji: "🏛️", title: "The Placement", place: "A hospital or a law chamber",
    who: ["A senior professional"],
    intro: "You are offered a placement in a respected institution, long hours, modest pay, the best teaching in the city. It means turning down two better-paying offers.",
    dialogue: [["Professional", "Pay is a short conversation. Reputation is a long one."]],
    requires: [{ done: "s54-property" }, ...on("professional")],
    tasks: [{ text: "Reach Study 8", cond: { skill: "study", n: 8 } }],
    choice: {
      prompt: "Which offer do you take?",
      options: [
        { label: "The prestigious placement", result: "Hard hours, great mentors, a name on your CV that opens doors for decades.", effect: { rep: 3, skill: { study: 0.4 }, flag: ["deal", "prestige"] } },
        { label: "The higher-paying offer", result: "Cash today, shorter queue, but fewer mentors.", effect: { money: 8_000, rep: 1, flag: ["deal", "pay"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s55", "done"] },
  },
  {
    id: "s56-dip", chapter: 6, n: 56, emoji: "📉", title: "The Market Turns", place: "Your phone",
    who: ["Tunde", "The analyst friend"],
    intro: "For a week, everything red. Group chats panic. Someone posts, 'Sell everything now.' Your balance dips on the screen every morning, quietly, like a tide going out.",
    dialogue: [["Analyst", "Stay calm. If you needed the money this month, you should not have invested it."]],
    requires: [{ flag: "s55", is: "done" }],
    tasks: [],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Hold. You planned for a down year.", result: "It recovers by the end of the quarter. You feel a little smug and a lot relieved.", effect: { rep: 1, skill: { hustle: 0.4 }, flag: ["dip", "held"] } },
        { label: "Sell some to lock in a loss and sleep better", result: "You choose peace over profit. You can always return when you are ready.", effect: { money: -2_000, mood: "wellRested", flag: ["dip", "sold"] } },
        { label: "Buy more while it is cheap, with money you can afford", result: "It is uncomfortable and it is smart. Courage and planning together.", effect: { money: -4_000, skill: { hustle: 0.5 }, flag: ["dip", "bought"] } },
      ],
    },
    reward: { money: 1_500 },
  },
  {
    id: "s57-mentee", chapter: 6, n: 57, emoji: "🌱", title: "Someone Looks Up to You", place: "A café near Yaba",
    who: ["Ade (a young hopeful)"],
    intro: "A nineteen-year-old named Ade sits across from you with a notebook full of questions. He says he found your name in the press interview. You realise you are now the person someone else hopes to become.",
    dialogue: [["Ade", "I just want to know what to avoid. The mistakes you made."]],
    requires: [{ done: "s56-dip" }],
    tasks: [{ text: "Be a trusted name (reputation 28)", cond: { rep: 28 } }],
    choice: {
      prompt: "How do you help?",
      options: [
        { label: "Mentor him every week and open your network", result: "He grows quickly. Months later he introduces you to someone who changes your plans.", effect: { rep: 3, skill: { charisma: 0.4 }, flag: ["mentee", "weekly"] } },
        { label: "Give him one afternoon and a reading list", result: "A small gift of time. He sends a thank-you note you keep.", effect: { rep: 1, flag: ["mentee", "once"] } },
        { label: "Pay for his course", result: "You open a door with money. He promises to repay it by passing it on.", effect: { money: -5_000, rep: 2, flag: ["mentee", "funded"] } },
      ],
    },
    reward: { money: 1_500 },
  },

  // ----- Mission 58: the big offer -----
  {
    id: "s58a-acquire", alt: true, chapter: 6, n: 58, emoji: "💼", title: "An Offer to Buy You", place: "A boardroom, Victoria Island",
    who: ["A larger company's director"],
    intro: "A bigger firm offers to acquire your business: a fat cheque, a title, and a leash. The director smiles with everything except her eyes. 'You can run it, under us.'",
    dialogue: [["Director", "You would have resources you have never had. And a boss you have never had."]],
    requires: [{ done: "s57-mentee" }, ...on("business")],
    tasks: [],
    choice: {
      prompt: "What do you say?",
      options: [
        { label: "Sell and take the cheque", result: "A large sum lands. You have security, and a lot of free time to plan the next move.", effect: { money: 30_000, rep: 1, flag: ["s58", "sold"] } },
        { label: "Decline and keep building on your terms", result: "Freedom is expensive. You keep the story as yours.", effect: { rep: 2, skill: { hustle: 0.4 }, flag: ["s58", "kept"] } },
        { label: "Counter with a partnership instead of a sale", result: "She is surprised, and agrees to talk. You keep a seat at the table.", effect: { money: 10_000, rep: 2, flag: ["s58", "partnered"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s58done", "yes"] },
  },
  {
    id: "s58b-remote", alt: true, chapter: 6, n: 58, emoji: "🌍", title: "The Remote Offer", place: "A video call",
    who: ["A hiring manager abroad"],
    intro: "A company abroad offers a remote role paid in dollars, a number that makes your eyebrows rise. The hiring manager is kind. The time zones are not.",
    dialogue: [["Manager", "We want your work. Where you live is your own business."]],
    requires: [{ done: "s57-mentee" }, ...on("tech")],
    tasks: [],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Accept and keep your life in Lagos", result: "Big pay, odd hours, and a life you are proud of. The best of both worlds, if you manage sleep.", effect: { money: 20_000, rep: 1, flag: ["s58", "remote"] } },
        { label: "Decline and build locally", result: "You stay close to the people who raised you, and your own company grows slowly.", effect: { rep: 2, skill: { study: 0.4 }, flag: ["s58", "local"] } },
        { label: "Negotiate for part-time hours", result: "She agrees. You keep half your attention for your own plans.", effect: { money: 10_000, rep: 1, flag: ["s58", "part"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s58done", "yes"] },
  },
  {
    id: "s58c-deal", alt: true, chapter: 6, n: 58, emoji: "🎧", title: "A Bigger Stage", place: "A fashion house or a studio, the Island",
    who: ["A talent scout"],
    intro: "A scout from a larger house offers you a place on a global stage: a showcase abroad, a tour of the circuit, new agents, new tastes. 'You can go further,' she says. 'But not as yourself, not completely.'",
    dialogue: [["Scout", "Everyone changes a little. The question is how much of it is your choice."]],
    requires: [{ done: "s57-mentee" }, ...on("creative")],
    tasks: [],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Take the offer and adapt as needed", result: "Bigger audiences, tougher critics. You grow quickly and learn what you will not change.", effect: { money: 20_000, rep: 2, flag: ["s58", "global"] } },
        { label: "Negotiate to keep creative control", result: "You get most of what you ask for. The scout writes you down as someone to watch.", effect: { money: 8_000, rep: 3, flag: ["s58", "control"] } },
        { label: "Decline and grow your own audience", result: "Slow, loyal, and entirely yours.", effect: { skill: { charisma: 0.4 }, flag: ["s58", "own"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s58done", "yes"] },
  },
  {
    id: "s58d-fellowship", alt: true, chapter: 6, n: 58, emoji: "🎓", title: "The Fellowship", place: "A letter from an institution",
    who: ["A selection panel"],
    intro: "A competitive fellowship accepts you: funding, mentors, and a year of focused work. It requires moving for a year and pausing everything else. It is the kind of chance people mention in their old age.",
    dialogue: [["Panel", "We chose you because we believe in what you will do next."]],
    requires: [{ done: "s57-mentee" }, ...on("professional")],
    tasks: [],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Take the fellowship", result: "A year of hard focus. You return sharper, and with a network you could not buy.", effect: { money: 10_000, skill: { study: 0.6 }, rep: 3, flag: ["s58", "fellow"] } },
        { label: "Defer it by a year to finish current commitments", result: "They agree. Being responsible does not cost you the opportunity.", effect: { rep: 2, flag: ["s58", "deferred"] } },
        { label: "Decline and go into practice now", result: "You earn sooner and learn on the job. Different road, same destination.", effect: { money: 12_000, rep: 1, flag: ["s58", "practice"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s58done", "yes"] },
  },
  {
    id: "s59-japa", chapter: 6, n: 59, emoji: "✈️", title: "The Japa Question", place: "A late-night call",
    who: ["Kunle", "Ify", "Mummy"],
    intro: "Half your friends have left or are leaving, with visas, tickets and tearful goodbyes at Murtala Muhammed. Kunle asks you straight: 'Are you leaving or staying?' Mummy asks nothing, which is louder.",
    dialogue: [
      ["Kunle", "Both are good answers. Just know which one is yours."],
      ["Mummy", "Wherever you are, you carry us with you."],
    ],
    requires: [{ flag: "s58done", is: "yes" }],
    tasks: [{ text: "Hold ₦180,000 in cash", cond: { money: 180_000 } }],
    choice: {
      prompt: "What is your honest answer?",
      options: [
        { label: "Stay and build here", result: "You choose roots. The city needs people who plant things.", effect: { rep: 2, bond: ["mummy", 6], flag: ["japa", "stay"] } },
        { label: "Keep both doors open and prepare", result: "Passport renewed, IELTS booked, plans in a drawer. Options are a form of freedom.", effect: { money: -2_000, skill: { study: 0.3 }, flag: ["japa", "both"] } },
        { label: "Plan to leave in the next two years", result: "You are leaving, and you are honest about it. It makes people sad and it makes them proud.", effect: { flag: ["japa", "leave"] } },
      ],
    },
    reward: { money: 2_000 },
  },
  {
    id: "s60-threshold", chapter: 6, n: 60, emoji: "🚪", title: "The Threshold", place: "A rooftop at dusk, Lagos",
    who: ["Everyone who has mattered"],
    intro: "From the rooftop, Lagos hums like an engine that never turns off. You have more money than you ever expected, more people who need you, and more decisions you cannot undo. The next chapter will cost something. You know it, and you step through the door anyway.",
    dialogue: [["You", "I do not know what is next. But I am ready to find out."]],
    requires: [{ done: "s59-japa" }],
    tasks: [{ text: "Hold ₦200,000 in cash", cond: { money: 200_000 } }, { text: "Be a recognised name (reputation 30)", cond: { rep: 30 } }],
    reward: { money: 12_000, rep: 3, skill: { hustle: 0.3, study: 0.3, charisma: 0.3 } },
    next: "Chapter 7, The Price of Success, is planned but not playable yet.",
  },
];
