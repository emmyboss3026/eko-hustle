// Chapter 9 — At the Top (missions 81-90). Major achievements and high-stakes decisions.
// Slots 82, 85 and 88 have four versions (business, tech, creative, professional).
// Mission 84 has three versions, picked by how you handled the politician in Chapter 8 (mission 74).

import type { StoryMission } from "./types";

const on = (path: string) => [{ flag: "path", is: path }] as const;
const pol = (v: string) => [{ flag: "politics", is: v }] as const;

export const ch9: StoryMission[] = [
  {
    id: "s81-cover", chapter: 9, n: 81, emoji: "📸", title: "The Cover Story", place: "A magazine studio, the Island",
    who: ["An editor", "A photographer"],
    intro: "A national magazine wants you on the cover. The photographer tells you where to stand. The editor asks what you want people to know. Behind the lights, someone you went to school with whispers, 'Look at you.'",
    dialogue: [["Editor", "People do not just read your story. They decide whether to believe it."]],
    requires: [{ done: "s80-mark" }],
    tasks: [{ text: "Hold a famous name (reputation 48)", cond: { rep: 48 } }],
    choice: {
      prompt: "How much of your life do you share?",
      options: [
        { label: "Talk openly about the work and the people who helped, and keep the rest private", result: "The piece is warm and specific. People thank you for not pretending.", effect: { rep: 3, bond: ["mummy", 6], flag: ["fame", "bounded"] } },
        { label: "Share everything: the money, the home, the lifestyle", result: "It makes for a glossy cover and a sharp public. Strangers start to feel entitled to you.", effect: { money: 8_000, rep: 1, flag: ["fame", "open"] } },
        { label: "Decline the personal questions altogether", result: "Mysterious and slightly cold. The piece is short, and your work does the talking.", effect: { rep: 2, flag: ["fame", "private"] } },
      ],
    },
    reward: { money: 3_000 },
  },

  // ----- Mission 82: your peak achievement -----
  {
    id: "s82a-flagship", alt: true, chapter: 9, n: 82, emoji: "🏢", title: "The Flagship Opens", place: "A new head office, Lagos",
    who: ["Your team", "Tunde", "Mummy"],
    intro: "A tower with your name on the third floor, and a ribbon you are supposed to cut with oversized scissors. Tunde stands at the back, grinning like he built it himself. Mummy sits in the front row with her handbag on her knees.",
    dialogue: [["Tunde", "From a bucket bath in Mushin to this. Do not you dare act humble."]],
    requires: [{ done: "s81-cover" }, ...on("business")],
    tasks: [{ text: "Own three businesses", cond: { biz: 3 } }, { text: "Earn ₦60,000 to fund the launch", cond: { do: "earned", n: 60_000 } }],
    reward: { money: 8_000, skill: { hustle: 0.3 }, rep: 2, flag: ["s82", "done"] },
  },
  {
    id: "s82b-million", alt: true, chapter: 9, n: 82, emoji: "📱", title: "A Million Users", place: "Your tech company",
    who: ["Your team", "Ify"],
    intro: "A counter on the office wall flips to 1,000,000. Someone brings out a cake. Ify raises a plastic cup. You remember her first lesson in the hub: 'Open a tab, learn one thing.' You have learned more than one.",
    dialogue: [["Ify", "A million people use something you made. Be a little proud."]],
    requires: [{ done: "s81-cover" }, ...on("tech")],
    tasks: [{ text: "Reach Study 9", cond: { skill: "study", n: 9 } }, { text: "Earn ₦60,000 from product work", cond: { do: "earned", n: 60_000 } }],
    reward: { money: 8_000, skill: { study: 0.3 }, rep: 2, flag: ["s82", "done"] },
  },
  {
    id: "s82c-prize", alt: true, chapter: 9, n: 82, emoji: "🏆", title: "Prize Night", place: "A grand hall, the Island",
    who: ["Mama Bisi", "The audience"],
    intro: "The envelope is opened, the pause stretches, and the host says your name wrong, then right. Mama Bisi, in the third row, is already crying. You walk to the stage with legs that do not feel like yours.",
    dialogue: [["Host", "The prize for lasting influence goes to..."]],
    requires: [{ done: "s81-cover" }, ...on("creative")],
    tasks: [{ text: "Reach Charisma 8", cond: { skill: "charisma", n: 8 } }, { text: "Earn ₦60,000 from your craft", cond: { do: "earned", n: 60_000 } }],
    reward: { money: 8_000, skill: { charisma: 0.3 }, rep: 2, flag: ["s82", "done"] },
  },
  {
    id: "s82d-landmark", alt: true, chapter: 9, n: 82, emoji: "🏅", title: "The Landmark", place: "A hospital or a courtroom",
    who: ["Your team", "An affected family"],
    intro: "A procedure, a ruling, or a case that people will cite for years. The work was tense, careful and long. The family you helped does not know the legal or technical words. They only know the relief.",
    dialogue: [["Family member", "We cannot pay you back. We can only say thank you."]],
    requires: [{ done: "s81-cover" }, ...on("professional")],
    tasks: [{ text: "Reach Study 9", cond: { skill: "study", n: 9 } }, { text: "Study two more sessions", cond: { do: "library", n: 2 } }],
    reward: { money: 8_000, skill: { study: 0.3 }, rep: 2, flag: ["s82", "done"] },
  },
  {
    id: "s83-crown", chapter: 9, n: 83, emoji: "👑", title: "Heavy Is the Crown", place: "Your office, late",
    who: ["Your assistant", "Ify"],
    intro: "More attention means more threats: anonymous emails, a stranger outside your gate, a stolen idea posted online. Your assistant has started screening your calls. Ify says the only way to survive is to stay unremarkable to the people who love you.",
    dialogue: [["Ify", "Fame is a costume. Do not forget what is under it."]],
    requires: [{ flag: "s82", is: "done" }],
    tasks: [],
    choice: {
      prompt: "How do you handle the pressure?",
      options: [
        { label: "Hire quiet, professional security and keep your habits", result: "A small, sensible cost. You can still walk to the market on Saturdays.", effect: { money: -8_000, rep: 1, flag: ["crown", "secured"] } },
        { label: "Withdraw from public life for a while", result: "A strange quiet. It helps, and it makes you wonder who you are without the audience.", effect: { mood: "wellRested", flag: ["crown", "withdrew"] } },
        { label: "Ignore it and trust people", result: "You stay open and exposed. Mostly it is fine, and one time it is not.", effect: { rep: 1, flag: ["crown", "open"] } },
      ],
    },
    reward: { money: 2_000, flag: ["s83done", "yes"] },
  },

  // ----- Mission 84: your answer to the politician comes back -----
  {
    id: "s84a-clean", alt: true, chapter: 9, n: 84, emoji: "🧼", title: "Clean Hands", place: "A press conference",
    who: ["A journalist", "A regulator"],
    intro: "A scandal engulfs your industry, and a dozen names are mentioned in the press. Yours is not one of them. A journalist notices and asks why. You think of the politician's folder and the answer you gave.",
    dialogue: [["Journalist", "You said no, years ago. Do you ever regret it?"]],
    requires: [{ flag: "s83done", is: "yes" }, ...pol("out")],
    tasks: [{ text: "Hold a respected name (reputation 50)", cond: { rep: 50 } }],
    choice: {
      prompt: "How do you answer?",
      options: [
        { label: "Say that the line was easier to hold early than late", result: "It is quoted widely. Younger people write it on their desks.", effect: { rep: 4, flag: ["s84", "done"] } },
        { label: "Decline to comment and let the record speak", result: "Quiet, dignified, and still effective.", effect: { rep: 2, flag: ["s84", "done"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s84", "done"] },
  },
  {
    id: "s84b-hearing", alt: true, chapter: 9, n: 84, emoji: "🏛️", title: "The Hearing", place: "A committee room",
    who: ["A committee chair", "A lawyer"],
    intro: "You are invited to explain the community projects you helped fund. The politician's name appears in the file several times. Yours appears twice. The chair is polite, and the room is cold.",
    dialogue: [["Chair", "We only want to understand how the money moved."]],
    requires: [{ flag: "s83done", is: "yes" }, ...pol("projects")],
    tasks: [{ text: "Hold a respected name (reputation 50)", cond: { rep: 50 } }],
    choice: {
      prompt: "How do you answer?",
      options: [
        { label: "Show your receipts and records, and answer everything plainly", result: "You are thanked and dismissed. Your records become the example others are asked to follow.", effect: { rep: 4, flag: ["s84", "done"] } },
        { label: "Answer only what is asked, and no more", result: "Technically fine. The chair writes a longer note than you would like.", effect: { rep: 1, flag: ["s84", "done"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s84", "done"] },
  },
  {
    id: "s84c-scandal", alt: true, chapter: 9, n: 84, emoji: "🧨", title: "Guilt by Photograph", place: "Social media, then everywhere",
    who: ["A journalist", "Your lawyer"],
    intro: "The politician you endorsed years ago is arrested, and the internet digs up the photograph of you shaking his hand. Strangers who never read your work are suddenly experts on your character.",
    dialogue: [["Lawyer", "You cannot erase the photograph. You can decide what happens next."]],
    requires: [{ flag: "s83done", is: "yes" }, ...pol("endorsed")],
    tasks: [{ text: "Keep a name to defend (reputation 50)", cond: { rep: 50 } }],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Own the mistake publicly and return what you gained", result: "It is humbling, and costly. It is also the end of the story. People respect the correction.", effect: { money: -15_000, rep: 4, flag: ["s84", "done"] } },
        { label: "Give a careful statement, and let the lawyers handle the rest", result: "It reduces the heat without ending it. The story lingers.", effect: { money: -4_000, rep: 1, flag: ["s84", "done"] } },
        { label: "Deny any real connection", result: "The photographs are still there. The denial is now part of the story.", effect: { rep: -3, flag: ["s84", "done"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s84", "done"] },
  },

  // ----- Mission 85: the high-stakes decision on your path -----
  {
    id: "s85a-listing", alt: true, chapter: 9, n: 85, emoji: "🏦", title: "Go Public?", place: "A boardroom, Lagos",
    who: ["Your board", "A banker"],
    intro: "Your banker lays out a plan to list the company on the stock exchange. Fresh capital, public scrutiny, and a hundred shareholders who will have opinions. Your oldest staff nervously ask if their jobs will change.",
    dialogue: [["Banker", "Going public makes you bigger and less private. Both are real."]],
    requires: [{ flag: "s84", is: "done" }, ...on("business")],
    tasks: [{ text: "Hold ₦350,000 as a cushion for the process", cond: { money: 350_000 } }],
    choice: {
      prompt: "What do you decide?",
      options: [
        { label: "List, and reserve shares for your staff", result: "Employees become part-owners. The day the bell rings, a cleaner cries with joy.", effect: { money: 30_000, rep: 4, flag: ["s85pick", "listed-staff"] } },
        { label: "List and keep control for yourself", result: "Capital flows in and the board is yours. Some staff feel left out.", effect: { money: 40_000, rep: 1, flag: ["s85pick", "listed"] } },
        { label: "Stay private and grow at your own pace", result: "Slower, steadier, and free of quarterly pressure.", effect: { rep: 2, skill: { hustle: 0.4 }, flag: ["s85pick", "private"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s85", "done"] },
  },
  {
    id: "s85b-line", alt: true, chapter: 9, n: 85, emoji: "🧠", title: "Where to Draw the Line", place: "Your product review",
    who: ["Your head of product", "Ify"],
    intro: "A feature would double your growth and quietly nudge users toward choices that are not good for them. It is legal. It tests well. Your head of product says it is a no-brainer, and Ify says it is a brain you should keep using.",
    dialogue: [["Ify", "Just because you can does not mean the user wins."]],
    requires: [{ flag: "s84", is: "done" }, ...on("tech")],
    tasks: [{ text: "Hold ₦350,000 as a cushion", cond: { money: 350_000 } }],
    choice: {
      prompt: "What do you decide?",
      options: [
        { label: "Cancel it and publish your reasons", result: "Growth slows, trust deepens. Other firms quietly copy the decision.", effect: { money: -10_000, rep: 4, flag: ["s85pick", "cancelled"] } },
        { label: "Ship a safer version, with opt-outs", result: "Less dramatic, still useful. A decent compromise.", effect: { rep: 2, skill: { study: 0.4 }, flag: ["s85pick", "safer"] } },
        { label: "Ship it as designed", result: "Numbers jump. A year later, the press asks hard questions.", effect: { money: 25_000, rep: -3, flag: ["s85pick", "shipped"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s85", "done"] },
  },
  {
    id: "s85c-legacy", alt: true, chapter: 9, n: 85, emoji: "🧵", title: "Legacy or Volume", place: "Your studio, Yaba",
    who: ["Mama Bisi", "A retail buyer"],
    intro: "A huge retailer wants to mass-produce your signature line. Millions of pieces, thin margins, and your name on every tag. Mama Bisi, in her chair by the window, tilts her head: 'Do you want to be worn, or remembered?'",
    dialogue: [["Mama Bisi", "There is no wrong answer. There is only the one you can live with."]],
    requires: [{ flag: "s84", is: "done" }, ...on("creative")],
    tasks: [{ text: "Hold ₦350,000 as a cushion", cond: { money: 350_000 } }],
    choice: {
      prompt: "What do you decide?",
      options: [
        { label: "Sign a limited deal that keeps quality and ethics", result: "A smaller number, a proud tag, and workers paid fairly.", effect: { money: 15_000, rep: 4, flag: ["s85pick", "ethical"] } },
        { label: "Take the huge deal", result: "Your name is everywhere. So are the shortcuts.", effect: { money: 40_000, rep: -1, flag: ["s85pick", "mass"] } },
        { label: "Decline and stay small, bespoke and rare", result: "Exclusive and lasting. You will never be everywhere, and that is the point.", effect: { rep: 3, skill: { charisma: 0.3 }, flag: ["s85pick", "rare"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s85", "done"] },
  },
  {
    id: "s85d-whistle", alt: true, chapter: 9, n: 85, emoji: "📣", title: "The Quiet Problem", place: "A senior meeting",
    who: ["A senior colleague", "A junior"],
    intro: "A junior comes to you at the end of the day, shaking, with proof that your institution has been hiding a problem that hurts the people it exists to serve. Telling the truth will cost you allies. Staying quiet will cost others more.",
    dialogue: [["Junior", "I do not know who else to tell. I think you are the only one who will listen."]],
    requires: [{ flag: "s84", is: "done" }, ...on("professional")],
    tasks: [{ text: "Hold ₦350,000 as a cushion", cond: { money: 350_000 } }],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Take it to the proper authority and protect the junior", result: "A hard few months. The problem is fixed and the junior keeps her career.", effect: { rep: 4, skill: { study: 0.3 }, flag: ["s85pick", "reported"] } },
        { label: "Raise it internally and give leadership time to act", result: "A softer path. Some of it is fixed. Some of it is slower.", effect: { rep: 2, flag: ["s85pick", "internal"] } },
        { label: "Advise the junior to leave it alone", result: "You keep your peace. You carry the question for years.", effect: { rep: -3, flag: ["s85pick", "silent"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s85", "done"] },
  },
  {
    id: "s86-reunion", chapter: 9, n: 86, emoji: "🍻", title: "The Old Gang", place: "A rooftop in Yaba",
    who: ["Tunde", "Ify", "Sule", "Funke"],
    intro: "A decade later, the rooftop is the same and almost nothing else is. Tunde has three businesses and a stutter of nerves. Ify has a company and a baby. Sule has a gym with your name in its thank-you wall. Funke brings jollof and the unspoken truth that you all made it, in different ways.",
    dialogue: [["Tunde", "Do not you dare think this is the end. We are still the ones who started small."]],
    requires: [{ flag: "s85", is: "done" }],
    tasks: [],
    choice: {
      prompt: "What do you offer this circle?",
      options: [
        { label: "Invest in each of their next steps, quietly", result: "Nobody mentions it. Everybody knows.", effect: { money: -20_000, bond: ["tunde", 8], rep: 3, flag: ["circle2", "invested"] } },
        { label: "Plan a yearly gathering and keep it sacred", result: "A small tradition that outlasts every deal.", effect: { bond: ["ify", 8], rep: 2, flag: ["circle2", "tradition"] } },
      ],
    },
    reward: { money: 1_500 },
  },
  {
    id: "s87-scare", chapter: 9, n: 87, emoji: "🩺", title: "The Doctor's Warning", place: "A private clinic, Ikeja",
    who: ["Your doctor", "Sule"],
    intro: "Your doctor looks at the test results longer than usual. She says, kindly, 'Nothing is wrong yet. Everything is heading that way.' Years of skipped meals, short sleep and long travel have written a bill.",
    dialogue: [["Doctor", "You have been taking care of everything except yourself."]],
    requires: [{ done: "s86-reunion" }],
    tasks: [{ text: "Do some real exercise", cond: { do: "jog" } }],
    choice: {
      prompt: "What do you change?",
      options: [
        { label: "Rebuild your routine: sleep, food and movement come first", result: "It feels slow and boring. A year later your bloodwork is excellent.", effect: { money: -4_000, skill: { fitness: 0.6 }, mood: "gymGlow", flag: ["scare", "rebuilt"] } },
        { label: "Make a few easy changes and keep the rest", result: "A balanced, doable plan. You will have to keep it.", effect: { skill: { fitness: 0.3 }, flag: ["scare", "some"] } },
        { label: "Promise yourself you will deal with it later", result: "Later has a way of arriving.", effect: { mood: "goSlow", flag: ["scare", "later"] } },
      ],
    },
    reward: { money: 1_000 },
  },

  // ----- Mission 88: pass the torch -----
  {
    id: "s88a-ceo", alt: true, chapter: 9, n: 88, emoji: "🪪", title: "Name a Successor", place: "Your boardroom",
    who: ["Your general manager", "Your board"],
    intro: "You do not have to run it forever. Your general manager is ready, and your board is nervous. 'If you step back,' one says, 'someone has to be allowed to disagree with you.'",
    dialogue: [["Board member", "The test of a founder is what happens after they walk out of the room."]],
    requires: [{ done: "s87-scare" }, ...on("business")],
    tasks: [],
    choice: {
      prompt: "What do you decide?",
      options: [
        { label: "Promote her to CEO, and become chair", result: "It is hard to hand over the keys. The company breathes.", effect: { money: 5_000, rep: 4, flag: ["s88", "handed"] } },
        { label: "Share leadership with a co-CEO structure", result: "Two voices, and sometimes two opinions. It works with patience.", effect: { rep: 2, skill: { hustle: 0.3 }, flag: ["s88", "shared"] } },
        { label: "Stay in charge a few more years", result: "You keep the steering wheel. The deputy's patience has an end.", effect: { rep: 0, flag: ["s88", "stayed"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s88done", "yes"] },
  },
  {
    id: "s88b-cto", alt: true, chapter: 9, n: 88, emoji: "🧬", title: "A New Technical Lead", place: "Your tech company",
    who: ["Your senior developer", "Ify"],
    intro: "Your best engineer has outgrown being your best engineer. She wants the technical lead role, and she wants your trust. You remember the junior in the hub, the first time someone gave you one.",
    dialogue: [["Developer", "I am not asking to replace you. I am asking to be able to say no to you."]],
    requires: [{ done: "s87-scare" }, ...on("tech")],
    tasks: [],
    choice: {
      prompt: "What do you decide?",
      options: [
        { label: "Make her CTO with real authority", result: "She challenges you in the first week. It is the best thing that has happened to the product.", effect: { money: 5_000, rep: 4, flag: ["s88", "handed"] } },
        { label: "Give her the role, with a safety net of reviews", result: "A cautious handover. Slower, safer, a little less generous.", effect: { rep: 2, skill: { study: 0.3 }, flag: ["s88", "reviewed"] } },
        { label: "Keep the technical lead yourself", result: "You stay hands-on. Your best engineer starts to look at other offers.", effect: { rep: 0, flag: ["s88", "stayed"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s88done", "yes"] },
  },
  {
    id: "s88c-protege", alt: true, chapter: 9, n: 88, emoji: "🎨", title: "Your Protégée's Collection", place: "A runway, Lagos",
    who: ["Your protégée", "Mama Bisi"],
    intro: "The lights go down and the music starts. The first look is not yours. It is your protégée's, and it is better than anything you made at her age. Mama Bisi squeezes your hand: 'Look what we made.'",
    dialogue: [["Mama Bisi", "The best compliment is when they stop needing you."]],
    requires: [{ done: "s87-scare" }, ...on("creative")],
    tasks: [],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Give her your platform and step back", result: "She becomes known on her own terms. You become a legend for a different reason.", effect: { rep: 4, skill: { charisma: 0.3 }, flag: ["s88", "handed"] } },
        { label: "Co-present her work under both names", result: "A bridge between generations. A little crowded, mostly kind.", effect: { rep: 2, flag: ["s88", "shared"] } },
        { label: "Keep the spotlight", result: "Everyone sees it. She learns what to avoid.", effect: { rep: -1, flag: ["s88", "stayed"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s88done", "yes"] },
  },
  {
    id: "s88d-train", alt: true, chapter: 9, n: 88, emoji: "🎓", title: "The Next Generation", place: "A teaching hall",
    who: ["A cohort of trainees", "A mentor"],
    intro: "Your mentor, much older now, asks you to take over the training of the next cohort. Twenty bright, nervous faces look up at you. One of them asks the question you asked once: 'How do I know I am good enough?'",
    dialogue: [["Mentor", "Teach them what you wish someone had told you."]],
    requires: [{ done: "s87-scare" }, ...on("professional")],
    tasks: [],
    choice: {
      prompt: "How do you teach?",
      options: [
        { label: "Make it about judgement and ethics, not only technique", result: "They ask harder questions. Three of them change how their departments work.", effect: { rep: 4, skill: { study: 0.3 }, flag: ["s88", "handed"] } },
        { label: "Make it rigorous and exam-focused", result: "Pass rates climb. It is practical and a bit joyless.", effect: { rep: 2, flag: ["s88", "rigorous"] } },
        { label: "Delegate the teaching and stay in practice", result: "You keep your hands in the work, and the cohort feels the distance.", effect: { rep: 0, flag: ["s88", "stayed"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s88done", "yes"] },
  },
  {
    id: "s89-letter", chapter: 9, n: 89, emoji: "✉️", title: "A Letter to the Kid in Mushin", place: "Your desk, early morning",
    who: ["You"],
    intro: "You pull out a sheet of paper and start with 'Dear you, at the gate with a bucket'. It takes three hours and six drafts. You do not say much about the money.",
    dialogue: [["You", "You do not have to become somebody else. You just have to keep becoming yourself."]],
    requires: [{ flag: "s88done", is: "yes" }],
    tasks: [{ text: "Hold ₦380,000 in cash", cond: { money: 380_000 } }],
    choice: {
      prompt: "What do you tell your younger self?",
      options: [
        { label: "Be kinder to yourself, and call home more", result: "You fold the paper and put it in a drawer with Mummy's old letters.", effect: { bond: ["mummy", 10], rep: 2, flag: ["letter", "kind"] } },
        { label: "Take the risks earlier, you were too careful", result: "You smile. You also know you would not have listened.", effect: { skill: { hustle: 0.4 }, flag: ["letter", "bold"] } },
        { label: "Keep going. It is all worth it", result: "Simple, true, and enough.", effect: { rep: 2, flag: ["letter", "keepgoing"] } },
      ],
    },
    reward: { money: 1_500 },
  },
  {
    id: "s90-top", chapter: 9, n: 90, emoji: "🏔️", title: "At the Top", place: "A rooftop above Lagos, early morning",
    who: ["The people who were there"],
    intro: "The sun comes up over a city that is still trying to be everything at once. You stand at the edge of a rooftop you once thought of only from the street, and you are surprised to find that the view is not the point. The people behind you are.",
    dialogue: [["Mummy", "My child, you did not just climb. You carried."]],
    requires: [{ done: "s89-letter" }],
    tasks: [{ text: "Hold ₦400,000 in cash", cond: { money: 400_000 } }, { text: "Hold a name that carries weight (reputation 50)", cond: { rep: 50 } }],
    reward: { money: 18_000, rep: 3, skill: { hustle: 0.3, study: 0.3, charisma: 0.3 } },
    next: "Chapter 10, Your Legacy, is planned but not playable yet.",
  },
];
