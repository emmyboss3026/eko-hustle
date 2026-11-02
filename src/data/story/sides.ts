// Side missions: optional stories you start from the 📖 Story app. Up to three at a time.
// Some only appear because of a choice you made (an ajo, a bank loan, a promise).
// The legacy ones appear after the main story ends.

import type { StoryMission } from "./types";

export const sides: StoryMission[] = [
  {
    id: "side-ronke", ch: 2, side: true, emoji: "🍲", title: "Mama Ronke's recipe", place: "buka", cast: ["ronke"],
    intro: "Mama Ronke's ewedu is famous from Mushin to Surulere. She's never shared the recipe. But she's short of hands in the kitchen, and you look like you can stir a pot.",
    goal: "Help in Mama Ronke's kitchen three times and reach Cooking level 2.",
    tasks: [{ do: "buka-help", n: 3 }, { skill: "cooking", min: 2 }],
    lines: [
      { who: "ronke", text: "The secret is not the ingredients. It's patience. And a little bit of locust beans. Don't tell anybody." },
      { who: "you", text: "I swear on my egusi, I'll never tell." },
    ],
    choices: [
      { label: "Cook it for Mummy when she visits", result: "Mummy tastes it and narrows her eyes. \"Who taught you this?\" You'll never tell.", fx: { bond: { mummy: 6, ronke: 8 } } },
      { label: "Ask Mama Ronke to teach you more dishes", result: "Every Sunday for a month: efo riro, ofada stew, moi moi. Your cooking changes forever.", fx: { skill: { cooking: 0.6 }, bond: { ronke: 10 } } },
    ],
    reward: { money: 3_000, xp: 150, flag: "ronke_recipe" },
  },
  {
    id: "side-ajo", ch: 2, side: true, if: "ajo", emoji: "🤝🏾", title: "Your ajo turn", place: "market", cast: ["funke"],
    intro: "Your weekly ajo contributions are adding up. Keep paying, and in a few weeks it'll be your turn to collect everything at once.",
    goal: "Pay three more weekly contributions and wait a week for your turn.",
    tasks: [{ pay: 5_000 }, { pay: 5_000 }, { pay: 5_000 }, { days: 7 }],
    lines: [
      { who: "funke", text: "Your turn! Twenty thousand naira, counted twice. Not a kobo missing. That's how ajo works." },
      { who: "you", text: "It's like saving, but with twelve people watching to make sure you don't cheat." },
    ],
    choices: [
      { label: "Use it to buy something you've needed for months", result: "A lump sum is powerful. You finally buy what you couldn't save up for alone.", fx: { mood: "payday" } },
      { label: "Stay in the ajo for another round", result: "Aunty Funke writes your name at the top of the next page. Discipline, every week.", fx: { bond: { funke: 8 }, skill: { hustle: 0.2 } } },
    ],
    reward: { money: 20_000, xp: 200, bond: { funke: 6 } },
  },
  {
    id: "side-volunteer", ch: 2, side: true, if: "volunteer", emoji: "🩹", title: "Saturday clinic", place: "hospital", cast: ["ngozi"],
    intro: "You signed up to volunteer at Mainland General on Saturdays. The waiting room is full by seven. Dr Ngozi hands you a clipboard and a smile.",
    goal: "Volunteer at the clinic three times.",
    tasks: [{ do: "volunteer", n: 3 }],
    lines: [
      { who: "ngozi", text: "Taking blood pressure, writing names, calming children. Small things keep a clinic alive." },
      { who: "you", text: "A grandmother held my hand the whole time she waited. I didn't do anything special." },
      { who: "ngozi", text: "You stayed. That's special." },
    ],
    choices: [
      { label: "Keep volunteering every month", result: "The nurses start calling you by name. The patients do too.", fx: { rep: 3, flag: "regular_volunteer" } },
      { label: "Organise a donation drive for the children's ward", result: "Toys, books and a fan for the children's ward. The nurses nearly cry.", fx: { rep: 4 } },
    ],
    reward: { money: 3_000, xp: 200, rep: 2 },
  },
  {
    id: "side-warehouse", ch: 2, side: true, if: "warehouse", emoji: "📦", title: "Saturdays at the warehouse", place: "market", cast: ["bisola"],
    intro: "Chief Bisola's warehouse at 6 a.m. on a Saturday: trucks, sacks, and a foreman who doesn't believe in breaks. You promised you'd come.",
    goal: "Carry loads for traders three times.",
    tasks: [{ do: "carry-loads", n: 3 }],
    lines: [
      { who: "bisola", text: "You came every Saturday. Most people come once. Now I'll teach you how to read a delivery note." },
      { who: "you", text: "My back hurts in places I didn't know I had." },
    ],
    choices: [
      { label: "Ask to learn how she prices her stock", result: "She opens her old ledger. Thirty years of prices, written in neat blue ink.", fx: { skill: { hustle: 0.5 } } },
      { label: "Ask to learn how she manages her drivers", result: "\"Pay on time, never shout, and know their children's names.\"", fx: { skill: { charisma: 0.4 } } },
    ],
    reward: { money: 6_000, xp: 200, flag: "bisola_trained" },
  },
  {
    id: "side-football", ch: 3, side: true, emoji: "⚽", title: "The street cup", place: "yaba-street", cast: ["tunde", "sule"],
    intro: "Every year, the streets of Yaba play a football tournament for a trophy made from a painted paint tin. Tunde's team needs one more player. Coach Sule is the referee.",
    goal: "Play street football three times and reach Fitness level 2.",
    tasks: [{ do: "football", n: 3 }, { skill: "fitness", min: 2 }],
    lines: [
      { who: "tunde", text: "Final! Last minute! Pass it, pass it, PASS IT!" },
      { who: "sule", text: "Fair game. Good spirit. Somebody please take Tunde off the pitch before he cries." },
    ],
    choices: [
      { label: "Take the last-minute shot yourself", result: "You shoot.", fx: { skill: { fitness: 0.2 } }, chance: { odds: 0.5, win: "GOAL! The street erupts. You're carried on shoulders down the road. The paint tin is yours.", winFx: { rep: 4, skill: { fitness: 0.2 }, mood: "goodGist" } } },
      { label: "Pass to Tunde for the winner", result: "Tunde scores and runs around the street with his shirt over his head. He'll tell this story forever.", fx: { bond: { tunde: 12 }, mood: "goodGist" } },
    ],
    reward: { money: 5_000, xp: 200 },
  },
  {
    id: "side-awareness", ch: 3, side: true, if: "scam_reported", emoji: "📢", title: "Scam awareness", place: "mushin-street", cast: ["femi", "tunde"],
    intro: "After the forex app vanished, three more people on your street lost money to similar schemes. The pastor and the imam both offer you five minutes to warn people.",
    goal: "Go to church or mosque twice.",
    tasks: [{ do: "worship", n: 2 }],
    lines: [
      { who: "femi", text: "Speak simply. Old people don't understand 'forex'. They understand 'thief'." },
      { who: "tunde", text: "Tell them about me. I don't mind. If my shame saves one person, fine." },
    ],
    choices: [
      { label: "Tell your own story", result: "Honest and funny. Afterwards, people queue to ask you about apps their children sent them.", fx: { rep: 4 } },
      { label: "Print a simple warning flyer", result: "\"If it doubles your money, it's a thief.\" It's taped to every shop door on the street.", fx: { rep: 3, skill: { charisma: 0.2 } } },
    ],
    reward: { money: 4_000, xp: 180, rep: 2 },
  },
  {
    id: "side-kunle-tutor", ch: 4, side: true, emoji: "📖", title: "Study with Kunle", place: "yaba-street", cast: ["kunle"],
    intro: "Kunle is struggling with first-year maths. He'd never say it, but Mummy did. You know a library in Yaba with good tables and bad air conditioning.",
    goal: "Study at the library three times with Kunle.",
    tasks: [{ do: "library|lecture", n: 3 }],
    lines: [
      { who: "kunle", text: "Why does calculus hate me?" },
      { who: "you", text: "It doesn't hate you. It just needs to be asked the same question many times. Like Mummy." },
    ],
    choices: [
      { label: "Make it a weekly habit", result: "Every Sunday at four. By the end of the semester, Kunle's teaching other students.", fx: { bond: { kunle: 12 }, skill: { study: 0.3 } } },
      { label: "Pay for a proper tutor (₦8,000)", result: "A patient maths graduate. Kunle passes with a B and calls it a miracle.", fx: { cost: 8_000, bond: { kunle: 8 } } },
    ],
    reward: { money: 5_000, xp: 220 },
  },
  {
    id: "side-chiamaka", ch: 4, side: true, if: "chiamaka_friend", emoji: "🎂", title: "Chiamaka's birthday", place: "campus", cast: ["chiamaka"],
    intro: "Chiamaka says she doesn't celebrate birthdays. Her friends have secretly booked a table at the campus cafeteria. Your job: get her there without her suspecting.",
    goal: "Eat at the campus cafeteria and pay for the cake.",
    tasks: [{ do: "campus-gist" }, { pay: 5_000 }],
    lines: [
      { who: "chiamaka", text: "Why is everybody here? Why is there a cake? I said no birthdays!" },
      { who: "you", text: "You also said you'd make a five-year plan. Some rules are made to be broken." },
    ],
    choices: [
      { label: "Give a short, funny speech", result: "She laughs so hard she has to sit down. Then she hugs everyone twice.", fx: { skill: { charisma: 0.2 }, mood: "goodGist" } },
      { label: "Give her a notebook for her next five-year plan", result: "She reads the first page you wrote, then hides her face. \"I hate you.\" She means the opposite.", fx: { flag: "chiamaka_close" } },
    ],
    reward: { money: 3_000, xp: 180 },
  },
  {
    id: "side-loan", ch: 5, side: true, if: "loan", emoji: "🏦", title: "Repay the bank", place: "tower", cast: ["bisola"],
    intro: "The bank loan helped you grow. Now the repayments are due, with interest. Paying it off early saves money and frees you from the monthly worry.",
    goal: "Repay the loan in full.",
    tasks: [{ pay: 230_000 }],
    lines: [
      { who: "bisola", text: "The day you clear your first loan, sleep well. You've earned it." },
      { who: "you", text: "Paid. Every naira, plus interest. The bank manager sent a fruit basket." },
    ],
    choices: [
      { label: "Promise yourself: only borrow for things that earn", result: "A rule you'll keep for the rest of your career.", fx: { skill: { hustle: 0.3 }, flag: "smart_debt" } },
      { label: "Ask the bank for a credit line for emergencies", result: "Approved, because you paid on time. A safety net, not a habit.", fx: { rep: 2 } },
    ],
    reward: { xp: 300, rep: 5, unflag: "loan", flag: "loan_repaid" },
  },
  {
    id: "side-tunde-wedding", ch: 6, side: true, emoji: "💒", title: "Tunde's wedding", place: "pavilion", cast: ["tunde", "jide"],
    intro: "Tunde is getting married! He's nervous, broke and wildly happy. The reception is at Royal Pavilion, and he wants you as his best man or chief bridesmaid, his words.",
    goal: "Attend the event and give a gift.",
    tasks: [{ do: "attend-event" }, { pay: 20_000 }],
    lines: [
      { who: "tunde", text: "From WhatsApp hustle to wedding! Can you believe this, my friend?" },
      { who: "jide", text: "I wasn't invited but I came anyway. Weddings need experienced dancers." },
    ],
    choices: [
      { label: "Pay for the live band as your gift", result: "The band plays until the hall manager begs them to stop. Tunde will never forget it.", fx: { cost: 30_000, bond: { tunde: 15 }, rep: 3 } },
      { label: "Give a speech about the forex app", result: "The whole hall laughs. Tunde laughs hardest, then hides behind his wife.", fx: { bond: { tunde: 10 }, skill: { charisma: 0.2 } } },
    ],
    reward: { money: 10_000, xp: 300 },
  },
  {
    id: "side-abeokuta", ch: 8, side: true, emoji: "🛣️", title: "Visit Abeokuta", place: "phone", cast: ["mummy", "kunle"],
    intro: "You haven't been home in a long time. Mummy says the mango tree in the yard has fruit this year, and she's keeping the best ones for you.",
    goal: "Call Mummy twice and pay for the trip.",
    tasks: [{ do: "call-mummy", n: 2 }, { pay: 20_000 }],
    lines: [
      { who: "mummy", text: "You came! Sit, sit. I've cooked everything you like. Twice." },
      { who: "kunle", text: "She's been cooking for three days. I'm not allowed to touch anything." },
    ],
    choices: [
      { label: "Spend the whole week doing nothing but eating and resting", result: "Seven days of Mummy's food and the sound of the mango leaves. You go back to Lagos new.", fx: { bond: { mummy: 15 }, mood: "wellRested" } },
      { label: "Visit your old primary school", result: "Your old teacher remembers you. The children ask how you made it. You tell them the truth.", fx: { rep: 4, bond: { mummy: 8 } } },
    ],
    reward: { money: 10_000, xp: 400 },
  },
  {
    id: "side-legacy-circle", ch: 10, side: true, if: "story_done", emoji: "♟️", title: "The mentors' circle", place: "park", cast: ["femi"],
    intro: "Your story is told, but Lagos keeps going. On Saturdays, young people gather at Unity Park, where Baba Femi's old board now waits. They want to learn from you.",
    goal: "Play draughts three times and reach reputation 95.",
    tasks: [{ do: "draughts", n: 3 }, { rep: 95 }],
    lines: [
      { who: "you", text: "You walk like someone looking for something. Sit. Play one game." },
      { who: "femi", text: "(on the phone) Ah, you're using my line now. Good. That's how it works." },
    ],
    choices: [
      { label: "Teach them draughts and life", result: "Every Saturday, a new face. Some of them will sit on this bench one day and say the same words.", fx: { rep: 3, flag: "legacy_circle" } },
      { label: "Let the young people teach you something new", result: "A fifteen-year-old shows you a game on her phone. You're terrible at it. Everyone laughs.", fx: { mood: "goodGist", flag: "legacy_circle" } },
    ],
    reward: { money: 100_000, xp: 500 },
  },
  {
    id: "side-legacy-danfo", ch: 10, side: true, if: "story_done", emoji: "🚌", title: "One more danfo", place: "mushin-street", cast: ["conductor"],
    intro: "You could take a car anywhere now. But some days, you take a danfo across Lagos, just to remember what it felt like when everything was ahead of you.",
    goal: "Take five trips across Lagos.",
    tasks: [{ count: "travel|walk", n: 5 }],
    lines: [
      { who: "conductor", text: "Yaba! Yaba! Enter with your change o! ...Wait. Aren't you the one from TV?" },
      { who: "you", text: "Same person. Same exact change." },
    ],
    choices: [
      { label: "Pay for everyone's fare", result: "The whole danfo cheers. The conductor tells the story at every stop for a week.", fx: { cost: 5_000, rep: 2, mood: "goodGist" } },
      { label: "Ride quietly and watch the city", result: "Mushin, Yaba, the bridge, the lagoon. The city that made you, rolling past the window.", fx: { mood: "wellRested" } },
    ],
    reward: { money: 50_000, xp: 500 },
  },
  // ---- they open when you claim a home goal (see data/homeGoals.ts): your flat and your story grow together
  {
    id: "side-housewarming", ch: 2, side: true, if: "home:settle", emoji: "🎉", title: "Housewarming", place: "home", cast: ["mummy"],
    intro: "The flat finally looks lived in. Mummy hears about it before you tell her, the way mothers do, and says she is coming with a pot of jollof.",
    goal: "Fill your flat with ten more things and accept an invitation for the weekend.",
    tasks: [{ furnish: 10 }, { count: "invite", n: 1 }],
    lines: [
      { who: "mummy", text: "A sofa, a lamp, a proper table. Look at you, building a life. Your father would have sat on that sofa all day." },
      { who: "you", text: "Mummy, please, the sofa is for guests." },
    ],
    choices: [
      { label: "Ask Mummy to bless the flat", result: "She walks every room, humming, touching each wall. The flat feels like it has been here for years.", fx: { bond: { mummy: 8 }, flag: "flat_blessed" } },
      { label: "Throw a small party for the neighbours", result: "Forty minutes in, half the compound is in your parlour. The speaker is borrowed, the rice is not enough, and nobody cares.", fx: { rep: 2, bond: { tunde: 4 } } },
    ],
    reward: { money: 10_000, xp: 150, bond: { mummy: 5 } },
  },
  {
    id: "side-garden", ch: 3, side: true, if: "home:yard", emoji: "🌿", title: "The gate and the garden party", place: "home", cast: ["tobi"],
    intro: "You met Tobi the architect on the Island. He sees your new garden and winces and smiles at the same time. \"Lovely lawn. But anybody can walk in. Give the compound a wall and a gate, and I will help you host.\"",
    goal: "Build the compound wall and gate, then accept two invitations.",
    tasks: [{ built: "gate" }, { count: "invite", n: 2 }],
    lines: [
      { who: "tobi", text: "A gate is not about keeping people out. It is about deciding who you let in. That is the whole of architecture." },
      { who: "you", text: "That sounds like something you say at a wedding." },
    ],
    choices: [
      { label: "Let Tobi design the party layout", result: "Lanterns along the drive, chairs in a curve, a path of light to the gate. Guests keep asking who did it.", fx: { rep: 3, skill: { charisma: 0.2 } } },
      { label: "Keep it simple: grill, music, neighbours", result: "Suya smoke over the new lawn, someone's cousin on the speakers. Simple and perfect.", fx: { rep: 1, bond: { tunde: 5 } } },
    ],
    reward: { money: 25_000, xp: 250, rep: 2 },
  },
  {
    id: "side-roadtrip", ch: 3, side: true, if: "home:wheels", emoji: "🛣️", title: "First road trip", place: "beach", cast: ["tunde"],
    intro: "A car in the drive, and Tunde cannot stop looking at it. \"We are not letting it sit there. Sunset Beach. Three stops on the way. I will pay for the roasted corn.\"",
    goal: "Take three trips across town and do something at Sunset Beach.",
    tasks: [{ count: "travel", n: 3 }, { visit: "beach" }],
    lines: [
      { who: "tunde", text: "Windows down, music up, no go-slow in sight. This is what the money was for." },
      { who: "you", text: "The money was for rent, Tunde." },
      { who: "tunde", text: "Rent is for tomorrow. Today we have a sea." },
    ],
    choices: [
      { label: "Drive home slowly and carefully", result: "Tunde complains for the first ten minutes, then falls asleep. You park without a scratch.", fx: { bond: { tunde: 4 }, skill: { fitness: 0.1 } } },
      { label: "Race the sunset back", result: "You make it to the gate with the last of the orange light and a very loud engine. Neighbours remember it for weeks.", fx: { rep: 2, mood: "payday" } },
    ],
    reward: { money: 8_000, xp: 200, bond: { tunde: 6 } },
  },
  {
    id: "side-guestroom", ch: 4, side: true, if: "home:extend", emoji: "🛏️", title: "The guest room", place: "home", cast: ["mummy"],
    intro: "With the extension done, Mummy takes one look at the new room and her eyes light up. \"Now Kunle can stop sleeping on that mat at his friend's place. And I can visit for a whole week.\"",
    goal: "Furnish the flat with fourteen things in total and bring Mummy closer.",
    tasks: [{ furnish: 14 }, { bond: "mummy", min: 40 }],
    lines: [
      { who: "mummy", text: "A bed for guests, a place for Kunle to study, and a window that opens. You have done well, my child." },
      { who: "you", text: "It was not cheap, Mummy." },
      { who: "mummy", text: "Nothing worth keeping is." },
    ],
    choices: [
      { label: "Offer the room to Kunle for his exams", result: "Kunle studies there for a month. He passes. He never stops talking about the table by the window.", fx: { bond: { kunle: 10, mummy: 4 } } },
      { label: "Keep it as a study for your own hustle", result: "A desk, a lamp, a door that closes. You get more done in a week than in the month before.", fx: { skill: { study: 0.3, hustle: 0.2 } } },
    ],
    reward: { money: 30_000, xp: 300, bond: { mummy: 6 } },
  },

];
