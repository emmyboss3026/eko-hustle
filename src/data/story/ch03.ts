// Chapter 3 — The Hustle (missions 21–30). Floods, scams, NEPA and the first real savings.
// Earlier choices come back here: the forex app, Kunle's fees, the people you were kind to.

import type { StoryMission } from "./types";

export const ch03: StoryMission[] = [
  {
    id: "c3-flood", ch: 3, emoji: "🌧️", title: "Rainy season", place: "mushin-street", cast: ["landlord", "femi"],
    intro: "The rains arrive all at once. Blocked gutters turn the street into a river, and water creeps under doors. Baba Landlord is out in his wellington boots, shouting instructions nobody follows.",
    goal: "Join the street clean-up and clear the gutters.",
    tasks: [{ do: "community-clean" }],
    lines: [
      { who: "femi", text: "Every year the same story. We throw rubbish in the gutter in the dry season and cry in the rainy season." },
      { who: "landlord", text: "Thank you for coming out. Half of the young men are still sleeping." },
      { who: "you", text: "If we did this every month, it wouldn't get this bad." },
    ],
    choices: [
      { label: "Organise a monthly clean-up for the street", result: "You make a WhatsApp group: \"Our Street, Our Gutter\". Forty people join in one day.", fx: { rep: 5, flag: "street_leader", bond: { landlord: 5 } } },
      { label: "Raise your things off the floor and move on", result: "Your room stays dry. You tell yourself that's enough for now.", fx: { flag: "kept_to_self" } },
    ],
    reward: { money: 3_000, xp: 140, rep: 2 },
  },
  {
    id: "c3-forex", ch: 3, if: "forex_scam", emoji: "📉", title: "The app vanished", place: "phone", cast: ["tunde"],
    intro: "You open the shiny forex app to check on your \"doubled\" money. The app is gone. The website is gone. Tunde's guy has changed his number.",
    goal: "Call Tunde and figure out what happened.",
    tasks: [{ count: "call", n: 1 }],
    lines: [
      { who: "tunde", text: "I swear I didn't know! I lost ₦20,000 myself. My guy said it was guaranteed..." },
      { who: "you", text: "Nothing that doubles your money in a week is guaranteed, Tunde. We both learned that today." },
    ],
    choices: [
      { label: "Report it and warn everyone you know", result: "You file a report with your bank and post a warning. Three friends say you saved them money.", fx: { rep: 4, flag: "scam_reported", skill: { charisma: 0.1 } } },
      { label: "Write it off as an expensive lesson", result: "₦2,000 for a lesson some people pay millions for. You'll never forget it.", fx: { skill: { hustle: 0.3 }, flag: "scam_lesson" } },
    ],
    reward: { xp: 120 },
  },
  {
    id: "c3-forex-b", ch: 3, unless: "forex_scam", emoji: "📉", title: "Tunde's bad week", place: "phone", cast: ["tunde"],
    intro: "Tunde calls, quieter than usual. The forex app he kept talking about has vanished with his money. He lost ₦20,000 and his pride.",
    goal: "Call Tunde and be a friend.",
    tasks: [{ count: "call", n: 1 }],
    lines: [
      { who: "tunde", text: "You were right not to put money in. I feel like a fool." },
      { who: "you", text: "You're not a fool. You trusted the wrong person. Now you know." },
      { who: "tunde", text: "Can you... lend me something small till Friday? My phone data finished." },
    ],
    choices: [
      { label: "Lend him ₦5,000", result: "\"Friday. I promise.\" On Friday he pays back every naira, plus a bottle of malt.", fx: { cost: 5_000, money: 5_000, bond: { tunde: 12 }, flag: "helped_tunde" } },
      { label: "Help him report the scam instead", result: "You sit with him while he files a report. He doesn't get the money back, but he gets his fight back.", fx: { bond: { tunde: 6 }, rep: 2, flag: "scam_reported" } },
    ],
    reward: { xp: 120 },
  },
  {
    id: "c3-phones", ch: 3, emoji: "📲", title: "Computer Village", place: "village", cast: ["tunde"],
    intro: "Computer Village in Ikeja: thousands of phones, laptops and chargers, and traders who can open a phone with their eyes closed. Tunde says there's real money in fixing and flipping.",
    goal: "Flip phones for profit at Computer Village.",
    tasks: [{ do: "computer-village", n: 2 }],
    lines: [
      { who: "tunde", text: "That one is refurbished. New screen, old battery. Some people sell it as 'London used, like new'." },
      { who: "you", text: "And the battery dies in three months." },
      { who: "tunde", text: "Exactly. Your choice how you sell it." },
    ],
    choices: [
      { label: "Tell buyers the truth and price it fairly", result: "Smaller profit, but your customers come back and bring their friends.", fx: { rep: 3, flag: "honest_trader", skill: { hustle: 0.2 } } },
      { label: "Sell it as 'London used, like new'", result: "Quick ₦5,000 profit. You try not to think about the customer's face in three months.", fx: { money: 5_000, rep: -3, flag: "shady_trader" } },
    ],
    reward: { money: 3_000, xp: 140 },
  },
  {
    id: "c3-health", ch: 3, emoji: "😮‍💨", title: "Running on empty", place: "home", cast: ["sule"],
    intro: "Long shifts, late nights and buka food are catching up with you. You're dizzy on the danfo. Coach Sule sees you climbing the stairs at the gym and frowns.",
    goal: "Get proper sleep and some exercise.",
    tasks: [{ do: "sleep|sleep-bed|floor-sleep" }, { do: "gym|jog|home-workout|aerobics" }],
    lines: [
      { who: "sule", text: "Your body is not a generator. You can't just pour fuel in and run it all night." },
      { who: "you", text: "If I rest, who will pay my rent?" },
      { who: "sule", text: "If you collapse, who will pay your hospital bill? Sleep, water, movement. Every day." },
    ],
    choices: [
      { label: "Book a proper check-up (₦3,000)", result: "The doctor says you're fine, just exhausted. You leave with a plan and peace of mind.", fx: { cost: 3_000, flag: "checkup", mood: "wellRested" } },
      { label: "Push through, there's money to make", result: "You feel better after one good night. You tell yourself that's enough.", fx: { flag: "ignored_health", skill: { hustle: 0.1 } } },
    ],
    reward: { money: 2_000, xp: 120 },
  },
  {
    id: "c3-kunle", ch: 3, emoji: "📬", title: "Kunle's results", place: "campus", cast: ["kunle", "mummy"],
    intro: "JAMB results are out. The whole family has been refreshing the portal since morning.",
    goal: "Meet Kunle at Lagoon University.",
    tasks: [{ visit: "campus" }],
    lines: [
      { who: "kunle", if: "paid_kunle", text: "Cousin! I scored 268! Lagoon University offered me admission! None of this happens without you." },
      { who: "kunle", if: "half_kunle", text: "I washed cars for three weeks to finish the fees. I scored 241. Lagoon University offered me a place!" },
      { who: "kunle", if: "jide_asked", text: "Uncle Jide paid in the end, but late. I scored 230. Admission came, but only for next session." },
      { who: "mummy", text: "God has done it. Now the real work starts: fees, books, accommodation..." },
    ],
    choices: [
      { label: "Let Kunle stay with you while he settles in", result: "Your small room gets smaller and louder. But at night you study together.", fx: { bond: { kunle: 12, mummy: 6 }, flag: "kunle_room", skill: { study: 0.2 } } },
      { label: "Buy him a second-hand laptop (₦25,000)", result: "He holds it like a baby. \"I'll make you proud.\"", fx: { cost: 25_000, bond: { kunle: 15 }, flag: "kunle_laptop" } },
      { label: "Give him advice and a hug", result: "\"Read hard, stay out of trouble, call your mother.\" He laughs, but he listens.", fx: { bond: { kunle: 4 } } },
    ],
    reward: { money: 2_000, xp: 130 },
  },
  {
    id: "c3-library", ch: 3, emoji: "📚", title: "Study partners", place: "yaba-street", cast: ["chiamaka"],
    intro: "Chiamaka has a rule: two hours at the Yaba library every week, phones face down. \"People who plan their future get one,\" she says. \"Everyone else gets whatever is left.\"",
    goal: "Study at the library twice and reach level 3 in any skill.",
    tasks: [{ do: "library|lecture|read-book", n: 2 }, { anySkill: 3 }],
    lines: [
      { who: "chiamaka", text: "So what's the plan? Five years from now, where are you?" },
      { who: "you", text: "Honestly? Somewhere with constant light and no landlord clearing his throat." },
      { who: "chiamaka", text: "Ha! That's a start. I want to run something. A hospital, a company, I don't know yet. Something big." },
    ],
    choices: [
      { label: "Make a five-year plan together", result: "You fill two pages. Some of it is silly. Some of it makes your heart beat faster.", fx: { flag: "five_year_plan", skill: { study: 0.3 } } },
      { label: "Tell her you'll figure it out as you go", result: "\"Lagos punishes people who 'figure it out',\" she warns. But she buys you a Fanta anyway.", fx: { skill: { hustle: 0.2 } } },
    ],
    reward: { money: 3_000, xp: 140 },
  },
  {
    id: "c3-invest", ch: 3, emoji: "📈", title: "Money that works", place: "phone", cast: ["tunde", "ify"],
    intro: "After the forex disaster, Tunde has become careful. Ify shows you both the 📈 Invest app: real funds, real risk, no promises of doubling.",
    goal: "Make your first investment in the 📈 Invest app.",
    tasks: [{ count: "invest", n: 1 }],
    lines: [
      { who: "ify", text: "Savings funds grow slowly but almost never fall. Tech funds can jump or crash. Never put in money you need for rent." },
      { who: "tunde", text: "And Moon Coin? It says up 40% this week!" },
      { who: "ify", text: "And down 60% next week. Your choice." },
    ],
    choices: [
      { label: "Play it safe: savings and bonds", result: "Slow and steady. Every morning you check, and it's a little higher.", fx: { flag: "safe_investor", skill: { hustle: 0.2 } } },
      { label: "Take some risk for bigger returns", result: "Your heart jumps every time you open the app. Some days you win, some days you learn.", fx: { flag: "risk_investor", skill: { hustle: 0.3 } } },
    ],
    reward: { money: 4_000, xp: 140 },
  },
  {
    id: "generator", ch: 3, emoji: "⚡", title: "Beat NEPA", place: "home", cast: ["landlord"],
    intro: "NEPA has taken the light for the third night this week. You can't study, can't charge your phone, and the heat is unbearable. Every house on the street hums with generators except yours.",
    goal: "Own a generator so power cuts don't stop you.",
    tasks: [{ item: "generator" }],
    steps: [
      "Save ₦120,000.",
      "At home, tap 🛒 Shop → ⚡ Small generator.",
      "Buy fuel: 📍 Places → 📱 Your phone → ⛽ Buy generator fuel.",
    ],
    tab: "home",
    lines: [
      { who: "landlord", text: "Ah, you've joined the generator club! Keep it outside the window and never run it inside. The fumes kill." },
      { who: "you", text: "I'll keep it outside, sir. I promise." },
    ],
    choices: [
      { label: "Share your power with the neighbour's kids so they can study", result: "Three children do their homework under your bulb every evening. Their mother sends you food.", fx: { rep: 4, flag: "shared_light" } },
      { label: "Keep it for yourself and save fuel", result: "Fuel is expensive. You run it only when you need it, and your wallet thanks you.", fx: { skill: { hustle: 0.2 } } },
    ],
    reward: { money: 5_000, xp: 180, rep: 1 },
  },
  {
    id: "c3-island", ch: 3, emoji: "🌃", title: "Island night", place: "island-street", cast: ["damola", "tobi"],
    intro: "Ify drags you to a networking mixer on the Island. Glass towers, live band, people who say \"let's do lunch\" and mean it. Two people stand out.",
    goal: "Attend a networking mixer on the Island.",
    tasks: [{ do: "networking" }],
    lines: [
      { who: "damola", text: "Damola Pedro. Import, export, real estate, music. If it makes money, I'm in it. And you are?" },
      { who: "tobi", text: "Don't mind him, he says that to everybody. I'm Tobi. I design buildings. Real ones, with foundations." },
      { who: "damola", text: "Tobi is jealous of my vision. Here's my card. Call me when you're ready to make real money." },
    ],
    choices: [
      { label: "Spend the evening talking with Tobi", result: "You talk about Lagos, buildings, dreams and the best suya in Yaba. The night goes too fast.", fx: { flag: ["tobi_met", "damola_met", "tobi_close"] } },
      { label: "Talk business with Damola", result: "He has a hundred ideas a minute. Some sound brilliant. Some sound... careful.", fx: { flag: ["tobi_met", "damola_met", "damola_ally"], skill: { hustle: 0.3 } } },
    ],
    reward: { money: 3_000, xp: 150, rep: 2 },
  },
  {
    id: "savings", ch: 3, emoji: "🏦", title: "Save ₦300,000", place: "phone", cast: ["femi"],
    intro: "Baba Femi says a person with no savings is like a house with no roof: fine until the first rain. Before you choose your future, build a cushion.",
    goal: "Build up savings for your big dream.",
    tasks: [{ money: 300_000 }],
    steps: [
      "Work shifts and side hustles, and spend carefully.",
      "Better jobs pay much more: check 💼 Jobs for what they need.",
      "Tap ✈️ Goals to see what your dream costs.",
    ],
    tab: "goals",
    lines: [
      { who: "femi", text: "Three hundred thousand. Good. Now you can choose your road, instead of the road choosing you." },
      { who: "femi", text: "In draughts, a piece that tries to go everywhere goes nowhere. Choose, then move with purpose." },
      { who: "you", text: "What matters most, Baba?" },
    ],
    choices: [
      { label: "\"Money first. Everything else follows.\"", result: "\"Money is a good servant and a terrible master,\" he says. \"Remember who is serving who.\"", fx: { flag: "value_money", skill: { hustle: 0.3 } } },
      { label: "\"Respect first. Money follows a good name.\"", result: "He taps his nose. \"A good name is better than gold. That's in the Book, and it's true in Lagos.\"", fx: { flag: "value_respect", rep: 3 } },
      { label: "\"Family first. That's why I came.\"", result: "\"Then don't forget them when you're busy. Busy is how people forget.\"", fx: { flag: "value_family", bond: { mummy: 6 } } },
    ],
    reward: { money: 10_000, xp: 250, rep: 2 },
  },
];
