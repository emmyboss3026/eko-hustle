// Chapter 8 — Making Your Mark (missions 71-80). Leadership, influence, wealth and personal development.
// Slots 72, 75 and 78 have four versions (business, tech, creative, professional).
// Mission 76 has three versions, picked by the value you committed to in Chapter 7 (mission 69).

import type { StoryMission } from "./types";

const on = (path: string) => [{ flag: "path", is: path }] as const;
const val = (v: string) => [{ flag: "values", is: v }] as const;

export const ch8: StoryMission[] = [
  {
    id: "s71-lead", chapter: 8, n: 71, emoji: "🧭", title: "Now You Are the Boss", place: "Your office, Lagos",
    who: ["Your team"],
    intro: "For years you reported to someone. Now six people look at you before they decide how to feel about a Monday. Everything you say carries more weight than you meant it to.",
    dialogue: [["Team member", "We are not scared of you. We just want to know what kind of boss you will be."]],
    requires: [{ done: "s70-cost" }],
    tasks: [{ text: "Hold a leader's name (reputation 40)", cond: { rep: 40 } }],
    choice: {
      prompt: "How will you lead?",
      options: [
        { label: "Listen first, decide second", result: "Meetings get longer and decisions get better. People say what they really think.", effect: { rep: 2, skill: { charisma: 0.4 }, flag: ["style", "listen"] } },
        { label: "Decide fast and explain afterwards", result: "Things move quickly. Some people feel steamrolled, and some feel relieved.", effect: { skill: { hustle: 0.4 }, flag: ["style", "fast"] } },
        { label: "Give people ownership and stay out of the way", result: "Mistakes happen. So does brilliance. Trust compounds.", effect: { rep: 2, skill: { study: 0.3 }, flag: ["style", "delegate"] } },
      ],
    },
    reward: { money: 3_000 },
  },

  // ----- Mission 72: build the organisation -----
  {
    id: "s72a-manager", alt: true, chapter: 8, n: 72, emoji: "🧑🏾‍💼", title: "The Manager Who Is Not You", place: "Your flagship shop",
    who: ["A new general manager", "Tunde"],
    intro: "You hire a general manager who is better at logistics than you will ever be. On day one she rearranges your counters and your calendar. You want to object, and then you see the queue move faster.",
    dialogue: [["Manager", "Let me run the day. You run the future."]],
    requires: [{ done: "s71-lead" }, ...on("business")],
    tasks: [{ text: "Own three businesses", cond: { biz: 3 } }, { text: "Earn ₦40,000 while stepping back", cond: { do: "earned", n: 40_000 } }],
    reward: { money: 5_000, skill: { hustle: 0.3 }, rep: 1, flag: ["s72", "done"] },
  },
  {
    id: "s72b-culture", alt: true, chapter: 8, n: 72, emoji: "🧪", title: "Write the Engineering Handbook", place: "Your tech company",
    who: ["Your senior developer", "A new junior"],
    intro: "A junior asks, 'How do we decide things here?' Nobody can answer. You realise the company has a culture, and it is mostly accidental. You decide to write it down on purpose.",
    dialogue: [["Developer", "Culture is what happens when you are not in the room."]],
    requires: [{ done: "s71-lead" }, ...on("tech")],
    tasks: [{ text: "Reach Study 8", cond: { skill: "study", n: 8 } }, { text: "Earn ₦40,000 from product work", cond: { do: "earned", n: 40_000 } }],
    reward: { money: 5_000, skill: { study: 0.3 }, rep: 1, flag: ["s72", "done"] },
  },
  {
    id: "s72c-studio", alt: true, chapter: 8, n: 72, emoji: "🏠", title: "Open the Studio", place: "A new studio, Yaba",
    who: ["Mama Bisi", "Your apprentices"],
    intro: "A real studio, with your name over the door and six apprentices who copy the way you hold a pair of scissors. Mama Bisi comes for the opening and says nothing for ten minutes, then: 'It is yours now. Be careful with it.'",
    dialogue: [["Mama Bisi", "I trained you. Now train someone better."]],
    requires: [{ done: "s71-lead" }, ...on("creative")],
    tasks: [{ text: "Reach Charisma 7", cond: { skill: "charisma", n: 7 } }, { text: "Earn ₦40,000 from your craft", cond: { do: "earned", n: 40_000 } }],
    reward: { money: 5_000, skill: { charisma: 0.3 }, rep: 1, flag: ["s72", "done"] },
  },
  {
    id: "s72d-practice", alt: true, chapter: 8, n: 72, emoji: "🏥", title: "Running the Unit", place: "A hospital unit or a firm's department",
    who: ["Your juniors", "A senior mentor"],
    intro: "You are asked to lead a unit: rotas, supervision, complaints, the odd emergency at 4 a.m. Your mentor says, 'It is not about knowing everything. It is about making sure someone always knows.'",
    dialogue: [["Mentor", "A good leader makes their team safe to disagree with."]],
    requires: [{ done: "s71-lead" }, ...on("professional")],
    tasks: [{ text: "Reach Study 8", cond: { skill: "study", n: 8 } }, { text: "Study two more sessions", cond: { do: "library", n: 2 } }],
    reward: { money: 5_000, skill: { study: 0.3 }, rep: 1, flag: ["s72", "done"] },
  },
  {
    id: "s73-scholarship", chapter: 8, n: 73, emoji: "🎒", title: "The Scholarship Idea", place: "A secondary school, Mushin",
    who: ["Ade", "A school principal", "Mr Bakare"],
    intro: "A principal invites you to speak at your old school. A girl asks, 'How do I get where you are?' You have the honest answer, and you also have the means to change what the answer needs to be.",
    dialogue: [["Principal", "We have talent. We do not have fees."]],
    requires: [{ flag: "s72", is: "done" }],
    tasks: [],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Fund a small scholarship every year in your name", result: "Three students start the year with books and a reason to stay. Ade runs the programme.", effect: { money: -15_000, rep: 3, flag: ["giving", "scholarship"] } },
        { label: "Mentor ten students and open your workplace to them", result: "A different kind of gift. Doors, not cash. Two of them become interns.", effect: { rep: 3, skill: { charisma: 0.4 }, flag: ["giving", "mentor"] } },
        { label: "Donate a modest amount and move on", result: "Appreciated, and forgotten by the next term.", effect: { money: -3_000, rep: 1, flag: ["giving", "small"] } },
      ],
    },
    reward: { money: 2_000 },
  },
  {
    id: "s74-endorse", chapter: 8, n: 74, emoji: "🗳️", title: "A Politician Calls", place: "A meeting at a hotel lobby",
    who: ["A local politician", "His aide"],
    intro: "A politician wants a photo with you and a few kind words for his campaign. He is charming. His aide slides over a folder of 'community projects' and a number with many zeros. 'Your name carries weight,' he says. 'Lend a little.'",
    dialogue: [["Politician", "You are the kind of person people believe. Help me be believed."]],
    requires: [{ done: "s73-scholarship" }],
    tasks: [{ text: "Hold a name that carries weight (reputation 42)", cond: { rep: 42 } }],
    choice: {
      prompt: "What do you tell him?",
      options: [
        { label: "Decline politely and say you stay out of party politics", result: "He is mildly offended and respects the line. People remember a person who has one.", effect: { rep: 3, flag: ["politics", "out"] } },
        { label: "Offer to support specific projects, not the campaign", result: "A narrow, honest yes. Two projects get real help, and your name stays on the work, not on a poster.", effect: { money: -8_000, rep: 2, flag: ["politics", "projects"] } },
        { label: "Endorse him fully for the access it brings", result: "Doors open fast. Your name is now tied to his, for better or worse.", effect: { money: 10_000, rep: -3, flag: ["politics", "endorsed"] } },
      ],
    },
    reward: { money: 1_500 },
  },

  // ----- Mission 75: influence in public -----
  {
    id: "s75a-keynote", alt: true, chapter: 8, n: 75, emoji: "🎤", title: "The Keynote", place: "A business summit, the Island",
    who: ["The summit host", "Young founders"],
    intro: "Twelve hundred people, one stage, and a clock counting down. You expected to talk about success. You end up talking about the three times you nearly quit.",
    dialogue: [["Host", "Everybody has heard the highlights. They want to hear the cost."]],
    requires: [{ done: "s74-endorse" }, ...on("business")],
    tasks: [{ text: "Earn ₦45,000 to fund the prep and travel", cond: { do: "earned", n: 45_000 } }],
    choice: {
      prompt: "How do you speak?",
      options: [
        { label: "Honestly, about failure and doubt", result: "Hands shoot up afterwards. A young woman says you changed her plan.", effect: { rep: 3, flag: ["spoke", "honest"] } },
        { label: "Inspiringly, with the big wins", result: "Everyone applauds. A few walk away feeling slightly smaller.", effect: { rep: 1, money: 3_000, flag: ["spoke", "inspiring"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s75", "done"] },
  },
  {
    id: "s75b-opensource", alt: true, chapter: 8, n: 75, emoji: "🌐", title: "Open the Code", place: "Your tech company",
    who: ["Ify", "Your team"],
    intro: "Ify proposes releasing part of your platform as open source. Your investors worry about giving away an advantage. Your engineers beg to do it. 'The best way to be trusted,' Ify says, 'is to let people look.'",
    dialogue: [["Ify", "Closed doors build moats. Open ones build communities."]],
    requires: [{ done: "s74-endorse" }, ...on("tech")],
    tasks: [{ text: "Earn ₦45,000 from product work", cond: { do: "earned", n: 45_000 } }],
    choice: {
      prompt: "What do you decide?",
      options: [
        { label: "Open-source it with a clear licence and good docs", result: "Strangers fix your bugs and send thank-you notes. Hiring gets easier overnight.", effect: { rep: 3, skill: { study: 0.4 }, flag: ["spoke", "open"] } },
        { label: "Release a smaller version and keep the core closed", result: "A cautious middle path. Some applaud it, others say it is not quite open.", effect: { rep: 1, skill: { study: 0.2 }, flag: ["spoke", "partial"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s75", "done"] },
  },
  {
    id: "s75c-soloshow", alt: true, chapter: 8, n: 75, emoji: "🖼️", title: "The Solo Show", place: "A gallery, Victoria Island",
    who: ["A curator", "Collectors"],
    intro: "A full gallery of your work. Forty pieces, one theme, a curator who insists the lighting be perfect. You spend the first hour hiding by the snacks and the second hour being hugged by strangers.",
    dialogue: [["Curator", "You are not here to be liked. You are here to be seen."]],
    requires: [{ done: "s74-endorse" }, ...on("creative")],
    tasks: [{ text: "Earn ₦45,000 from your craft", cond: { do: "earned", n: 45_000 } }],
    choice: {
      prompt: "A collector offers a lot of money for your signature piece, with a condition: you may never make another like it.",
      options: [
        { label: "Decline and keep the freedom to explore", result: "The collector sighs. A curator nods. Your next series is the best you have made.", effect: { rep: 3, skill: { charisma: 0.3 }, flag: ["spoke", "free"] } },
        { label: "Take the offer", result: "A great payday and a gap where your best idea used to be.", effect: { money: 15_000, rep: 0, flag: ["spoke", "sold"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s75", "done"] },
  },
  {
    id: "s75d-publish", alt: true, chapter: 8, n: 75, emoji: "📚", title: "Put It in Writing", place: "A journal editor's office",
    who: ["A journal editor", "A senior mentor"],
    intro: "Years of cases, patients or clients, boiled down to eight thousand words and a conclusion you are not sure you believe. The editor sends comments longer than the paper. Your mentor smiles: 'That means they took you seriously.'",
    dialogue: [["Editor", "Make your claim smaller and your evidence larger."]],
    requires: [{ done: "s74-endorse" }, ...on("professional")],
    tasks: [{ text: "Reach Study 8", cond: { skill: "study", n: 8 } }],
    choice: {
      prompt: "A reviewer finds a flaw in your data.",
      options: [
        { label: "Rerun the analysis and publish the corrected version", result: "It takes three extra months and earns you a reputation for rigour.", effect: { rep: 3, skill: { study: 0.4 }, flag: ["spoke", "rigour"] } },
        { label: "Argue that the flaw is minor and push on", result: "Published, with a correction note months later.", effect: { rep: 0, flag: ["spoke", "pushed"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s75", "done"] },
  },

  // ----- Mission 76: your values are tested (picked by mission 69) -----
  {
    id: "s76a-hard-quarter", alt: true, chapter: 8, n: 76, emoji: "🫂", title: "The Hard Quarter", place: "A staff meeting",
    who: ["Your team"],
    intro: "A tough quarter. The spreadsheet says cut people. You promised yourself, in a quiet room not long ago, that you would put people before profit. The number on the screen does not care about your promise.",
    dialogue: [["Team member", "We have seen the numbers. Please just be straight with us."]],
    requires: [{ flag: "s75", is: "done" }, ...val("people")],
    tasks: [{ text: "Hold ₦280,000 to carry the team through", cond: { money: 280_000 } }],
    choice: {
      prompt: "How do you protect the team?",
      options: [
        { label: "Cut your own pay first and ask everyone to share the load fairly", result: "A hard month. Nobody is fired. People work harder because they trust you.", effect: { money: -10_000, rep: 4, flag: ["s76path", "shared"] } },
        { label: "Freeze hiring and cut costs elsewhere", result: "Everyone stays, and some projects slow down. A fair compromise.", effect: { rep: 2, flag: ["s76path", "froze"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s76", "done"] },
  },
  {
    id: "s76b-succession", alt: true, chapter: 8, n: 76, emoji: "🪜", title: "Plan for When You're Gone", place: "Your boardroom",
    who: ["A lawyer", "Your deputy"],
    intro: "You committed to building something durable. A lawyer lays out what happens to your business, team and promises if you are unavailable for a month. The honest answer is: it falls apart.",
    dialogue: [["Lawyer", "A company that cannot survive its founder is a fragile hobby."]],
    requires: [{ flag: "s75", is: "done" }, ...val("durable")],
    tasks: [{ text: "Hold ₦280,000 to build the structure", cond: { money: 280_000 } }],
    choice: {
      prompt: "How do you prepare?",
      options: [
        { label: "Train a deputy properly and give her real authority", result: "It is uncomfortable to let go. The company becomes sturdier, and so do you.", effect: { money: -6_000, rep: 3, skill: { hustle: 0.3 }, flag: ["s76path", "deputy"] } },
        { label: "Write detailed procedures and hire a board advisor", result: "Cleaner on paper, less personal. A solid second layer.", effect: { money: -4_000, rep: 2, flag: ["s76path", "procedures"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s76", "done"] },
  },
  {
    id: "s76c-hostile", alt: true, chapter: 8, n: 76, emoji: "🦈", title: "A Weak Rival", place: "A quiet phone call",
    who: ["An advisor"],
    intro: "A competitor is struggling. Your advisor, with a thin smile, says you could buy their key suppliers and starve them out. It is legal. It would also be a final exit for sixty people.",
    dialogue: [["Advisor", "Business is not charity. But you did say you wanted to keep winning."]],
    requires: [{ flag: "s75", is: "done" }, ...val("winning")],
    tasks: [{ text: "Hold ₦280,000 to make the move", cond: { money: 280_000 } }],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Make an offer to acquire them fairly and keep the staff", result: "A merger instead of a kill. Sixty jobs survive, and your reach grows.", effect: { money: -12_000, rep: 4, flag: ["s76path", "merged"] } },
        { label: "Compete hard but fairly, and let the market decide", result: "A clean fight. You win some and lose some.", effect: { rep: 2, flag: ["s76path", "fair"] } },
        { label: "Starve them out", result: "You win completely. Nobody applauds, and your reputation has an asterisk.", effect: { money: 15_000, rep: -4, flag: ["s76path", "crushed"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s76", "done"] },
  },
  {
    id: "s77-mummy", chapter: 8, n: 77, emoji: "🏡", title: "Mummy's Pride", place: "Home, Mushin",
    who: ["Mummy", "Kunle", "Funke"],
    intro: "Mummy has never asked you for anything big. Today she mentions that the church roof leaks, in the tone of a person who is not asking. The whole compound is quietly watching you hear it.",
    dialogue: [["Mummy", "I only say it so you know. I am not asking."]],
    requires: [{ flag: "s76", is: "done" }],
    tasks: [{ text: "Be close to Mummy (relationship 80)", cond: { bond: "mummy", n: 80 } }],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Fix the roof and sit with Mummy on the day it is blessed", result: "She cries, then scolds you for spending, then boasts to everyone. You get a whole afternoon of her laughter.", effect: { money: -12_000, bond: ["mummy", 12], rep: 2, mood: "mummyLove", flag: ["pride", "roof"] } },
        { label: "Give Mummy a new house to live in", result: "She refuses, then accepts. Her neighbours still call it 'the child's house'.", effect: { money: -35_000, bond: ["mummy", 15], rep: 3, flag: ["pride", "house"] } },
        { label: "Be there in person, and let the church raise its own roof with your help", result: "A smaller cheque, a bigger crowd. The roof is also the community's.", effect: { money: -5_000, bond: ["mummy", 8], rep: 2, flag: ["pride", "together"] } },
      ],
    },
    reward: { money: 2_000 },
  },

  // ----- Mission 78: the big partnership -----
  {
    id: "s78a-jv", alt: true, chapter: 8, n: 78, emoji: "🌍", title: "The Joint Venture", place: "A boardroom, Victoria Island",
    who: ["A foreign firm's partner"],
    intro: "A foreign firm wants to set up in Lagos with you as the local partner. They bring money and brand. You bring knowledge of how things actually work. The contract has a clause that worries your lawyer.",
    dialogue: [["Partner", "We will respect your leadership on the ground. The clause is boilerplate."]],
    requires: [{ done: "s77-mummy" }, ...on("business")],
    tasks: [],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Negotiate the clause out before signing", result: "They push back, then concede. The partnership begins as equals.", effect: { money: 12_000, rep: 3, flag: ["s78", "equal"] } },
        { label: "Sign as written and trust the relationship", result: "It works until it does not. Your lawyer's face says 'I told you so' for a year.", effect: { money: 20_000, rep: 0, flag: ["s78", "trusting"] } },
        { label: "Walk away and build the same thing alone", result: "Slower and fully yours.", effect: { skill: { hustle: 0.4 }, rep: 2, flag: ["s78", "alone"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s78done", "yes"] },
  },
  {
    id: "s78b-seriesa", alt: true, chapter: 8, n: 78, emoji: "💸", title: "The Funding Round", place: "A pitch room, Yaba",
    who: ["An investor", "Your co-founder"],
    intro: "A real round: a lead investor, a term sheet, and the first time you have to say out loud what the company is worth. The term sheet includes a board seat and a growth plan with numbers you did not choose.",
    dialogue: [["Investor", "We back founders who finish. We just also want a say in how."]],
    requires: [{ done: "s77-mummy" }, ...on("tech")],
    tasks: [],
    choice: {
      prompt: "How do you take the money?",
      options: [
        { label: "Take the round, and protect your founders' control", result: "A longer negotiation and a better deal. You keep your voice.", effect: { money: 25_000, rep: 3, flag: ["s78", "protected"] } },
        { label: "Take the largest offer, whatever the strings", result: "A huge number and a short leash. You are now building for someone else's timeline.", effect: { money: 40_000, rep: 0, flag: ["s78", "biggest"] } },
        { label: "Stay bootstrapped and keep control", result: "A slower company that is wholly yours.", effect: { skill: { study: 0.4 }, rep: 2, flag: ["s78", "bootstrapped"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s78done", "yes"] },
  },
  {
    id: "s78c-festival", alt: true, chapter: 8, n: 78, emoji: "🎪", title: "Headline Night", place: "A festival ground, Lagos",
    who: ["A festival producer", "Your crew"],
    intro: "Twenty thousand people in a field, hot lights, and a producer who counts down from ten in your earpiece. For ninety minutes you forget the contracts and the criticism. For ninety minutes it is only the work.",
    dialogue: [["Producer", "Five, four, three... go be yourself."]],
    requires: [{ done: "s77-mummy" }, ...on("creative")],
    tasks: [],
    choice: {
      prompt: "A sponsor offers a lot of money, but wants their logo on everything you make.",
      options: [
        { label: "Take a smaller deal with limits on where the logo appears", result: "A fair middle. Fans do not feel sold to.", effect: { money: 15_000, rep: 3, flag: ["s78", "limited"] } },
        { label: "Take the full deal", result: "Big money, plenty of logos. Fans roll their eyes and keep buying.", effect: { money: 30_000, rep: -1, flag: ["s78", "full"] } },
        { label: "Decline and keep your work free of brands", result: "A cleaner identity and a lighter bank balance.", effect: { rep: 3, skill: { charisma: 0.4 }, flag: ["s78", "clean"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s78done", "yes"] },
  },
  {
    id: "s78d-own", alt: true, chapter: 8, n: 78, emoji: "🏛️", title: "Your Own Practice", place: "A new office, Ikeja",
    who: ["Your first clients", "A senior mentor"],
    intro: "Your name on a brass plate for the first time. A modest waiting room, a receptionist who guards your calendar, and a mentor who stands in the doorway with a plant, saying nothing but beaming.",
    dialogue: [["Mentor", "Plants die if you forget them. So do practices."]],
    requires: [{ done: "s77-mummy" }, ...on("professional")],
    tasks: [],
    choice: {
      prompt: "How do you set your fees?",
      options: [
        { label: "Fair fees, with a slice of free work for those who cannot pay", result: "People come to you because they trust you. The free cases become your best advertising.", effect: { money: 8_000, rep: 4, flag: ["s78", "fair"] } },
        { label: "Premium fees for a selective list of clients", result: "High margins, long waiting list. It is a career, and it is a statement.", effect: { money: 20_000, rep: 1, flag: ["s78", "premium"] } },
        { label: "Cheap and fast, to build volume", result: "You are busy and exhausted. The reputation is less clear.", effect: { money: 10_000, rep: 0, flag: ["s78", "volume"] } },
      ],
    },
    reward: { money: 4_000, flag: ["s78done", "yes"] },
  },
  {
    id: "s79-growth", chapter: 8, n: 79, emoji: "🌿", title: "Becoming Someone Better", place: "A quiet morning, your balcony",
    who: ["Sule", "Ify"],
    intro: "Success has made your calendar full and your inner life thin. Sule suggests running at sunrise. Ify suggests a book you will pretend you do not need. You try both.",
    dialogue: [["Sule", "The body is the only house you cannot sell."]],
    requires: [{ flag: "s78done", is: "yes" }],
    tasks: [{ text: "Read for pleasure", cond: { do: "read-book" } }, { text: "Take some quiet time to worship or reflect", cond: { do: "worship" } }],
    choice: {
      prompt: "Where do you invest your free time this year?",
      options: [
        { label: "Fitness and health: you want to be there in thirty years", result: "Sunrise runs, better sleep, and a doctor who now compliments your bloodwork.", effect: { skill: { fitness: 0.6 }, mood: "gymGlow", flag: ["growth", "body"] } },
        { label: "Learning: courses, languages, long reading", result: "Your mind stretches. New ideas return to your work.", effect: { skill: { study: 0.6 }, flag: ["growth", "mind"] } },
        { label: "Relationships: family, friends, faith", result: "You show up more often. It changes the way people talk about you.", effect: { bond: ["mummy", 6], rep: 2, flag: ["growth", "people"] } },
      ],
    },
    reward: { money: 1_500 },
  },
  {
    id: "s80-mark", chapter: 8, n: 80, emoji: "🪧", title: "Your Mark", place: "A street in Lagos, unannounced",
    who: ["Everyone who stayed"],
    intro: "On a Tuesday morning, a young man walks past you with a notebook, and you realise he is wearing a tailor's tag, a coder's hoodie, or a stall apron you recognise. Somebody you never met is building the thing you started. It is not a monument. It is better.",
    dialogue: [["You", "That is what it was for."]],
    requires: [{ done: "s79-growth" }],
    tasks: [{ text: "Hold ₦320,000 in cash", cond: { money: 320_000 } }, { text: "Hold a name that carries weight (reputation 45)", cond: { rep: 45 } }],
    reward: { money: 16_000, rep: 3, skill: { hustle: 0.3, study: 0.3, charisma: 0.3 } },
    next: "Chapter 9, At the Top, is planned but not playable yet.",
  },
];
