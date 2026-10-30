// Chapter 4 — Choosing Your Future (missions 31–40). The crossroads: pick a career route.
// Each route has its own missions from here on, between the shared life missions.
// Game time is compressed: a few game weeks can stand for years of school or training.

import type { StoryMission } from "./types";

export const ch04: StoryMission[] = [
  {
    id: "c4-crossroads", ch: 4, emoji: "🛣️", title: "Crossroads", place: "park", cast: ["femi", "mummy"],
    intro: "Under the trees of Unity Park, Baba Femi sets up the board but doesn't play. \"Five people have shown you five different Lagos,\" he says. \"Which one is yours?\"",
    goal: "Call Mummy, then choose your road.",
    tasks: [{ do: "call-mummy" }, { do: "draughts" }],
    lines: [
      { who: "femi", text: "Chief Bisola trades. Dr Ngozi heals. Barrister Emeka argues. Ify builds. K-Wave entertains. All of them started where you're sitting." },
      { who: "mummy", text: "Whatever you choose, do it well and do it honestly. That's all I ask." },
      { who: "you", text: "I've made my choice." },
    ],
    choices: [
      { label: "🏪 Business: learn from Chief Bisola", result: "Chief Bisola's reply comes in one word: \"Monday.\" Then: \"6 a.m.\"", fx: { route: "biz", flag: "route_biz", skill: { hustle: 0.3 } } },
      { label: "🩺 Medicine: follow Dr Ngozi", result: "Dr Ngozi sends you a list of books and a warning: \"This road is long. Don't start if you'll stop.\"", fx: { route: "med", flag: "route_med", skill: { study: 0.3 } } },
      { label: "⚖️ Law: learn from Barrister Emeka", result: "Barrister Emeka laughs on the phone. \"Good. Lagos needs lawyers with sense. Start reading.\"", fx: { route: "law", flag: "route_law", skill: { study: 0.2, charisma: 0.1 } } },
      { label: "💻 Technology: build with Ify", result: "Ify sends a thumbs-up and a link to a 300-page programming book. \"Chapter one by Friday.\"", fx: { route: "tech", flag: "route_tech", skill: { study: 0.3 } } },
      { label: "🎤 Entertainment: create with K-Wave", result: "K-Wave sends a voice note of a beat. \"Write something to this. Let me hear your soul.\"", fx: { route: "ent", flag: "route_ent", skill: { charisma: 0.3 } } },
    ],
    reward: { money: 5_000, xp: 250, rep: 2 },
  },
  {
    id: "c4-mummy", ch: 4, emoji: "👵🏾", title: "Telling Mummy", place: "phone", cast: ["mummy", "jide"],
    intro: "News travels fast in a Nigerian family. By evening, Mummy, Uncle Jide and three aunties you've never met all have opinions about your choice.",
    goal: "Call Mummy and visit Uncle Jide's house for Sunday lunch.",
    tasks: [{ do: "call-mummy" }, { do: "family-lunch" }],
    lines: [
      { who: "mummy", if: "route_med", text: "A doctor! My child, a doctor! I'm telling everybody in church on Sunday." },
      { who: "mummy", if: "route_law", text: "A lawyer. Good. You've always argued with everybody since you were small." },
      { who: "mummy", if: "route_biz", text: "Business is good, but be careful who you trust with money. Even family." },
      { who: "mummy", if: "route_tech", text: "Computers? Will they pay you in real money or in internet?" },
      { who: "mummy", if: "route_ent", text: "Music? Film? Hmm. As long as you don't come home with tattoos on your face." },
      { who: "jide", text: "In my day we became doctors, lawyers or engineers, full stop. But this is your time. Make us proud." },
    ],
    choices: [
      { label: "Ask for Mummy's blessing", result: "She prays over the phone for a long time. You feel like you could carry a building.", fx: { bond: { mummy: 10 }, flag: "blessed" } },
      { label: "Promise to send money home every month", result: "\"Not too much. Take care of yourself first.\" But you hear the relief in her voice.", fx: { bond: { mummy: 6 }, flag: "send_home" } },
    ],
    reward: { money: 4_000, xp: 200 },
  },

  // ----- route missions, part 1 -----
  {
    id: "c4-biz-1", ch: 4, route: "biz", emoji: "🧺", title: "One stall", place: "market", cast: ["bisola", "funke"],
    intro: "Chief Bisola's first lesson: start small, start now. Aunty Funke has a free stall next to hers. The rent is ₦20,000 a month and the competition is fierce.",
    goal: "Pay for the stall and trade there three times.",
    tasks: [{ pay: 20_000 }, { do: "market-trade", n: 3 }],
    lines: [
      { who: "bisola", text: "What do people buy every day? Rice, oil, pepper, soap. Not designer shoes. Sell what people need." },
      { who: "funke", text: "And smile at every customer. Even the ones who price your tomatoes down to nothing." },
    ],
    choices: [
      { label: "Sell rice by the cup, for people buying daily", result: "Small sales, many customers. By evening your hand is tired from scooping.", fx: { skill: { hustle: 0.3 }, rep: 2, flag: "cup_seller" } },
      { label: "Sell rice by the bag to small shops", result: "Fewer customers, bigger orders. You learn to negotiate with people who negotiate for a living.", fx: { skill: { hustle: 0.3, charisma: 0.1 }, flag: "bulk_seller" } },
    ],
    reward: { money: 8_000, xp: 250 },
  },
  {
    id: "c4-med-1", ch: 4, route: "med", emoji: "📝", title: "Entrance exams", place: "yaba-street", cast: ["ngozi", "chiamaka"],
    intro: "To study medicine you need a high score in the university entrance exam (JAMB) and the university's own screening test. Only a few hundred places, and thousands of applicants.",
    goal: "Register for the exam, study hard and reach Study level 3.",
    tasks: [{ pay: 8_000 }, { do: "library|study-hall|read-book|lecture", n: 2 }, { skill: "study", min: 3 }],
    lines: [
      { who: "ngozi", text: "Biology, chemistry, physics, English. Do past questions until you dream about them." },
      { who: "chiamaka", if: "chiamaka_friend", text: "I'm writing it too! I want medicine as well. We'll do this together." },
      { who: "you", text: "What if I don't make the cut-off?" },
      { who: "ngozi", text: "Then you write it again. Half of my classmates needed two tries. Nobody asks you that when you're a consultant." },
    ],
    choices: [
      { label: "Put Lagoon University first (close to home)", result: "You can keep your room and your Saturday work. Your heart races when you submit.", fx: { flag: "uni_lagoon", skill: { study: 0.2 } } },
      { label: "Pay for extra tutorial classes too (₦10,000)", result: "The tutor is strict and brilliant. Your scores in practice tests jump.", fx: { cost: 10_000, skill: { study: 0.6 } } },
    ],
    reward: { money: 5_000, xp: 250 },
  },
  {
    id: "c4-law-1", ch: 4, route: "law", emoji: "📝", title: "Law admission", place: "court", cast: ["emeka", "adewale"],
    intro: "Law is one of the most competitive courses at Lagoon University. Barrister Emeka says the first step is to see what lawyers actually do. Then pass the entrance exam.",
    goal: "Register for the exam, watch a court session and reach Study level 3.",
    tasks: [{ pay: 8_000 }, { do: "watch-court" }, { skill: "study", min: 3 }],
    lines: [
      { who: "emeka", text: "See how the judge listens more than she talks? Law is listening, reading and then saying exactly the right thing." },
      { who: "adewale", text: "The Faculty of Law takes very few students. Your English must be sharp and your reasoning sharper." },
    ],
    choices: [
      { label: "Read a law report every night", result: "The language is strange at first. By week three, you start to hear the logic in it.", fx: { skill: { study: 0.4 }, flag: "law_reader" } },
      { label: "Join a debate club to sharpen your tongue", result: "You lose your first debate badly. You win your third.", fx: { skill: { charisma: 0.4 }, flag: "debater" } },
    ],
    reward: { money: 5_000, xp: 250, flag: "lawstudent" },
  },
  {
    id: "c4-tech-1", ch: 4, route: "tech", emoji: "👩🏾‍💻", title: "Bootcamp", place: "hub", cast: ["ify"],
    intro: "Ify runs a twelve-week coding bootcamp at Brainbox. It costs money, but she has one scholarship place for someone who can prove they're serious.",
    goal: "Take coding classes three times and reach Study level 3.",
    tasks: [{ do: "bootcamp|learn-code", n: 3 }, { skill: "study", min: 3 }],
    lines: [
      { who: "ify", text: "Programming is mostly being stuck and getting unstuck. If you hate being stuck, choose another road." },
      { who: "ify", if: "hackathon", text: "And you signed up for the hackathon before you could even code. I like that kind of crazy." },
      { who: "you", text: "I don't hate being stuck. I hate staying stuck." },
    ],
    choices: [
      { label: "Pay the full bootcamp fee (₦30,000)", result: "You leave the scholarship for someone who needs it more. Ify notices.", fx: { cost: 30_000, rep: 3, skill: { study: 0.5 } } },
      { label: "Apply for the scholarship with a small project", result: "You build a tiny website for Mama Ronke's buka. Ify gives you the place.", fx: { skill: { study: 0.4 }, bond: { ify: 8, ronke: 5 }, flag: "scholarship" } },
    ],
    reward: { money: 5_000, xp: 250 },
  },
  {
    id: "c4-ent-1", ch: 4, route: "ent", emoji: "🤳🏾", title: "Your page", place: "studio", cast: ["kola"],
    intro: "K-Wave's first rule: \"Nobody will discover you in your room. Post every day. Be yourself, but on purpose.\" Time to build your page.",
    goal: "Shoot content at Afrowave Studios three times.",
    tasks: [{ do: "shoot-content", n: 3 }],
    lines: [
      { who: "kola", text: "Comedy skit, dance, a song cover, a day in your life. Find what makes people stop scrolling." },
      { who: "you", text: "What if nobody watches?" },
      { who: "kola", text: "Then you post again tomorrow. My first video got eleven views. Nine were my mother." },
    ],
    choices: [
      { label: "Funny skits about Lagos life", result: "Your skit about the danfo conductor gets shared in a hundred WhatsApp groups.", fx: { flag: "skits", skill: { charisma: 0.3 } } },
      { label: "Music: covers and your own songs", result: "Slower growth, but the comments say you have a real voice.", fx: { flag: "singer", skill: { charisma: 0.3 } } },
    ],
    reward: { money: 5_000, xp: 250, flag: "creator" },
  },

  // ----- route missions, part 2 -----
  {
    id: "c4-biz-2", ch: 4, route: "biz", emoji: "🏢", title: "Make it official", place: "tower", cast: ["bisola"],
    intro: "\"A business without papers is a hobby,\" says Chief Bisola. Registering your business name with the Corporate Affairs Commission means you can open a business account and sign contracts.",
    goal: "Pay the registration fee and attend a business seminar.",
    tasks: [{ pay: 15_000 }, { do: "biz-class" }],
    lines: [
      { who: "bisola", text: "Big companies won't buy from someone with no registration. Banks won't lend to you. Do it now, while you're small." },
      { who: "you", text: "What should I call it?" },
      { who: "bisola", text: "Something you won't be ashamed of when it's painted on a truck." },
    ],
    choices: [
      { label: "Name it after Mummy", result: "When you tell her, she goes completely silent. Then she cries. Then she tells the whole church.", fx: { bond: { mummy: 10 }, flag: "biz_name_mummy" } },
      { label: "Pick a bold, modern name", result: "Short, strong, easy to remember. Chief Bisola approves: \"That one can travel.\"", fx: { skill: { charisma: 0.2 }, flag: "biz_name_bold" } },
    ],
    reward: { money: 8_000, xp: 250, rep: 2, flag: "registered" },
  },
  {
    id: "c4-med-2", ch: 4, route: "med", emoji: "✉️", title: "Admission letter", place: "campus", cast: ["ngozi", "mummy"],
    intro: "The admission list goes up on the notice board at Lagoon University. A crowd of nervous students pushes forward. You find your name: Medicine and Surgery (MBBS).",
    goal: "Wait for the results and keep studying until Study level 4.",
    tasks: [{ days: 2 }, { skill: "study", min: 4 }],
    lines: [
      { who: "mummy", text: "Doctor! I mean, future doctor! My child!" },
      { who: "ngozi", text: "Congratulations. Six years of medical school starts now. Pre-clinical first, then clinical years on the wards." },
      { who: "ngozi", text: "In this game of life, time moves fast. But don't let anyone tell you that the work is small." },
    ],
    choices: [
      { label: "Celebrate with the family", result: "Uncle Jide insists on a small party. You eat too much jollof and dance badly.", fx: { cost: 5_000, bond: { mummy: 8 }, mood: "bigNight" } },
      { label: "Buy your textbooks straight away (₦15,000)", result: "Gray's Anatomy weighs more than your bag. You start reading on the danfo home.", fx: { cost: 15_000, skill: { study: 0.6 }, flag: "books" } },
    ],
    reward: { money: 5_000, xp: 250, flag: ["medstudent", "student"] },
  },
  {
    id: "c4-law-2", ch: 4, route: "law", emoji: "📖", title: "First year of law", place: "chambers", cast: ["emeka", "chiamaka"],
    intro: "Contract law, criminal law, the constitution. The law library at Nwosu & Partners opens to students on weekends, and Barrister Emeka expects you there.",
    goal: "Attend lectures and read law reports in the library.",
    tasks: [{ do: "lecture", n: 1 }, { do: "read-cases", n: 2 }],
    lines: [
      { who: "emeka", text: "Don't just memorise. Understand why the judge decided. Then you can predict the next judge." },
      { who: "chiamaka", if: "chiamaka_friend", text: "I switched to law too! Medicine wasn't for me. Now you're stuck with me for five years." },
    ],
    choices: [
      { label: "Form a study group", result: "Four students, one table, too much coffee. Your notes get twice as good.", fx: { skill: { study: 0.3, charisma: 0.1 }, flag: "study_group" } },
      { label: "Ask Barrister Emeka for a weekend job", result: "\"Filing, photocopying and making tea. Still interested?\" You are.", fx: { money: 3_000, flag: "chambers_job" } },
    ],
    reward: { money: 5_000, xp: 250, flag: "student" },
  },
  {
    id: "c4-tech-2", ch: 4, route: "tech", emoji: "💻", title: "Your own machine", place: "home", cast: ["ify", "tunde"],
    intro: "Coding at the hub is fine, but freelancers work at night. Your first client is waiting: a pharmacy in Surulere wants a simple website. You need your own laptop and desk.",
    goal: "Get a desk with a laptop and code at home twice.",
    tasks: [{ item: "desk" }, { do: "learn-code", n: 2 }],
    lines: [
      { who: "tunde", text: "₦160,000 for a laptop? Are you sure?" },
      { who: "ify", text: "It's not a laptop. It's a factory. Every gig you do on it pays it back." },
      { who: "you", text: "The pharmacy wants the site in a week. How much should I charge?" },
    ],
    choices: [
      { label: "Charge a fair price: ₦40,000", result: "The pharmacist haggles, then agrees. When it's done, she refers two friends.", fx: { money: 40_000, skill: { charisma: 0.1 }, flag: "fair_pricing" } },
      { label: "Undercut everyone: ₦10,000", result: "You get the job fast. Then you realise you worked twenty hours for less than a POS shift.", fx: { money: 10_000, skill: { study: 0.3 }, flag: "underpriced" } },
    ],
    reward: { money: 5_000, xp: 250 },
  },
  {
    id: "c4-ent-2", ch: 4, route: "ent", emoji: "🎙️", title: "Open mic", place: "pavilion", cast: ["kola"],
    intro: "Royal Pavilion hosts an open mic every Sunday. Comedians, singers, poets: five minutes each, and the crowd is honest. Very honest.",
    goal: "Attend an event at Royal Pavilion and reach Charisma level 2.",
    tasks: [{ do: "attend-event" }, { skill: "charisma", min: 2 }],
    lines: [
      { who: "kola", text: "Five minutes. If they boo, you smile and finish. If they cheer, you smile and finish. Either way, you finish." },
      { who: "you", text: "My hands are shaking." },
      { who: "kola", text: "Good. That means you care. Now go." },
    ],
    choices: [
      { label: "Perform something original", result: "Your own words, your own story. Halfway through, the room goes quiet and listens.", fx: { skill: { charisma: 0.4 }, rep: 2, flag: "original" } },
      { label: "Play it safe with a classic highlife tune", result: "Everyone sings along. You leave to big applause and a little regret.", fx: { skill: { charisma: 0.3 }, mood: "bigNight" } },
    ],
    reward: { money: 5_000, xp: 250 },
  },

  {
    id: "c4-room", ch: 4, emoji: "🛋️", title: "Level up your room", place: "home", cast: ["kunle", "landlord"],
    intro: "You've outgrown the foam mattress. Kunle says your room looks like a waiting room. If you're building a new life, your room should look like it.",
    goal: "Own a proper bed and a standing fan.",
    tasks: [{ item: "bed" }, { item: "fan" }],
    lines: [
      { who: "kunle", text: "Now this is a room! A bed with a frame! A fan! Cousin, you've arrived." },
      { who: "landlord", text: "Just don't run that fan on my light all night. Oh, it's on your meter? Then run it." },
    ],
    choices: [
      { label: "Host your friends for a room-warming", result: "Eight people in one small room, music on the radio, and the best night in months.", fx: { cost: 5_000, rep: 2, mood: "goodGist" } },
      { label: "Keep it quiet and enjoy the peace", result: "You lie on your new bed under the fan and fall asleep in seconds.", fx: { mood: "wellRested" } },
    ],
    reward: { money: 6_000, xp: 220 },
  },

  // ----- route missions, part 3 -----
  {
    id: "c4-biz-3", ch: 4, route: "biz", emoji: "🏪", title: "Your first business", place: "phone", cast: ["bisola"],
    intro: "The stall taught you customers. Now it's time to own something that earns while you sleep. Chief Bisola has one rule: \"One business you run well beats three you run badly.\"",
    goal: "Buy your first business in the 🏪 Business app.",
    tasks: [{ biz: 1 }],
    lines: [
      { who: "bisola", text: "Now you have staff, stock and expenses. Watch your numbers every morning like a hawk." },
      { who: "you", text: "Who should I hire to run it?" },
    ],
    choices: [
      { label: "Hire a cousin you know", result: "He's loyal and honest, but he also gives free stuff to every relative who passes.", fx: { bond: { mummy: 4 }, flag: "hired_family" } },
      { label: "Hire the best person who applies", result: "A stranger with experience. Takings are up from day one.", fx: { skill: { hustle: 0.3 }, flag: "hired_best" } },
    ],
    reward: { money: 10_000, xp: 280, rep: 2 },
  },
  {
    id: "c4-med-3", ch: 4, route: "med", emoji: "🦴", title: "The dissection hall", place: "campus", cast: ["chiamaka"],
    intro: "Pre-clinical years: anatomy, physiology, biochemistry. The dissection hall smells of formalin and nobody talks for the first ten minutes.",
    goal: "Revise in the study hall three times and attend a lecture.",
    tasks: [{ do: "study-hall", n: 3 }, { do: "lecture" }],
    lines: [
      { who: "chiamaka", if: "chiamaka_friend", text: "I nearly fainted in the dissection hall. Then I remembered we're going to save lives with this knowledge." },
      { who: "you", text: "The brachial plexus is a nightmare. Five roots, three trunks, six divisions..." },
    ],
    choices: [
      { label: "Form a study group", result: "Six of you, past questions, one whiteboard. Nobody fails alone.", fx: { skill: { study: 0.3, charisma: 0.2 }, flag: "study_group" } },
      { label: "Study alone through the night", result: "You learn faster alone, but you're tired all week.", fx: { skill: { study: 0.5 } } },
    ],
    reward: { money: 6_000, xp: 280 },
  },
  {
    id: "c4-law-3", ch: 4, route: "law", emoji: "🗣️", title: "Moot court", place: "court", cast: ["emeka"],
    intro: "The faculty's moot court competition: a pretend case, argued like a real one, in front of real judges who volunteer. The winners get noticed by the big firms.",
    goal: "Argue two moot cases and reach Charisma level 2.",
    tasks: [{ do: "moot", n: 2 }, { skill: "charisma", min: 2 }],
    lines: [
      { who: "emeka", text: "Don't shout. Judges don't respect volume. They respect clarity and authority." },
      { who: "you", text: "My lord, the facts are clear..." },
    ],
    choices: [
      { label: "Take the harder side of the case", result: "You lose narrowly, but one judge asks for your name afterwards.", fx: { skill: { charisma: 0.4 }, rep: 3, flag: "brave_advocate" } },
      { label: "Take the side with the stronger evidence", result: "You win clearly. Barrister Emeka nods once, which means a lot.", fx: { skill: { study: 0.3 } } },
    ],
    reward: { money: 6_000, xp: 280 },
  },
  {
    id: "c4-tech-3", ch: 4, route: "tech", emoji: "🧑🏾‍💻", title: "Internship", place: "hub", cast: ["ify"],
    intro: "A fintech in Yaba is hiring interns. Ify forwards your name. The interview has a coding test and a question about why you want to work there.",
    goal: "Get a job in Tech (Jobs tab).",
    tasks: [{ career: "tech" }],
    lines: [
      { who: "ify", text: "You're in! Now listen: say 'I don't know, I'll find out' more than you pretend to know. Seniors respect that." },
      { who: "you", text: "My first day and I already broke the test server." },
      { who: "ify", text: "Welcome to tech. Fix it, write down what you learned, move on." },
    ],
    choices: [
      { label: "Ask a senior engineer to mentor you", result: "She's busy, but she gives you thirty minutes every Friday. Those thirty minutes change everything.", fx: { skill: { study: 0.4 }, flag: "tech_mentor" } },
      { label: "Stay quiet and work twice as hard", result: "You learn fast, but nobody knows how much you're doing.", fx: { skill: { study: 0.3, hustle: 0.1 } } },
    ],
    reward: { money: 8_000, xp: 280 },
  },
  {
    id: "c4-ent-3", ch: 4, route: "ent", emoji: "💿", title: "First demo", place: "studio", cast: ["kola"],
    intro: "K-Wave books you three hours in Booth B. A real microphone, real headphones, a real producer. It's not cheap, but every career starts with a demo.",
    goal: "Record a demo at Afrowave Studios.",
    tasks: [{ do: "record-demo" }],
    lines: [
      { who: "kola", text: "Again. Again. Once more, with feeling. There! That's the take." },
      { who: "you", text: "Is it good?" },
      { who: "kola", text: "It's honest. Good comes later. What sound do you want people to know you for?" },
    ],
    choices: [
      { label: "Afrobeats with a street story", result: "Bouncy beat, real words about Mushin. K-Wave nods along without noticing.", fx: { flag: "afrobeats", skill: { charisma: 0.3 } } },
      { label: "Highlife fusion, old meets new", result: "Your grandmother's music with a modern beat. Older people stop to listen.", fx: { flag: "highlife", skill: { charisma: 0.3 } } },
      { label: "Comedy and acting, not music", result: "You record a short comedy film instead. K-Wave laughs so hard he drops his headphones.", fx: { flag: "actor", skill: { charisma: 0.3 } } },
    ],
    reward: { money: 6_000, xp: 280, flag: "demo" },
  },

  {
    id: "c4-tobi", ch: 4, emoji: "🌅", title: "Dinner with Tobi", place: "beach", cast: ["tobi"],
    intro: "Tobi texts: \"Grilled fish at Sunset Beach on Saturday? I need someone to tell me my new building design isn't ugly.\"",
    goal: "Have grilled fish at Sunset Beach on the Island.",
    tasks: [{ do: "seafood|beach" }],
    lines: [
      { who: "tobi", text: "Everyone in Lagos is building something. Houses, businesses, names. What are you building?" },
      { who: "tobi", if: "tobi_close", text: "I liked talking to you at the mixer. You listen. Lagos people don't listen." },
      { who: "you", text: "A life I don't need to apologise for." },
    ],
    choices: [
      { label: "Tell Tobi you'd like to see them again, as more than friends", result: "Tobi smiles at the sea for a long moment. \"I was hoping you'd say that.\"", fx: { flag: "tobi_dating", mood: "goodGist" } },
      { label: "Keep it a great friendship", result: "\"Best friends, then. You're stuck with me.\" You laugh until the waves soak your shoes.", fx: { flag: "tobi_friend", mood: "goodGist" } },
    ],
    reward: { money: 3_000, xp: 200 },
  },

  // ----- route missions, part 4 -----
  {
    id: "c4-biz-4", ch: 4, route: "biz", emoji: "🧾", title: "Records and receipts", place: "phone", cast: ["bisola"],
    intro: "Chief Bisola asks to see your books. You show her a notebook full of crossed-out numbers. She closes her eyes for a full ten seconds.",
    goal: "Keep your business running for three days.",
    tasks: [{ days: 3 }, { biz: 1 }],
    lines: [
      { who: "bisola", text: "If you don't know your numbers, you don't know your business. You're just guessing with your own money." },
      { who: "you", text: "Profit was good this week. I think." },
      { who: "bisola", text: "\"I think\" is not a number." },
    ],
    choices: [
      { label: "Open a business bank account and track every naira", result: "It's boring work. Then you find ₦8,000 a week leaking from careless stock. You fix it.", fx: { money: 8_000, skill: { hustle: 0.4 }, flag: "good_books" } },
      { label: "Keep cash in a drawer, it's simpler", result: "Simple, until you can't remember what you spent. Chief Bisola just shakes her head.", fx: { flag: "cash_drawer" } },
    ],
    reward: { money: 10_000, xp: 280 },
  },
  {
    id: "c4-med-4", ch: 4, route: "med", emoji: "🧪", title: "Second MB exams", place: "campus", cast: ["ngozi", "chiamaka"],
    intro: "The second MB exams decide who moves on to the clinical years. Fail, and you repeat a whole year. The library is full at midnight.",
    goal: "Revise twice more and reach Study level 5.",
    tasks: [{ do: "study-hall", n: 2 }, { skill: "study", min: 5 }],
    lines: [
      { who: "ngozi", text: "I failed physiology once. I cried for a week, then passed it with distinction. Failure is information, not a verdict." },
      { who: "you", text: "I passed! Every paper!" },
      { who: "chiamaka", if: "chiamaka_friend", text: "We both passed! Clinical years, here we come!" },
    ],
    choices: [
      { label: "Help a classmate who failed one paper", result: "You spend your holiday teaching him. He passes the resit and never forgets it.", fx: { rep: 4, skill: { study: 0.2 }, flag: "helped_classmate" } },
      { label: "Rest properly before clinical years start", result: "You sleep for two days straight, then visit Mummy. You come back fresh.", fx: { bond: { mummy: 6 }, mood: "wellRested" } },
    ],
    reward: { money: 8_000, xp: 300 },
  },
  {
    id: "c4-law-4", ch: 4, route: "law", emoji: "🗂️", title: "Holiday clerkship", place: "chambers", cast: ["emeka"],
    intro: "During the long holiday, Nwosu & Partners takes you on as a clerk. On day three, a client tells you something in confidence that could win his opponent's case.",
    goal: "Help at the legal clinic twice and read law reports.",
    tasks: [{ do: "legal-clinic", n: 2 }, { do: "read-cases" }],
    lines: [
      { who: "emeka", text: "What a client tells you stays with you. Always. That is the foundation of this profession." },
      { who: "you", text: "Even if the other side is my friend's uncle?" },
      { who: "emeka", text: "Especially then." },
    ],
    choices: [
      { label: "Keep the confidence, say nothing", result: "Barrister Emeka finds out later how much you knew. He gives you a key to the library.", fx: { rep: 3, flag: "trustworthy" } },
      { label: "Ask Barrister Emeka for guidance first", result: "\"Good instinct. When in doubt, ask.\" He explains the rules of professional conduct line by line.", fx: { skill: { study: 0.4 }, flag: "asks_for_help" } },
    ],
    reward: { money: 8_000, xp: 300 },
  },
  {
    id: "c4-tech-4", ch: 4, route: "tech", emoji: "🏆", title: "Hackathon", place: "hub", cast: ["ify", "chiamaka"],
    intro: "The Yaba Hackathon: 48 hours, too much coffee, and a ₦500,000 prize for the best app solving a Lagos problem.",
    goal: "Go to a tech meetup and reach Study level 4.",
    tasks: [{ do: "meetup" }, { skill: "study", min: 4 }],
    lines: [
      { who: "ify", text: "Pick a problem you actually understand. Judges can smell fake problems." },
      { who: "chiamaka", if: "chiamaka_friend", text: "I'll do design and the pitch, you do the code. Deal?" },
      { who: "you", text: "Hour 40. Nothing works. Everything is on fire." },
    ],
    choices: [
      { label: "Pitch an app that tracks market prices for traders", result: "Aunty Funke is your first test user. The judges love that she's real.", fx: { skill: { study: 0.3 }, flag: "app_market" }, chance: { odds: 0.4, win: "You win second place and ₦100,000! Aunty Funke tells the whole market.", winFx: { money: 100_000, rep: 4, flag: "app_market" } } },
      { label: "Pitch an app for danfo routes and fares", result: "Every judge has been lost in a danfo. They laugh, then they listen.", fx: { skill: { study: 0.3 }, flag: "app_transit" }, chance: { odds: 0.4, win: "You win second place and ₦100,000! A transport company asks for a meeting.", winFx: { money: 100_000, rep: 4, flag: "app_transit" } } },
    ],
    reward: { money: 8_000, xp: 300 },
  },
  {
    id: "c4-ent-4", ch: 4, route: "ent", emoji: "📱", title: "Going viral", place: "studio", cast: ["kola", "damola"],
    intro: "One of your clips explodes overnight. A hundred thousand views, a thousand comments, and some of them are not nice. Afrowave offers you a regular slot.",
    goal: "Work as a content creator (Jobs tab) and do two shifts.",
    tasks: [{ career: "ent" }, { count: "work", n: 2 }],
    lines: [
      { who: "kola", text: "Viral is a door, not a house. Walk through it and keep building." },
      { who: "damola", text: "I can get you 50,000 followers by tomorrow. Small money. Nobody will know they're fake." },
      { who: "you", text: "And the mean comments?" },
    ],
    choices: [
      { label: "Ignore the trolls, reply to real fans", result: "Your real fans notice you notice them. They become your army.", fx: { rep: 3, skill: { charisma: 0.3 }, flag: "real_fans" } },
      { label: "Clap back at the worst troll", result: "The clap-back goes even more viral. Half the internet loves you, half doesn't.", fx: { rep: -1, skill: { charisma: 0.3 }, flag: "clap_back" } },
    ],
    reward: { money: 8_000, xp: 300, flag: "artist" },
  },

  {
    id: "c4-damola", ch: 4, emoji: "🕶️", title: "Damola's offer", place: "island-street", cast: ["damola"],
    intro: "Damola Pedro invites you to lunch on the Island. He pays, which is suspicious. Over pepper soup, he slides a proposal across the table.",
    goal: "Meet Damola at a networking mixer on the Island.",
    tasks: [{ do: "networking|tower-network" }],
    lines: [
      { who: "damola", if: "route_biz", text: "I have a container of 'designer' bags. Very good copies. You sell, we split the profit. Nobody checks." },
      { who: "damola", if: "route_med", text: "A pharma company pays students to hand out drug samples and say nice things to doctors. Easy money." },
      { who: "damola", if: "route_law", text: "I need someone to 'lose' some documents at the court registry. Small favour, big thank-you." },
      { who: "damola", if: "route_tech", text: "There's an app in America. Copy it, put a Naija name on it, sell it to a bank. Who will know?" },
      { who: "damola", if: "route_ent", text: "I can buy you 100,000 followers. Brands only check numbers. Nobody checks if they're real." },
      { who: "you", text: "And if something goes wrong?" },
      { who: "damola", text: "Nothing goes wrong when you know the right people. ₦20,000 now, more later." },
    ],
    choices: [
      { label: "Decline politely and leave", result: "\"Your loss,\" he says, smiling. You get the feeling this isn't the last time.", fx: { rep: 3, flag: "refused_damola" } },
      { label: "Take the deal, just this once", result: "₦20,000 lands in your account. It feels heavier than it should.", fx: { money: 20_000, rep: -2, flag: "took_damola" } },
    ],
    reward: { xp: 250 },
  },
  {
    id: "c4-year", ch: 4, emoji: "🎂", title: "One year in Lagos", place: "family", cast: ["jide", "mummy", "kunle"],
    intro: "It's been a year since you arrived with one bag. Uncle Jide says a year in Lagos is worth five anywhere else, and he wants to celebrate. Loudly.",
    goal: "Reach reputation 15 and a net worth of ₦100,000.",
    tasks: [{ rep: 15 }, { worth: 100_000 }],
    lines: [
      { who: "jide", text: "Look at this one! Came with nothing, and now everybody on the street knows the name!" },
      { who: "kunle", text: "Cousin, people at school ask me if you're the one who..." },
      { who: "mummy", text: "I'm proud of you. Don't forget where you came from." },
    ],
    choices: [
      { label: "Throw a party at Uncle Jide's house (₦15,000)", result: "Jollof, small chops, and Uncle Jide dancing like he's twenty. The whole street comes.", fx: { cost: 15_000, rep: 4, bond: { mummy: 4, kunle: 4 }, mood: "bigNight" } },
      { label: "Send ₦20,000 to Mummy instead", result: "She uses it to fix the leaking roof at home and sends you a photo of the new zinc.", fx: { cost: 20_000, bond: { mummy: 12 }, flag: "sent_mummy" } },
      { label: "Celebrate quietly and save", result: "You buy yourself one plate of really good amala and sit with your thoughts. One year.", fx: { skill: { hustle: 0.2 } } },
    ],
    reward: { money: 15_000, xp: 300, rep: 2 },
  },
];
