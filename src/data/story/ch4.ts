// Chapter 4 — Choosing Your Future (missions 31-40). The path you picked at mission 29 now shapes your missions.
// Slots 33, 35 and 38 each have four versions (business, tech, creative, professional); you play the one for your path.
// Nothing here is a dead end: mission 38 lets you change course.

import type { StoryMission } from "./types";

const on = (path: string) => [{ flag: "path", is: path }] as const;

export const ch4: StoryMission[] = [
  {
    id: "s31-advice", chapter: 4, n: 31, emoji: "☕", title: "Ask Someone Who Knows", place: "A buka near Yaba",
    who: ["Kunle", "Ify", "Tunde"],
    intro: "You have chosen a direction, and now the doubt arrives right on schedule. Over pepper soup, three people who have seen more than you offer three different maps.",
    dialogue: [
      ["Kunle", "Choose the road where you can stand being bad for two years."],
      ["Ify", "Choose the road where learning never stops being interesting."],
      ["Tunde", "Choose the road where somebody will pay you before you are perfect."],
    ],
    requires: [{ done: "s30-ready" }],
    tasks: [],
    choice: {
      prompt: "Whose advice do you carry into the next months?",
      options: [
        { label: "Kunle's: patience and a steady base", result: "Slow, solid, family-approved. You will not be flashy, but you will be hard to knock down.", effect: { bond: ["kunle", 10], flag: ["mentor", "kunle"] } },
        { label: "Ify's: depth over speed", result: "You sign up to learn properly. The skill will outlast the trend.", effect: { bond: ["ify", 10], skill: { study: 0.4 }, flag: ["mentor", "ify"] } },
        { label: "Tunde's: move first, polish later", result: "You will make mistakes quickly and cheaply. That is a fair trade.", effect: { bond: ["tunde", 10], skill: { hustle: 0.4 }, flag: ["mentor", "tunde"] } },
      ],
    },
    reward: { money: 2_000, rep: 1 },
  },
  {
    id: "s32-offers", chapter: 4, n: 32, emoji: "📨", title: "Two Offers", place: "Your phone",
    who: ["A recruiter", "A course organiser"],
    intro: "Two messages land within an hour of each other. One is a safe job at a company that pays on time. The other is a paid course that could open a better door in six months, if you can afford the wait.",
    dialogue: [
      ["Recruiter", "Salary is modest, but it is monthly, and monthly is a gift."],
      ["Organiser", "The course is ₦8,000. Graduates tend to get calls. Tend to."],
    ],
    requires: [{ done: "s31-advice" }],
    tasks: [],
    choice: {
      prompt: "Safety now, or growth later?",
      options: [
        { label: "Take the safe offer", result: "A steady sum lands. You sleep well and learn the office rules.", effect: { money: 4_000, flag: ["plan", "safe"] } },
        { label: "Pay for the course", result: "Your wallet complains. Your brain does not.", effect: { money: -8_000, skill: { study: 0.6, hustle: 0.3 }, flag: ["plan", "train"] } },
        { label: "Do neither, and keep saving", result: "You hold your position. Sometimes the right move is waiting.", effect: { rep: 1, flag: ["plan", "wait"] } },
      ],
    },
    reward: { money: 1_000 },
  },

  // ----- Mission 33: your path's first step -----
  {
    id: "s33a-ledger", alt: true, chapter: 4, n: 33, emoji: "📒", title: "Keep the Ledger Honest", place: "Your stall and your phone",
    who: ["Mama Ronke", "Chidi"],
    intro: "A business that does not know its numbers is just a loud hobby. Mama Ronke makes you write down every sale for a week, even the ₦50 ones.",
    dialogue: [["Mama Ronke", "Write it down. The day you stop is the day money starts to leak."]],
    requires: [{ done: "s32-offers" }, ...on("business")],
    tasks: [{ text: "Reach Hustle 3", cond: { skill: "hustle", n: 3 } }, { text: "Earn ₦12,000 across the week", cond: { do: "earned", n: 12_000 } }],
    reward: { money: 2_500, skill: { hustle: 0.3 }, rep: 1, flag: ["s33", "done"] },
  },
  {
    id: "s33b-first-code", alt: true, chapter: 4, n: 33, emoji: "💻", title: "Your First Real Line of Code", place: "The tech hub, Yaba",
    who: ["Ify"],
    intro: "The cursor blinks like it is waiting for you to be brave. Ify has set you a small project: a page that lists three things and does not crash.",
    dialogue: [["Ify", "Broken code is how everybody starts. The only crime is not running it."]],
    requires: [{ done: "s32-offers" }, ...on("tech")],
    tasks: [{ text: "Reach Study 3", cond: { skill: "study", n: 3 } }, { text: "Get a job in Tech", cond: { job: "tech" } }],
    reward: { money: 2_500, skill: { study: 0.3 }, rep: 1, flag: ["s33", "done"] },
  },
  {
    id: "s33c-sewing", alt: true, chapter: 4, n: 33, emoji: "🧵", title: "Needle and Nerve", place: "A tailor's workshop, Yaba",
    who: ["Mama Bisi (master tailor)"],
    intro: "Mama Bisi measures you with her eyes before you open your mouth. Her workshop hums with machines and gossip. 'Style is not a gift,' she says. 'It is a habit.'",
    dialogue: [["Mama Bisi", "Cut once, cut well. Customers remember how it fits, not how it was explained."]],
    requires: [{ done: "s32-offers" }, ...on("creative")],
    tasks: [{ text: "Join the fashion trade", cond: { job: "fashion" } }, { text: "Reach Charisma 2", cond: { skill: "charisma", n: 2 } }],
    reward: { money: 2_500, skill: { charisma: 0.3 }, rep: 1, flag: ["s33", "done"] },
  },
  {
    id: "s33d-books", alt: true, chapter: 4, n: 33, emoji: "📖", title: "The Long Library Nights", place: "Yaba library",
    who: ["Ify", "A final-year student"],
    intro: "Medicine and law do not take shortcuts. A final-year student at the next table explains the road: exams, years, supervisors, more exams. 'It is long,' she says. 'That is why it is respected.'",
    dialogue: [["Student", "Nobody remembers the nights. They remember the title."]],
    requires: [{ done: "s32-offers" }, ...on("professional")],
    tasks: [{ text: "Reach Study 4", cond: { skill: "study", n: 4 } }, { text: "Spend two sessions in the library", cond: { do: "library", n: 2 } }],
    reward: { money: 2_500, skill: { study: 0.3 }, rep: 1, flag: ["s33", "done"] },
  },
  {
    id: "s34-mummy", chapter: 4, n: 34, emoji: "🍲", title: "Sunday With Mummy", place: "Home, Mushin",
    who: ["Mummy", "Kunle"],
    intro: "Mummy cooks as though you might vanish if the pot is not full. Kunle is there too, pretending not to listen. Between bites she asks the question every parent asks: 'And what will this lead to?'",
    dialogue: [
      ["Mummy", "I only want to know you will be alright when I am not around to ask."],
      ["Kunle", "She means well. She always means well."],
    ],
    requires: [{ flag: "s33", is: "done" }],
    tasks: [{ text: "Be close to Mummy (relationship 70)", cond: { bond: "mummy", n: 70 } }],
    choice: {
      prompt: "How do you answer?",
      options: [
        { label: "Share the plan in detail and ask for her blessing", result: "She listens, corrects two things, and then blesses it all anyway.", effect: { bond: ["mummy", 8], rep: 1, flag: ["mummy3", "included"] } },
        { label: "Reassure her without details", result: "She smiles, unconvinced. The worry stays in the room.", effect: { flag: ["mummy3", "vague"] } },
      ],
    },
    reward: { money: 1_000 },
  },

  // ----- Mission 35: proving ground -----
  {
    id: "s35a-second-shop", alt: true, chapter: 4, n: 35, emoji: "🏬", title: "A Second Stall", place: "Mushin and Yaba",
    who: ["Tunde", "Chidi"],
    intro: "One stall proves you can sell. Two stalls prove you can run something. Tunde finds a spot in Yaba with good foot traffic and a landlord who talks too much.",
    dialogue: [["Tunde", "Two shops, one boss. Do not make the second shop a copy of the first. Learn from it."]],
    requires: [{ flag: "s33", is: "done" }, { done: "s34-mummy" }, ...on("business")],
    tasks: [{ text: "Own two businesses", cond: { biz: 2 } }],
    reward: { money: 3_500, skill: { hustle: 0.4 }, rep: 1, flag: ["s35", "done"] },
  },
  {
    id: "s35b-intern", alt: true, chapter: 4, n: 35, emoji: "🧑🏾‍💻", title: "The Probation Month", place: "A tech company, Yaba",
    who: ["Your team lead"],
    intro: "Standup at nine. A bug you did not cause lands on your desk anyway. Your team lead watches how you react, not just whether you fix it.",
    dialogue: [["Team lead", "Nobody is here to be perfect. We are here to ship and learn."]],
    requires: [{ flag: "s33", is: "done" }, { done: "s34-mummy" }, ...on("tech")],
    tasks: [{ text: "Be promoted in tech", cond: { job: "tech", level: 1 } }],
    reward: { money: 3_500, skill: { study: 0.4 }, rep: 1, flag: ["s35", "done"] },
  },
  {
    id: "s35c-showcase", alt: true, chapter: 4, n: 35, emoji: "👗", title: "The Showcase", place: "A pop-up fashion show, the Island",
    who: ["Mama Bisi", "A stylist"],
    intro: "Backstage smells of hairspray and panic. Your piece is third on the runway. The stylist adjusts your hem and whispers, 'Walk like it was always yours.'",
    dialogue: [["Stylist", "Fashion is nerves wearing confidence."]],
    requires: [{ flag: "s33", is: "done" }, { done: "s34-mummy" }, ...on("creative")],
    tasks: [{ text: "Get promoted in the trade", cond: { job: "fashion", level: 1 } }, { text: "Mingle at the lounge", cond: { do: "mingle" } }],
    reward: { money: 3_500, skill: { charisma: 0.4 }, rep: 2, flag: ["s35", "done"] },
  },
  {
    id: "s35d-exam", alt: true, chapter: 4, n: 35, emoji: "📝", title: "The First Big Exam", place: "A quiet exam hall",
    who: ["An invigilator"],
    intro: "Rows of desks, a ticking clock, a stranger's cough. You write until your wrist aches. When the invigilator calls time, half the hall exhales together.",
    dialogue: [["Invigilator", "Pens down. Whatever is on the page is on the page."]],
    requires: [{ flag: "s33", is: "done" }, { done: "s34-mummy" }, ...on("professional")],
    tasks: [{ text: "Reach Study 5", cond: { skill: "study", n: 5 } }, { text: "Read for the exam", cond: { do: "read-book", n: 2 } }],
    reward: { money: 3_500, skill: { study: 0.4 }, rep: 1, flag: ["s35", "done"] },
  },
  {
    id: "s36-setback", chapter: 4, n: 36, emoji: "⛈️", title: "A Bad Month", place: "Everywhere",
    who: ["Funke", "Mr Bakare"],
    intro: "Everything goes wrong in order: a phone screen cracks, a customer disappears with an unpaid bill, and the landlord raises a small fee. Nothing is fatal. All of it together is heavy.",
    dialogue: [["Funke", "Bad months come with everyone's name on them. Yours just arrived."]],
    requires: [{ flag: "s35", is: "done" }],
    tasks: [],
    choice: {
      prompt: "How do you absorb it?",
      options: [
        { label: "Cover it from savings and move on", result: "It stings. You stay steady and learn what an emergency fund is for.", effect: { money: -3_000, rep: 1, flag: ["setback", "paid"] } },
        { label: "Cut back for a while and ask friends for help", result: "A friend covers some of it. You owe them a favour and a thank-you.", effect: { bond: ["funke", 6], flag: ["setback", "helped"] } },
        { label: "Take a bit of extra work for a week", result: "Tired, but the balance recovers. Effort is a currency too.", effect: { skill: { hustle: 0.3 }, flag: ["setback", "worked"] } },
      ],
    },
    reward: { money: 1_000, rep: 1 },
  },
  {
    id: "s37-mentor", chapter: 4, n: 37, emoji: "🧭", title: "The Mentor's Test", place: "Wherever your mentor is",
    who: ["Your mentor"],
    intro: "Your mentor does not call to check in. They call when they want to see what you do with a hard problem. Today it is a real one, with a real cost.",
    dialogue: [["Mentor", "I will not tell you what to do. I will tell you what I would watch."]],
    requires: [{ flag: "s35", is: "done" }, { done: "s36-setback" }],
    tasks: [{ text: "Be someone worth trusting (reputation 12)", cond: { rep: 12 } }],
    choice: {
      prompt: "The test: a shortcut would save you a month, but it bends a rule.",
      options: [
        { label: "Take the long, honest way", result: "Your mentor says nothing, and later tells someone else about you.", effect: { rep: 3, flag: ["integrity", "high"] } },
        { label: "Take the shortcut and hope it stays quiet", result: "It saves time. Some doors you walk past later will not open.", effect: { money: 3_000, rep: -2, flag: ["integrity", "low"] } },
      ],
    },
    reward: { money: 1_500 },
  },

  // ----- Mission 38: the decision point (you may change course here) -----
  {
    id: "s38a-partner", alt: true, chapter: 4, n: 38, emoji: "🤝", title: "Partner or Alone?", place: "A Victoria Island lounge",
    who: ["An investor"],
    intro: "An investor has seen your numbers and wants a slice. 'I bring money and contacts,' he says. 'You bring the work. Fair?'",
    dialogue: [["Investor", "A smaller piece of something big beats all of something small."]],
    requires: [{ done: "s37-mentor" }, ...on("business")],
    tasks: [],
    choice: {
      prompt: "What do you do with the offer?",
      options: [
        { label: "Accept the partnership", result: "Cash arrives, and so does someone who has opinions about everything.", effect: { money: 15_000, rep: 1, flag: ["s38", "partner"] } },
        { label: "Stay independent and grow slowly", result: "Slower, but yours. Nobody else owns the story.", effect: { skill: { hustle: 0.4 }, flag: ["s38", "solo"] } },
        { label: "Change course: this is not for me", result: "You step back, and a new road comes into view. Starting again is not failing.", effect: { flag: ["path", "creative"] } },
      ],
    },
    reward: { money: 2_000, flag: ["s38done", "yes"] },
  },
  {
    id: "s38b-offer", alt: true, chapter: 4, n: 38, emoji: "🚀", title: "A Startup Calls", place: "A tech hub, Yaba",
    who: ["A founder"],
    intro: "A small startup wants you full-time. Equity, not much salary, a dream and a deadline. Your current job pays better, today.",
    dialogue: [["Founder", "We might disappear in a year. Or we might not. Come find out."]],
    requires: [{ done: "s37-mentor" }, ...on("tech")],
    tasks: [],
    choice: {
      prompt: "Security or a gamble?",
      options: [
        { label: "Join the startup", result: "Long nights, bigger lessons. If it works, you were there at the start.", effect: { skill: { study: 0.5 }, rep: 1, flag: ["s38", "startup"] } },
        { label: "Stay and keep growing in your current role", result: "Safer, steadier, less thrilling. Both are good lives.", effect: { money: 3_000, flag: ["s38", "stay"] } },
        { label: "Change course: try business instead", result: "You close the laptop, open a notebook, and start planning a stall.", effect: { flag: ["path", "business"] } },
      ],
    },
    reward: { money: 2_000, flag: ["s38done", "yes"] },
  },
  {
    id: "s38c-contract", alt: true, chapter: 4, n: 38, emoji: "🎤", title: "The First Contract", place: "A manager's office, the Island",
    who: ["A talent manager"],
    intro: "A manager slides a contract across the table. The upside is shiny. The small print is not. 'Everyone signs,' she says. 'Few read.'",
    dialogue: [["Manager", "I will make you known. You will pay for it. That is how this works."]],
    requires: [{ done: "s37-mentor" }, ...on("creative")],
    tasks: [],
    choice: {
      prompt: "What do you do with the contract?",
      options: [
        { label: "Ask for a week and have a lawyer friend read it", result: "She sighs, but respects it. The terms improve slightly.", effect: { rep: 2, flag: ["s38", "careful"] } },
        { label: "Sign now and ride the momentum", result: "Doors open quickly. Some of them are not yours to close.", effect: { money: 5_000, rep: 1, flag: ["s38", "signed"] } },
        { label: "Change course: work on something steadier", result: "You walk out lighter. A new plan begins with a clean page.", effect: { flag: ["path", "professional"] } },
      ],
    },
    reward: { money: 2_000, flag: ["s38done", "yes"] },
  },
  {
    id: "s38d-apply", alt: true, chapter: 4, n: 38, emoji: "🏫", title: "The Application", place: "Your desk, late at night",
    who: ["Ify", "Kunle"],
    intro: "The application form is longer than your CV. Two fields give you pause: personal statement and referees. Kunle offers to read your draft. Ify offers to be harsh about it.",
    dialogue: [["Ify", "Be specific. 'I want to help people' is on every form. Why you?"]],
    requires: [{ done: "s37-mentor" }, ...on("professional")],
    tasks: [],
    choice: {
      prompt: "How do you write the statement?",
      options: [
        { label: "Tell your real story, rough edges and all", result: "It reads like a person. The reviewers remember people.", effect: { rep: 2, flag: ["s38", "honest"] } },
        { label: "Write a polished, safe version", result: "Clean and forgettable. It will pass, but it will not shine.", effect: { skill: { study: 0.3 }, flag: ["s38", "safe"] } },
        { label: "Change course: try tech instead", result: "You close the form and open a code editor. Curiosity changes direction easily.", effect: { flag: ["path", "tech"] } },
      ],
    },
    reward: { money: 2_000, flag: ["s38done", "yes"] },
  },
  {
    id: "s39-circle", chapter: 4, n: 39, emoji: "🫂", title: "Who Came With You", place: "Mushin, evening",
    who: ["Tunde", "Ify", "Funke", "Chidi"],
    intro: "A quiet evening on the compound steps. Everyone who has shown up in the last months is here, in some form. You count the people you can call at midnight and are surprised by the number.",
    dialogue: [["Funke", "It is not only about who is above you. It is about who is beside you."]],
    requires: [{ flag: "s38done", is: "yes" }],
    tasks: [{ text: "Keep a good name (reputation 14)", cond: { rep: 14 } }],
    choice: {
      prompt: "How do you invest in the people around you?",
      options: [
        { label: "Organise a small gathering and pay for it", result: "Laughter, jollof, an old story told badly. It costs a little and returns a lot.", effect: { money: -3_000, bond: ["tunde", 6], rep: 2, flag: ["circle", "hosted"] } },
        { label: "Check in with each person quietly, one by one", result: "Short calls, real talk. Nobody forgets who called.", effect: { bond: ["ify", 6], rep: 1, flag: ["circle", "personal"] } },
      ],
    },
    reward: { money: 1_000, rep: 1 },
  },
  {
    id: "s40-chosen", chapter: 4, n: 40, emoji: "🛤️", title: "The Chosen Road", place: "Your flat, Mushin",
    who: ["Everyone"],
    intro: "You lay out the last four months like cards: the offers, the failures, the people, the decisions. The road you are on is not the one you imagined, and it is yours. The map for Chapter 5 will be drawn by what you do next.",
    dialogue: [["You", "I know what I am building. Now I have to be worth it."]],
    requires: [{ done: "s39-circle" }],
    tasks: [{ text: "Hold ₦90,000 in cash", cond: { money: 90_000 } }, { text: "Be known (reputation 16)", cond: { rep: 16 } }],
    reward: { money: 8_000, rep: 3, skill: { hustle: 0.3, study: 0.3, charisma: 0.3 } },
    next: "Chapter 5, Building a Reputation, is planned but not playable yet.",
  },
];
