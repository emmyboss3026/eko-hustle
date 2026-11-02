// Chapter 6 — Bigger Opportunities (missions 51–60). Investments, promotions and decisions with weight.

import type { StoryMission } from "./types";

export const ch06: StoryMission[] = [
  {
    id: "c6-property", ch: 6, emoji: "🏘️", title: "Bricks and mortar", place: "phone", cast: ["tobi", "femi"],
    intro: "Tobi says everyone in Lagos eventually asks the same question: \"When will I own something with a roof?\" Land and property rarely lose value here, but they eat money first.",
    goal: "Have ₦100,000 in investments (the 🏘️ property fund counts).",
    tasks: [{ invested: 100_000 }],
    lines: [
      { who: "tobi", text: "Real estate in Lagos is slow money. You don't get rich next month. You get rich in ten years." },
      { who: "femi", text: "My father bought a plot in Ikeja when it was bush. People laughed. Now that bush has a shopping mall on it." },
      { who: "you", text: "And people who bought fake plots from fake agents?" },
      { who: "tobi", text: "Always check the papers at the land registry. Always." },
    ],
    choices: [
      { label: "Keep adding to the property fund every month", result: "Small amounts, every month, without fail. The number climbs slowly and surely.", fx: { skill: { hustle: 0.3 }, flag: "property_saver" } },
      { label: "Ask Tobi to teach you how to read building plans", result: "Two Saturdays of plans and coffee. You start seeing Lagos as a map of possibilities.", fx: { skill: { study: 0.3 }, flag: "reads_plans" } },
    ],
    reward: { money: 20_000, xp: 420 },
  },

  // ----- routes, part 1 -----
  {
    id: "c6-biz-1", ch: 6, route: "biz", emoji: "🚢", title: "The import run", place: "tower", cast: ["bisola"],
    intro: "Prices at the market keep rising. Chief Bisola suggests importing your stock directly: cheaper per bag, but you pay up front, wait for the shipment, and deal with the port.",
    goal: "Pay for the shipment and wait three days for it to arrive.",
    tasks: [{ pay: 150_000 }, { days: 3 }],
    lines: [
      { who: "bisola", text: "At the port, everything must be on paper. Duties, forms, receipts. Some people take shortcuts. Shortcuts become long roads." },
      { who: "you", text: "An officer says he can 'help' clear the container faster. For ₦30,000, in cash." },
    ],
    choices: [
      { label: "Pay the official duties and wait", result: "It takes four extra days. Your goods arrive, and every paper is clean.", fx: { cost: 20_000, rep: 3, flag: "clean_import" } },
      { label: "Pay the officer to speed it up", result: "Your goods arrive two days earlier. The officer now has your number, and he calls often.", fx: { cost: 30_000, rep: -3, flag: "bribed_port" } },
    ],
    reward: { money: 220_000, xp: 450 },
  },
  {
    id: "c6-med-1", ch: 6, route: "med", emoji: "🇳🇬", title: "Service year", place: "hospital", cast: ["ngozi"],
    intro: "After house job comes the National Youth Service Corps: a year serving the country. Doctors are often posted to primary health centres where they may be the only doctor for thousands of people.",
    goal: "Let three days pass and work three shifts.",
    tasks: [{ days: 3 }, { count: "work", n: 3 }],
    lines: [
      { who: "ngozi", text: "In a primary health centre, you are the doctor, the pharmacist and sometimes the electrician. You'll learn more than in any hospital." },
      { who: "you", text: "I delivered a baby by torchlight last night. The mother named her after me." },
      { who: "ngozi", text: "Then you'll always have family in that village." },
    ],
    choices: [
      { label: "Start free health talks for the community", result: "Hand-washing, malaria nets, clean water. Cases of diarrhoea drop noticeably in three months.", fx: { rep: 6, flag: "health_talks" } },
      { label: "Study for your residency exams in every free moment", result: "Your colleagues play cards. You do past questions. You'll be ready.", fx: { skill: { study: 0.5 } } },
    ],
    reward: { money: 20_000, xp: 450, flag: "nysc" },
  },
  {
    id: "c6-law-1", ch: 6, route: "law", emoji: "💼", title: "Junior associate", place: "chambers", cast: ["emeka"],
    intro: "Your first desk at Nwosu & Partners, next to the photocopier. The work is research, drafting, filing at court registries, and carrying Barrister Emeka's very heavy bag.",
    goal: "Get a job in Law and work two shifts.",
    tasks: [{ career: "law" }, { count: "work", n: 2 }],
    lines: [
      { who: "emeka", text: "Your first brief: a contract dispute between two traders. Small money for them, everything for their families. Treat it like a Supreme Court case." },
      { who: "you", text: "I read the contract four times. There's a clause nobody noticed." },
      { who: "emeka", text: "That's why I hired you." },
    ],
    choices: [
      { label: "Stay late to master the firm's precedents", result: "You know where every important file is. Partners start asking for you by name.", fx: { skill: { study: 0.4 }, flag: "precedent_master" } },
      { label: "Make friends with the court registry clerks", result: "You learn the secret of Lagos litigation: the clerks know everything. Your filings never get lost.", fx: { skill: { charisma: 0.4 }, flag: "registry_friends" } },
    ],
    reward: { money: 20_000, xp: 450 },
  },
  {
    id: "c6-tech-1", ch: 6, route: "tech", emoji: "🛠️", title: "Software engineer", place: "hub", cast: ["ify"],
    intro: "Your work on the payments team is noticed. A software engineer role is opening, with real responsibility: if your code breaks, thousands of people can't pay for their bread.",
    goal: "Get promoted to Software engineer.",
    tasks: [{ career: "tech", level: 2 }],
    lines: [
      { who: "ify", text: "Software engineer! Remember: every line you ship is a promise to a user you'll never meet." },
      { who: "you", text: "I'm on call this weekend. If the system goes down, my phone rings." },
      { who: "ify", text: "Welcome to adulthood in tech." },
    ],
    choices: [
      { label: "Mentor the new interns", result: "Explaining things makes you understand them better. Two interns say you're the reason they stayed.", fx: { rep: 4, skill: { charisma: 0.3 }, flag: "mentors_interns" } },
      { label: "Take on the hardest project nobody wants", result: "The legacy payment system, written ten years ago with no comments. You tame it.", fx: { skill: { study: 0.5 }, flag: "legacy_hero" } },
    ],
    reward: { money: 25_000, xp: 450 },
  },
  {
    id: "c6-ent-1", ch: 6, route: "ent", emoji: "🎧", title: "Streaming numbers", place: "studio", cast: ["kola"],
    intro: "Your single is on every streaming platform. The numbers update every hour, and you check them every five minutes. K-Wave hides your phone during studio sessions.",
    goal: "Work four shifts in Entertainment and reach reputation 30.",
    tasks: [{ count: "work", n: 4 }, { rep: 30 }],
    lines: [
      { who: "kola", text: "One hit is luck. Three hits is a career. Stop counting and start writing the next one." },
      { who: "kola", if: "street_video", text: "The video with Mama Ronke is why people love you. They see themselves in it." },
      { who: "you", text: "A radio station in Ibadan just played my song!" },
    ],
    choices: [
      { label: "Visit radio stations to thank the DJs in person", result: "Seven stations in a week. DJs remember the artist who brought puff-puff and said thank you.", fx: { rep: 5, skill: { charisma: 0.3 }, flag: "radio_friends" } },
      { label: "Lock yourself in the studio and write", result: "Twelve songs in two weeks. Three of them are very good.", fx: { skill: { charisma: 0.4 }, flag: "prolific" } },
    ],
    reward: { money: 25_000, xp: 450 },
  },

  {
    id: "c6-tobi", ch: 6, if: "tobi_dating", emoji: "💛", title: "Meeting the parents", place: "family", cast: ["tobi", "jide"],
    intro: "Tobi's parents have invited you to Sunday lunch. Tobi's father is a retired judge. Tobi's mother has heard about you for months and has \"a few questions\".",
    goal: "Have Sunday lunch with the family and get close to Mummy.",
    tasks: [{ do: "family-lunch" }, { bond: "mummy", min: 70 }],
    lines: [
      { who: "tobi", text: "Relax. Just eat everything they offer and greet Daddy with both hands." },
      { who: "jide", text: "I'll come with you. Every family needs a spokesman, and I've been practising." },
      { who: "you", text: "Tobi's father asks what my plans are for the next ten years." },
    ],
    choices: [
      { label: "Answer honestly, with your real dreams and doubts", result: "He listens without interrupting, then says, \"Good. A person who knows their doubts knows themselves.\"", fx: { rep: 3, flag: "parents_approve", skill: { charisma: 0.2 } } },
      { label: "Let Uncle Jide do the talking", result: "Uncle Jide talks for forty minutes about your childhood. Tobi's mother laughs so hard she cries. It works, somehow.", fx: { bond: { mummy: 5 }, flag: ["parents_approve", "jide_spokesman"] } },
    ],
    reward: { money: 15_000, xp: 400 },
  },
  {
    id: "c6-tobi-b", ch: 6, unless: "tobi_dating", emoji: "📐", title: "Tobi's competition", place: "tower", cast: ["tobi"],
    intro: "Tobi has entered a national competition to design affordable housing for Lagos. The deadline is in a week, the model is half built, and Tobi hasn't slept properly in days.",
    goal: "Network at Marina Point Tower and help Tobi's team.",
    tasks: [{ do: "tower-network" }, { anySkill: 5 }],
    lines: [
      { who: "tobi", text: "Two hundred flats that ordinary people can actually afford. If we win, the state might build them." },
      { who: "you", text: "What do you need? I'm not an architect, but I can carry, cut and cook." },
    ],
    choices: [
      { label: "Spend three nights helping build the model", result: "Glue, cardboard and laughter at 3 a.m. Tobi's team wins second place. Your name is in the credits.", fx: { rep: 3, flag: "tobi_team", skill: { fitness: 0.1 } } },
      { label: "Introduce Tobi to people who can fund it", result: "Two of your contacts are interested. Even without winning, the project has a future now.", fx: { rep: 4, skill: { charisma: 0.3 }, flag: "tobi_funded" } },
    ],
    reward: { money: 15_000, xp: 400 },
  },

  // ----- routes, part 2 -----
  {
    id: "c6-biz-2", ch: 6, route: "biz", emoji: "🏙️", title: "Three's a crowd", place: "phone", cast: ["bisola", "funke"],
    intro: "Your shipments are cheaper than the market, so your shops are busy. The next step is a third business, and real managers, because you can't be in three places at once.",
    goal: "Own three businesses.",
    tasks: [{ biz: 3 }],
    lines: [
      { who: "bisola", text: "Now you need systems. If a business only works when you're there, you don't own a business. You own a job." },
      { who: "funke", if: "funke_partner", text: "Our bulk-buying is the talk of the market. Other traders want to join." },
    ],
    choices: [
      { label: "Write a simple manual for each business", result: "How to open, how to count stock, how to treat customers. Your managers stop calling you every hour.", fx: { skill: { hustle: 0.4 }, flag: "systems" } },
      { label: "Bring in a business partner to manage operations", result: "A sharp operations manager from a big company joins for a share of profits. Things run smoothly, and you have less control.", fx: { skill: { charisma: 0.3 }, flag: "ops_partner" } },
    ],
    reward: { money: 35_000, xp: 480, rep: 2 },
  },
  {
    id: "c6-med-2", ch: 6, route: "med", emoji: "📚", title: "The primaries", place: "campus", cast: ["ngozi", "chiamaka"],
    intro: "To become a resident doctor and train as a specialist, you must pass the primary exams of the postgraduate medical college. The pass rate is low. The fees are not.",
    goal: "Pay the exam fees and reach Study level 7.",
    tasks: [{ pay: 60_000 }, { skill: "study", min: 7 }],
    lines: [
      { who: "ngozi", text: "Which specialty? Internal medicine, surgery, paediatrics, obstetrics? Choose what you'd still love at 3 a.m." },
      { who: "chiamaka", if: "chiamaka_friend", text: "I'm writing too, for paediatrics. Same library table as always?" },
      { who: "you", text: "Passed. First attempt." },
    ],
    choices: [
      { label: "Specialise in internal medicine, like Dr Ngozi", result: "\"Copycat,\" she says, but she's smiling. You'll train under her.", fx: { bond: { mummy: 3 }, flag: "internal_medicine" } },
      { label: "Specialise in paediatrics, caring for children", result: "Children are honest patients: they tell you exactly where it hurts, loudly.", fx: { rep: 2, flag: "paediatrics" } },
      { label: "Specialise in surgery", result: "Long hours, steady hands, and the thrill of fixing things you can see.", fx: { skill: { fitness: 0.2 }, flag: "surgery" } },
    ],
    reward: { money: 25_000, xp: 480, flag: "primaries" },
  },
  {
    id: "c6-law-2", ch: 6, route: "law", emoji: "🏚️", title: "The first real case", place: "court", cast: ["emeka", "funke"],
    intro: "Aunty Funke's friend Iya Basira had her shop demolished overnight by a developer who claims the land is his. She has papers. He has money and friends.",
    goal: "Work two shifts and watch a court session.",
    tasks: [{ count: "work", n: 2 }, { do: "watch-court" }],
    lines: [
      { who: "funke", text: "She has sold there for twenty-two years. Now she sits on the rubble every day, waiting." },
      { who: "emeka", text: "Our case is strong, but the developer will offer a settlement. Your client decides, not you. Advise her well." },
      { who: "you", text: "The developer offers ₦2 million to drop the case." },
    ],
    choices: [
      { label: "Advise her to fight for her land in court", result: "It's risky, but she agrees. You prepare like your life depends on it.", fx: { skill: { charisma: 0.3 }, rep: 2, flag: "fought_case" }, chance: { odds: 0.6, win: "Judgment day: the court rules the demolition unlawful and orders compensation. Iya Basira dances on the courthouse steps.", winFx: { rep: 8, flag: ["fought_case", "won_basira"], skill: { charisma: 0.3 } } } },
      { label: "Negotiate a better settlement", result: "You push the developer to ₦5 million and a new shop. Iya Basira accepts and thanks you with tears.", fx: { rep: 4, skill: { hustle: 0.3 }, flag: "settled_case" } },
    ],
    reward: { money: 25_000, xp: 480, bond: { funke: 8 } },
  },
  {
    id: "c6-tech-2", ch: 6, route: "tech", emoji: "📲", title: "Users love it", place: "hub", cast: ["ify", "halima"],
    intro: "Your app has 20,000 users. Your phone buzzes all day with feature requests, bug reports and messages that say \"this changed my life\". Your bank account doesn't agree yet.",
    goal: "Reach reputation 30 and present at two meetups.",
    tasks: [{ rep: 30 }, { do: "meetup", n: 2 }],
    lines: [
      { who: "halima", text: "Twenty thousand users is real. Now show me twenty thousand people who would be angry if it disappeared." },
      { who: "ify", text: "Talk to your users every week. Not surveys. Real conversations." },
      { who: "you", text: "How do I make money without making users hate me?" },
    ],
    choices: [
      { label: "A premium version with extra features", result: "Five percent of users upgrade. That's a thousand people paying every month.", fx: { money: 40_000, flag: "premium" } },
      { label: "Sell aggregated insights to businesses, never personal data", result: "Shops and transport companies pay for trends, not names. Your users' privacy stays intact.", fx: { money: 30_000, rep: 3, flag: "data_ethical" } },
    ],
    reward: { money: 25_000, xp: 480 },
  },
  {
    id: "c6-ent-2", ch: 6, route: "ent", emoji: "🎭", title: "Nollywood audition", place: "home", cast: ["kola"],
    intro: "A Nollywood director saw your video and wants you to audition for a supporting role in a new film. The script arrives tonight. The audition is in three days.",
    goal: "Own a mirror, practise speeches twice and reach Charisma level 5.",
    tasks: [{ item: "mirror" }, { do: "practise-speech", n: 2 }, { skill: "charisma", min: 5 }],
    lines: [
      { who: "kola", text: "Music and film are cousins. Same family, different manners. On set, you wait twelve hours for two minutes of work." },
      { who: "you", text: "The director wants me to read for the villain." },
      { who: "kola", if: "actor", text: "You've always been good at characters. This is your moment." },
    ],
    choices: [
      { label: "Play the villain with full commitment", result: "You're so convincing that the director gets goosebumps. Audiences will love to hate you.", fx: { skill: { charisma: 0.4 }, rep: 3, flag: "villain_role" } },
      { label: "Ask to read for the hero instead", result: "Bold. The director lets you. You don't get the hero, but you get a better supporting role.", fx: { skill: { charisma: 0.3 }, flag: "hero_role" } },
    ],
    reward: { money: 30_000, xp: 480 },
  },

  {
    id: "c6-jide", ch: 6, emoji: "🎩", title: "Uncle Jide's loan", place: "family", cast: ["jide", "mummy"],
    intro: "Uncle Jide arrives at your door in his best agbada. He has a \"once-in-a-lifetime business opportunity\" and needs ₦100,000. He'll pay back double. Mummy calls ten minutes later.",
    goal: "Have at least ₦100,000 and decide.",
    tasks: [{ money: 100_000 }],
    lines: [
      { who: "jide", text: "Generators! Big ones! Everybody needs light. I buy ten, I rent them to parties. Double your money in six months!" },
      { who: "mummy", text: "He's my brother and I love him. But he has had many once-in-a-lifetime opportunities." },
      { who: "you", text: "Uncle, have you done the numbers?" },
    ],
    choices: [
      { label: "Lend him the ₦100,000", result: "He hugs you so hard your back cracks. \"You won't regret it!\" You hope he's right.", fx: { cost: 100_000, flag: "lent_jide", bond: { mummy: 3 } } },
      { label: "Give him ₦20,000 as a gift, not a loan", result: "He's disappointed, then touched. \"A gift. You are your mother's child.\"", fx: { cost: 20_000, bond: { mummy: 6 }, flag: "gift_jide" } },
      { label: "Help him write a business plan first", result: "Halfway through the plan, he realises generators need fuel, repairs and drivers. He rethinks.", fx: { skill: { hustle: 0.3 }, flag: "planned_jide" } },
    ],
    reward: { money: 15_000, xp: 420 },
  },

  // ----- routes, part 3 -----
  {
    id: "c6-biz-3", ch: 6, route: "biz", emoji: "🎪", title: "Chief's test", place: "pavilion", cast: ["bisola"],
    intro: "Chief Bisola recommends you to supply drinks and food for a 600-guest wedding at Royal Pavilion. It's a test. If you deliver, big contracts follow. If you fail, everyone will know.",
    goal: "Go to Royal Pavilion and get your businesses to 4 levels in total, within 4 days.",
    tasks: [{ do: "attend-event|usher" }, { bizLevel: 4 }],
    deadline: 4,
    fail: { text: "The wedding planner had to find another supplier at the last minute. Chief Bisola is disappointed. You'll get another chance, but people talk.", rep: -5 },
    lines: [
      { who: "bisola", text: "Six hundred guests. Every one of them could become a customer, or a critic. Deliver." },
      { who: "you", text: "Everything arrives on time. The couple's mother sends you a thank-you voice note at midnight." },
    ],
    choices: [
      { label: "Hire extra staff to make sure nothing goes wrong", result: "It costs more, but service is flawless. Three guests ask for your number.", fx: { cost: 20_000, rep: 6, flag: "event_supplier" } },
      { label: "Do it lean and keep the profit", result: "Tight, stressful, profitable. One cooler runs out of ice, but nobody complains much.", fx: { money: 40_000, rep: 2 } },
    ],
    reward: { money: 40_000, xp: 500, rep: 2 },
  },
  {
    id: "c6-med-3", ch: 6, route: "med", emoji: "🦠", title: "Outbreak", place: "hospital", cast: ["ngozi", "landlord"],
    intro: "After the floods, cholera cases appear in several communities. Mainland General is overwhelmed. Dr Ngozi is organising teams for the wards and for outreach.",
    goal: "Within 5 days: work three shifts and volunteer twice at the clinic.",
    tasks: [{ count: "work", n: 3 }, { do: "volunteer", n: 2 }],
    deadline: 5,
    fail: { text: "The outbreak peaks without you on the team. Dr Ngozi doesn't say anything, which is worse. You go back to help.", rep: -4 },
    lines: [
      { who: "ngozi", text: "Oral rehydration, clean water, and fast treatment. Most deaths from cholera are preventable. Most." },
      { who: "landlord", text: "Doctor, my tenants are sick! The water from the well smells funny." },
      { who: "you", text: "The well is the source. We need to tell the whole street." },
    ],
    choices: [
      { label: "Lead the community outreach team", result: "You go door to door with nurses and chlorine tablets. New cases in your area drop to zero in a week.", fx: { rep: 7, bond: { landlord: 10 }, flag: "outbreak_outreach" } },
      { label: "Stay on the wards treating the sickest patients", result: "Twelve-hour shifts, drips, monitoring. Every patient on your ward goes home.", fx: { rep: 4, skill: { study: 0.4 }, flag: "outbreak_ward" } },
    ],
    reward: { money: 30_000, xp: 520 },
  },
  {
    id: "c6-law-3", ch: 6, route: "law", emoji: "🏠", title: "The tenancy case", place: "chambers", cast: ["emeka", "landlord"],
    intro: "A tenants' association hires the firm: forty families face eviction without notice so a developer can build luxury flats. Barrister Emeka gives you the case to lead. The hearing is in five days.",
    goal: "Within 5 days: reach Charisma level 4 and help at the legal clinic twice.",
    tasks: [{ skill: "charisma", min: 4 }, { do: "legal-clinic", n: 2 }],
    deadline: 5,
    fail: { text: "You ask for an adjournment because you're not ready. The judge grants it, unhappily. The families' faces stay with you.", rep: -4 },
    lines: [
      { who: "emeka", text: "Remember the family next door, all those years ago? This is the same fight, bigger." },
      { who: "landlord", text: "I'm a landlord, but even I know this is wrong. I'll testify if you need me." },
      { who: "you", text: "My lord, the law requires proper notice. These families received none." },
    ],
    choices: [
      { label: "Call Baba Landlord as a witness", result: "A landlord defending tenants surprises everyone, including the judge. The eviction is stopped.", fx: { rep: 6, bond: { landlord: 12 }, flag: "tenancy_win" } },
      { label: "Rely on the documents alone", result: "Clean, technical, airtight. The judge rules in your favour and praises your preparation.", fx: { rep: 5, skill: { study: 0.3 }, flag: "tenancy_win" } },
    ],
    reward: { money: 30_000, xp: 520 },
  },
  {
    id: "c6-tech-3", ch: 6, route: "tech", emoji: "🔐", title: "Breach scare", place: "hub", cast: ["ify"],
    intro: "3 a.m. An alert: someone may have accessed part of your app's database. You don't know yet how much they saw. Your users trust you with their information.",
    goal: "Reach Study level 7.5 and work two shifts.",
    tasks: [{ skill: "study", min: 7.5 }, { count: "work", n: 2 }],
    lines: [
      { who: "ify", text: "First, stop the leak. Then find out what happened. Then tell people the truth. In that order, quickly." },
      { who: "you", text: "Some email addresses were exposed. No passwords, no payment data." },
      { who: "ify", text: "Under Nigeria's data protection law you may need to notify the regulator. And your users deserve to know either way." },
    ],
    choices: [
      { label: "Tell your users and the regulator immediately", result: "Some users leave. Most stay and thank you for being honest. Tech journalists praise how you handled it.", fx: { rep: 6, flag: "disclosed_breach" } },
      { label: "Fix it quietly and say nothing", result: "Nobody finds out. Yet. You check the news nervously for weeks.", fx: { rep: -2, flag: "hid_breach" } },
    ],
    reward: { money: 30_000, xp: 520 },
  },
  {
    id: "c6-ent-3", ch: 6, route: "ent", emoji: "🥤", title: "Brand deal", place: "tower", cast: ["kola", "damola"],
    intro: "Brands are calling. A betting company offers ₦500,000 for a year of posts. A soft drink, Zesto, offers ₦200,000. A small Lagos fashion label offers clothes and ₦50,000.",
    goal: "Reach reputation 35.",
    tasks: [{ rep: 35 }],
    lines: [
      { who: "kola", text: "Your face sells whatever you put next to it. Choose things you'd be proud to explain to a ten-year-old fan." },
      { who: "damola", text: "Betting money is the best money! Take it! Everybody is doing it." },
      { who: "you", text: "Half my fans are teenagers." },
    ],
    choices: [
      { label: "Take the Zesto soft drink deal", result: "Fun ads, family-friendly, good money. Your face on danfos all over Lagos.", fx: { money: 200_000, rep: 3, flag: "zesto" } },
      { label: "Support the small Lagos fashion label", result: "Less money, but their clothes look amazing on you, and their sales triple. Loyalty for life.", fx: { money: 50_000, rep: 5, flag: "local_brand" } },
      { label: "Take the betting company's money", result: "Half a million naira. Some parents write angry messages. You tell yourself it's just business.", fx: { money: 500_000, rep: -5, flag: "betting_deal" } },
    ],
    reward: { money: 20_000, xp: 500 },
  },

  {
    id: "c6-kunle", ch: 6, emoji: "💼", title: "Kunle's internship", place: "phone", cast: ["kunle"],
    intro: "Kunle needs a six-month internship placement for his degree. His classmates all have \"connections\". He doesn't want to ask you, so he asks Mummy to ask you.",
    goal: "Reach reputation 30 and get close to Kunle.",
    tasks: [{ rep: 30 }, { bond: "kunle", min: 60 }],
    lines: [
      { who: "kunle", text: "I don't want to be the cousin who got in because of family. But I don't have anybody else." },
      { who: "kunle", if: "kunle_hustle", text: "My snack business is still running, by the way. I have two workers now." },
      { who: "you", text: "Let me make some calls." },
    ],
    choices: [
      { label: "Get him a place where you work", result: "He works harder than anyone to prove he deserves it. Your boss calls him \"the serious one\".", fx: { bond: { kunle: 10 }, flag: "kunle_with_you" } },
      { label: "Introduce him, then let him interview like anyone else", result: "He gets the place on his own merit and tells everyone he did it himself, which is true.", fx: { bond: { kunle: 8 }, rep: 2, flag: "kunle_earned" } },
    ],
    reward: { money: 15_000, xp: 420 },
  },

  // ----- routes, part 4 -----
  {
    id: "c6-biz-4", ch: 6, route: "biz", emoji: "⬆️", title: "Growing up", place: "phone", cast: ["bisola"],
    intro: "Your businesses are healthy, but small. Upgrades, more staff and better locations would double their takings. It means spending now to earn later.",
    goal: "Get your businesses to 6 levels in total.",
    tasks: [{ bizLevel: 6 }],
    lines: [
      { who: "bisola", text: "Grow what's working. Close what isn't. Never be sentimental about a business that loses money." },
      { who: "you", text: "One of my businesses has lost money three months in a row." },
    ],
    choices: [
      { label: "Close the weak business and focus", result: "It hurts. Then your other businesses grow faster with your full attention.", fx: { skill: { hustle: 0.4 }, flag: "focused" } },
      { label: "Give it one more chance with a new manager", result: "The new manager finds the problem in a week: a staff member was stealing stock. Fixed.", fx: { skill: { charisma: 0.3 }, rep: 2 } },
    ],
    reward: { money: 40_000, xp: 500 },
  },
  {
    id: "c6-med-4", ch: 6, route: "med", emoji: "🥼", title: "Resident doctor", place: "hospital", cast: ["ngozi"],
    intro: "Residency: four to six years of specialist training. You're a doctor, a student and a teacher all at once, and the hospital depends on you.",
    goal: "Get promoted to Resident doctor.",
    tasks: [{ career: "med", level: 2 }],
    lines: [
      { who: "ngozi", text: "Now you teach the house officers what I taught you. That's how medicine survives." },
      { who: "you", text: "A house officer asked me a question at 3 a.m. and I knew the answer. I felt like a real doctor." },
    ],
    choices: [
      { label: "Run a weekly teaching session for house officers", result: "Twenty young doctors every Thursday. They call it \"the session that saves lives\".", fx: { rep: 5, flag: "teacher" } },
      { label: "Join a research project on malaria", result: "Data, papers and late nights. Your name will be on a published study.", fx: { skill: { study: 0.5 }, flag: "researcher" } },
    ],
    reward: { money: 35_000, xp: 520 },
  },
  {
    id: "c6-law-4", ch: 6, route: "law", emoji: "📈", title: "Associate", place: "chambers", cast: ["emeka"],
    intro: "After the tenancy case, Barrister Emeka wants you handling your own files. Promotion to associate means your own clients, your own court appearances and your own mistakes.",
    goal: "Get promoted to Associate in Law.",
    tasks: [{ career: "law", level: 1 }],
    lines: [
      { who: "emeka", text: "Associate. Your name will be on documents now. Make sure you can defend every word." },
      { who: "you", text: "A big company wants me to represent them against a small trader. They pay well." },
    ],
    choices: [
      { label: "Take the case, but insist on a fair settlement offer first", result: "The trader gets a fair deal, the company avoids a long fight, and both respect you.", fx: { rep: 4, skill: { charisma: 0.3 }, flag: "fair_lawyer" } },
      { label: "Decline: you don't want to fight small traders", result: "You lose a fee, but Barrister Emeka quietly sends you a better case a week later.", fx: { rep: 3, flag: "principled" } },
    ],
    reward: { money: 35_000, xp: 520 },
  },
  {
    id: "c6-tech-4", ch: 6, route: "tech", emoji: "🤝🏾", title: "Meeting Halima", place: "tower", cast: ["halima", "ify"],
    intro: "Halima Yusuf invites you to Lagoon Ventures' offices on the 22nd floor of Marina Point Tower. The view is incredible. The questions are harder.",
    goal: "Pitch to investors and network at the lobby café.",
    tasks: [{ do: "pitch-deck" }, { do: "tower-network" }],
    lines: [
      { who: "halima", text: "Who are your competitors? Why will you win? What happens if a big bank copies you tomorrow?" },
      { who: "you", if: "disclosed_breach", text: "She mentions the breach. \"I read how you handled it. That's why you're in this room.\"" },
      { who: "ify", text: "Don't pretend to know things you don't. Investors can smell it from the lift." },
    ],
    choices: [
      { label: "Admit what you don't know and show your plan to learn", result: "Halima puts down her pen. \"Finally. An honest founder.\" She asks for your financials.", fx: { rep: 4, flag: "halima_trust" } },
      { label: "Present the biggest vision you can imagine", result: "\"Pan-African, ten million users, five years.\" She's interested, but sceptical.", fx: { skill: { charisma: 0.4 }, flag: "big_vision" } },
    ],
    reward: { money: 35_000, xp: 520 },
  },
  {
    id: "c6-ent-4", ch: 6, route: "ent", emoji: "💿", title: "Recording artist", place: "studio", cast: ["kola"],
    intro: "Afrowave is ready to put serious money into your first full project: an album or a big film role, with real promotion behind it. K-Wave says it's time.",
    goal: "Get promoted to Recording artist.",
    tasks: [{ career: "ent", level: 2 }],
    lines: [
      { who: "kola", text: "Recording artist. You're not a viral clip anymore. You're a body of work." },
      { who: "you", text: "What should the album be about?" },
      { who: "kola", text: "Whatever keeps you awake at night." },
    ],
    choices: [
      { label: "An album about Lagos: the hustle, the love, the go-slow", result: "You call it 'Eko Diaries'. Every track is a street you've walked.", fx: { rep: 4, flag: "eko_diaries" } },
      { label: "An album about family and home", result: "You call it 'Abeokuta to Mushin'. Mummy cries at the first track.", fx: { bond: { mummy: 10 }, flag: "family_album" } },
    ],
    reward: { money: 40_000, xp: 520 },
  },

  {
    id: "c6-japa", ch: 6, emoji: "✈️", title: "The japa question", place: "phone", cast: ["chiamaka", "ify"],
    intro: "Chiamaka has a job offer abroad. So do half your old classmates. Every week another farewell party. \"Come with me,\" she says. \"There's work for people like us everywhere.\"",
    goal: "Call two friends and think it through.",
    tasks: [{ count: "call", n: 2 }],
    lines: [
      { who: "chiamaka", text: "Constant light, safe roads, salaries that don't melt. I love Lagos, but I'm tired." },
      { who: "ify", text: "I had offers too. I stayed. Somebody has to build here, and the problems are where the opportunities are." },
      { who: "you", text: "What do I want?" },
    ],
    choices: [
      { label: "Stay and build in Lagos", result: "You hug Chiamaka at the airport. \"Come back and visit,\" you say. \"I'll be here, building.\"", fx: { rep: 3, flag: "stayed" } },
      { label: "Start a japa plan, just in case", result: "You check what the ✈️ Goals tab needs. A backup plan helps you sleep. You don't have to use it.", fx: { skill: { study: 0.3 }, flag: "japa_plan" } },
      { label: "Help Chiamaka prepare and promise to stay in touch", result: "You help her pack and drive her to the airport. Video calls every Sunday, at least at first.", fx: { flag: "chiamaka_abroad" } },
    ],
    reward: { money: 15_000, xp: 420 },
  },
  {
    id: "c6-worth", ch: 6, emoji: "💎", title: "Half a million", place: "phone", cast: ["femi", "mummy"],
    intro: "Baba Femi asks you to count everything you own: cash, investments, businesses, furniture. \"Not to boast,\" he says. \"To know.\"",
    goal: "Reach a net worth of ₦500,000.",
    tasks: [{ worth: 500_000 }],
    lines: [
      { who: "femi", text: "Half a million. When you came, you had ten thousand naira and a bag. Do you see how far you've walked?" },
      { who: "mummy", text: "I tell everybody at church. Not the amount, I'm not foolish. Just that my child is doing well." },
      { who: "you", text: "It doesn't feel like much in Lagos money." },
      { who: "femi", text: "It's not the money. It's the person who can make it again if they lose it." },
    ],
    choices: [
      { label: "Invest a chunk for the long term", result: "Into the funds it goes, and you promise not to touch it for years.", fx: { skill: { hustle: 0.3 }, flag: "long_term" } },
      { label: "Pay for Kunle's final-year fees", result: "Kunle stares at the receipt for a long time. \"I'll pay it forward,\" he says.", fx: { cost: 50_000, bond: { kunle: 15, mummy: 8 }, flag: "paid_final_fees" } },
      { label: "Buy yourself something nice, finally", result: "A good watch, or good shoes, or a good mattress. You deserve one nice thing.", fx: { cost: 30_000, mood: "payday" } },
    ],
    reward: { money: 30_000, xp: 500, rep: 3 },
  },
];
