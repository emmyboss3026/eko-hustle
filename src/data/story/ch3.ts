// Chapter 3 — The Hustle (missions 21-30). The Island: bigger money, bigger risks, and the first real decision about your future.

import type { StoryMission } from "./types";

export const ch3: StoryMission[] = [
  {
    id: "s21-island", chapter: 3, n: 21, emoji: "🌉", title: "Across the Lagoon", place: "Victoria Island",
    who: ["Tunde", "A networking host"],
    intro: "The bridge lifts you over black water and into a different Lagos: glass towers, security guards in pressed shirts, and a coffee that costs a day's food. Tunde whispers: 'Act like you've been here before.'",
    dialogue: [["Host", "Everyone here is selling something. The trick is to know what you are."]],
    requires: [{ done: "s20-sunset" }],
    tasks: [{ text: "Do some networking on the Island", cond: { do: "networking" } }],
    reward: { money: 2_000, skill: { charisma: 0.3 }, rep: 1 },
  },
  {
    id: "s22-scam", chapter: 3, n: 22, emoji: "📵", title: "Too Good To Be True", place: "Your phone",
    who: ["Unknown number"],
    intro: "A text arrives: 'Congratulations! You qualify for a ₦200,000 grant. Send ₦5,000 processing fee.' It has your name spelled right, which makes it worse.",
    dialogue: [["Unknown", "Offer closes in 10 minutes. Don't tell anyone."]],
    requires: [{ done: "s21-island" }],
    tasks: [],
    choice: {
      prompt: "The clock on the message is ticking.",
      options: [
        { label: "Delete it and warn your friends", result: "Ify says she got the same text. You saved someone ₦5,000 and a night of regret.", effect: { rep: 2, flag: ["scam", "avoided"] } },
        { label: "Send the fee and hope", result: "The number goes dead. A cheap lesson, though it hurts.", effect: { money: -5_000, flag: ["scam", "fell"] } },
        { label: "Call the number and play along to see how it works", result: "You learn the script, then block them. Knowledge, at no cost.", effect: { skill: { hustle: 0.3 }, flag: ["scam", "studied"] } },
      ],
    },
    reward: { money: 500 },
  },
  {
    id: "s23-two-jobs", chapter: 3, n: 23, emoji: "⏱️", title: "Two Hustles, One Body", place: "Mainland and Island",
    who: ["Kunle"],
    intro: "Kunle warns you: 'One job is a salary. Two jobs is a schedule. Three is a funeral.' You are somewhere between one and two.",
    dialogue: [["Kunle", "Don't let the second hustle eat the first one's food."]],
    requires: [{ done: "s22-scam" }, { job: true }],
    tasks: [{ text: "Earn ₦8,000 while keeping your job", cond: { do: "earned", n: 8_000 } }, { text: "Work two more shifts", cond: { do: "work", n: 2 } }],
    days: 8, fail: "You did not have enough hours. Kunle: 'Try again, but sleep first.'",
    reward: { money: 3_000, skill: { hustle: 0.4 } },
  },
  {
    id: "s24-stall", chapter: 3, n: 24, emoji: "🏪", title: "A Stall of Your Own", place: "A corner near your street",
    who: ["Tunde", "Mama Ronke"],
    intro: "Tunde taps a spot on the pavement. 'Pure water, sachets, soft drinks. It's not glamour, it's cashflow.' Mama Ronke offers a fridge she isn't using.",
    dialogue: [["Mama Ronke", "A business is a baby. It cries at night and pays you back in ten years."]],
    requires: [{ done: "s23-two-jobs" }],
    tasks: [{ text: "Buy a small business in the 🏪 phone app", cond: { biz: 1 } }],
    choice: {
      prompt: "Your first business is open. What is the rule of the stall?",
      options: [
        { label: "Fair prices, fair weight, regular customers", result: "Slower first week, but people return. Your name starts to mean something.", effect: { rep: 2, flag: ["biz", "fair"] } },
        { label: "Squeeze every kobo you can", result: "More cash today. Some customers do not return.", effect: { money: 2_000, rep: -1, flag: ["biz", "squeeze"] } },
      ],
    },
    reward: { money: 1_500, skill: { hustle: 0.3 } },
  },
  {
    id: "s25-flood", chapter: 3, n: 25, emoji: "🌧️", title: "Flood Season", place: "Mushin and beyond",
    who: ["Funke", "Mr Bakare"],
    intro: "The rains arrive like a debt collector. Gutters overflow, roads become rivers, and the compound's water level creeps toward the front step.",
    dialogue: [["Mr Bakare", "Everybody raise the sandbags. We do this together or not at all."]],
    requires: [{ done: "s24-stall" }],
    tasks: [{ text: "Keep a ₦10,000 cushion for emergencies", cond: { money: 10_000 } }],
    choice: {
      prompt: "A neighbour's room is taking water. Yours is dry.",
      options: [
        { label: "Help carry her things and sandbag the door", result: "Muddy to the knees, and the whole compound knows your name.", effect: { rep: 3, bond: ["funke", 8], flag: ["flood", "helped"] } },
        { label: "Protect your own room and keep dry", result: "Safe, warm, a little ashamed.", effect: { mood: "wellRested", flag: ["flood", "kept"] } },
      ],
    },
    reward: { money: 1_000 },
  },
  {
    id: "s26-tip", chapter: 3, n: 26, emoji: "📈", title: "Tunde's Tip", place: "Your phone, the 📈 app",
    who: ["Tunde"],
    intro: "Tunde sends a voice note at midnight: 'I'm not saying get rich quick. I'm saying learn how money grows while you sleep.'",
    dialogue: [["Tunde", "Don't put in what you can't lose. Put in what you can learn from."]],
    requires: [{ done: "s25-flood" }],
    tasks: [{ text: "Make your first investment", cond: { trades: 1 } }],
    choice: {
      prompt: "The market moves. How do you react?",
      options: [
        { label: "Hold steady and check once a week", result: "Boring and sensible. Time does half the work.", effect: { skill: { hustle: 0.3 }, flag: ["invest", "patient"] } },
        { label: "Watch it all day and chase every move", result: "It is exciting and exhausting. You learn how emotions cost money.", effect: { mood: "goSlow", flag: ["invest", "anxious"] } },
      ],
    },
    reward: { money: 1_500 },
  },
  {
    id: "s27-level", chapter: 3, n: 27, emoji: "🧠", title: "Level Up", place: "Wherever you learn",
    who: ["Ify"],
    intro: "Ify slides a sheet across the table: three things you can do better, in her handwriting. 'You are decent,' she says. 'Decent doesn't pay rent for long.'",
    dialogue: [["Ify", "Pick a skill. Be great at it for a month. Then pick again."]],
    requires: [{ done: "s26-tip" }],
    tasks: [{ text: "Reach Hustle 2", cond: { skill: "hustle", n: 2 } }, { text: "Reach Study 2", cond: { skill: "study", n: 2 } }],
    reward: { money: 2_000, rep: 1 },
  },
  {
    id: "s28-rival", chapter: 3, n: 28, emoji: "🥊", title: "The Competition", place: "Your corner, Mushin",
    who: ["Chidi (rival seller)"],
    intro: "A new stall opens ten steps from yours. Same drinks, lower prices, bigger smile. Chidi waves like he has already won.",
    dialogue: [
      ["Chidi", "Friendly competition, boss. Welcome to the street."],
      ["You", "Welcome to the street."],
    ],
    requires: [{ done: "s27-level" }],
    tasks: [{ text: "Earn ₦10,000 in a week to keep your lead", cond: { do: "earned", n: 10_000 } }],
    days: 7, fail: "Chidi took the week. You regroup and try again, smarter.",
    choice: {
      prompt: "How do you answer the rival?",
      options: [
        { label: "Propose sharing a supplier to cut costs together", result: "Chidi hesitates, then agrees. Two small businesses are stronger than two angry ones.", effect: { rep: 2, flag: ["rival", "ally"] } },
        { label: "Cut your prices below his", result: "Customers cheer. Margins shrink. Chidi mutters.", effect: { money: -2_000, skill: { hustle: 0.4 }, flag: ["rival", "enemy"] } },
      ],
    },
    reward: { money: 3_000, rep: 1 },
  },
  {
    id: "s29-lane", chapter: 3, n: 29, emoji: "🧭", title: "Pick a Lane", place: "A quiet evening, thinking",
    who: ["Kunle", "Mummy"],
    intro: "You are no longer new. People expect things now: a plan, a direction, a reason. Chapter 4 is the long road; this is where you choose which direction your feet point.",
    dialogue: [
      ["Kunle", "You can do many things. You can't do all of them first."],
      ["Mummy", "Whatever you pick, do it with your whole name."],
    ],
    requires: [{ done: "s28-rival" }],
    tasks: [],
    choice: {
      prompt: "Which road will your life follow into Chapter 4?",
      options: [
        { label: "Business: build things that earn without you", result: "Stalls become companies. You will learn to hire, to lose, to learn.", effect: { flag: ["path", "business"], skill: { hustle: 0.4 } } },
        { label: "Technology: write code, ship products", result: "A slow start, a steep curve, a long reach.", effect: { flag: ["path", "tech"], skill: { study: 0.4 } } },
        { label: "Creative: voice, style, audience", result: "You will be seen. That is its own kind of work.", effect: { flag: ["path", "creative"], skill: { charisma: 0.4 } } },
        { label: "Professional: study toward medicine or law", result: "Years of books ahead, and a title at the end that no one can take.", effect: { flag: ["path", "professional"], skill: { study: 0.4 } } },
      ],
    },
    reward: { money: 2_000, rep: 1 },
  },
  {
    id: "s30-ready", chapter: 3, n: 30, emoji: "🚀", title: "Ready for the Next Level", place: "Your flat, Mushin",
    who: ["Everyone who helped you"],
    intro: "You look around the room that scared you a month ago. The bucket, the burner, the fan: they are all still here, but you are not who arrived. A knock at the door: Tunde, Ify, Funke, even Mr Bakare, holding a small cake.",
    dialogue: [
      ["Funke", "We saw how you moved. Do it again at the next level."],
      ["Mr Bakare", "I never say it twice: you are a good tenant."],
    ],
    requires: [{ done: "s29-lane" }],
    tasks: [{ text: "Build real standing (reputation 10)", cond: { rep: 10 } }, { text: "Hold ₦60,000 in cash", cond: { money: 60_000 } }],
    reward: { money: 5_000, rep: 3, skill: { hustle: 0.3, charisma: 0.3 } },
    next: "Chapter 4, Choosing Your Future, is next. It is planned but not playable yet.",
  },
];
