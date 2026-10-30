// Chapter 10 — Your Legacy (missions 91–100). What will Lagos remember about you?
// The last mission sets "story_done"; after it, side missions, daily challenges and weekly events go on.

import type { StoryMission } from "./types";

export const ch10: StoryMission[] = [
  {
    id: "c10-mummy-house", ch: 10, emoji: "🏡", title: "Mummy's house", place: "phone", cast: ["mummy", "kunle"],
    intro: "Mummy's house in Abeokuta is the one you grew up in: the leaking roof, the well in the yard, the kitchen where she cooked for everyone. She'd never ask. So you don't ask her.",
    goal: "Pay for the renovation and call Mummy.",
    tasks: [{ pay: 1_000_000 }, { do: "call-mummy" }],
    lines: [
      { who: "kunle", text: "I'll keep her busy at church while the builders finish. She suspects nothing." },
      { who: "mummy", text: "What is this? A new roof? Running water? A generator that doesn't wake the whole street? My child, what have you done?" },
      { who: "you", text: "What you did for me, Ma. Just slower." },
    ],
    choices: [
      { label: "Keep her old kitchen exactly as it was, just repaired", result: "She walks in, sees her old pots in their old places, and sits down to cry.", fx: { bond: { mummy: 20 }, flag: "old_kitchen" } },
      { label: "Add a room for the grandchildren to visit", result: "A room with bunk beds and a big window. Every holiday it's full.", fx: { bond: { mummy: 18, kunle: 8 } } },
    ],
    reward: { money: 200_000, xp: 1_000, rep: 4 },
  },

  // ----- routes, part 1 -----
  {
    id: "c10-biz-1", ch: 10, route: "biz", emoji: "🧭", title: "The succession plan", place: "tower", cast: ["bisola", "halima"],
    intro: "Chief Bisola's last lesson: \"A business that dies with its founder was never a business.\" You start planning for a company that runs without you.",
    goal: "Get your businesses to 14 levels in total.",
    tasks: [{ bizLevel: 14 }],
    lines: [
      { who: "bisola", text: "Train three people who could replace you. Then let them try." },
      { who: "halima", text: "Write down what you believe. Not the strategy, the values. Strategy changes. Values shouldn't." },
    ],
    choices: [
      { label: "Promote from within: the first manager you ever trained", result: "She started as a shop attendant. She'll be CEO one day. Everyone in the company sees what's possible.", fx: { rep: 8, flag: "inside_successor" } },
      { label: "Create a board with workers, investors and community leaders", result: "Unusual in Lagos. It works. The company belongs to more people than ever.", fx: { rep: 9, flag: "community_board" } },
    ],
    reward: { money: 600_000, xp: 1_100 },
  },
  {
    id: "c10-med-1", ch: 10, route: "med", emoji: "🏛️", title: "The teaching wing", place: "hospital", cast: ["ngozi", "adewale"],
    intro: "Mainland General needs a new teaching wing: lecture rooms, a simulation lab, a library. Prof. Adewale and the hospital board ask if you'll lead the fundraising.",
    goal: "Fund the teaching wing.",
    tasks: [{ pay: 2_000_000 }],
    lines: [
      { who: "adewale", text: "A hospital that teaches is a hospital that lasts." },
      { who: "ngozi", text: "When I trained, we had one skeleton between forty students. His name was Uncle Bones." },
    ],
    choices: [
      { label: "Name the simulation lab after Dr Ngozi", result: "\"The Ngozi Okafor Simulation Centre.\" She says it's too much. She visits every week.", fx: { rep: 8, flag: "ngozi_lab" } },
      { label: "Name it after the okada rider you treated first", result: "A small plaque tells his story: the night a young doctor treated first and asked questions later.", fx: { rep: 9, flag: "rider_plaque" } },
    ],
    reward: { money: 500_000, xp: 1_100 },
  },
  {
    id: "c10-law-1", ch: 10, route: "law", emoji: "📜", title: "Law reform", place: "court", cast: ["emeka"],
    intro: "The state government asks you to chair a committee reforming tenancy law, the same law you learned at a free clinic helping your neighbours, all those years ago.",
    goal: "Reach reputation 90 and Study level 10.",
    tasks: [{ rep: 90 }, { skill: "study", min: 10 }],
    lines: [
      { who: "emeka", text: "Laws are written by the people in the room. Make sure tenants are in the room." },
      { who: "you", text: "Fair notice, limits on advance rent, and no more self-help evictions. Clear enough for anyone to read." },
    ],
    choices: [
      { label: "Hold public hearings in every neighbourhood", result: "Market women, students, landlords, okada riders. The new law sounds like Lagos, because Lagos wrote it.", fx: { rep: 10, flag: "people_law" } },
      { label: "Write a short plain-language guide to the new law", result: "Every tenant can read their rights in ten minutes. It's translated into Yoruba, Igbo, Hausa and Pidgin.", fx: { rep: 9, flag: "plain_law" } },
    ],
    reward: { money: 500_000, xp: 1_100 },
  },
  {
    id: "c10-tech-1", ch: 10, route: "tech", emoji: "🏫", title: "The Yaba campus", place: "hub", cast: ["ify"],
    intro: "Brainbox Tech Hub is too small for the hundreds who want to learn. You buy the empty building next door to build a proper tech campus, free for those who can't pay.",
    goal: "Fund the campus.",
    tasks: [{ pay: 2_000_000 }],
    lines: [
      { who: "ify", text: "When I started, there was one hub with one router. Now look." },
      { who: "you", text: "Free Wi-Fi, constant light, and nobody turned away for money." },
    ],
    choices: [
      { label: "Name it the Ify Campus", result: "She refuses. You insist. The board votes. She loses, happily.", fx: { bond: { ify: 15 }, rep: 8 } },
      { label: "Make it free for women and girls in tech", result: "Half the students are women within a year. The industry notices.", fx: { rep: 10, flag: "women_in_tech" } },
    ],
    reward: { money: 500_000, xp: 1_100 },
  },
  {
    id: "c10-ent-1", ch: 10, route: "ent", emoji: "🎹", title: "The music academy", place: "studio", cast: ["kola"],
    intro: "Talented kids from Mushin and Ajegunle can't afford music lessons. You and K-Wave want to change that with a free academy: instruments, studios, and the business side of music.",
    goal: "Fund the academy.",
    tasks: [{ pay: 2_000_000 }],
    lines: [
      { who: "kola", text: "We teach them the music, and we teach them to read contracts. Nobody signs a bad deal from our academy." },
      { who: "you", text: "The first class has a girl who reminds me of me at the open mic." },
    ],
    choices: [
      { label: "Teach the first class yourself", result: "Every Saturday morning, no phones, just music. Your students will remember it forever.", fx: { rep: 9, flag: "taught_academy" } },
      { label: "Fund scholarships for the best students to study abroad and come back", result: "Five students a year, each promising to return and teach. Most do.", fx: { rep: 8, flag: "come_back_scholars" } },
    ],
    reward: { money: 500_000, xp: 1_100 },
  },

  {
    id: "c10-foundation", ch: 10, emoji: "🌱", title: "Your foundation", place: "tower", cast: ["halima", "chiamaka"],
    intro: "Your giving has grown too big for your phone's notes app. Halima suggests a proper foundation: audited, transparent, and built to outlast you.",
    goal: "Fund the foundation.",
    tasks: [{ pay: 500_000 }],
    lines: [
      { who: "halima", text: "Good intentions without accounts become bad stories. Publish everything." },
      { who: "chiamaka", if: "chiamaka_abroad", text: "I'll help from here. And if you ever need me in Lagos, I'm one flight away." },
      { who: "chiamaka", unless: "chiamaka_abroad", text: "I'll be on the board. Somebody needs to keep you serious, like old times." },
    ],
    choices: [
      { label: "Focus on education", result: "Schools, scholarships, libraries. Children who will never know your name will read because of you.", fx: { rep: 8, flag: "foundation_education" } },
      { label: "Focus on health", result: "Clinics, screening days, maternal care. Lives saved quietly every week.", fx: { rep: 8, flag: "foundation_health" } },
      { label: "Focus on jobs for young people", result: "Apprenticeships, small grants, mentors. Thousands of young people get their first chance.", fx: { rep: 8, flag: "foundation_jobs" } },
    ],
    reward: { money: 200_000, xp: 1_000, rep: 3 },
  },

  // ----- routes, part 2 -----
  {
    id: "c10-biz-2", ch: 10, route: "biz", emoji: "🎓", title: "The traders' school", place: "market", cast: ["funke"],
    intro: "Aunty Funke has an idea: a school for market traders. Bookkeeping, pricing, mobile payments, how to read a loan agreement. Taught in the market, in the evenings, for free.",
    goal: "Have ₦2,000,000 in cash and trade at the market.",
    tasks: [{ money: 2_000_000 }, { do: "market-trade" }],
    lines: [
      { who: "funke", text: "You learned at my corner. Now let the whole market learn at yours." },
      { who: "you", text: "We start with the young traders who just arrived from the village." },
    ],
    choices: [
      { label: "Fund it fully and make Aunty Funke the principal", result: "She wears a new gele every class. Three hundred traders graduate in the first year.", fx: { cost: 500_000, bond: { funke: 20 }, rep: 8 } },
      { label: "Fund it with other big traders as partners", result: "Ten companies contribute. The school opens in five markets at once.", fx: { cost: 300_000, rep: 9, flag: "traders_school" } },
    ],
    reward: { money: 600_000, xp: 1_100 },
  },
  {
    id: "c10-med-2", ch: 10, route: "med", emoji: "🚐", title: "Doctors for the villages", place: "hospital", cast: ["ngozi"],
    intro: "Many villages have no doctor at all. You start a programme: young doctors serve two years in rural clinics, with good pay, housing and training. Then many stay.",
    goal: "Volunteer at the clinic three times.",
    tasks: [{ do: "volunteer", n: 3 }],
    lines: [
      { who: "ngozi", text: "Remember the baby you delivered by torchlight during your service year? She's in secondary school now. She wants to be a doctor." },
      { who: "you", text: "Then we'd better build her a medical school she can afford." },
    ],
    choices: [
      { label: "Fund twenty rural doctors a year", result: "Twenty villages with a doctor for the first time. Infant deaths fall where they serve.", fx: { cost: 500_000, rep: 10, flag: "rural_doctors" } },
      { label: "Fund telemedicine links to your clinic", result: "Village nurses can video-call specialists. Hundreds of referrals avoided every month.", fx: { cost: 300_000, rep: 9, flag: "telemedicine" } },
    ],
    reward: { money: 500_000, xp: 1_100 },
  },
  {
    id: "c10-law-2", ch: 10, route: "law", emoji: "⚖️", title: "Legal aid for all", place: "phone", cast: ["emeka"],
    intro: "Your chambers have the reputation and the resources. Now you want every Lagos resident to have access to a lawyer, whatever they earn.",
    goal: "Get your chambers to level 3.",
    tasks: [{ bizId: "lawfirm", level: 3 }],
    lines: [
      { who: "emeka", text: "When I started the Saturday clinic, people said it was a waste of time. Look at it now." },
      { who: "you", text: "A legal aid desk in every market, every motor park, every hospital." },
    ],
    choices: [
      { label: "Train paralegals from the communities themselves", result: "Two hundred community paralegals. Disputes are solved before they reach court.", fx: { rep: 10, flag: "community_paralegals" } },
      { label: "Build a free legal advice line", result: "A phone number anyone can call. Ten thousand calls in the first year.", fx: { rep: 9, flag: "legal_line" } },
    ],
    reward: { money: 600_000, xp: 1_100 },
  },
  {
    id: "c10-tech-2", ch: 10, route: "tech", emoji: "👧🏾", title: "Code in every school", place: "hub", cast: ["ify", "kunle"],
    intro: "Kunle, now a teacher, tells you his students have never touched a computer. You want every public secondary school in Lagos to teach coding.",
    goal: "Teach at a coding class twice and reach reputation 90.",
    tasks: [{ do: "bootcamp|meetup", n: 2 }, { rep: 90 }],
    lines: [
      { who: "kunle", text: "My students learn about computers from a textbook drawing of a computer." },
      { who: "ify", text: "Then we bring the computers. And the teachers. And the internet." },
    ],
    choices: [
      { label: "Fund computer labs in fifty schools", result: "Fifty labs, solar-powered so NEPA can't stop them. Kunle's school is first.", fx: { cost: 500_000, rep: 10, bond: { kunle: 15 }, flag: "school_labs" } },
      { label: "Train teachers to teach coding", result: "Five hundred teachers trained. Each one teaches hundreds of students. It multiplies.", fx: { rep: 10, flag: "teacher_training" } },
    ],
    reward: { money: 600_000, xp: 1_100 },
  },
  {
    id: "c10-ent-2", ch: 10, route: "ent", emoji: "🗄️", title: "The archive", place: "studio", cast: ["kola", "femi"],
    intro: "Old highlife and juju records are rotting in basements across Lagos. Baba Femi has a crate of them. When they're gone, a whole history of Lagos music goes with them.",
    goal: "Work four shifts in Entertainment and shoot content twice.",
    tasks: [{ count: "work", n: 4 }, { do: "shoot-content", n: 2 }],
    lines: [
      { who: "femi", text: "This record is from 1968. I danced to it at my wedding. Nobody has played it in thirty years." },
      { who: "kola", text: "We can restore them, digitise them, and pay the families of the musicians properly." },
    ],
    choices: [
      { label: "Create a free online archive of Lagos music", result: "Thousands of songs saved. Young producers sample them. Old music lives again.", fx: { rep: 9, flag: "music_archive" } },
      { label: "Release a remastered album with royalties for the families", result: "The album charts. Families of musicians who died poor finally receive royalties.", fx: { rep: 10, money: 200_000, flag: "remastered" } },
    ],
    reward: { money: 600_000, xp: 1_100 },
  },

  {
    id: "c10-femi", ch: 10, emoji: "♟️", title: "Baba Femi's board", place: "park", cast: ["femi"],
    intro: "Baba Femi is moving back to his village to retire under his own mango tree. He asks for one last game at Unity Park, at the same bench as the first time.",
    goal: "Play draughts with Baba Femi twice.",
    tasks: [{ do: "draughts", n: 2 }],
    lines: [
      { who: "femi", text: "You beat me. Properly, finally. It only took you, how many years?" },
      { who: "femi", text: "Take the board. It was my father's. Teach somebody who walks like they're looking for something." },
      { who: "you", text: "I'll keep it in the park, Baba. For anyone who wants to learn." },
    ],
    choices: [
      { label: "Start a free draughts club at Unity Park in his name", result: "Every Saturday, old men and young people at the same tables. The Baba Femi Club.", fx: { rep: 6, flag: "femi_club" } },
      { label: "Drive him to his village yourself", result: "Six hours of stories, proverbs and very bad singing. The best road trip of your life.", fx: { mood: "goodGist", rep: 3 } },
    ],
    reward: { money: 150_000, xp: 1_000, rep: 3 },
  },

  // ----- routes, part 3 -----
  {
    id: "c10-biz-3", ch: 10, route: "biz", emoji: "🌺", title: "Chief Bisola's farewell", place: "tower", cast: ["bisola", "funke"],
    intro: "Chief Bisola is officially retiring. Her farewell is at Marina Point Tower. Ministers, bankers, and in the front row, by her request, the traders of Oja Tuntun.",
    goal: "Network at the tower and get close to Aunty Funke.",
    tasks: [{ do: "tower-network" }, { bond: "funke", min: 80 }],
    lines: [
      { who: "bisola", text: "I'm leaving my seat to someone who started at the same corner I did. That's how it should be in Lagos." },
      { who: "funke", text: "Chief, you left my corner thirty years ago, and now this one too. My corner produces champions." },
    ],
    choices: [
      { label: "Give the farewell speech", result: "\"Buy well, sell well, keep records, keep promises.\" The whole hall says the last two words with you.", fx: { rep: 8 } },
      { label: "Present her with the first bag of rice your company ever sold", result: "You kept it all these years. She laughs so hard she has to sit down.", fx: { rep: 7, flag: "first_bag" } },
    ],
    reward: { money: 600_000, xp: 1_150 },
  },
  {
    id: "c10-med-3", ch: 10, route: "med", emoji: "🌺", title: "Dr Ngozi's farewell", place: "hospital", cast: ["ngozi", "tunde"],
    intro: "Dr Ngozi is stepping back from practice after forty years. The hospital throws a farewell. Tunde, whose sprained ankle started it all, insists on giving a speech.",
    goal: "Visit the hospital and work two shifts.",
    tasks: [{ do: "visit-patient|volunteer" }, { count: "work", n: 2 }],
    lines: [
      { who: "tunde", text: "I twisted my ankle playing football, and this doctor told me no football for two weeks. I played after one week. I'm sorry, Doctor. Also, thank you." },
      { who: "ngozi", text: "My proudest moment wasn't any diagnosis. It was the day a young person in my queue decided to become a doctor." },
    ],
    choices: [
      { label: "Give her the stethoscope you've carried since house job", result: "She holds it for a long time. \"Keep it. Give it to your best student one day.\"", fx: { rep: 7, flag: "stethoscope" } },
      { label: "Announce the Ngozi Okafor Fellowship for young doctors", result: "Every year, one young doctor trained in her name. She can't speak.", fx: { cost: 300_000, rep: 9, flag: "ngozi_fellowship" } },
    ],
    reward: { money: 500_000, xp: 1_150 },
  },
  {
    id: "c10-law-3", ch: 10, route: "law", emoji: "🌺", title: "Barrister Emeka's farewell", place: "chambers", cast: ["emeka"],
    intro: "Barrister Emeka is retiring from Nwosu & Partners. He asks you to sit in his old chair for the last day, and to give the first and last lesson to the new juniors.",
    goal: "Help at the legal clinic and read law reports.",
    tasks: [{ do: "legal-clinic" }, { do: "read-cases" }],
    lines: [
      { who: "emeka", text: "Tell them about the family next door. That's where every good lawyer starts: with somebody's family next door." },
      { who: "you", text: "The law is the poor man's weapon. He told me that on my first day. Write it down." },
    ],
    choices: [
      { label: "Keep his old law report on the juniors' desk", result: "Every new junior reads the margins: forty years of mistakes and lessons.", fx: { rep: 7, flag: "emeka_report" } },
      { label: "Name the legal clinic after him", result: "The Emeka Nwosu Legal Clinic. Every Saturday, forever.", fx: { rep: 8, flag: "emeka_clinic" } },
    ],
    reward: { money: 500_000, xp: 1_150 },
  },
  {
    id: "c10-tech-3", ch: 10, route: "tech", emoji: "🌺", title: "Ify's next chapter", place: "hub", cast: ["ify"],
    intro: "Ify is leaving Brainbox to become head of computer science at a new university. She asks you to take over the Saturday beginners' class, the same one you once sat in.",
    goal: "Teach the beginners' class.",
    tasks: [{ do: "bootcamp" }],
    lines: [
      { who: "ify", text: "First rule: being stuck is normal. Second rule: staying stuck is a choice. Third rule: bring snacks." },
      { who: "you", text: "Someone in the class has a borrowed laptop and a notebook full of ideas." },
    ],
    choices: [
      { label: "Give her a laptop and a mentor", result: "She'll build something you can't imagine yet. That's the point.", fx: { cost: 160_000, rep: 6, flag: "laptop_gift" } },
      { label: "Promise to teach the class every Saturday", result: "You keep the promise for years. Many of your students become engineers.", fx: { rep: 7, flag: "saturday_teacher" } },
    ],
    reward: { money: 500_000, xp: 1_150 },
  },
  {
    id: "c10-ent-3", ch: 10, route: "ent", emoji: "🌺", title: "K-Wave's last beat", place: "studio", cast: ["kola"],
    intro: "K-Wave is stepping away from producing to run the music academy full-time. He wants to make one last song with you, in Booth B, where your first demo was recorded.",
    goal: "Record in the studio and jam with the band.",
    tasks: [{ do: "record-demo" }, { do: "jam" }],
    lines: [
      { who: "kola", text: "Again. Again. Once more, with feeling. There. That's the take. Same as the first time." },
      { who: "you", text: "You gave me everything. A mic, a booth, and the truth." },
    ],
    choices: [
      { label: "Release the song with all proceeds to the academy", result: "It becomes an anthem. Every stream pays for a student's lessons.", fx: { rep: 9, flag: "last_beat" } },
      { label: "Keep it unreleased, just for the two of you", result: "Some songs are for the people who made them. You play it on his birthday every year.", fx: { rep: 3, flag: "secret_song" } },
    ],
    reward: { money: 500_000, xp: 1_150 },
  },

  {
    id: "c10-stay", ch: 10, emoji: "🧭", title: "Stay or go", place: "phone", cast: ["chiamaka", "tobi"],
    intro: "A university abroad invites you to teach for a year. Friends abroad call often. Lagos still drives you crazy. You could go, you could stay, or you could do both.",
    goal: "Call two people you trust.",
    tasks: [{ count: "call", n: 2 }],
    lines: [
      { who: "chiamaka", text: "Whatever you decide, decide it for you. Not for Lagos, not for anyone." },
      { who: "tobi", text: "You built half your life here. The other half can be anywhere you want." },
    ],
    choices: [
      { label: "Stay in Lagos, for good", result: "Lagos is home. Frustrating, loud, impossible, wonderful home.", fx: { rep: 5, flag: "lagos_forever" } },
      { label: "Teach abroad for a year, then come back", result: "A year away teaches you how much you love Lagos. You return with new ideas.", fx: { skill: { study: 0.5, charisma: 0.3 }, flag: "year_abroad" } },
      { label: "Split your time between Lagos and abroad", result: "Two homes, two lives, one heart. The airport staff know your name.", fx: { skill: { charisma: 0.3 }, flag: "two_homes" } },
    ],
    reward: { money: 200_000, xp: 1_000 },
  },

  // ----- routes, part 4 -----
  {
    id: "c10-biz-4", ch: 10, route: "biz", emoji: "🏙️", title: "The empire", place: "tower", cast: ["bisola", "funke"],
    intro: "Your companies employ thousands. Your trucks cross Lagos day and night. And the market traders still call you by your first name.",
    goal: "Reach reputation 90 and a net worth of ₦8,000,000.",
    tasks: [{ rep: 90 }, { worth: 8_000_000 }],
    lines: [
      { who: "funke", text: "When you come to the market, you still greet everybody first. That's why they love you." },
      { who: "bisola", text: "Thirty years from now, someone will start at that same corner. Leave the door open for them." },
    ],
    choices: [
      { label: "Open a stall at Oja Tuntun, just to sell on Saturdays", result: "A billion-naira business owner selling rice by the cup on Saturdays. The market loves it.", fx: { rep: 8, flag: "saturday_stall" } },
      { label: "Fund a market renovation: roofs, drainage, lights", result: "No more flooded stalls, no more fires from bad wiring. Oja Tuntun is reborn.", fx: { cost: 1_000_000, rep: 10, flag: "market_renewed" } },
    ],
    reward: { money: 1_000_000, xp: 1_300 },
  },
  {
    id: "c10-med-4", ch: 10, route: "med", emoji: "💙", title: "A lifetime of care", place: "hospital", cast: ["ngozi"],
    intro: "Your clinic now has three branches. Thousands of patients, hundreds of staff, and a reputation for never turning anyone away in an emergency.",
    goal: "Get your clinic to level 3 and reach reputation 90.",
    tasks: [{ bizId: "clinic", level: 3 }, { rep: 90 }],
    lines: [
      { who: "ngozi", text: "I once said medicine is a long road. I didn't say you'd build the road for others." },
      { who: "you", text: "Every doctor we train becomes a doctor who stays." },
    ],
    choices: [
      { label: "Make the clinics a non-profit trust", result: "The clinics will never be sold, never closed for profit. They belong to the patients now.", fx: { rep: 10, flag: "clinic_trust" } },
      { label: "Keep running them, and train your successor", result: "A young doctor from Mushin, trained in your teaching wing, will lead them one day.", fx: { rep: 8, flag: "clinic_successor" } },
    ],
    reward: { money: 800_000, xp: 1_300 },
  },
  {
    id: "c10-law-4", ch: 10, route: "law", emoji: "🌟", title: "The next generation", place: "chambers", cast: ["emeka"],
    intro: "Law students line up outside your chambers for internships. Some of them first heard of you from the tenancy guide in their own language.",
    goal: "Help at the legal clinic three times and reach reputation 90.",
    tasks: [{ do: "legal-clinic", n: 3 }, { rep: 90 }],
    lines: [
      { who: "emeka", text: "I visited the clinic today, just to sit in the corner. A junior explained self-help eviction to a family. Perfectly." },
      { who: "you", text: "The law is the poor man's weapon. Now everyone knows how to hold it." },
    ],
    choices: [
      { label: "Endow a chair of public interest law at Lagoon University", result: "Generations of students will study the cases you won.", fx: { cost: 500_000, rep: 9, flag: "law_chair" } },
      { label: "Write a book about your cases for ordinary readers", result: "It's taught in schools. Taxi drivers quote it to you.", fx: { rep: 9, money: 300_000, flag: "law_book" } },
    ],
    reward: { money: 800_000, xp: 1_300 },
  },
  {
    id: "c10-tech-4", ch: 10, route: "tech", emoji: "🌐", title: "Handing over", place: "phone", cast: ["halima", "ify"],
    intro: "The company you started on a borrowed hub connection is now one of Africa's best-known tech companies. It's time to let a new CEO lead, and to decide what you'll build next.",
    goal: "Keep your startup at level 3 and reach a net worth of ₦8,000,000.",
    tasks: [{ bizId: "startup", level: 3 }, { worth: 8_000_000 }],
    lines: [
      { who: "halima", text: "The best founders know when to step aside. You know." },
      { who: "ify", text: "So what's next? Don't say 'rest'. You don't know how." },
    ],
    choices: [
      { label: "Hand over to one of your first bootcamp hires", result: "She joined as a junior who broke the build. Now she's CEO. The circle closes.", fx: { rep: 9, flag: "bootcamp_ceo" } },
      { label: "Stay as chair and start a new venture for public good", result: "Your next project: open-source tools for every government hospital in West Africa.", fx: { rep: 9, flag: "public_good_venture" } },
    ],
    reward: { money: 1_000_000, xp: 1_300 },
  },
  {
    id: "c10-ent-4", ch: 10, route: "ent", emoji: "🌟", title: "Legend", place: "pavilion", cast: ["kola", "ronke"],
    intro: "A lifetime achievement award, at thirty-something. Your songs play at weddings, your films on every TV channel, and your label's artists fill stadiums.",
    goal: "Get your label to level 3 and reach reputation 95.",
    tasks: [{ bizId: "label", level: 3 }, { rep: 95 }],
    lines: [
      { who: "ronke", text: "When you first came to my buka, you could only afford half a plate of amala. Now you're a legend. Eat a full plate today." },
      { who: "kola", text: "Eleven views. Never forget." },
    ],
    choices: [
      { label: "Give the award to your academy's first graduate", result: "You call her on stage and hand it over. \"It's yours now. Go and earn your own one day.\"", fx: { rep: 10, flag: "award_passed" } },
      { label: "Perform your first song, the one from the open mic", result: "Shaking hands, five minutes, a room that goes quiet and listens. Exactly like the first time.", fx: { rep: 9, flag: "first_song" } },
    ],
    reward: { money: 1_000_000, xp: 1_300 },
  },

  {
    id: "c10-party", ch: 10, emoji: "🎊", title: "The celebration", place: "pavilion", cast: ["jide", "mummy", "tunde", "ronke"],
    intro: "Uncle Jide insists: a party for everything you've achieved, at Royal Pavilion, with every person who was part of the journey. He has already booked a band. And a second band.",
    goal: "Pay for the celebration and attend.",
    tasks: [{ pay: 300_000 }, { do: "attend-event" }],
    lines: [
      { who: "jide", text: "Ladies and gentlemen, my sister's child! Who came with one bag! ONE BAG!" },
      { who: "tunde", text: "I was there on day one with my WhatsApp hustle! Remember that, everybody!" },
      { who: "ronke", text: "I fed this one on credit for two weeks. Today I'm calling in the debt: everybody eat!" },
      { who: "mummy", text: "My child. My child. I don't have any more words." },
    ],
    choices: [
      { label: "Dance with Mummy first", result: "The whole hall stops to watch. She dances better than you, as always.", fx: { bond: { mummy: 15 }, mood: "bigNight" } },
      { label: "Thank every person by name", result: "It takes forty minutes. Nobody gets bored. Everyone hears their name.", fx: { rep: 6 } },
    ],
    reward: { money: 200_000, xp: 1_000, rep: 3 },
  },
  {
    id: "c10-legacy", ch: 10, emoji: "🏛️", title: "Your legacy", place: "park", cast: ["mummy", "femi", "you"],
    intro: "Unity Park, early morning. The same bench where you first played draughts. You think about everything: the bag, the bucket bath, the danfo, the people. What do you want Lagos to remember?",
    goal: "Reach a net worth of ₦5,000,000 and reputation 85.",
    tasks: [{ worth: 5_000_000 }, { rep: 85 }],
    lines: [
      { who: "mummy", text: "When you left home, I prayed you'd be safe. I didn't dare pray for all of this." },
      { who: "femi", text: "A good name is better than gold. You have both. Now go and enjoy your life." },
      { who: "you", text: "I came to Lagos to make it. I think, in the end, Lagos made me." },
    ],
    choices: [
      { label: "\"Remember that I kept my promises.\"", result: "Years later, a young person arrives in Mushin with one bag. Someone tells them your story, starting with a promise to a landlord.", fx: { rep: 5, flag: ["story_done", "legacy_promises"] } },
      { label: "\"Remember the people I lifted.\"", result: "Thousands of people can say: \"I got my first chance because of them.\" That's your monument.", fx: { rep: 5, flag: ["story_done", "legacy_people"] } },
      { label: "\"Remember that I never forgot where I came from.\"", result: "Every year on the anniversary of your arrival, you take a danfo across Lagos, just to remember. You always pay exact change.", fx: { rep: 5, flag: ["story_done", "legacy_roots"] } },
    ],
    reward: { money: 1_000_000, xp: 2_000, rep: 5 },
  },
];
