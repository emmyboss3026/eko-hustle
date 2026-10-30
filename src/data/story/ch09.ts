// Chapter 9 — At the Top (missions 81–90). Years have passed. The biggest stage of your career.

import type { StoryMission } from "./types";

export const ch09: StoryMission[] = [
  {
    id: "c9-years", ch: 9, emoji: "⏳", title: "Years later", place: "park", cast: ["femi", "mummy"],
    intro: "Time moves fast in Lagos. Years have passed since you arrived with one bag. Baba Femi's hair is white now. Mummy has more grandchildren to pray for. And people stop you in the street.",
    goal: "Play draughts with Baba Femi and reach a net worth of ₦2,500,000.",
    tasks: [{ do: "draughts" }, { worth: 2_500_000 }],
    lines: [
      { who: "femi", text: "Do you know what I see when I look at you? The same young person who couldn't play draughts. Only now, you win sometimes." },
      { who: "mummy", text: "When people ask about my child, I don't know where to start." },
      { who: "you", if: "kept_wallet", text: "Sometimes I still think about that envelope under the danfo seat." },
      { who: "you", text: "What matters most, at the top?" },
    ],
    choices: [
      { label: "\"The people who came with me.\"", result: "\"Good,\" says Baba Femi. \"The top is lonely for people who climbed alone.\"", fx: { rep: 4, flag: "people_first" } },
      { label: "\"Building something bigger than me.\"", result: "He nods slowly. \"Then build it so it stands when you're gone.\"", fx: { skill: { hustle: 0.3 }, flag: "builder" } },
      { label: "\"Staying honest when it's hard.\"", result: "He beats you in nine moves and says, \"Honest, but still bad at draughts.\"", fx: { rep: 5, flag: "honest_top" } },
    ],
    reward: { money: 100_000, xp: 750 },
  },

  // ----- routes, part 1 -----
  {
    id: "c9-biz-1", ch: 9, route: "biz", emoji: "📦", title: "Expansion", place: "phone", cast: ["bisola"],
    intro: "Supermarkets in Ikeja, Lekki and Surulere want your delivery service. Your trucks are full every day. It's time to grow the logistics company again.",
    goal: "Get your logistics company to level 2.",
    tasks: [{ bizId: "logistics", level: 2 }],
    lines: [
      { who: "bisola", text: "I'm retiring properly this year. My company is safe in your hands. Don't make me come back." },
      { who: "you", text: "Chief, everything I know about business, I learned at your elbow." },
    ],
    choices: [
      { label: "Open a training school for young drivers", result: "Free training, fair jobs, a career path. Two hundred young people get licences.", fx: { cost: 150_000, rep: 8, flag: "driver_school" } },
      { label: "Expand into cold storage for farmers", result: "Tomatoes from the north arrive fresh instead of rotten. Farmers earn more, prices fall.", fx: { cost: 150_000, rep: 6, skill: { hustle: 0.4 }, flag: "cold_chain" } },
    ],
    reward: { money: 250_000, xp: 800 },
  },
  {
    id: "c9-med-1", ch: 9, route: "med", emoji: "🏥", title: "Head of department", place: "hospital", cast: ["ngozi"],
    intro: "Dr Ngozi is retiring. The hospital board wants you to lead the department of medicine: budgets, staffing, standards, and every difficult phone call.",
    goal: "Reach reputation 75 and work four shifts.",
    tasks: [{ rep: 75 }, { count: "work", n: 4 }],
    lines: [
      { who: "ngozi", text: "I'm leaving my department to the person who stayed with a sprained ankle in a long queue. I couldn't choose better." },
      { who: "you", text: "Who will I call at 3 a.m. now?" },
      { who: "ngozi", text: "Me. I'm retiring, not dying." },
    ],
    choices: [
      { label: "Push the board for more doctors and safer shifts", result: "A year of meetings. Then twelve new doctors and no more 36-hour calls in your department.", fx: { rep: 8, flag: "safer_shifts" } },
      { label: "Modernise the department with digital records", result: "No more lost files. Tests aren't repeated. Patients spend hours less in the hospital.", fx: { rep: 6, skill: { study: 0.3 }, flag: "digital_dept" } },
    ],
    reward: { money: 200_000, xp: 800 },
  },
  {
    id: "c9-law-1", ch: 9, route: "law", emoji: "🛡️", title: "The defence", place: "court", cast: ["emeka"],
    intro: "A journalist who exposed corruption is being sued for millions by a powerful man. If she loses, every journalist in Lagos will learn to stay quiet. She asks you to defend her.",
    goal: "Work four shifts and reach reputation 75.",
    tasks: [{ count: "work", n: 4 }, { rep: 75 }],
    lines: [
      { who: "emeka", text: "This case will make you enemies. Powerful ones. It will also make you the lawyer people trust when it matters most." },
      { who: "you", text: "The truth is the best defence. We can prove every word she wrote." },
    ],
    choices: [
      { label: "Defend her for free", result: "Months of work. The court rules for her: the truth is not defamation. Journalists across Nigeria celebrate.", fx: { rep: 10, flag: "press_freedom" } },
      { label: "Lead a team of lawyers from several firms", result: "Five firms, one defence. The case becomes a symbol of the profession standing together.", fx: { rep: 8, skill: { charisma: 0.4 }, flag: "press_freedom" } },
    ],
    reward: { money: 200_000, xp: 800 },
  },
  {
    id: "c9-tech-1", ch: 9, route: "tech", emoji: "📶", title: "Scale", place: "phone", cast: ["halima", "ify"],
    intro: "A million users. Servers in three data centres. A team of eighty. The startup has become a company, and you've become a CEO who sometimes misses writing code.",
    goal: "Get your startup to level 3.",
    tasks: [{ bizId: "startup", level: 3 }],
    lines: [
      { who: "halima", if: "sold_startup", text: "Your new board is happy, mostly. You've kept the culture alive. That's rare after a sale." },
      { who: "ify", text: "A million people use something you built. Do you understand how mad that is?" },
      { who: "you", text: "I still have the laptop I bought for the pharmacy website." },
    ],
    choices: [
      { label: "Open-source a part of your system for others to use", result: "Hundreds of African developers use your code in their own projects. Your engineers are proud.", fx: { rep: 8, flag: "open_source" } },
      { label: "Build an engineering academy inside the company", result: "Fifty juniors a year, trained and paid. Half of Yaba's engineers will have your company on their CV.", fx: { cost: 200_000, rep: 8, flag: "academy" } },
    ],
    reward: { money: 250_000, xp: 800 },
  },
  {
    id: "c9-ent-1", ch: 9, route: "ent", emoji: "🎟️", title: "Sold out", place: "pavilion", cast: ["kola"],
    intro: "Your concert at Royal Pavilion sells out in eleven minutes. They add a second night. It sells out in nine.",
    goal: "Host two shows and reach reputation 75.",
    tasks: [{ do: "host-show", n: 2 }, { rep: 75 }],
    lines: [
      { who: "kola", text: "Two sold-out nights. I'm going to sit down for a moment." },
      { who: "you", if: "street_front_row", text: "The street is in the front row again. Mama Ronke knows all the words now." },
    ],
    choices: [
      { label: "Bring out every artist from your label as guests", result: "A night of new talent. The young artists' streams triple overnight.", fx: { rep: 8, flag: "label_showcase" } },
      { label: "Play an acoustic set of your first songs", result: "No lights, no dancers, just you and a guitar. Ten thousand phone lights in the dark.", fx: { rep: 7, skill: { charisma: 0.3 }, flag: "acoustic_set" } },
    ],
    reward: { money: 250_000, xp: 800 },
  },

  {
    id: "c9-kunle", ch: 9, emoji: "🎓", title: "Kunle's turn", place: "campus", cast: ["kunle", "mummy"],
    intro: "Kunle, the cousin you helped with exam fees years ago, has an announcement. The whole family gathers at Lagoon University for it.",
    goal: "Visit the campus and be close to Kunle.",
    tasks: [{ visit: "campus" }, { bond: "kunle", min: 70 }],
    lines: [
      { who: "kunle", if: "paid_kunle", text: "First class! And a scholarship for my master's degree! It started with you paying that ₦8,000. I've never forgotten." },
      { who: "kunle", if: "kunle_hustle", text: "My little snack business now supplies four campuses. I employ twelve students." },
      { who: "kunle", unless: "paid_kunle", text: "I graduated with a good degree. It took longer than I hoped, but I did it." },
      { who: "mummy", text: "Look at my two children. I'm too blessed. Somebody hold me." },
    ],
    choices: [
      { label: "Ask Kunle to help with your scholarship fund", result: "He takes over the fund's student selection. He knows exactly what struggling students need.", fx: { bond: { kunle: 10 }, rep: 3, flag: "kunle_fund" } },
      { label: "Throw him a graduation party", result: "Uncle Jide is the MC. Kunle dances worse than you. Mummy films everything.", fx: { cost: 50_000, bond: { kunle: 12, mummy: 8 } } },
    ],
    reward: { money: 80_000, xp: 750 },
  },

  // ----- routes, part 2 -----
  {
    id: "c9-biz-2", ch: 9, route: "biz", emoji: "🏭", title: "Make it here", place: "tower", cast: ["bisola", "halima"],
    intro: "Imported goods get more expensive every year. A factory outside Lagos is for sale. Making products in Nigeria means jobs and control, but also power cuts, roads and risk.",
    goal: "Have ₦1,500,000 in cash.",
    tasks: [{ money: 1_500_000 }],
    lines: [
      { who: "halima", text: "Local manufacturing is hard, slow and important. Most investors avoid it. That's why it's an opportunity." },
      { who: "bisola", text: "When I was young, everything we sold was made here. Bring it back." },
    ],
    choices: [
      { label: "Buy the factory and make your own products", result: "Your own brand of rice, oil and soap, made by three hundred Nigerian workers. It's hard. It's yours.", fx: { cost: 1_000_000, rep: 8, flag: "factory" } },
      { label: "Partner with local farmers and processors instead", result: "No factory, but contracts with fifty farming cooperatives. Lighter risk, wide impact.", fx: { cost: 300_000, rep: 6, flag: "cooperatives" } },
    ],
    reward: { money: 300_000, xp: 820 },
  },
  {
    id: "c9-med-2", ch: 9, route: "med", emoji: "🔬", title: "The rare diagnosis", place: "hospital", cast: ["ngozi"],
    intro: "A twelve-year-old girl has been to five hospitals. Nobody can explain her symptoms. Her parents have sold their car to pay for tests. They bring her to you as a last hope.",
    goal: "Reach Study level 9 and work three shifts.",
    tasks: [{ skill: "study", min: 9 }, { count: "work", n: 3 }],
    lines: [
      { who: "ngozi", text: "When everyone else has looked at the obvious, look at the rare. Then look at the patient again." },
      { who: "you", text: "It's a rare metabolic disorder. Treatable, if you know what it is." },
    ],
    choices: [
      { label: "Waive her fees and write up the case to teach others", result: "She's home in a month, running around. Your case report helps doctors across West Africa spot it early.", fx: { rep: 9, flag: "rare_case" } },
      { label: "Start a fund for children with rare diseases", result: "₦300,000 from you, more from donors. Twelve families helped in the first year.", fx: { cost: 300_000, rep: 9, flag: "rare_fund" } },
    ],
    reward: { money: 200_000, xp: 820 },
  },
  {
    id: "c9-law-2", ch: 9, route: "law", emoji: "🏛️", title: "Open your chambers", place: "phone", cast: ["emeka"],
    intro: "The office is ready. The brass plate is polished. Barrister Emeka is coming to the opening with a gift he refuses to describe.",
    goal: "Own your chambers (🏪 Business app).",
    tasks: [{ bizId: "lawfirm" }],
    lines: [
      { who: "emeka", text: "The gift? My first law report, from 1981. Every note in the margin is a mistake I made. Learn from them." },
      { who: "you", text: "I'll keep it on my desk forever." },
    ],
    choices: [
      { label: "Make access to justice the firm's mission", result: "A third of your cases are free or low-cost. Your firm becomes famous for it.", fx: { rep: 8, flag: "justice_firm" } },
      { label: "Build a top commercial firm and fund a legal aid trust", result: "Big clients pay big fees. The trust funds lawyers for people who can't pay.", fx: { money: 300_000, rep: 6, flag: "legal_aid_trust" } },
    ],
    reward: { money: 250_000, xp: 820 },
  },
  {
    id: "c9-tech-2", ch: 9, route: "tech", emoji: "🌍", title: "Across Africa from Lagos", place: "hub", cast: ["ify", "halima"],
    intro: "Your app launches in Accra and Nairobi, run by teams you hire there, but built and led from Yaba. Lagos startups going continental used to be a dream.",
    goal: "Reach reputation 75 and attend two tech meetups.",
    tasks: [{ rep: 75 }, { do: "meetup", n: 2 }],
    lines: [
      { who: "ify", text: "Every launch in a new country teaches you something you got wrong in Lagos. Listen." },
      { who: "halima", text: "Hire locals to lead. Don't send Lagos people to run Nairobi." },
    ],
    choices: [
      { label: "Hire local leaders in each country", result: "They know their markets. Growth is faster than anyone expected.", fx: { rep: 6, skill: { charisma: 0.3 }, flag: "local_leaders" } },
      { label: "Build one strong product for everyone first", result: "Slower expansion, but the product works everywhere without hacks.", fx: { skill: { study: 0.3 }, flag: "one_product" } },
    ],
    reward: { money: 250_000, xp: 820 },
  },
  {
    id: "c9-ent-2", ch: 9, route: "ent", emoji: "🌐", title: "The collaboration", place: "studio", cast: ["kola"],
    intro: "A famous international artist wants to work with you. Their team sends a contract, a beat, and a plane ticket. Your fans are losing their minds online.",
    goal: "Work four shifts and reach Charisma level 9.",
    tasks: [{ count: "work", n: 4 }, { skill: "charisma", min: 9 }],
    lines: [
      { who: "kola", text: "Make sure the song sounds like you, not like you're visiting their song." },
      { who: "you", text: "I want to record it here, at Afrowave, not abroad." },
    ],
    choices: [
      { label: "Insist on recording in Lagos with Lagos musicians", result: "They fly in. Your band plays on a global hit. Afrowave Studios becomes famous overnight.", fx: { rep: 9, flag: "lagos_collab" } },
      { label: "Fly out and learn how they work", result: "You come back with new techniques and new friends. Your next album is your best.", fx: { skill: { charisma: 0.4 }, flag: "global_lessons" } },
    ],
    reward: { money: 300_000, xp: 820 },
  },

  {
    id: "c9-damola", ch: 9, if: "helped_damola_honest", emoji: "🌅", title: "Damola's second chance", place: "island-street", cast: ["damola"],
    intro: "Damola Pedro asks to meet. No fancy car this time, no designer glasses. He has a small, honest business, and he wants to say something.",
    goal: "Meet Damola at a networking mixer and reach reputation 70.",
    tasks: [{ do: "networking|tower-network" }, { rep: 70 }],
    lines: [
      { who: "damola", text: "You told me no more times than anyone in my life. And you were the only one who helped when I fell." },
      { who: "damola", text: "My business makes real money now. Small, but real. I sleep at night." },
      { who: "you", text: "I'm glad, Damola. Really." },
    ],
    choices: [
      { label: "Invite him to speak to young entrepreneurs about his mistakes", result: "Honest, funny and painful. Young people learn more from his failures than from a dozen success stories.", fx: { rep: 5, flag: "damola_redeemed" } },
      { label: "Become his first big customer", result: "He delivers on time, every time. Old enemies, new partners.", fx: { rep: 4, skill: { hustle: 0.2 }, flag: "damola_partner" } },
    ],
    reward: { money: 100_000, xp: 760 },
  },
  {
    id: "c9-damola-b", ch: 9, unless: "helped_damola_honest", emoji: "📰", title: "Damola's fall", place: "island-street", cast: ["damola", "tunde"],
    intro: "The headlines are everywhere: Damola Pedro's schemes have collapsed. Investors lost millions. Some of them call you, asking if you knew him.",
    goal: "Attend a networking mixer and reach reputation 70.",
    tasks: [{ do: "networking|tower-network" }, { rep: 70 }],
    lines: [
      { who: "tunde", text: "Remember the forex app? That was his guy. It was always him, one way or another." },
      { who: "you", if: "covered_up", text: "I never came clean about that first deal. My stomach drops every time a journalist calls." },
      { who: "you", unless: "covered_up", text: "I said no to him every time. Today, I'm glad." },
    ],
    choices: [
      { label: "Help the small investors who lost money get legal help", result: "You fund a group legal action for traders who lost their savings. Some get money back.", fx: { cost: 100_000, rep: 7, flag: "helped_victims" } },
      { label: "Stay quiet and let the courts handle it", result: "It's not your fight. Life goes on, a little quieter.", fx: { flag: "stayed_out" } },
    ],
    reward: { money: 100_000, xp: 760 },
  },

  // ----- routes, part 3 -----
  {
    id: "c9-biz-3", ch: 9, route: "biz", emoji: "🦈", title: "The takeover bid", place: "tower", cast: ["bisola", "halima"],
    intro: "A foreign fund is quietly buying shares in your logistics company. Their plan: take control, cut jobs, sell the parts. You have four days to rally your partners.",
    goal: "Within 4 days: reach reputation 75 and network at Marina Point Tower twice.",
    tasks: [{ rep: 75 }, { do: "tower-network", n: 2 }],
    deadline: 4,
    fail: { text: "The fund grabbed a bigger stake while you were busy. You still have a chance to fight back, but the board is nervous.", rep: -6 },
    lines: [
      { who: "bisola", text: "I built this company over thirty years. Don't let them sell it for parts in thirty days." },
      { who: "halima", text: "Lagoon Ventures will stand with you. So will most of the drivers, if you ask them." },
    ],
    choices: [
      { label: "Offer shares to your employees to block the bid", result: "Drivers, managers, warehouse staff: they buy in. The fund can't get control. The company is owned by its people.", fx: { rep: 9, flag: "employee_owned" } },
      { label: "Find a friendly Nigerian investor to buy the shares", result: "A respected Lagos family business buys in. The fund leaves. Jobs are safe.", fx: { rep: 6, skill: { charisma: 0.4 }, flag: "white_knight" } },
    ],
    reward: { money: 300_000, xp: 850 },
  },
  {
    id: "c9-med-3", ch: 9, route: "med", emoji: "🏥", title: "Your clinic", place: "phone", cast: ["tobi", "ngozi"],
    intro: "The building Tobi designed is finished: natural light, a garden, an emergency room that never asks for a deposit first. It's time to open.",
    goal: "Own your clinic (🏪 Business app).",
    tasks: [{ bizId: "clinic" }],
    lines: [
      { who: "ngozi", text: "No deposit before emergency treatment, written on the wall at the entrance. I approve." },
      { who: "tobi", text: "Patients will sit in that garden and feel better before they even see a doctor." },
      { who: "you", if: "treat_first", text: "I wrote it on the wall because of an okada rider, years ago." },
    ],
    choices: [
      { label: "Name the emergency room after Dr Ngozi", result: "She protests for ten minutes, then cries at the unveiling.", fx: { rep: 6, flag: "ngozi_wing" } },
      { label: "Name it after Mummy", result: "Mummy cuts the ribbon. She tells everyone it's her hospital now.", fx: { bond: { mummy: 15 }, rep: 4 } },
    ],
    reward: { money: 300_000, xp: 850 },
  },
  {
    id: "c9-law-3", ch: 9, route: "law", emoji: "👑", title: "Senior Advocate", place: "court", cast: ["emeka", "mummy"],
    intro: "After many years at the Bar and a record of landmark cases, your peers nominate you for the rank of Senior Advocate of Nigeria, the highest honour in the profession.",
    goal: "Reach Study level 9, Charisma level 8 and reputation 80.",
    tasks: [{ skill: "study", min: 9 }, { skill: "charisma", min: 8 }, { rep: 80 }],
    lines: [
      { who: "emeka", text: "I was there when you wrote your first letter at the legal clinic. Now you'll wear silk. Lagos, eh." },
      { who: "mummy", text: "What does it mean? Never mind, I'm proud anyway. Tell me again what it means." },
    ],
    choices: [
      { label: "Dedicate the honour to the legal clinic", result: "You fund the clinic for ten more years in your speech. Barrister Emeka stands up first to clap.", fx: { cost: 200_000, rep: 8, flag: "clinic_endowed" } },
      { label: "Dedicate it to every client who couldn't pay", result: "\"They taught me what the law is for.\" The hall is silent, then loud.", fx: { rep: 8 } },
    ],
    reward: { money: 300_000, xp: 850, flag: "san" },
  },
  {
    id: "c9-tech-3", ch: 9, route: "tech", emoji: "🏆", title: "Tech award", place: "tower", cast: ["ify", "halima"],
    intro: "You're named Tech Founder of the Year at a ceremony on the Island. Ify is at your table. So is the intern who broke the test server on your first day.",
    goal: "Reach reputation 80 and Study level 9.",
    tasks: [{ rep: 80 }, { skill: "study", min: 9 }],
    lines: [
      { who: "ify", text: "You know what I'm proudest of? Not the award. The forty bootcamp graduates working for you." },
      { who: "halima", text: "Best investment I ever made. Don't tell my other founders." },
    ],
    choices: [
      { label: "Give your award speech about Ify and Brainbox", result: "\"Everything started with a borrowed laptop and a teacher who didn't give up.\" Ify pretends there's something in her eye.", fx: { bond: { ify: 15 }, rep: 6 } },
      { label: "Announce a fund for first-time founders", result: "₦500,000 in small grants for founders from neighbourhoods like Mushin. Applications open tonight.", fx: { cost: 500_000, rep: 10, flag: "founder_fund" } },
    ],
    reward: { money: 300_000, xp: 850 },
  },
  {
    id: "c9-ent-3", ch: 9, route: "ent", emoji: "🎬", title: "The premiere", place: "pavilion", cast: ["kola", "tobi"],
    intro: "Your film premieres at Royal Pavilion. Red carpet, flashing cameras, and in the front row, the people whose stories it tells.",
    goal: "Attend the event and get your label to level 2.",
    tasks: [{ do: "attend-event" }, { bizId: "label", level: 2 }],
    lines: [
      { who: "kola", text: "From an extra in a music video to this. Do you remember? You had a face for the camera." },
      { who: "tobi", text: "The set looks exactly like a Mushin room. I would know." },
    ],
    choices: [
      { label: "Screen it free in Mushin the next night", result: "A giant screen on the street, plastic chairs, puff-puff. The best premiere of your life.", fx: { rep: 9, flag: "street_screening" } },
      { label: "Send it to international film festivals", result: "It's selected for a major festival abroad. Lagos stories, on the world stage.", fx: { rep: 7, flag: "festival_film" } },
    ],
    reward: { money: 300_000, xp: 850 },
  },

  {
    id: "c9-interview", ch: 9, emoji: "📺", title: "The Eko Morning Show", place: "tower", cast: ["tunde", "mummy"],
    intro: "The biggest TV morning show in Lagos wants you live in the studio. Millions watching. The host is famous for one surprise question at the end.",
    goal: "Reach reputation 75 and network on the Island.",
    tasks: [{ rep: 75 }, { do: "tower-network|networking" }],
    lines: [
      { who: "tunde", text: "Everybody on the street is watching! Mama Ronke turned off the generator so she could hear!" },
      { who: "mummy", text: "Sit up straight. Smile. Don't say anything I'll have to explain at church." },
      { who: "you", text: "The surprise question: \"What would you tell your younger self, the day you arrived?\"" },
    ],
    choices: [
      { label: "\"Keep your promises. Even the small ones.\"", result: "The clip is shared a million times. Teachers write it on blackboards.", fx: { rep: 6, flag: "promises_quote" } },
      { label: "\"Call your mother more.\"", result: "Mummy calls the studio live, on air, to say she agrees. The host laughs for a whole minute.", fx: { rep: 5, bond: { mummy: 12 } } },
      { label: "\"Lagos will test you. Pass the test anyway.\"", result: "It becomes a slogan on T-shirts and danfo stickers across the city.", fx: { rep: 6, flag: "lagos_quote" } },
    ],
    reward: { money: 100_000, xp: 780, rep: 3 },
  },

  // ----- routes, part 4 -----
  {
    id: "c9-biz-4", ch: 9, route: "biz", emoji: "🏅", title: "Company of the year", place: "tower", cast: ["bisola"],
    intro: "Your group of companies is named Lagos Company of the Year. Trucks, shops, rental flats, a factory or cooperatives, and thousands of people who earn their living with you.",
    goal: "Get your businesses to 12 levels in total.",
    tasks: [{ bizLevel: 12 }],
    lines: [
      { who: "bisola", text: "One basin of tomatoes at Aunty Funke's corner. Do you remember?" },
      { who: "you", text: "I remember everything. Especially the part where you said \"if you're late, don't come\"." },
    ],
    choices: [
      { label: "Give every employee a bonus", result: "Thousands of families have a better month because of you. The market talks about it for weeks.", fx: { cost: 300_000, rep: 8 } },
      { label: "Fund a market traders' cooperative bank", result: "Low-interest loans for small traders, run by traders. Aunty Funke is the first chairwoman.", fx: { cost: 500_000, rep: 10, bond: { funke: 15 }, flag: "traders_bank" } },
    ],
    reward: { money: 400_000, xp: 880 },
  },
  {
    id: "c9-med-4", ch: 9, route: "med", emoji: "🩺", title: "Medical director", place: "hospital", cast: ["ngozi"],
    intro: "Your clinic has grown. More doctors, more beds, more patients every week. You're the medical director now, and every decision affects thousands of lives.",
    goal: "Get your clinic to level 2 and reach reputation 80.",
    tasks: [{ bizId: "clinic", level: 2 }, { rep: 80 }],
    lines: [
      { who: "ngozi", text: "I visit your clinic every week and pretend I'm just passing by. I'm not just passing by." },
      { who: "you", text: "We treated our ten-thousandth patient today." },
    ],
    choices: [
      { label: "Open a free maternity ward", result: "Mothers who couldn't afford a safe birth now have one. The first baby is named after the clinic.", fx: { cost: 300_000, rep: 10, flag: "maternity_ward" } },
      { label: "Partner with public hospitals to share specialists", result: "Your specialists visit public hospitals weekly. Thousands get care they'd never have had.", fx: { rep: 9, flag: "shared_specialists" } },
    ],
    reward: { money: 400_000, xp: 880 },
  },
  {
    id: "c9-law-4", ch: 9, route: "law", emoji: "🏙️", title: "Defending the city", place: "court", cast: ["emeka", "landlord"],
    intro: "A plan to demolish a whole waterfront community, without consultation or compensation, reaches the courts. Thousands of families. You lead the case for the residents.",
    goal: "Get your chambers to level 2 and reach reputation 85.",
    tasks: [{ bizId: "lawfirm", level: 2 }, { rep: 85 }],
    lines: [
      { who: "landlord", text: "I'm old now. But I'll come to court every day and sit in the front row." },
      { who: "emeka", text: "The law protects the weak only when lawyers make it. Make it." },
    ],
    choices: [
      { label: "Fight for the community to stay", result: "The court orders proper consultation and compensation before any demolition. The community stays.", fx: { rep: 10, flag: "waterfront_win" } },
      { label: "Negotiate resettlement on fair terms", result: "New homes nearby, compensation for every family, and a community centre. A painful but fair outcome.", fx: { rep: 8, skill: { charisma: 0.3 }, flag: "fair_resettlement" } },
    ],
    reward: { money: 400_000, xp: 880 },
  },
  {
    id: "c9-tech-4", ch: 9, route: "tech", emoji: "💹", title: "Profitable at last", place: "phone", cast: ["halima"],
    intro: "For years, growth came first. Now the company makes real profit every month. Halima sends a one-word message: \"Finally.\"",
    goal: "Reach a net worth of ₦6,000,000.",
    tasks: [{ worth: 6_000_000 }],
    lines: [
      { who: "halima", text: "Most startups never get here. You did it without losing your soul. That's the hard part." },
      { who: "you", text: "Profit means we never have to ask anyone for permission again." },
    ],
    choices: [
      { label: "Share profits with every employee", result: "A profit-sharing plan for everyone, from engineers to cleaners. Nobody leaves.", fx: { cost: 300_000, rep: 8, flag: "profit_sharing" } },
      { label: "Invest in the next generation of Lagos startups", result: "You become an angel investor in ten young companies. Three of them will be big.", fx: { cost: 500_000, rep: 7, flag: "angel" } },
    ],
    reward: { money: 400_000, xp: 880 },
  },
  {
    id: "c9-ent-4", ch: 9, route: "ent", emoji: "🎆", title: "Headlining the Eko Festival", place: "beach", cast: ["kola", "ronke"],
    intro: "The Eko Festival: forty thousand people on the beach, the biggest stage in Lagos, and your name in lights at the top of the bill.",
    goal: "Reach reputation 85 and a net worth of ₦4,000,000.",
    tasks: [{ rep: 85 }, { worth: 4_000_000 }],
    lines: [
      { who: "ronke", text: "I closed the buka for the first time in twenty years to be here. Don't disappoint me." },
      { who: "kola", text: "Forty thousand. Do you remember the eleven views?" },
    ],
    choices: [
      { label: "Close with a song about Mushin and invite your street on stage", result: "Mama Ronke, Tunde, Baba Femi, all dancing in front of forty thousand people. Legendary.", fx: { rep: 9, flag: "festival_legend" } },
      { label: "Donate the entire fee to music schools", result: "Instruments and teachers for twenty public schools. The next generation starts here.", fx: { rep: 10, flag: "music_schools" } },
    ],
    reward: { money: 400_000, xp: 880 },
  },

  {
    id: "c9-giving", ch: 9, emoji: "🎓", title: "Give back", place: "campus", cast: ["adewale", "kunle"],
    intro: "Prof. Adewale asks if you'd fund scholarships at Lagoon University for students from neighbourhoods like the one you started in. Kunle offers to help run it.",
    goal: "Fund the scholarship.",
    tasks: [{ pay: 500_000 }],
    lines: [
      { who: "adewale", text: "Every great Lagos story starts with someone who refused to stay small. Now you get to help other people refuse." },
      { who: "kunle", text: "I know exactly who needs it. The ones who study under streetlights." },
    ],
    choices: [
      { label: "Name it after Mummy", result: "\"The Mummy Scholarship\", as she insists on calling it. Twenty students a year.", fx: { bond: { mummy: 12 }, rep: 6 } },
      { label: "Let the students name it", result: "They call it \"The One Bag Scholarship\", after your story. You laugh, then cry.", fx: { rep: 8, flag: "one_bag" } },
    ],
    reward: { money: 100_000, xp: 800, rep: 4 },
  },
  {
    id: "c9-elite", ch: 9, emoji: "👑", title: "Elite", place: "residences", cast: ["tobi", "femi"],
    intro: "Lagos has a word for people at your level: \"big man\" or \"big madam\". Invitations come from governors, CEOs and foreign ambassadors. Baba Femi is not impressed.",
    goal: "Reach a net worth of ₦3,000,000 and reputation 80.",
    tasks: [{ worth: 3_000_000 }, { rep: 80 }],
    lines: [
      { who: "tobi", text: "You're on the guest list for the Governor's dinner. Wear the good shoes." },
      { who: "femi", text: "When you sit with big people, remember the small people who carried you to the table." },
    ],
    choices: [
      { label: "Use your influence to push for better roads and drainage in Mushin", result: "It takes a year of meetings. Then the bulldozers come, to build, not to demolish.", fx: { rep: 8, flag: "mushin_roads" } },
      { label: "Bring Baba Femi to the Governor's dinner", result: "He beats the Governor at draughts in eleven moves. The Governor asks for a rematch.", fx: { rep: 6, flag: "femi_governor" } },
    ],
    reward: { money: 200_000, xp: 850, rep: 4 },
  },
];
