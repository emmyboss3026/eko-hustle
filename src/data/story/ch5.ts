// Chapter 5 — Building a Reputation (missions 41-50). Career advancement, relationships and standing.
// Slots 42, 45 and 48 have four versions (business, tech, creative, professional); you play the one for your path.

import type { StoryMission } from "./types";

const on = (path: string) => [{ flag: "path", is: path }] as const;

export const ch5: StoryMission[] = [
  {
    id: "s41-invite", chapter: 5, n: 41, emoji: "💌", title: "A Name on the List", place: "Your phone",
    who: ["An event organiser"],
    intro: "An invitation lands that you did not apply for: a networking evening on the Island, hosted by people you have only read about. Your name is on the list. Someone, somewhere, has been talking.",
    dialogue: [["Organiser", "We invite people who are going somewhere. Come and meet the others."]],
    requires: [{ done: "s40-chosen" }],
    tasks: [{ text: "Be known (reputation 18)", cond: { rep: 18 } }],
    choice: {
      prompt: "What do you wear, and how do you carry yourself?",
      options: [
        { label: "Spend on a sharp outfit and go early", result: "You are noticed in the first five minutes. Confidence is half preparation.", effect: { money: -4_000, rep: 2, skill: { charisma: 0.3 }, flag: ["gala", "dressed"] } },
        { label: "Go as you are, and let your work speak", result: "Fewer glances, deeper conversations. People who care about substance find you.", effect: { rep: 1, skill: { study: 0.2 }, flag: ["gala", "plain"] } },
      ],
    },
    reward: { money: 2_000 },
  },

  // ----- Mission 42: the next rung of your path -----
  {
    id: "s42a-hire", alt: true, chapter: 5, n: 42, emoji: "👥", title: "Your First Employee", place: "Your shop, Yaba",
    who: ["A young hire", "Tunde"],
    intro: "A nineteen-year-old stands in front of your counter with a folded CV and polite eyes. Hiring someone means their rent is now partly your problem.",
    dialogue: [["Tunde", "The day you hire is the day you stop being only a hustler and start being a boss."]],
    requires: [{ done: "s41-invite" }, ...on("business")],
    tasks: [{ text: "Own two businesses", cond: { biz: 2 } }, { text: "Reach Hustle 4", cond: { skill: "hustle", n: 4 } }],
    reward: { money: 3_000, skill: { hustle: 0.3 }, rep: 1, flag: ["s42", "done"] },
  },
  {
    id: "s42b-senior", alt: true, chapter: 5, n: 42, emoji: "🧑🏾‍💻", title: "Own Your Module", place: "Your tech company",
    who: ["Your team lead"],
    intro: "Your team lead hands you a whole feature: design, build, ship, and answer for it. 'If it breaks, your name is on the commit,' she says with a smile.",
    dialogue: [["Team lead", "Ownership is not a title. It is who gets the call at 2 a.m."]],
    requires: [{ done: "s41-invite" }, ...on("tech")],
    tasks: [{ text: "Reach software engineer level", cond: { job: "tech", level: 2 } }],
    reward: { money: 3_000, skill: { study: 0.3 }, rep: 1, flag: ["s42", "done"] },
  },
  {
    id: "s42c-collection", alt: true, chapter: 5, n: 42, emoji: "👘", title: "Your First Collection", place: "A studio, Yaba",
    who: ["Mama Bisi"],
    intro: "Mama Bisi steps back and lets you design the whole line. Twelve pieces, one theme, one deadline. 'A collection is a sentence,' she says. 'Say something.'",
    dialogue: [["Mama Bisi", "Do not copy what sells. Make what you would be proud to see walking past."]],
    requires: [{ done: "s41-invite" }, ...on("creative")],
    tasks: [{ text: "Reach fashion designer level", cond: { job: "fashion", level: 2 } }],
    reward: { money: 3_000, skill: { charisma: 0.3 }, rep: 1, flag: ["s42", "done"] },
  },
  {
    id: "s42d-clinic", alt: true, chapter: 5, n: 42, emoji: "🩺", title: "Shadowing Day", place: "A teaching hospital or a law chamber",
    who: ["A senior professional"],
    intro: "For one day you follow a senior professional like a shadow with a notebook. You see what the books skip: tired eyes, hard calls, small kindnesses that never make the report.",
    dialogue: [["Professional", "Technique is the easy part. Judgement is what we are really paying you for."]],
    requires: [{ done: "s41-invite" }, ...on("professional")],
    tasks: [{ text: "Reach Study 6", cond: { skill: "study", n: 6 } }, { text: "Study three more sessions", cond: { do: "library", n: 3 } }],
    reward: { money: 3_000, skill: { study: 0.3 }, rep: 1, flag: ["s42", "done"] },
  },
  {
    id: "s43-rumour", chapter: 5, n: 43, emoji: "🗯️", title: "A Rumour With Your Name", place: "Everywhere, quickly",
    who: ["Funke", "Chidi"],
    intro: "By lunchtime three people have asked whether you really did something you never did. Lagos rumours travel faster than danfo, and they do not wait for the facts.",
    dialogue: [
      ["Funke", "Do not fight it in the street. Fight it with how you live."],
      ["Chidi", "If it is about me, I want to hear it from you first."],
    ],
    requires: [{ flag: "s42", is: "done" }],
    tasks: [],
    choice: {
      prompt: "How do you deal with the rumour?",
      options: [
        { label: "Answer calmly to the people who matter and let time do the rest", result: "It fades. The people who knew you never doubted you.", effect: { rep: 2, skill: { charisma: 0.3 }, flag: ["rumour", "calm"] } },
        { label: "Post a sharp reply and name names", result: "It trends for a day. You win the argument and lose a little warmth.", effect: { rep: -1, flag: ["rumour", "loud"] } },
        { label: "Ask the person who started it to meet you in person", result: "It is awkward, and it works. Face to face, the story collapses.", effect: { bond: ["funke", 5], rep: 1, flag: ["rumour", "direct"] } },
      ],
    },
    reward: { money: 1_000 },
  },
  {
    id: "s44-friendship", chapter: 5, n: 44, emoji: "🫶", title: "The Friend Who Drifted", place: "A quiet evening",
    who: ["Tunde", "Ify"],
    intro: "You realise you have not spoken properly to one of your oldest friends in weeks. Success has a way of making calendars full and hearts hungry.",
    dialogue: [["You", "I have been busy. I know that is not a reason."]],
    requires: [{ done: "s43-rumour" }],
    tasks: [{ text: "Keep a good name (reputation 20)", cond: { rep: 20 } }],
    choice: {
      prompt: "Who do you make time for?",
      options: [
        { label: "Call Tunde and offer him a real role in your plans", result: "He is quiet, then grateful. Loyalty and opportunity make a strong pair.", effect: { bond: ["tunde", 12], rep: 1, flag: ["old-friend", "tunde"] } },
        { label: "Take Ify out for dinner and talk about everything but work", result: "You laugh like you did on the hub rooftop. It restores something.", effect: { money: -3_000, bond: ["ify", 12], rep: 1, flag: ["old-friend", "ify"] } },
      ],
    },
    reward: { money: 1_000 },
  },

  // ----- Mission 45: your path in public -----
  {
    id: "s45a-pitch", alt: true, chapter: 5, n: 45, emoji: "📢", title: "The Pitch Night", place: "A business forum, the Island",
    who: ["A panel of investors"],
    intro: "Five minutes, ten slides, three tough questions. The panel does not smile until you say a number they like. Your hands are steady only because you rehearsed in the mirror.",
    dialogue: [["Investor", "Tell me why this survives without you in the room."]],
    requires: [{ done: "s44-friendship" }, ...on("business")],
    tasks: [{ text: "Earn ₦20,000 in a week to show momentum", cond: { do: "earned", n: 20_000 } }],
    days: 8, fail: "The week ended before the numbers were ready. The panel's door is still open.",
    choice: {
      prompt: "A panelist asks a question you cannot answer.",
      options: [
        { label: "Say honestly that you don't know yet and how you will find out", result: "He nods. Honesty buys more trust than a polished guess.", effect: { rep: 2, flag: ["pitch", "honest"] } },
        { label: "Bluff with confident numbers", result: "It sounds convincing. It will need to be true before the next meeting.", effect: { rep: -1, money: 3_000, flag: ["pitch", "bluff"] } },
      ],
    },
    reward: { money: 3_000, skill: { hustle: 0.3 }, flag: ["s45", "done"] },
  },
  {
    id: "s45b-talk", alt: true, chapter: 5, n: 45, emoji: "🎙️", title: "Speaking at the Hub", place: "A developer meetup, Yaba",
    who: ["Ify", "An audience"],
    intro: "Ify volunteers you for a lightning talk. Ten minutes, one demo, a hundred people with laptops open. Your live demo works on the third try, to loud applause.",
    dialogue: [["Ify", "You do not need to be loud. You need to be clear."]],
    requires: [{ done: "s44-friendship" }, ...on("tech")],
    tasks: [{ text: "Earn through tech and side work (₦15,000)", cond: { do: "earned", n: 15_000 } }],
    days: 8, fail: "The meetup passed before you were ready. Another one comes next month.",
    choice: {
      prompt: "After the talk, a company offers to sponsor your next project.",
      options: [
        { label: "Take the sponsorship and credit them openly", result: "Everybody wins, and your name travels with a good project.", effect: { money: 5_000, rep: 1, flag: ["sponsor", "taken"] } },
        { label: "Decline and stay independent for now", result: "Freedom has a cost, but you keep full control.", effect: { rep: 1, skill: { study: 0.3 }, flag: ["sponsor", "declined"] } },
      ],
    },
    reward: { money: 3_000, skill: { study: 0.3 }, flag: ["s45", "done"] },
  },
  {
    id: "s45c-runway", alt: true, chapter: 5, n: 45, emoji: "📸", title: "Your Face, Your Name", place: "A photo shoot, the Island",
    who: ["A photographer", "A stylist"],
    intro: "A magazine wants a shoot of the new designer on the scene. You are nervous, then you are not. The photographer says, 'Good. Hold it. That is who you actually are.'",
    dialogue: [["Photographer", "Do not pose for the camera. Pose for the one person who will stop and look."]],
    requires: [{ done: "s44-friendship" }, ...on("creative")],
    tasks: [{ text: "Earn ₦15,000 from your trade or hustles", cond: { do: "earned", n: 15_000 } }],
    days: 8, fail: "The shoot window closed before you were ready. They said to call again.",
    choice: {
      prompt: "The magazine asks if they may retouch the photos heavily.",
      options: [
        { label: "Ask them to keep it natural", result: "The shoot looks real. Readers respond to what they recognise.", effect: { rep: 2, flag: ["shoot", "natural"] } },
        { label: "Let them polish it fully", result: "It is stunning and slightly not you. Some people like it more.", effect: { money: 3_000, flag: ["shoot", "polished"] } },
      ],
    },
    reward: { money: 3_000, skill: { charisma: 0.3 }, flag: ["s45", "done"] },
  },
  {
    id: "s45d-viva", alt: true, chapter: 5, n: 45, emoji: "🎓", title: "The Oral Defence", place: "A lecture room",
    who: ["A panel of examiners"],
    intro: "Three examiners, one chair, one question that will not leave you alone. They want to hear how you think, not just what you remember.",
    dialogue: [["Examiner", "Walk us through your reasoning. Take your time."]],
    requires: [{ done: "s44-friendship" }, ...on("professional")],
    tasks: [{ text: "Reach Study 7", cond: { skill: "study", n: 7 } }],
    choice: {
      prompt: "An examiner challenges your answer, and she may be right.",
      options: [
        { label: "Admit the gap and correct yourself in front of the room", result: "She smiles slightly. Being willing to be corrected is rarer than being right.", effect: { rep: 2, skill: { study: 0.3 }, flag: ["viva", "humble"] } },
        { label: "Defend your answer firmly", result: "You hold your ground. It lands well, mostly.", effect: { rep: 1, flag: ["viva", "firm"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s45", "done"] },
  },
  {
    id: "s46-family", chapter: 5, n: 46, emoji: "👨🏾‍👩🏾‍👧🏾", title: "The Family Ask", place: "Mushin and the phone",
    who: ["Kunle", "Mummy"],
    intro: "Kunle calls: a cousin's school fees are overdue, a relative's hospital bill needs help, and Mummy has stopped mentioning it because she does not want to ask. Family loves you and asks you at the same time.",
    dialogue: [
      ["Kunle", "I would never ask if I had another door."],
      ["Mummy", "Do what you can. God will do the rest."],
    ],
    requires: [{ flag: "s45", is: "done" }],
    tasks: [],
    choice: {
      prompt: "How do you answer?",
      options: [
        { label: "Cover the fees fully", result: "A child stays in school. Your account sighs, but your heart does not.", effect: { money: -10_000, bond: ["kunle", 10], rep: 2, flag: ["family-ask", "paid"] } },
        { label: "Give part, and help the cousin find a scholarship", result: "A gift and a plan. The cousin writes his own way forward.", effect: { money: -4_000, bond: ["kunle", 6], rep: 1, flag: ["family-ask", "shared"] } },
        { label: "Explain you cannot right now, and offer your time", result: "It is awkward but honest. You spend a weekend helping with the application.", effect: { bond: ["kunle", 2], flag: ["family-ask", "time"] } },
      ],
    },
    reward: { money: 1_000 },
  },
  {
    id: "s47-borehole", chapter: 5, n: 47, emoji: "🚰", title: "The Neighbourhood Project", place: "Your compound, Mushin",
    who: ["Mr Bakare", "Funke", "The community"],
    intro: "The compound's water has been unreliable since the last flood. Mr Bakare, for once, does not say no. 'If somebody leads,' he says, 'we will follow.'",
    dialogue: [["Funke", "People remember who showed up when it was not about them."]],
    requires: [{ done: "s46-family" }],
    tasks: [{ text: "Be someone people follow (reputation 22)", cond: { rep: 22 } }],
    choice: {
      prompt: "How do you lead the project?",
      options: [
        { label: "Put in money and organise the compound", result: "A borehole, a rota, and a neighbourhood that thanks you at every gate.", effect: { money: -8_000, bond: ["funke", 10], rep: 3, flag: ["community", "funded"] } },
        { label: "Rally everyone to contribute equally", result: "Slower and messier, and it feels like theirs. Because it is.", effect: { bond: ["funke", 6], rep: 2, skill: { charisma: 0.4 }, flag: ["community", "rallied"] } },
      ],
    },
    reward: { money: 1_000 },
  },

  // ----- Mission 48: a rival makes a move -----
  {
    id: "s48a-poach", alt: true, chapter: 5, n: 48, emoji: "🕵🏾", title: "The Poached Supplier", place: "Your shop, Yaba",
    who: ["Chidi", "Your supplier"],
    intro: "Your best supplier stops answering. Two days later you learn why: a competitor offered a better rate and a loud promise. It is business. It is also personal.",
    dialogue: [["Supplier", "You are fair, but he pays up front. I have a family too."]],
    requires: [{ done: "s47-borehole" }, ...on("business")],
    tasks: [{ text: "Hold ₦40,000 so you can pay suppliers faster", cond: { money: 40_000 } }],
    choice: {
      prompt: "How do you respond?",
      options: [
        { label: "Match the offer and be loyal in return", result: "The supplier stays and tells others. You paid more and bought a name.", effect: { money: -6_000, rep: 2, flag: ["s48", "matched"] } },
        { label: "Find a new supplier and diversify", result: "It takes effort, and you are now harder to squeeze.", effect: { skill: { hustle: 0.5 }, flag: ["s48", "diversified"] } },
      ],
    },
    reward: { money: 2_500, flag: ["s48done", "yes"] },
  },
  {
    id: "s48b-leak", alt: true, chapter: 5, n: 48, emoji: "🐛", title: "The Leaked Build", place: "Your tech company",
    who: ["Your team lead", "A colleague"],
    intro: "A competitor ships a feature that looks suspiciously like your unreleased one. Someone talked. Suspicion drifts across the open office like smoke.",
    dialogue: [["Team lead", "I am not accusing anyone. I am asking everyone to be honest."]],
    requires: [{ done: "s47-borehole" }, ...on("tech")],
    tasks: [{ text: "Keep your standing (reputation 23)", cond: { rep: 23 } }],
    choice: {
      prompt: "You suspect a colleague, but you have no proof.",
      options: [
        { label: "Share your concern privately and ask for an audit", result: "A quiet check clears the room, and tightens access without blaming anyone.", effect: { rep: 2, flag: ["s48", "audit"] } },
        { label: "Say nothing and watch", result: "You avoid a fight, but the doubt lingers in every meeting.", effect: { flag: ["s48", "silent"] } },
      ],
    },
    reward: { money: 2_500, flag: ["s48done", "yes"] },
  },
  {
    id: "s48c-copycat", alt: true, chapter: 5, n: 48, emoji: "🪡", title: "The Knock-Off", place: "Balogun market",
    who: ["Mama Bisi", "A stranger"],
    intro: "A cheap copy of your best piece appears in the market within a week of your showcase. Mama Bisi laughs: 'Copying is the highest form of rudeness.'",
    dialogue: [["Mama Bisi", "You cannot stop imitators. You can only keep being the original."]],
    requires: [{ done: "s47-borehole" }, ...on("creative")],
    tasks: [{ text: "Keep your standing (reputation 23)", cond: { rep: 23 } }],
    choice: {
      prompt: "How do you answer the knock-off?",
      options: [
        { label: "Release a new limited piece with a signature detail", result: "The original rises above the copies. Customers can tell the difference.", effect: { money: -2_000, rep: 2, skill: { charisma: 0.3 }, flag: ["s48", "signature"] } },
        { label: "Take it up with the seller loudly", result: "You win a small concession. The street talks about the fight more than the clothes.", effect: { rep: -1, flag: ["s48", "fight"] } },
      ],
    },
    reward: { money: 2_500, flag: ["s48done", "yes"] },
  },
  {
    id: "s48d-case", alt: true, chapter: 5, n: 48, emoji: "⚖️", title: "The Difficult Case", place: "A hospital ward or a chamber",
    who: ["A senior mentor", "A worried family"],
    intro: "You are handed a case that does not fit the textbook. The family wants answers you cannot yet give. Your mentor says only, 'Be honest about what you know and what you do not.'",
    dialogue: [["Mentor", "Certainty is a luxury. Honesty is a duty."]],
    requires: [{ done: "s47-borehole" }, ...on("professional")],
    tasks: [{ text: "Reach Study 7", cond: { skill: "study", n: 7 } }],
    choice: {
      prompt: "The family begs you for a guarantee.",
      options: [
        { label: "Explain the uncertainty clearly and the plan you will follow", result: "They are scared, then steadier. Clarity is a form of care.", effect: { rep: 3, skill: { charisma: 0.3 }, flag: ["s48", "honest"] } },
        { label: "Offer comfort without details", result: "They feel better for a day. Later questions are harder.", effect: { rep: 0, flag: ["s48", "soft"] } },
      ],
    },
    reward: { money: 2_500, flag: ["s48done", "yes"] },
  },
  {
    id: "s49-press", chapter: 5, n: 49, emoji: "📰", title: "The Interview", place: "A studio, the Island",
    who: ["A journalist"],
    intro: "A local magazine wants your story for a feature on young people building Lagos. The journalist is warm, and every question has a second question behind it.",
    dialogue: [["Journalist", "Tell me about the hardest part. People trust people who say the hard part."]],
    requires: [{ flag: "s48done", is: "yes" }],
    tasks: [{ text: "Hold a good name (reputation 24)", cond: { rep: 24 } }],
    choice: {
      prompt: "How do you tell your story?",
      options: [
        { label: "Tell it straight: the cold start, the mistakes, the help you got", result: "Readers write in. Several say your story made them try again.", effect: { rep: 3, bond: ["mummy", 6], flag: ["press", "honest"] } },
        { label: "Tell the polished version: only the wins", result: "It reads well, and it travels. Some friends gently tease the gloss.", effect: { rep: 1, money: 2_000, flag: ["press", "polished"] } },
      ],
    },
    reward: { money: 1_500 },
  },
  {
    id: "s50-recognition", chapter: 5, n: 50, emoji: "🏅", title: "A Seat at the Table", place: "A community award night",
    who: ["Everyone who has helped you"],
    intro: "Halfway through the story of your life so far, the room stands to honour young people who have earned it. Your name is called. For a moment you cannot move. Somewhere at the back, Mummy is crying, and so is Mr Bakare, who will deny it forever.",
    dialogue: [
      ["Host", "Standing here is not the end. It is a promise you have just made to everyone watching."],
      ["You", "Then I intend to keep it."],
    ],
    requires: [{ done: "s49-press" }],
    tasks: [{ text: "Hold ₦130,000 in cash", cond: { money: 130_000 } }, { text: "Earn a real name (reputation 26)", cond: { rep: 26 } }],
    reward: { money: 10_000, rep: 3, skill: { hustle: 0.3, study: 0.3, charisma: 0.3 } },
    next: "Chapter 6, Bigger Opportunities, is planned but not playable yet.",
  },
];
