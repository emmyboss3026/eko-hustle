// Chapter 2 — Finding Your Feet (missions 11-20). Yaba and the mainland: learning, first promotion, friends.
// Mission 13 has three versions, picked by the lane you chose at the end of Chapter 1.

import type { StoryMission } from "./types";

export const ch2: StoryMission[] = [
  {
    id: "s11-mainland", chapter: 2, n: 11, emoji: "🚌", title: "Mainland Bound", place: "Danfo to Yaba",
    who: ["Tunde"],
    intro: "The danfo is a rolling argument. A conductor shouts destinations like prayers. You hold your bag in front of you, and Yaba arrives in pieces: bookshops, phone repair stalls, young people with laptops in rucksacks.",
    dialogue: [
      ["Tunde", "Yaba is Lagos's thinking cap. Money here is smaller than the Island, but ideas are cheaper."],
      ["You", "And the Island?"],
      ["Tunde", "Later. First learn to walk without looking lost."],
    ],
    requires: [{ done: "s10-friday" }],
    tasks: [{ text: "Travel to another part of Lagos", cond: { do: "travel" } }],
    reward: { money: 1_000, rep: 1 },
  },
  {
    id: "s12-hub", chapter: 2, n: 12, emoji: "📶", title: "Free Wi-Fi, Real Opportunity", place: "The tech hub, Yaba",
    who: ["Ify"],
    intro: "The hub smells of instant noodles and ambition. Ify is hunched over a laptop covered in stickers. 'The Wi-Fi is free,' she says, 'but the lessons are not.'",
    dialogue: [
      ["Ify", "Sit. Open a tab. Learn one thing before you go home."],
      ["You", "What if I fail?"],
      ["Ify", "Then fail in public. It is cheaper."],
    ],
    requires: [{ done: "s11-mainland" }],
    tasks: [{ text: "Use the hub Wi-Fi to work on yourself", cond: { do: "wifi" } }],
    choice: {
      prompt: "A stranger at the next table asks what you are building.",
      options: [
        { label: "Tell him your honest goals, even the small ones", result: "He gives you a number and says, 'Call me when it grows.'", effect: { rep: 1, flag: ["hub", "open"] } },
        { label: "Say 'nothing yet' and keep learning", result: "You protect the idea. Nobody can steal an idea nobody heard.", effect: { skill: { study: 0.3 } } },
      ],
    },
    reward: { money: 1_000, skill: { study: 0.3 } },
  },
  // ----- Mission 13: the lane you chose in Chapter 1 decides which scene you get -----
  {
    id: "s13a-library", alt: true, chapter: 2, n: 13, emoji: "📚", title: "The Library Card", place: "Yaba public library",
    who: ["Ify", "A librarian"],
    intro: "A quiet building in a loud city. The librarian stamps a card with the care of a priest. Ify says the shelves are the cheapest mentors in Lagos.",
    dialogue: [["Librarian", "Silence is also a language. Learn to speak it."]],
    requires: [{ done: "s12-hub" }, { flag: "lane", is: "study" }],
    tasks: [{ text: "Spend a session at the library", cond: { do: "library" } }, { text: "Reach Study 1", cond: { skill: "study", n: 1 } }],
    reward: { money: 1_500, skill: { study: 0.4 }, rep: 1, flag: ["s13", "done"] },
  },
  {
    id: "s13b-bootcamp", alt: true, chapter: 2, n: 13, emoji: "⚡", title: "Sprint Week", place: "Business bootcamp, Yaba",
    who: ["Tunde", "A pitch coach"],
    intro: "A projector, plastic chairs, and a coach who says 'revenue' like a war cry. Tunde grins: 'This is where hustle gets a CV.'",
    dialogue: [["Coach", "Your idea is not your business. Your first customer is."]],
    requires: [{ done: "s12-hub" }, { flag: "lane", is: "hustle" }],
    tasks: [{ text: "Join a bootcamp session", cond: { do: "bootcamp" } }, { text: "Earn ₦2,000 on the side", cond: { do: "earned", n: 2_000 } }],
    reward: { money: 1_500, skill: { hustle: 0.4 }, rep: 1, flag: ["s13", "done"] },
  },
  {
    id: "s13c-meetup", alt: true, chapter: 2, n: 13, emoji: "🤝", title: "Faces and Names", place: "A community meetup, Yaba",
    who: ["Sule", "Strangers"],
    intro: "Sule drags you into a hall of strangers with name tags. By the second hour you realise most jobs in Lagos are found by conversation, not applications.",
    dialogue: [["Sule", "Shake hands like you mean it. Then remember their names."]],
    requires: [{ done: "s12-hub" }, { flag: "lane", is: "social" }],
    tasks: [{ text: "Attend a meetup", cond: { do: "meetup" } }, { text: "Greet three people on the street", cond: { do: "greet", n: 3 } }],
    reward: { money: 1_500, skill: { charisma: 0.4 }, rep: 1, flag: ["s13", "done"] },
  },
  {
    id: "s14-friend", chapter: 2, n: 14, emoji: "👥", title: "Who Has Your Back?", place: "Yaba, evening",
    who: ["Tunde", "Ify"],
    intro: "Two people want your time. Tunde has a side gig that pays fast. Ify has a study group that pays slow, then pays well. You cannot be in both rooms tonight.",
    dialogue: [
      ["Tunde", "Opportunity doesn't knock twice in this city."],
      ["Ify", "Neither does a good teacher."],
    ],
    requires: [{ flag: "s13", is: "done" }],
    tasks: [{ text: "Be known around Yaba (reputation 3)", cond: { rep: 3 } }],
    choice: {
      prompt: "Which room do you walk into?",
      options: [
        { label: "Tunde's side gig", result: "Cash in hand, new rules learned. You gain a partner and a risk.", effect: { money: 1_500, bond: ["tunde", 10], flag: ["friend", "tunde"] } },
        { label: "Ify's study group", result: "Notes, snacks, a code review. You leave tired and sharper.", effect: { skill: { study: 0.5 }, bond: ["ify", 10], flag: ["friend", "ify"] } },
      ],
    },
    reward: { money: 500, rep: 1 },
  },
  {
    id: "s15-promotion", chapter: 2, n: 15, emoji: "📈", title: "Show Them What You Can Do", place: "Your workplace",
    who: ["Your supervisor"],
    intro: "Weeks of showing up pay in a strange currency: the supervisor starts using your name before giving instructions.",
    dialogue: [["Supervisor", "Two people are up for the next step. One of them turns up on time."]],
    requires: [{ done: "s14-friend" }, { job: true }],
    tasks: [{ text: "Get promoted at work", cond: { job: true, level: 1 } }],
    choice: {
      prompt: "You got the promotion. A colleague who was also up for it looks quietly crushed.",
      options: [
        { label: "Share a drink and be gracious", result: "He thaws. Reputation grows in the small gestures.", effect: { money: -500, rep: 2 } },
        { label: "Celebrate loudly with your friends", result: "Good night, but word travels. Not everyone loved the noise.", effect: { mood: "bigNight", rep: -1 } },
      ],
    },
    reward: { money: 2_000, rep: 2 },
  },
  {
    id: "s16-habit", chapter: 2, n: 16, emoji: "🏦", title: "Save Before It Disappears", place: "Your phone, your bank",
    who: ["Kunle"],
    intro: "Money in Lagos has legs. It runs to transport, data, food, and 'small help for a friend'. Kunle says the best discipline is boring: move money before you see it.",
    dialogue: [["Kunle", "Pay yourself first. The rest will complain, but it will still be here."]],
    requires: [{ done: "s15-promotion" }],
    tasks: [{ text: "Hold ₦30,000 in cash", cond: { money: 30_000 } }],
    choice: {
      prompt: "You hit ₦30,000 for the first time. Mummy's birthday is next week.",
      options: [
        { label: "Send ₦5,000 home", result: "She cries on the phone, then blesses you for ten minutes. You feel ten feet tall.", effect: { money: -5_000, bond: ["mummy", 12], rep: 1, flag: ["family", "helped"] } },
        { label: "Keep building your cushion", result: "The number stays big. You promise yourself a bigger gift later.", effect: { flag: ["family", "kept"] } },
      ],
    },
    reward: { money: 1_000 },
  },
  {
    id: "s17-look", chapter: 2, n: 17, emoji: "💈", title: "Look the Part", place: "A barber's, Yaba",
    who: ["Barber Dele"],
    intro: "Dele's shop plays three radios at once. 'You can't pitch a business with that head,' he says, and you realise he is right.",
    dialogue: [
      ["Dele", "First impression is the only one that costs nothing and pays forever."],
      ["You", "Just a clean cut, please."],
    ],
    requires: [{ done: "s16-habit" }],
    tasks: [{ text: "Get a proper haircut", cond: { do: "barber" } }],
    reward: { money: 500, skill: { charisma: 0.3 }, rep: 1 },
  },
  {
    id: "s18-voice", chapter: 2, n: 18, emoji: "👵🏾", title: "Mummy's Voice", place: "On the phone",
    who: ["Mummy"],
    intro: "She calls on a Sunday evening, voice softer than usual. She has been telling the whole church about 'my child in Lagos'.",
    dialogue: [["Mummy", "People ask me what you do. Tell me, so I can say it properly."]],
    requires: [{ done: "s17-look" }],
    tasks: [{ text: "Be close to Mummy (relationship 75)", cond: { bond: "mummy", n: 75 } }],
    choice: {
      prompt: "How do you describe your life to her?",
      options: [
        { label: "The honest version: hard days, small wins", result: "She is quiet, then says: 'That is a real life.' You feel known.", effect: { bond: ["mummy", 8], flag: ["mummy2", "honest"] } },
        { label: "The shiny version: all good, big plans", result: "She is thrilled. You hold the pressure of making it true.", effect: { rep: 1, flag: ["mummy2", "shiny"] } },
      ],
    },
    reward: { money: 1_000 },
  },
  {
    id: "s19-weekend", chapter: 2, n: 19, emoji: "🛠️", title: "Weekend Hustle", place: "Around Yaba",
    who: ["Tunde"],
    intro: "Weekends are for people who need more than a salary. Tunde has a plan: three small jobs, two days, one pocket.",
    dialogue: [["Tunde", "Work the weekend and Monday feels like a gift."]],
    requires: [{ done: "s18-voice" }],
    tasks: [{ text: "Earn ₦6,000 from side hustles", cond: { do: "earned", n: 6_000 } }],
    days: 7, fail: "The weekend slipped past without enough work. Tunde says: 'We go again.'",
    reward: { money: 2_500, skill: { hustle: 0.4 }, rep: 1 },
  },
  {
    id: "s20-sunset", chapter: 2, n: 20, emoji: "🌇", title: "Yaba Sunset", place: "A rooftop, Yaba",
    who: ["Ify", "Tunde", "Sule"],
    intro: "From the rooftop the city is a circuit board of orange light. Everyone you have met this month is here, talking over each other. Someone asks what you want from life, and for once you answer without a script.",
    dialogue: [
      ["Ify", "I want a company that outlives me."],
      ["Tunde", "I want to be so rich my cousins stop borrowing."],
      ["Sule", "I want to be strong enough to carry everyone's bags."],
      ["You", "I want..."],
    ],
    requires: [{ done: "s19-weekend" }],
    tasks: [{ text: "Be someone people know (reputation 6)", cond: { rep: 6 } }],
    choice: {
      prompt: "What do you tell them?",
      options: [
        { label: "\"I want to build money that works for me.\"", result: "Tunde claps. A few eyes widen. The goal has a name now.", effect: { flag: ["ambition", "money"], skill: { hustle: 0.3 } } },
        { label: "\"I want to be great at something real.\"", result: "Ify nods slowly. 'That is the hardest and best answer.'", effect: { flag: ["ambition", "craft"], skill: { study: 0.3 } } },
        { label: "\"I want to lift people with me.\"", result: "Sule raises a bottle. 'Then we are going to need a bigger table.'", effect: { flag: ["ambition", "people"], skill: { charisma: 0.3 } } },
      ],
    },
    reward: { money: 3_000, rep: 2 }, next: "Chapter 3: the Island is calling, and the hustle gets serious.",
  },
];
