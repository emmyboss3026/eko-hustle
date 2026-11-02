// Chapter 7 — The Price of Success (missions 61-70). Competition, setbacks, ethical dilemmas and responsibility.
// Slots 62, 65 and 68 have four versions (business, tech, creative, professional); you play the one for your path.
// Choices here cost something either way. None of them ends the game.

import type { StoryMission } from "./types";

const on = (path: string) => [{ flag: "path", is: path }] as const;

export const ch7: StoryMission[] = [
  {
    id: "s61-missed", chapter: 7, n: 61, emoji: "📵", title: "The Calls You Missed", place: "Your phone",
    who: ["Mummy", "Funke"],
    intro: "Seventeen missed calls over two weeks. Mummy's birthday dinner, Funke's baby naming, a Sunday you promised to keep free. You were busy doing things that mattered, and the people who mattered went quiet.",
    dialogue: [["Funke", "We are not angry. We just stopped expecting you."]],
    requires: [{ done: "s60-threshold" }],
    tasks: [{ text: "Be someone worth missing (reputation 32)", cond: { rep: 32 } }],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Drop everything this weekend and go home", result: "A long meal, an honest apology, and Mummy holding your face in both hands.", effect: { bond: ["mummy", 12], rep: 1, mood: "mummyLove", flag: ["missed", "went"] } },
        { label: "Send a generous gift and promise to visit soon", result: "It helps, a little. A gift is not a visit, and everyone knows it.", effect: { money: -6_000, bond: ["mummy", 3], flag: ["missed", "gift"] } },
        { label: "Schedule proper time into your calendar from now on", result: "A tidy fix for a messy problem. Time with family is now a meeting you cannot cancel.", effect: { bond: ["mummy", 6], skill: { hustle: 0.3 }, flag: ["missed", "scheduled"] } },
      ],
    },
    reward: { money: 2_000 },
  },

  // ----- Mission 62: the ethical dilemma on your path -----
  {
    id: "s62a-dash", alt: true, chapter: 7, n: 62, emoji: "🛃", title: "The Dash at the Port", place: "Apapa port",
    who: ["A clearing agent", "A customs officer"],
    intro: "Your stock sits in a container, and each day of delay costs money. The clearing agent leans in: 'There is a way to make it faster. Everybody does it. A small something for the officer.'",
    dialogue: [["Agent", "You can be proud or you can be on time. Rarely both."]],
    requires: [{ done: "s61-missed" }, ...on("business")],
    tasks: [{ text: "Be someone worth trusting (reputation 33)", cond: { rep: 33 } }],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Refuse and clear the goods the proper way", result: "It takes nine extra days and a lot of patience. A senior official notices and quietly respects you.", effect: { money: -6_000, rep: 3, flag: ["dilemma", "clean"] } },
        { label: "Pay the 'small something'", result: "The container moves. Nobody speaks of it, and you know you will be asked again.", effect: { rep: -2, flag: ["dilemma", "paid"] } },
        { label: "Change agent and find a legitimate fast lane", result: "More work, a better partner, a lesson in not accepting the first answer.", effect: { skill: { hustle: 0.4 }, rep: 1, flag: ["dilemma", "rerouted"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s62", "done"] },
  },
  {
    id: "s62b-data", alt: true, chapter: 7, n: 62, emoji: "🔐", title: "The Data Request", place: "A meeting room, your tech company",
    who: ["A client executive", "Your lawyer friend"],
    intro: "A client asks for a full export of their users' data, 'for analysis'. The request is polite. The purpose is vague. The users never agreed to this.",
    dialogue: [["Executive", "It is all inside our contract, somewhere. Just send it over."]],
    requires: [{ done: "s61-missed" }, ...on("tech")],
    tasks: [{ text: "Be someone worth trusting (reputation 33)", cond: { rep: 33 } }],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Refuse until the purpose and consent are clear", result: "The client is irritated. A week later they thank you: a regulator had been asking questions.", effect: { rep: 3, skill: { study: 0.3 }, flag: ["dilemma", "clean"] } },
        { label: "Send an anonymised version only", result: "A compromise that protects people and keeps the client. It takes more work than either extreme.", effect: { rep: 2, skill: { study: 0.4 }, flag: ["dilemma", "compromise"] } },
        { label: "Send everything and keep the contract", result: "The client is happy. You sleep badly for a month.", effect: { money: 5_000, rep: -2, flag: ["dilemma", "sent"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s62", "done"] },
  },
  {
    id: "s62c-credit", alt: true, chapter: 7, n: 62, emoji: "🖋️", title: "Whose Idea Was It?", place: "A studio, Yaba",
    who: ["A junior designer", "A well-known stylist"],
    intro: "A junior designer's sketch is nearly identical to a piece you are about to show on a big stage. She says it was her idea, months ago. You do not remember her sketch, and you cannot be sure it did not seed yours.",
    dialogue: [["Junior", "I am not asking for money. I am asking you not to forget me."]],
    requires: [{ done: "s61-missed" }, ...on("creative")],
    tasks: [{ text: "Be someone worth trusting (reputation 33)", cond: { rep: 33 } }],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Credit her publicly and pay her for the design", result: "It stings your ego and lifts her career. People talk about it, kindly, for months.", effect: { money: -5_000, rep: 3, flag: ["dilemma", "credited"] } },
        { label: "Invite her to collaborate on the final piece", result: "Both names, one line. She is thrilled, and the work is better for it.", effect: { rep: 2, skill: { charisma: 0.3 }, flag: ["dilemma", "collab"] } },
        { label: "Say nothing and show it as yours", result: "It sells well. She does not forget it, and neither do you.", effect: { money: 4_000, rep: -3, flag: ["dilemma", "silent"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s62", "done"] },
  },
  {
    id: "s62d-signoff", alt: true, chapter: 7, n: 62, emoji: "📋", title: "The Sign-Off", place: "A hospital ward or a firm's meeting room",
    who: ["A senior colleague"],
    intro: "A senior colleague hands you a file and a pen: 'Just sign here.' The file does not match what you saw yourself. He is powerful, impatient, and sure that you will do the sensible thing.",
    dialogue: [["Colleague", "Everyone signs these. Your signature is a formality."]],
    requires: [{ done: "s61-missed" }, ...on("professional")],
    tasks: [{ text: "Be someone worth trusting (reputation 33)", cond: { rep: 33 } }],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Decline to sign and state exactly why", result: "It is awkward, and it is correct. The file is corrected, and your name stays clean.", effect: { rep: 3, skill: { study: 0.3 }, flag: ["dilemma", "refused"] } },
        { label: "Ask for a short delay and verify it yourself", result: "He is annoyed, you are safe, and the error is found before it hurts anyone.", effect: { rep: 2, skill: { study: 0.4 }, flag: ["dilemma", "verified"] } },
        { label: "Sign it and trust him", result: "Nothing goes wrong this time. You know how close it was.", effect: { rep: -2, flag: ["dilemma", "signed"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s62", "done"] },
  },
  {
    id: "s63-audit", chapter: 7, n: 63, emoji: "🧾", title: "The Tax Letter", place: "Your desk",
    who: ["An accountant"],
    intro: "A formal letter arrives with official stamps and a short deadline. Your accountant calls it routine. Your stomach calls it a verdict.",
    dialogue: [["Accountant", "Clean books are not about fear. They are about being able to sleep."]],
    requires: [{ flag: "s62", is: "done" }],
    tasks: [],
    choice: {
      prompt: "How do you handle it?",
      options: [
        { label: "Pay everything due and keep complete records", result: "It costs money and buys peace. A calm, well-organised file ends the matter in a week.", effect: { money: -7_000, rep: 2, flag: ["audit", "clean"] } },
        { label: "Hire a good accountant and negotiate a fair settlement", result: "It takes weeks, but the settlement is reasonable, and the books are finally in order.", effect: { money: -5_000, skill: { hustle: 0.4 }, flag: ["audit", "negotiated"] } },
        { label: "Delay and hope it goes away", result: "It does not go away. A penalty is added, and a lesson is learned the expensive way.", effect: { money: -10_000, rep: -1, flag: ["audit", "delayed"] } },
      ],
    },
    reward: { money: 1_500 },
  },
  {
    id: "s64-burnout", chapter: 7, n: 64, emoji: "🪫", title: "The Wall", place: "Your flat, Mushin",
    who: ["Sule", "Mummy"],
    intro: "One Tuesday you sit down to answer an email and cannot. Not will not, cannot. Your head is full of cotton and your hands do not move. Sule finds you on the stairs and says, gently, 'You have been running on fumes since January.'",
    dialogue: [["Sule", "The body keeps a ledger. It collects even when you pretend not to owe."]],
    requires: [{ done: "s63-audit" }],
    tasks: [{ text: "Rest properly: sleep and relax", cond: { do: "relax" } }],
    choice: {
      prompt: "How do you recover?",
      options: [
        { label: "Take a full week off, no phone", result: "Your world does not end. You return with a clearer head and a shorter to-do list.", effect: { money: -4_000, mood: "wellRested", skill: { fitness: 0.4 }, flag: ["burnout", "rested"] } },
        { label: "Cut your workload and delegate more", result: "It is hard to let go. It is harder to keep carrying everything alone.", effect: { skill: { hustle: 0.3 }, rep: 1, flag: ["burnout", "delegated"] } },
        { label: "Push through and promise yourself a break later", result: "You finish the quarter. Your body sends a larger bill next time.", effect: { mood: "goSlow", flag: ["burnout", "pushed"] } },
      ],
    },
    reward: { money: 1_000 },
  },

  // ----- Mission 65: the rival escalates -----
  {
    id: "s65a-pricewar", alt: true, chapter: 7, n: 65, emoji: "⚔️", title: "The Price War", place: "The market, Mushin",
    who: ["Chidi"],
    intro: "Chidi has dropped his prices below cost, to bleed you out of the market. He is losing money to make you lose more. His smile is a threat.",
    dialogue: [["Chidi", "Nothing personal. The street has room for one big shop."]],
    requires: [{ done: "s64-burnout" }, ...on("business")],
    tasks: [{ text: "Hold ₦120,000 to outlast the war", cond: { money: 120_000 } }],
    choice: {
      prompt: "How do you fight back?",
      options: [
        { label: "Compete on quality and service, not price", result: "Customers pay a little more for a lot more care. Chidi's shelves empty slowly.", effect: { skill: { hustle: 0.4 }, rep: 2, flag: ["rival2", "quality"] } },
        { label: "Match his prices for a month and outlast him", result: "It bleeds you both. He folds first, barely.", effect: { money: -8_000, rep: 1, flag: ["rival2", "matched"] } },
        { label: "Spread a rumour about his stock", result: "It works. It also makes you someone who does that.", effect: { money: 3_000, rep: -3, flag: ["rival2", "dirty"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s65", "done"] },
  },
  {
    id: "s65b-poach", alt: true, chapter: 7, n: 65, emoji: "🧲", title: "They Want Your Team", place: "Your tech company",
    who: ["A rival recruiter", "Your senior developer"],
    intro: "A rival recruiter is calling your best people, one by one, offering double. Your senior developer asks for a quiet word. 'I am not leaving,' she says. 'But I want you to know what they offered.'",
    dialogue: [["Developer", "Loyalty is not blind. It needs a reason."]],
    requires: [{ done: "s64-burnout" }, ...on("tech")],
    tasks: [{ text: "Hold ₦120,000 to keep your team", cond: { money: 120_000 } }],
    choice: {
      prompt: "How do you respond?",
      options: [
        { label: "Raise salaries and say why, openly", result: "It costs more and saves more. The team remembers who spoke first.", effect: { money: -9_000, rep: 3, flag: ["rival2", "raised"] } },
        { label: "Offer growth, ownership and a say in the roadmap", result: "Money is not the only currency. Three people say it was the deciding factor.", effect: { skill: { charisma: 0.4 }, rep: 2, flag: ["rival2", "ownership"] } },
        { label: "Make everyone sign a restrictive contract", result: "They sign, and they stop trusting you.", effect: { rep: -3, flag: ["rival2", "locked"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s65", "done"] },
  },
  {
    id: "s65c-smear", alt: true, chapter: 7, n: 65, emoji: "🗞️", title: "The Smear Campaign", place: "Social media",
    who: ["A rival designer", "Your publicist"],
    intro: "A rival designer's account posts side-by-side photos implying you copied her. The comments are cruel and fast. Your publicist has a script, and so does your temper.",
    dialogue: [["Publicist", "Do not respond in anger. Respond like you are already past it."]],
    requires: [{ done: "s64-burnout" }, ...on("creative")],
    tasks: [{ text: "Hold ₦120,000 for a legal cushion", cond: { money: 120_000 } }],
    choice: {
      prompt: "How do you answer?",
      options: [
        { label: "Post the sketches and a timeline, calmly", result: "The facts do most of the talking. People respect the composure.", effect: { rep: 3, flag: ["rival2", "calm"] } },
        { label: "Ignore it and let your next collection answer", result: "It stings for a week. Then the work speaks louder than the post.", effect: { rep: 2, skill: { charisma: 0.3 }, flag: ["rival2", "ignored"] } },
        { label: "Reply with a harsher post about her", result: "You win the day. You lose the week.", effect: { rep: -2, flag: ["rival2", "harsh"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s65", "done"] },
  },
  {
    id: "s65d-post", alt: true, chapter: 7, n: 65, emoji: "🏆", title: "Two Candidates, One Post", place: "A hospital or a firm",
    who: ["A rival colleague", "A senior mentor"],
    intro: "There is one senior position and two excellent candidates: you and a colleague you quite like. The panel keeps asking quiet questions about both of you. Everyone is polite and everyone is watching.",
    dialogue: [["Mentor", "How you compete will be remembered longer than whether you win."]],
    requires: [{ done: "s64-burnout" }, ...on("professional")],
    tasks: [{ text: "Hold ₦120,000, so the decision is about merit, not money", cond: { money: 120_000 } }],
    choice: {
      prompt: "How do you compete?",
      options: [
        { label: "Do your best work and stay generous to your rival", result: "You do not get everything you want. You keep everything you need.", effect: { rep: 3, skill: { study: 0.3 }, flag: ["rival2", "fair"] } },
        { label: "Quietly highlight your rival's weaknesses to the panel", result: "It works a little. It will be remembered, too.", effect: { rep: -2, flag: ["rival2", "undermined"] } },
        { label: "Propose a joint plan so the unit benefits either way", result: "The panel is surprised. Both of you end up with expanded roles.", effect: { rep: 2, skill: { charisma: 0.4 }, flag: ["rival2", "joint"] } },
      ],
    },
    reward: { money: 3_000, flag: ["s65", "done"] },
  },
  {
    id: "s66-dependants", chapter: 7, n: 66, emoji: "🧺", title: "People Who Depend on You", place: "Your shop, your office, your compound",
    who: ["Ade", "Your staff"],
    intro: "Success has a way of making your problems everyone else's. Someone on your team is behind on rent. Ade's course has a surprise fee. A neighbour's son needs school supplies. Each request is small. Together they are a second salary.",
    dialogue: [["Ade", "I hate asking. But I do not know who else to ask."]],
    requires: [{ flag: "s65", is: "done" }],
    tasks: [{ text: "Be a pillar (reputation 34)", cond: { rep: 34 } }],
    choice: {
      prompt: "How do you handle the requests?",
      options: [
        { label: "Cover each of them this once, and set up a small emergency fund for next time", result: "It costs money and removes the guesswork. People stop dreading their own emergencies.", effect: { money: -10_000, bond: ["funke", 6], rep: 3, flag: ["dependants", "fund"] } },
        { label: "Help the most urgent one and teach the others how to plan", result: "A mix of generosity and honesty. It is hard to be the bad guy and the good guy at once.", effect: { money: -4_000, skill: { charisma: 0.3 }, rep: 2, flag: ["dependants", "triage"] } },
        { label: "Say no to all of it, kindly but firmly", result: "It is your money and your right. It is also a little lonely.", effect: { rep: -1, flag: ["dependants", "no"] } },
      ],
    },
    reward: { money: 1_500 },
  },
  {
    id: "s67-favour", chapter: 7, n: 67, emoji: "🤝", title: "The Favour", place: "A call from Tunde",
    who: ["Tunde"],
    intro: "Tunde has never asked you for much. Now he does: a word with someone you know, so a friend's contract moves to the front of the queue. It is not illegal. It is not exactly fair either.",
    dialogue: [["Tunde", "This is how the system works. I am just asking you to work it once, for me."]],
    requires: [{ done: "s66-dependants" }],
    tasks: [],
    choice: {
      prompt: "What do you tell him?",
      options: [
        { label: "Say no, and offer to help his friend prepare a stronger application", result: "He is quiet, then grudgingly agrees. The friend gets in on merit three weeks later.", effect: { bond: ["tunde", 4], rep: 3, flag: ["favour", "refused"] } },
        { label: "Make the call, and tell him it is the last time", result: "It works. You are now someone who can be asked.", effect: { bond: ["tunde", 10], rep: -1, flag: ["favour", "done"] } },
        { label: "Make the call, and ask for nothing in return", result: "A friend is happy. You wonder, later, what else you will be asked.", effect: { bond: ["tunde", 8], rep: -2, flag: ["favour", "freely"] } },
      ],
    },
    reward: { money: 1_500 },
  },

  // ----- Mission 68: a public mistake -----
  {
    id: "s68a-recall", alt: true, chapter: 7, n: 68, emoji: "🛑", title: "The Bad Batch", place: "Your warehouse",
    who: ["Your manager", "A customer"],
    intro: "A batch of your product has a fault. A customer posts photos. By afternoon it has been shared ten thousand times. Your manager looks at you for the next sentence.",
    dialogue: [["Customer", "I trusted your brand for my family. What are you going to do about it?"]],
    requires: [{ flag: "s65", is: "done" }, { done: "s67-favour" }, ...on("business")],
    tasks: [],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Recall the batch, apologise publicly and refund everyone", result: "It is expensive and clean. A week later, people post about how well you handled it.", effect: { money: -12_000, rep: 4, flag: ["mistake", "owned"] } },
        { label: "Refund the complaints and quietly fix the next batch", result: "It saves money, and some people never forgive the silence.", effect: { money: -5_000, rep: 0, flag: ["mistake", "quiet"] } },
        { label: "Blame the supplier in public", result: "Partly true, entirely unwise. The supplier fires back, and so does the press.", effect: { rep: -4, flag: ["mistake", "blamed"] } },
      ],
    },
    reward: { money: 2_000, flag: ["s68", "done"] },
  },
  {
    id: "s68b-outage", alt: true, chapter: 7, n: 68, emoji: "🔥", title: "The Outage", place: "Your tech company, 3 a.m.",
    who: ["Your on-call engineer", "Your biggest client"],
    intro: "Your product goes down for six hours on the busiest day of the year. A bad deploy, a missed review, a tired engineer. The client's calls come every ten minutes.",
    dialogue: [["Client", "I do not need excuses. I need to know how this will never happen again."]],
    requires: [{ flag: "s65", is: "done" }, { done: "s67-favour" }, ...on("tech")],
    tasks: [],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Publish an honest post-mortem and credit the fix to the team", result: "It is read widely. Users trust you more for having been open.", effect: { rep: 4, skill: { study: 0.4 }, flag: ["mistake", "owned"] } },
        { label: "Fix it quietly and send private apologies", result: "The client calms down. The public never learns the story, or the lesson.", effect: { rep: 0, flag: ["mistake", "quiet"] } },
        { label: "Blame the engineer who deployed", result: "She resigns. Everyone else wonders who is next.", effect: { rep: -4, flag: ["mistake", "blamed"] } },
      ],
    },
    reward: { money: 2_000, flag: ["s68", "done"] },
  },
  {
    id: "s68c-flop", alt: true, chapter: 7, n: 68, emoji: "🎭", title: "The Flop", place: "A launch night, the Island",
    who: ["A critic", "Your team"],
    intro: "Your biggest launch of the year falls flat. The critic's review is two lines long and both are cruel. The room that cheered you last year looks past you this year.",
    dialogue: [["Critic", "Ambition is a good thing. Taste is another."]],
    requires: [{ flag: "s65", is: "done" }, { done: "s67-favour" }, ...on("creative")],
    tasks: [],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Own it, learn from it, and share what went wrong", result: "Your honesty is the most-shared thing you ever posted. People relate to failure more than polish.", effect: { rep: 4, skill: { charisma: 0.3 }, flag: ["mistake", "owned"] } },
        { label: "Withdraw for a while and rebuild privately", result: "A quiet retreat, a better next piece. Some forget you, and some wait.", effect: { rep: 0, flag: ["mistake", "retreat"] } },
        { label: "Attack the critic publicly", result: "It looks small. The critic wins the argument without trying.", effect: { rep: -4, flag: ["mistake", "attacked"] } },
      ],
    },
    reward: { money: 2_000, flag: ["s68", "done"] },
  },
  {
    id: "s68d-error", alt: true, chapter: 7, n: 68, emoji: "⚠️", title: "The Error", place: "A hospital ward or a chamber",
    who: ["A senior colleague", "An affected person"],
    intro: "A mistake in your work reaches someone it should not have. Nobody is seriously hurt, but the discovery is yours, and so is the choice about what to do with it.",
    dialogue: [["Colleague", "Systems fail. People hide it. You decide which kind of professional you will be."]],
    requires: [{ flag: "s65", is: "done" }, { done: "s67-favour" }, ...on("professional")],
    tasks: [],
    choice: {
      prompt: "What do you do?",
      options: [
        { label: "Report it immediately, apologise, and help fix the process", result: "A hard conversation and a better system. The person affected thanks you for the honesty.", effect: { rep: 4, skill: { study: 0.4 }, flag: ["mistake", "owned"] } },
        { label: "Fix it quietly and document it internally", result: "The immediate problem is solved. The deeper pattern remains unseen.", effect: { rep: 0, flag: ["mistake", "quiet"] } },
        { label: "Hope it goes unnoticed", result: "It does not. The delay makes the consequences worse.", effect: { rep: -4, flag: ["mistake", "hid"] } },
      ],
    },
    reward: { money: 2_000, flag: ["s68", "done"] },
  },
  {
    id: "s69-reckoning", chapter: 7, n: 69, emoji: "🪞", title: "A Quiet Reckoning", place: "Your flat, late at night",
    who: ["Ify", "Mummy"],
    intro: "After the noise settles, you sit alone with a notebook. Ify's question comes back to you from years ago: 'What are you willing to lose for this?' You write down the answer, then cross it out, then write it again.",
    dialogue: [["Ify", "You are allowed to change your mind about what winning means."]],
    requires: [{ flag: "s68", is: "done" }],
    tasks: [{ text: "Hold ₦220,000 in cash", cond: { money: 220_000 } }, { text: "Hold a respected name (reputation 36)", cond: { rep: 36 } }],
    choice: {
      prompt: "What do you commit to?",
      options: [
        { label: "Put people before profit, even when it costs", result: "You write it on a card and put it in your wallet. It will be tested, soon.", effect: { rep: 3, bond: ["ify", 8], flag: ["values", "people"] } },
        { label: "Build something durable, and be fair along the way", result: "Patience, rules, and a plan that can survive you.", effect: { rep: 2, skill: { hustle: 0.3 }, flag: ["values", "durable"] } },
        { label: "Keep winning, and clean up the damage as it comes", result: "It is a plan. It is not a comfortable one.", effect: { money: 5_000, flag: ["values", "winning"] } },
      ],
    },
    reward: { money: 2_000 },
  },
  {
    id: "s70-cost", chapter: 7, n: 70, emoji: "⚖️", title: "What It Cost, What It Bought", place: "A rooftop, Lagos at night",
    who: ["Everyone who has mattered"],
    intro: "You count it all out, the way you once counted ₦50 notes: the apologies owed, the lessons earned, the nights lost, the people who stayed. The ledger does not balance neatly, and you realise it was never meant to.",
    dialogue: [["You", "Whatever comes next, I will bring all of this with me."]],
    requires: [{ done: "s69-reckoning" }],
    tasks: [{ text: "Hold ₦240,000 in cash", cond: { money: 240_000 } }, { text: "Hold a respected name (reputation 38)", cond: { rep: 38 } }],
    reward: { money: 14_000, rep: 3, skill: { hustle: 0.3, study: 0.3, charisma: 0.3 } },
    next: "Chapter 8, Making Your Mark, is planned but not playable yet.",
  },
];
