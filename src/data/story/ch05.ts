// Chapter 5 — Building a Reputation (missions 41–50). People start to know your name.
// Medicine: clinical years, final exams and house job. Law: degree, Law School and the Bar.
// Business: a second business and the first rival. Tech: a promotion and a side project. Entertainment: the first contract.

import type { StoryMission } from "./types";

export const ch05: StoryMission[] = [
  {
    id: "c5-asoebi", ch: 5, emoji: "👗", title: "Aso-ebi", place: "family", cast: ["jide", "mummy"],
    intro: "Uncle Jide's daughter Bukola is getting married, and the family has chosen the aso-ebi: matching fabric everyone wears to show they belong. It costs ₦15,000. Not wearing it will be noticed.",
    goal: "Help Uncle Jide prepare the house and buy your aso-ebi.",
    tasks: [{ do: "help-jide" }, { pay: 15_000 }],
    lines: [
      { who: "jide", text: "This is a family wedding! Everybody in the same colour, so the photographers know who is who." },
      { who: "mummy", text: "Your aunties have been asking about you. Be on your best behaviour. And dance properly, not that thing you call dancing." },
      { who: "you", text: "At the reception, an aunty asks when you're getting married. Another asks how much you earn." },
    ],
    choices: [
      { label: "Spray money on the couple with style", result: "You dance into the circle and spray crisp notes. The crowd roars. The photographer catches the moment.", fx: { cost: 5_000, rep: 4, bond: { mummy: 6 }, mood: "bigNight" } },
      { label: "Help serve the guests behind the scenes", result: "Nobody sees you on the dance floor, but every aunty sees you carrying coolers. They talk about you for months.", fx: { rep: 3, bond: { mummy: 8 }, flag: "family_helper" } },
      { label: "Answer the nosy questions with a joke", result: "\"I'm married to my work, Aunty.\" Half the table laughs. The other half starts praying for you.", fx: { skill: { charisma: 0.3 }, mood: "goodGist" } },
    ],
    reward: { money: 10_000, xp: 320, rep: 2 },
  },

  // ----- routes, part 1 -----
  {
    id: "c5-biz-1", ch: 5, route: "biz", emoji: "🏬", title: "Two is company", place: "phone", cast: ["bisola"],
    intro: "Your first business is steady. Chief Bisola says it's time for a second one, but different enough that one bad month can't sink both.",
    goal: "Own two businesses.",
    tasks: [{ biz: 2 }],
    lines: [
      { who: "bisola", text: "Don't put all your eggs in one basket, and don't let one basket carry the other. Each business must stand on its own legs." },
      { who: "you", text: "Two businesses means twice the problems." },
      { who: "bisola", text: "And twice the lessons. Hire a manager you trust, and check on them like you don't." },
    ],
    choices: [
      { label: "Promote your best worker to manager", result: "She's shocked, then determined. Takings rise and she trains the new staff herself.", fx: { skill: { charisma: 0.3 }, rep: 2, flag: "promoted_staff" } },
      { label: "Run both yourself, at least for now", result: "You barely sleep, but you know every naira in both tills.", fx: { skill: { hustle: 0.4 } } },
    ],
    reward: { money: 15_000, xp: 350, rep: 2 },
  },
  {
    id: "c5-med-1", ch: 5, route: "med", emoji: "🩺", title: "Clinical years", place: "hospital", cast: ["ngozi", "chiamaka"],
    intro: "No more only books. Now you follow consultants on the wards of Mainland General, take histories from real patients and present them on ward rounds, often badly.",
    goal: "Join ward rounds three times and reach Study level 6.",
    tasks: [{ do: "ward-round", n: 3 }, { skill: "study", min: 6 }],
    lines: [
      { who: "ngozi", text: "The patient is not 'bed seven'. She is Mrs Adebayo, she sells pepper in Mushin, and she's frightened. Start there." },
      { who: "you", text: "She's worried about her children more than her diagnosis." },
      { who: "ngozi", text: "Then you've learned the most important thing on this ward today." },
    ],
    choices: [
      { label: "Spend extra time talking with frightened patients", result: "Your notes are longer and your feet hurt more, but patients ask for you by name.", fx: { skill: { charisma: 0.4 }, rep: 3, flag: "good_bedside" } },
      { label: "Focus on clinical knowledge and exams", result: "You know every drug dose by heart. Dr Ngozi nods, then reminds you about Mrs Adebayo.", fx: { skill: { study: 0.4 } } },
    ],
    reward: { money: 10_000, xp: 350 },
  },
  {
    id: "c5-law-1", ch: 5, route: "law", emoji: "📕", title: "Final year", place: "chambers", cast: ["emeka", "adewale"],
    intro: "Final year of the law degree: a long essay, the hardest exams, and endless nights in the library at Nwosu & Partners.",
    goal: "Read law reports three times and reach Study level 6.",
    tasks: [{ do: "read-cases", n: 3 }, { skill: "study", min: 6 }],
    lines: [
      { who: "adewale", text: "Your long essay on tenants' rights in Lagos is the best I've marked this year. Don't let it go to your head." },
      { who: "emeka", if: "trustworthy", text: "I've been watching you since the clerkship. When you finish Law School, there may be a desk for you here." },
      { who: "you", text: "Five years. I can't believe it's done." },
    ],
    choices: [
      { label: "Throw a small party with your study group", result: "Six exhausted law graduates dancing badly to highlife. Nobody talks about tort law for one night.", fx: { cost: 5_000, mood: "bigNight", rep: 2 } },
      { label: "Start preparing for Law School immediately", result: "Your friends call you boring. Your notes for Law School are already half done.", fx: { skill: { study: 0.4 } } },
    ],
    reward: { money: 10_000, xp: 350, flag: "llb" },
  },
  {
    id: "c5-tech-1", ch: 5, route: "tech", emoji: "📈", title: "Junior developer", place: "hub", cast: ["ify"],
    intro: "The internship is going well. Your team lead hints that a junior developer role is opening. Promotion in tech means shipping code that works and helping others ship theirs.",
    goal: "Get promoted to Junior developer.",
    tasks: [{ career: "tech", level: 1 }],
    lines: [
      { who: "ify", text: "Junior developer! Now the real learning starts: other people will read your code. Write it like they're tired and angry." },
      { who: "you", text: "My first pull request had 47 comments." },
      { who: "ify", text: "Mine had 112. Fix them, say thank you, and buy the reviewer a puff-puff." },
    ],
    choices: [
      { label: "Start writing a tech blog about what you learn", result: "Your post 'Debugging with NEPA: coding in power cuts' gets shared across Nigerian tech Twitter.", fx: { rep: 4, skill: { charisma: 0.2 }, flag: "tech_blog" } },
      { label: "Spend weekends learning a new language", result: "Saturday mornings, two hours, every week. In two months you're the team's go-to for tricky bugs.", fx: { skill: { study: 0.5 } } },
    ],
    reward: { money: 15_000, xp: 350 },
  },
  {
    id: "c5-ent-1", ch: 5, route: "ent", emoji: "🎤", title: "Performer", place: "studio", cast: ["kola"],
    intro: "Content is good, but K-Wave wants to see you on stage. \"Views pay small. Shows pay rent,\" he says. Afrowave can book you as a performing artist if you're ready.",
    goal: "Get promoted to Performing artist in Entertainment.",
    tasks: [{ career: "ent", level: 1 }],
    lines: [
      { who: "kola", text: "On stage, the first ten seconds decide everything. Walk out like you own the building." },
      { who: "you", text: "What if I forget my lines?" },
      { who: "kola", text: "Then you smile and improvise. The crowd doesn't know your lines. They know your energy." },
    ],
    choices: [
      { label: "Rehearse with a live band", result: "Real drums, real bass. Your voice finds a new power. The band wants to work with you again.", fx: { cost: 8_000, skill: { charisma: 0.5 }, flag: "live_band" } },
      { label: "Keep it simple: you and a backing track", result: "Cheaper and easier to book. You learn to fill a stage on your own.", fx: { skill: { charisma: 0.3, hustle: 0.1 } } },
    ],
    reward: { money: 12_000, xp: 350, rep: 2 },
  },

  {
    id: "c5-kunle", ch: 5, emoji: "🧑🏾‍🎓", title: "Kunle's first semester", place: "campus", cast: ["kunle"],
    intro: "Kunle calls from campus. Lectures are going well, but money is tight: handouts, transport, food. He doesn't want to ask, but his voice asks for him.",
    goal: "Visit Kunle at Lagoon University and get closer to him.",
    tasks: [{ visit: "campus" }, { bond: "kunle", min: 55 }],
    lines: [
      { who: "kunle", if: "kunle_room", text: "Sharing your room taught me discipline. Now I wake up at five without an alarm." },
      { who: "kunle", if: "kunle_laptop", text: "The laptop is my best friend. I type my notes, and my classmates pay me to type theirs." },
      { who: "kunle", text: "Some of my classmates go to bed hungry. Lagos is hard on students." },
    ],
    choices: [
      { label: "Give him a monthly allowance (₦10,000 now)", result: "He promises to account for every naira. He actually sends you a spreadsheet.", fx: { cost: 10_000, bond: { kunle: 12, mummy: 6 }, flag: "kunle_allowance" } },
      { label: "Help him start a small hustle on campus", result: "You lend him ₦5,000 for a stock of snacks and drinks. Within a month he's paying his own transport.", fx: { cost: 5_000, bond: { kunle: 10 }, skill: { hustle: 0.2 }, flag: "kunle_hustle" } },
      { label: "Tutor him and his friends on Sundays", result: "Five students, one whiteboard, your Sundays gone. Their grades go up. So does your reputation.", fx: { rep: 3, bond: { kunle: 8 }, skill: { study: 0.2 } } },
    ],
    reward: { money: 8_000, xp: 320 },
  },

  // ----- routes, part 2 -----
  {
    id: "c5-biz-2", ch: 5, route: "biz", emoji: "🛒", title: "QuickMart opens", place: "market", cast: ["damola", "funke"],
    intro: "A new shop opens across the road with balloons, loud music and prices that make no sense. The sign says QuickMart. Behind the counter, smiling: Damola Pedro.",
    goal: "Keep trading at the market for two days.",
    tasks: [{ days: 2 }, { do: "market-trade", n: 2 }],
    lines: [
      { who: "damola", text: "Competition is healthy, my friend. May the best businessman win." },
      { who: "funke", text: "His prices are below cost. He's trying to finish you, then raise prices when you're gone." },
      { who: "you", text: "I can't match those prices. Not for long." },
    ],
    choices: [
      { label: "Start a price war", result: "You match him for two weeks. You both lose money. Then his prices quietly go back up.", fx: { cost: 15_000, skill: { hustle: 0.3 }, flag: "price_war" } },
      { label: "Compete on service: delivery and credit for regulars", result: "Old customers stay. Some who tried QuickMart come back, complaining about rude staff.", fx: { rep: 4, skill: { charisma: 0.3 }, flag: "service_first" } },
      { label: "Team up with Aunty Funke to buy in bulk", result: "Together you buy a whole truck of rice at wholesale. Your prices drop without your profit dropping.", fx: { bond: { funke: 10 }, skill: { hustle: 0.4 }, flag: "funke_partner" } },
    ],
    reward: { money: 15_000, xp: 350 },
  },
  {
    id: "c5-med-2", ch: 5, route: "med", emoji: "🎓", title: "Final MB", place: "campus", cast: ["ngozi", "mummy"],
    intro: "The final MB exams: written papers, clinical exams with real patients, and an oral exam with examiners who have seen everything. Pass, and you're a doctor.",
    goal: "Revise three more times and reach Study level 6.5.",
    tasks: [{ do: "study-hall", n: 3 }, { skill: "study", min: 6.5 }],
    lines: [
      { who: "ngozi", text: "Breathe. You know this. You've seen a hundred patients. The examiners just want to see that you're safe." },
      { who: "you", text: "The results are out. I passed. I'm a doctor." },
      { who: "mummy", text: "Doctor! Say it again! I want to hear it again!" },
    ],
    choices: [
      { label: "Take the Hippocratic oath with your family watching", result: "Mummy, Kunle and Uncle Jide fill a whole row. Mummy wears her best gele. You'll remember it forever.", fx: { bond: { mummy: 12, kunle: 6 }, rep: 3 } },
      { label: "Spend the day thanking everyone who helped", result: "Dr Ngozi, the nurses, your study group, even the cleaner who let you study late. Each one gets a thank-you card.", fx: { rep: 5, skill: { charisma: 0.2 } } },
    ],
    reward: { money: 15_000, xp: 400, flag: "mbbs" },
  },
  {
    id: "c5-law-2", ch: 5, route: "law", emoji: "🏫", title: "Law School", place: "chambers", cast: ["emeka", "chiamaka"],
    intro: "A degree isn't enough to practise. Every law graduate must attend the Nigerian Law School for a year of practical training: drafting, advocacy, ethics. The fees are high.",
    goal: "Pay the Law School fees and argue two moot cases.",
    tasks: [{ pay: 100_000 }, { do: "moot", n: 2 }],
    lines: [
      { who: "emeka", text: "Law School teaches you to be a lawyer, not just to know law. Dress properly. Speak properly. Be on time." },
      { who: "chiamaka", if: "chiamaka_friend", text: "Same class again! Who would have thought, from Prof. Adewale's lecture to this." },
      { who: "you", text: "The dinners are strange. Formal clothes, speeches, rules about which fork to use." },
    ],
    choices: [
      { label: "Volunteer to lead your drafting group", result: "Leading means fixing everyone's mistakes. You learn twice as fast.", fx: { skill: { study: 0.3, charisma: 0.3 }, flag: "group_leader" } },
      { label: "Find a quiet corner and master the syllabus", result: "You know the procedure rules better than some lecturers.", fx: { skill: { study: 0.5 } } },
    ],
    reward: { money: 10_000, xp: 380, flag: "lawschool" },
  },
  {
    id: "c5-tech-2", ch: 5, route: "tech", emoji: "📱", title: "Side project", place: "home", cast: ["ify", "funke"],
    intro: "Ify's advice: \"Your day job pays your rent. Your side project shows what you can do.\" Every evening, after work, you build something of your own.",
    goal: "Code at home three times and reach Study level 5.5.",
    tasks: [{ do: "learn-code", n: 3 }, { skill: "study", min: 5.5 }],
    lines: [
      { who: "ify", if: "app_market", text: "Remember the market price app from the hackathon? Aunty Funke still asks about it." },
      { who: "ify", if: "app_transit", text: "Remember the danfo app from the hackathon? People still ask me when it's coming." },
      { who: "funke", text: "If your phone can tell me the price of rice in three markets, I will pay you every month. I'm serious." },
    ],
    choices: [
      { label: "Build the market price app for traders", result: "You call it 'MarketPulse'. Aunty Funke and eleven traders become your first users.", fx: { skill: { study: 0.4 }, bond: { funke: 8 }, flag: "app_market" } },
      { label: "Build the danfo route and fare app", result: "You call it 'Wetin Be Fare'. Commuters add routes themselves. It grows like weeds.", fx: { skill: { study: 0.4 }, rep: 2, flag: "app_transit" } },
      { label: "Build a clinic appointment app", result: "You call it 'QueueLess'. A small clinic in Yaba tries it. Waiting times drop by an hour.", fx: { skill: { study: 0.4 }, rep: 2, flag: "app_health" } },
    ],
    reward: { money: 15_000, xp: 380 },
  },
  {
    id: "c5-ent-2", ch: 5, route: "ent", emoji: "🎪", title: "First paid show", place: "pavilion", cast: ["kola"],
    intro: "A real booking: thirty minutes at Royal Pavilion, opening for a bigger act. The organiser pays on the night, cash in an envelope, if the crowd likes you.",
    goal: "Host a show at Royal Pavilion.",
    tasks: [{ do: "host-show" }],
    lines: [
      { who: "kola", text: "The headliner's crowd doesn't know you. Make them know you in thirty minutes." },
      { who: "you", text: "Halfway through, the sound cuts out. Five hundred people are watching me." },
      { who: "kola", text: "And then?" },
    ],
    choices: [
      { label: "Keep singing without the mic", result: "The front rows go quiet, then start singing with you. When the sound comes back, the whole hall is with you.", fx: { rep: 5, skill: { charisma: 0.4 }, flag: "legend_moment" } },
      { label: "Crack jokes until it's fixed", result: "Three minutes of improvised comedy. Clips of it go round WhatsApp for a week.", fx: { rep: 3, skill: { charisma: 0.4 } } },
    ],
    reward: { money: 15_000, xp: 380 },
  },

  {
    id: "c5-street", ch: 5, emoji: "🔌", title: "The transformer", place: "mushin-street", cast: ["landlord", "femi"],
    intro: "The street's transformer has been dead for two weeks. The Community Development Association calls a meeting. Baba Landlord wants you to speak for the younger tenants.",
    goal: "Join a street clean-up and reach reputation 20.",
    tasks: [{ do: "community-clean" }, { rep: 20 }],
    lines: [
      { who: "landlord", text: "The electricity company says we must pay for a new transformer ourselves. ₦3 million. Every house must contribute." },
      { who: "femi", text: "The last time we collected money, the chairman bought a new car." },
      { who: "you", if: "street_leader", text: "Everyone knows me from the clean-ups. Maybe they'll trust me to do this properly." },
    ],
    choices: [
      { label: "Propose a public account: every naira on a noticeboard", result: "Receipts on the wall, updated weekly. Contributions pour in. The transformer arrives in a month.", fx: { cost: 10_000, rep: 6, bond: { landlord: 8 }, flag: "transformer_hero" } },
      { label: "Write to the electricity company with the law on your side", result: "It takes three letters and one visit, but they agree to share the cost. People call you \"Lawyer\" for weeks.", fx: { rep: 5, skill: { charisma: 0.3 } }, need: { skill: { charisma: 3 } } },
      { label: "Contribute your share and stay out of the politics", result: "You pay, you keep quiet, and you get light when everyone else does.", fx: { cost: 10_000, rep: 1 } },
    ],
    reward: { money: 12_000, xp: 350, rep: 2 },
  },

  // ----- routes, part 3 -----
  {
    id: "c5-biz-3", ch: 5, route: "biz", emoji: "🏦", title: "The bank loan", place: "tower", cast: ["bisola"],
    intro: "A bank manager on the Island offers you a loan of ₦200,000 to grow faster. The interest is high, and the repayments start next month. Chief Bisola has opinions.",
    goal: "Network at Marina Point Tower and reach reputation 20.",
    tasks: [{ do: "tower-network" }, { rep: 20 }],
    lines: [
      { who: "bisola", text: "Debt is a tool. It can build a house or bury you under it. Do you know exactly what you'll do with every naira?" },
      { who: "you", text: "Stock up before prices rise, and open a delivery service." },
      { who: "bisola", text: "Then the question is whether you can pay it back if prices don't rise." },
    ],
    choices: [
      { label: "Take the ₦200,000 loan", result: "The money lands. So does a schedule of repayments. Your side mission 'Repay the bank' starts.", fx: { money: 200_000, flag: "loan" } },
      { label: "Grow slowly with your own money", result: "Slower, but you sleep well. Chief Bisola smiles: \"My first ten years, I never borrowed one kobo.\"", fx: { skill: { hustle: 0.3 }, flag: "no_debt" } },
    ],
    reward: { money: 12_000, xp: 360 },
  },
  {
    id: "c5-med-3", ch: 5, route: "med", emoji: "🏥", title: "House job", place: "hospital", cast: ["ngozi"],
    intro: "Every new doctor does a year of housemanship before full registration: rotations through medicine, surgery, children and women's health, on call for 24 hours at a time.",
    goal: "Get a job in Medicine as a House officer and work two shifts.",
    tasks: [{ career: "med" }, { count: "work", n: 2 }],
    lines: [
      { who: "ngozi", text: "Welcome to the real thing. You will be tired in ways you didn't know existed. Eat when you can, sleep when you can, and ask when you don't know." },
      { who: "you", text: "My first night on call, I admitted eleven patients." },
      { who: "ngozi", text: "And they're all alive this morning. Good. Now write your notes." },
    ],
    choices: [
      { label: "Take extra calls to learn faster", result: "You see everything: emergencies, births, miracles, mistakes. You grow up fast.", fx: { skill: { study: 0.4, fitness: -0.1 }, flag: "extra_calls" } },
      { label: "Protect your rest days fiercely", result: "Tired doctors make mistakes. You come to every shift sharp, and the nurses notice.", fx: { mood: "wellRested", skill: { charisma: 0.2 } } },
    ],
    reward: { money: 12_000, xp: 380 },
  },
  {
    id: "c5-law-3", ch: 5, route: "law", emoji: "🧑🏾‍⚖️", title: "Externship", place: "court", cast: ["emeka"],
    intro: "Law School sends you out for externships: weeks in a law firm and weeks in court, watching how the law actually works when real people's lives depend on it.",
    goal: "Watch court sessions twice and help at the legal clinic twice.",
    tasks: [{ do: "watch-court", n: 2 }, { do: "legal-clinic", n: 2 }],
    lines: [
      { who: "emeka", text: "Watch the judge's face, not just the lawyers'. Judges decide with their heads and their patience." },
      { who: "you", text: "A woman waited six years for her case to be heard. Six years." },
      { who: "emeka", text: "Delay is the cruellest thing in our system. Remember how it felt to watch that." },
    ],
    choices: [
      { label: "Write a report on court delays for your externship", result: "Your supervisor sends it to the Chief Registrar. Nothing changes yet, but someone important read it.", fx: { rep: 3, skill: { study: 0.3 }, flag: "delay_report" } },
      { label: "Help the woman find a lawyer who'll work for free", result: "Barrister Emeka takes her case himself, at no charge. \"You see? One phone call.\"", fx: { rep: 4, flag: "found_probono" } },
    ],
    reward: { money: 12_000, xp: 380 },
  },
  {
    id: "c5-tech-3", ch: 5, route: "tech", emoji: "🔍", title: "Code review", place: "hub", cast: ["ify"],
    intro: "Ify agrees to review your side project line by line. Her face during the review tells you everything. \"We need to talk about your database,\" she says.",
    goal: "Get close to Ify and work two shifts.",
    tasks: [{ bond: "ify", min: 50 }, { count: "work", n: 2 }],
    lines: [
      { who: "ify", text: "It works, but it won't survive a thousand users. Here, here and here, it will fall over." },
      { who: "you", text: "So I have to rebuild half of it?" },
      { who: "ify", text: "Better now with fifty users than later with fifty thousand." },
    ],
    choices: [
      { label: "Rebuild it properly, even if it takes weeks", result: "Six weeks of evenings. The new version is fast, clean and boring in the best way.", fx: { skill: { study: 0.5 }, flag: "solid_code" } },
      { label: "Patch the worst problems and launch anyway", result: "It works for now. You have a list of 'things to fix later' that keeps growing.", fx: { skill: { hustle: 0.3 }, flag: "tech_debt" } },
    ],
    reward: { money: 15_000, xp: 380 },
  },
  {
    id: "c5-ent-3", ch: 5, route: "ent", emoji: "📝", title: "The contract", place: "studio", cast: ["kola", "damola"],
    intro: "Afrowave Records offers you a deal: they pay for recording, videos and promotion. In return, they take a share of everything: music, shows, endorsements. A \"360 deal\".",
    goal: "Reach reputation 20 and Charisma level 4.",
    tasks: [{ rep: 20 }, { skill: "charisma", min: 4 }],
    lines: [
      { who: "kola", text: "It's a fair deal for Lagos, but read every line. Get a lawyer. Never sign anything the same day." },
      { who: "damola", text: "Don't sign with them! Sign with me. I'll make you bigger than anybody. Small percentage, I promise." },
      { who: "you", text: "Big label, independent, or Damola's offer." },
    ],
    choices: [
      { label: "Sign with Afrowave Records (after a lawyer reads it)", result: "The lawyer changes four clauses. Afrowave agrees. You sign, with your own pen.", fx: { money: 50_000, flag: "signed_label", skill: { charisma: 0.2 } } },
      { label: "Stay independent and own everything", result: "Less money now, total control forever. You set up your own distribution online.", fx: { flag: "indie", skill: { hustle: 0.4 } } },
      { label: "Sign Damola's contract", result: "He's very happy. Too happy. You realise later you didn't read page six.", fx: { money: 80_000, flag: ["damola_contract", "took_damola"], rep: -1 } },
    ],
    reward: { money: 15_000, xp: 380 },
  },

  {
    id: "c5-sule", ch: 5, emoji: "🏋🏾", title: "Fit for the road", place: "gym", cast: ["sule"],
    intro: "Coach Sule is organising a team for the Eko City Run, a 10 km charity race across the Third Mainland Bridge. He says your new life needs a strong body to carry it.",
    goal: "Lift weights or exercise three times and reach Fitness level 2.",
    tasks: [{ do: "gym|jog|aerobics|home-workout", n: 3 }, { skill: "fitness", min: 2 }],
    lines: [
      { who: "sule", text: "Stress is heavy. The gym is where you put it down for an hour." },
      { who: "sule", if: "ignored_health", text: "Last time you told me you'd 'push through'. Your body keeps the receipts, my friend." },
      { who: "you", text: "Kilometre eight, the bridge goes on forever." },
    ],
    choices: [
      { label: "Run for a children's hospital charity", result: "Friends sponsor every kilometre. You raise ₦80,000 for the children's ward and limp home proud.", fx: { rep: 5, skill: { fitness: 0.3 }, flag: "charity_run" } },
      { label: "Run for a personal best", result: "You cross the line in 58 minutes. Coach Sule lifts you off the ground.", fx: { skill: { fitness: 0.5 }, bond: { sule: 10 }, mood: "gymGlow" } },
    ],
    reward: { money: 10_000, xp: 330, rep: 1 },
  },

  // ----- routes, part 4 -----
  {
    id: "c5-biz-4", ch: 5, route: "biz", emoji: "📊", title: "The Island seminar", place: "tower", cast: ["bisola", "halima"],
    intro: "Chief Bisola invites you to a business seminar at Marina Point Tower: bankers, importers and investors. You're the youngest person in the room, and the only one taking notes by hand.",
    goal: "Attend a business seminar and network at the lobby café.",
    tasks: [{ do: "biz-class" }, { do: "tower-network" }],
    lines: [
      { who: "halima", text: "I invest in businesses that solve boring problems very well. Logistics, food, payments. Who are you?" },
      { who: "bisola", text: "This one started at a market stall. Watch this one." },
      { who: "you", text: "I want to build something that lasts longer than me." },
    ],
    choices: [
      { label: "Ask Halima what she looks for in a founder", result: "\"Honesty about numbers, and stubbornness about customers.\" She gives you her card.", fx: { flag: "halima_met", skill: { hustle: 0.3 } } },
      { label: "Pitch your business to the room", result: "Your voice shakes, but your numbers don't. Two importers want to supply you.", fx: { rep: 4, skill: { charisma: 0.4 }, flag: "halima_met" } },
    ],
    reward: { money: 18_000, xp: 380 },
  },
  {
    id: "c5-med-4", ch: 5, route: "med", emoji: "🚑", title: "The deposit rule", place: "hospital", cast: ["ngozi"],
    intro: "2 a.m. in the emergency room. A young okada rider is brought in unconscious after an accident. No family, no money. The hospital rule says no treatment until a deposit is paid.",
    goal: "Work three shifts at the hospital.",
    tasks: [{ count: "work", n: 3 }],
    lines: [
      { who: "ngozi", text: "The law says emergencies must be treated first. Some hospitals still demand money at the door. What do you do at 2 a.m.?" },
      { who: "you", text: "He's bleeding. He can't wait for anybody's deposit." },
    ],
    choices: [
      { label: "Treat him first and argue about money later", result: "He survives. The administrator is furious, then quiet when Dr Ngozi backs you. His mother finds you a week later, crying.", fx: { rep: 6, flag: "treat_first", skill: { study: 0.2 } } },
      { label: "Pay the deposit from your own pocket", result: "₦20,000 from your salary. He survives. Word spreads about the house officer who paid.", fx: { cost: 20_000, rep: 5, flag: "paid_deposit" } },
      { label: "Follow the rule and call the administrator", result: "It takes forty minutes to get approval. He survives, barely. You don't sleep that night.", fx: { rep: -2, flag: "followed_rule" } },
    ],
    reward: { money: 15_000, xp: 400 },
  },
  {
    id: "c5-law-4", ch: 5, route: "law", emoji: "🎩", title: "Call to the Bar", place: "court", cast: ["emeka", "mummy"],
    intro: "The Bar Finals are behind you. Now comes the ceremony: wig, gown, and your name read out in front of hundreds of families. You become a Barrister and Solicitor of the Supreme Court of Nigeria.",
    goal: "Reach Study level 7 and wait for the Bar results.",
    tasks: [{ skill: "study", min: 7 }, { days: 2 }],
    lines: [
      { who: "mummy", text: "In that wig you look like a judge already! My lawyer!" },
      { who: "emeka", text: "Welcome to the profession. There's a desk at Nwosu & Partners if you want it. Junior associate. Long hours, small pay, big lessons." },
      { who: "you", text: "I accept." },
    ],
    choices: [
      { label: "Dedicate your call to Mummy", result: "In your speech you thank the woman who sold akara so you could read. Half the hall is crying.", fx: { bond: { mummy: 15 }, rep: 3 } },
      { label: "Thank Barrister Emeka and the legal clinic", result: "You promise to do one free case every month. Barrister Emeka holds you to it for years.", fx: { rep: 4, flag: "probono_pledge" } },
    ],
    reward: { money: 20_000, xp: 450, flag: "bar" },
  },
  {
    id: "c5-tech-4", ch: 5, route: "tech", emoji: "🚀", title: "Launch day", place: "hub", cast: ["ify", "halima"],
    intro: "Your side project is ready for the world. Ify lets you demo it at the monthly Brainbox meetup. Halima Yusuf from Lagoon Ventures is in the audience.",
    goal: "Present at a tech meetup and reach reputation 20.",
    tasks: [{ do: "meetup" }, { rep: 20 }],
    lines: [
      { who: "halima", text: "Nice demo. How will it make money?" },
      { who: "you", text: "I... haven't decided yet." },
      { who: "halima", text: "Decide. Then call me." },
    ],
    choices: [
      { label: "Keep it free and grow users first", result: "Users pour in: 2,000 in the first week. Your server bill does too.", fx: { rep: 4, flag: "free_app" } },
      { label: "Charge a small monthly fee from day one", result: "Fewer users, but every one of them pays. You make your first ₦30,000 from software.", fx: { money: 30_000, skill: { hustle: 0.3 }, flag: "paid_app" } },
    ],
    reward: { money: 15_000, xp: 400, flag: ["founder", "halima_met"] },
  },
  {
    id: "c5-ent-4", ch: 5, route: "ent", emoji: "🎬", title: "Music video", place: "studio", cast: ["kola"],
    intro: "Your single is ready. Now it needs a video: locations across Lagos, dancers, a director with opinions. Video budgets in Lagos range from \"small\" to \"is this a film?\".",
    goal: "Pay for the video shoot and shoot content twice.",
    tasks: [{ pay: 50_000 }, { do: "shoot-content", n: 2 }],
    lines: [
      { who: "kola", text: "Mushin at sunrise, Yaba at lunchtime, the Island at night. Your story, your city." },
      { who: "kola", if: "signed_label", text: "The label is paying for most of it, so the director has big plans. Don't let him put you on a camel." },
      { who: "kola", if: "indie", text: "Independent means we do it with heart and small money. Heart shows on camera." },
    ],
    choices: [
      { label: "Feature real people from your street", result: "Mama Ronke, Baba Femi and the danfo conductor all appear. The video feels like home to everyone who watches.", fx: { rep: 5, bond: { ronke: 8 }, flag: "street_video" } },
      { label: "Go glamorous: cars, lights, the Island", result: "It looks expensive. Brands start sending messages.", fx: { skill: { charisma: 0.3 }, flag: "glam_video" } },
    ],
    reward: { money: 18_000, xp: 400 },
  },

  {
    id: "c5-blog", ch: 5, emoji: "📰", title: "Gidi Gist", place: "island-street", cast: ["damola", "tobi"],
    intro: "Gidi Gist, the most-read lifestyle blog in Lagos, wants to feature you in \"30 Under 30 to Watch\". The interviewer is charming. Some of her questions are not.",
    goal: "Reach reputation 25 and attend a networking mixer.",
    tasks: [{ rep: 25 }, { do: "networking|tower-network" }],
    lines: [
      { who: "tobi", text: "You're in the blog! My friend is famous! Can I have an autograph?" },
      { who: "damola", text: "Funny, they didn't ask me. Their loss." },
      { who: "you", text: "The interviewer asks about my past mistakes." },
      { who: "you", if: "took_damola", text: "She also asks about my 'business with Damola'. How does she know?" },
    ],
    choices: [
      { label: "Tell your story honestly, mistakes and all", result: "The article is warm and real. Young people write to say your story gave them hope.", fx: { rep: 6, flag: "honest_profile" } },
      { label: "Keep it polished: only the wins", result: "You look perfect in the article. It's shared widely, then forgotten.", fx: { rep: 3, skill: { charisma: 0.2 } } },
    ],
    reward: { money: 12_000, xp: 350, rep: 2 },
  },
  {
    id: "c5-mummy", ch: 5, emoji: "🧳", title: "Mummy comes to Lagos", place: "home", cast: ["mummy", "kunle"],
    intro: "Mummy is coming to Lagos for a week: her first visit since you moved. She'll inspect your room, your cooking, your friends and your future, in that order.",
    goal: "Have ₦50,000 saved, pay for her trip, and cook for her twice.",
    tasks: [{ money: 50_000 }, { pay: 10_000 }, { do: "cook", n: 2 }],
    lines: [
      { who: "mummy", text: "This room is clean! Who cleaned it? Don't lie to me." },
      { who: "kunle", text: "Aunty, I helped! Mostly I moved things from one corner to another." },
      { who: "mummy", text: "Your egusi is almost as good as mine. Almost. I'm proud of you, you know. Even if I don't say it enough." },
    ],
    choices: [
      { label: "Show her where you work", result: "She greets everyone at your workplace like she's the governor's wife. Your colleagues adore her.", fx: { bond: { mummy: 12 }, rep: 2 } },
      { label: "Take her to the beach for the first time", result: "She stands in the waves holding her wrapper, laughing like a girl. You take a hundred photos.", fx: { cost: 5_000, bond: { mummy: 15 }, mood: "beachDay" } },
      { label: "Take her to Sunday service and lunch at Uncle Jide's", result: "Church, then a family lunch that lasts five hours. She's in heaven.", fx: { bond: { mummy: 10 }, rep: 3 } },
    ],
    reward: { money: 15_000, xp: 380, rep: 2 },
  },
];
