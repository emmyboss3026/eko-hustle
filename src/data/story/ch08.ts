// Chapter 8 — Making Your Mark (missions 71–80). Lead people, own property, shape your street.

import type { StoryMission } from "./types";

export const ch08: StoryMission[] = [
  {
    id: "c8-property", ch: 8, emoji: "🌇", title: "A place of your own", place: "residences", cast: ["tobi", "landlord"],
    intro: "Tobi shows you Ocean Crest Residences on the Island: a pool, a view of the lagoon, and generators that never stop. Rent is serious money. Buying property to rent out is even more serious.",
    goal: "Reach a net worth of ₦1,500,000.",
    tasks: [{ worth: 1_500_000 }],
    lines: [
      { who: "tobi", text: "I designed the balconies on the tenth floor. Look at that light!" },
      { who: "landlord", text: "So you're leaving my compound? After all these years? ...I'm proud of you. Don't tell anyone I said that." },
      { who: "you", text: "Live in luxury, or let my money work in property?" },
    ],
    choices: [
      { label: "Rent a flat at Ocean Crest (₦300,000)", result: "A pool, a view, constant light. You keep your old room in Mushin too, for old times' sake.", fx: { cost: 300_000, flag: ["penthouse", "property"], mood: "beachDay" } },
      { label: "Buy flats to rent out instead", result: "You'll live simply and let property pay you. The 🏘️ rental flats are now in your Business app.", fx: { skill: { hustle: 0.4 }, flag: "property" } },
    ],
    reward: { money: 50_000, xp: 650, rep: 3 },
  },

  // ----- routes, part 1 -----
  {
    id: "c8-biz-1", ch: 8, route: "biz", emoji: "🤝🏾", title: "Cole's offer", place: "tower", cast: ["bisola", "halima"],
    intro: "Chief Bisola's office on the 18th floor. She wants to step back. Her logistics arm needs a younger partner to run it: trucks, warehouses, contracts across Lagos.",
    goal: "Network at Marina Point Tower and reach reputation 55.",
    tasks: [{ do: "tower-network" }, { rep: 55 }],
    lines: [
      { who: "bisola", text: "I've watched you for years. You kept your scales honest, even when it cost you. That's why I'm offering you this." },
      { who: "halima", text: "Lagoon Ventures will co-invest if you lead it. Logistics is the backbone of this city." },
      { who: "you", if: "recalled", text: "She mentions the oil recall. \"You lost money to protect strangers. I remember.\"" },
    ],
    choices: [
      { label: "Accept: buy in as a partner", result: "You sign. The 🚚 logistics company is now in your Business app, waiting for you to take the wheel.", fx: { flag: "cole_partner", rep: 5 } },
      { label: "Accept, with Halima's investors backing you", result: "More capital, more board meetings. The 🚚 logistics company is yours to run.", fx: { money: 500_000, flag: ["cole_partner", "halima_backed"] } },
    ],
    reward: { money: 80_000, xp: 680 },
  },
  {
    id: "c8-med-1", ch: 8, route: "med", emoji: "👩🏾‍⚕️", title: "Consultant", place: "hospital", cast: ["ngozi"],
    intro: "With your fellowship complete, Mainland General offers you a consultant post. Your own team, your own clinics, and the final say on difficult cases.",
    goal: "Get promoted to Consultant.",
    tasks: [{ career: "med", level: 3 }],
    lines: [
      { who: "ngozi", text: "Consultant. We're colleagues now. Equals. That will take me a while to get used to." },
      { who: "you", text: "My first ward round as a consultant. The house officers are terrified of me." },
      { who: "ngozi", text: "Be the consultant you needed when you were terrified." },
    ],
    choices: [
      { label: "Ban humiliating juniors on your ward rounds", result: "Questions without shame, mistakes as lessons. Juniors fight to be on your team.", fx: { rep: 6, flag: "kind_consultant" } },
      { label: "Set the highest standards in the hospital", result: "Your team is the best-prepared in the building. Strict, fair, excellent.", fx: { skill: { study: 0.4 }, flag: "strict_consultant" } },
    ],
    reward: { money: 80_000, xp: 680 },
  },
  {
    id: "c8-law-1", ch: 8, route: "law", emoji: "🗝️", title: "The partnership offer", place: "chambers", cast: ["emeka"],
    intro: "Barrister Emeka invites you to dinner with the other partners of Nwosu & Partners. Over pepper soup they make an offer: partnership, if you'll commit to the firm.",
    goal: "Be a Senior associate and reach reputation 55.",
    tasks: [{ career: "law", level: 2 }, { rep: 55 }],
    lines: [
      { who: "emeka", text: "A partner owns part of the firm's future, and part of its mistakes. It's not a promotion. It's a marriage." },
      { who: "you", if: "reported_bribe", text: "One partner mentions the envelope I reported. \"That's the kind of name we want on our door.\"" },
    ],
    choices: [
      { label: "Accept the partnership", result: "Your name will go up on the brass plate. You can be promoted to Partner now.", fx: { flag: "partner", rep: 4 } },
      { label: "Accept, but ask for a pro bono department", result: "They agree, after some grumbling. Your partnership comes with a free legal clinic every week.", fx: { flag: ["partner", "probono_dept"], rep: 6 } },
    ],
    reward: { money: 80_000, xp: 680 },
  },
  {
    id: "c8-tech-1", ch: 8, route: "tech", emoji: "🎯", title: "Product–market fit", place: "phone", cast: ["halima", "ify"],
    intro: "The moment every startup waits for: users are telling friends, revenue grows every week, and you can't hire fast enough. Time to upgrade the company.",
    goal: "Get your startup to level 2.",
    tasks: [{ bizId: "startup", level: 2 }],
    lines: [
      { who: "halima", text: "This is what product–market fit looks like. Don't celebrate too long. Competitors are watching." },
      { who: "ify", text: "Remember the girl with the borrowed laptop at Brainbox? I'm so proud I could cry. I won't, but I could." },
    ],
    choices: [
      { label: "Give every employee shares in the company", result: "Everyone becomes an owner. Nobody leaves for a competitor. Ever.", fx: { rep: 5, flag: "employee_shares" } },
      { label: "Reinvest everything in growth", result: "New features, new markets, new servers. Growth doubles again.", fx: { skill: { hustle: 0.4 }, flag: "growth_mode" } },
    ],
    reward: { money: 100_000, xp: 680 },
  },
  {
    id: "c8-ent-1", ch: 8, route: "ent", emoji: "💿", title: "Your own label", place: "studio", cast: ["kola"],
    intro: "K-Wave has a proposal: start your own label together. Find young artists from neighbourhoods like Mushin, give them fair contracts, and own the music.",
    goal: "Reach a net worth of ₦1,500,000 and reputation 60.",
    tasks: [{ worth: 1_500_000 }, { rep: 60 }],
    lines: [
      { who: "kola", text: "We've seen bad contracts ruin good artists. Let's be the label we wished existed." },
      { who: "you", if: "free_my_music", text: "After what happened with my old label, every contract we sign will be one I'd sign myself." },
    ],
    choices: [
      { label: "Start the label with K-Wave as partner", result: "You call it 'Mushin Gold Records'. The 💿 label is now in your Business app.", fx: { flag: "own_label", rep: 4 } },
      { label: "Start it alone, with K-Wave as head producer", result: "Your name, your rules. The 💿 label is now in your Business app.", fx: { flag: "own_label", skill: { hustle: 0.3 } } },
    ],
    reward: { money: 80_000, xp: 680 },
  },

  {
    id: "c8-jide", ch: 8, if: "lent_jide", emoji: "🎩", title: "Uncle Jide pays back", place: "family", cast: ["jide", "mummy"],
    intro: "Uncle Jide calls a family meeting. He stands up in his best agbada, clears his throat, and announces that he has news about the generator business.",
    goal: "Visit the family house for Sunday lunch.",
    tasks: [{ do: "family-lunch" }],
    lines: [
      { who: "jide", text: "My people! Many of you laughed at my generator business. Some of you are still laughing. Please stop." },
      { who: "mummy", text: "Brother, just tell us. Did it work?" },
    ],
    choices: [
      { label: "Ask him gently how the business went", result: "Some months good, some bad. He hands you an envelope with ₦60,000. \"The rest is coming, I swear on my agbada.\"", fx: { money: 60_000, bond: { mummy: 5 } }, chance: { odds: 0.4, win: "\"It worked!\" He hands you ₦200,000: double, as promised. The whole family is speechless.", winFx: { money: 200_000, bond: { mummy: 8 }, flag: "jide_success" } } },
      { label: "Tell him to keep it and invest in the business", result: "He's so moved he forgets his speech. The business grows, and so does his respect for you.", fx: { rep: 4, bond: { mummy: 10 }, flag: "jide_investor" } },
    ],
    reward: { money: 30_000, xp: 620 },
  },
  {
    id: "c8-jide-b", ch: 8, unless: "lent_jide", emoji: "🎉", title: "Uncle Jide's sixtieth", place: "family", cast: ["jide", "mummy"],
    intro: "Uncle Jide is turning sixty and planning the biggest owambe Mushin has seen. Live band, three kinds of jollof, and aso-ebi in gold.",
    goal: "Visit the family house and accept an invitation.",
    tasks: [{ do: "family-lunch" }, { count: "invite", n: 1 }],
    lines: [
      { who: "jide", text: "Sixty years! And still the best dancer in this family. Don't argue." },
      { who: "mummy", text: "He's been practising his dance moves for three weeks. Please, clap loudly." },
    ],
    choices: [
      { label: "Pay for the live band (₦50,000)", result: "The band plays until 2 a.m. Uncle Jide dances like he's twenty. He'll talk about it until he's eighty.", fx: { cost: 50_000, bond: { mummy: 10 }, rep: 4 } },
      { label: "Give a speech about what he taught you", result: "Funny, true and a little emotional. Uncle Jide cries into his gold aso-ebi.", fx: { bond: { mummy: 8 }, skill: { charisma: 0.3 } } },
    ],
    reward: { money: 30_000, xp: 620 },
  },

  // ----- routes, part 2 -----
  {
    id: "c8-biz-2", ch: 8, route: "biz", emoji: "🚚", title: "Trucks with your name", place: "phone", cast: ["bisola"],
    intro: "The logistics company is yours to run. Forty drivers, twelve trucks, three warehouses, and a contract to deliver for half the supermarkets in Lagos.",
    goal: "Own the logistics company.",
    tasks: [{ bizId: "logistics" }],
    lines: [
      { who: "bisola", text: "The first time you see your name on a truck, take a photo. Then go back to work." },
      { who: "you", text: "A truck with my name just drove past Oja Tuntun. Aunty Funke screamed." },
    ],
    choices: [
      { label: "Invest in driver safety and fair pay", result: "Fewer accidents, fewer resignations, better deliveries. The best drivers in Lagos want to work for you.", fx: { cost: 100_000, rep: 6, flag: "safe_fleet" } },
      { label: "Invest in tracking technology", result: "Every truck on a map, every delivery on time. Customers love it.", fx: { cost: 100_000, skill: { study: 0.3 }, flag: "tracked_fleet" } },
    ],
    reward: { money: 150_000, xp: 700 },
  },
  {
    id: "c8-med-2", ch: 8, route: "med", emoji: "🩹", title: "Free clinic Saturdays", place: "hospital", cast: ["ngozi", "landlord"],
    intro: "Many people in Mushin never see a doctor until it's an emergency. You want to change that with a free clinic, one Saturday a month, in the community hall.",
    goal: "Volunteer at the clinic three times and reach reputation 60.",
    tasks: [{ do: "volunteer", n: 3 }, { rep: 60 }],
    lines: [
      { who: "landlord", text: "Use my compound! I'll provide chairs and the generator. Doctor, I'm very proud to say I knew you when you were broke." },
      { who: "ngozi", text: "Prevention is cheaper than cure, and kinder. I'll bring two residents." },
    ],
    choices: [
      { label: "Focus on blood pressure and diabetes checks", result: "Hundreds screened. Dozens referred early. Some lives saved quietly, before anyone knew they were in danger.", fx: { rep: 7, flag: "screening_clinic" } },
      { label: "Focus on mothers and children", result: "Vaccinations, check-ups, nutrition advice. Mothers bring their babies every month.", fx: { rep: 7, flag: "maternal_clinic" } },
    ],
    reward: { money: 80_000, xp: 680 },
  },
  {
    id: "c8-law-2", ch: 8, route: "law", emoji: "🏅", title: "Partner", place: "chambers", cast: ["emeka"],
    intro: "Your name goes up on the brass plate at the entrance: Nwosu & Partners. You and Barrister Emeka unveil it together. He pretends to have dust in his eye.",
    goal: "Get promoted to Partner.",
    tasks: [{ career: "law", level: 3 }],
    lines: [
      { who: "emeka", text: "From the legal clinic, helping your neighbours with one letter, to this. Lagos is a strange and wonderful place." },
      { who: "you", text: "Thank you for every chance you gave me." },
      { who: "emeka", text: "You took them. That's the difference." },
    ],
    choices: [
      { label: "Hire three young lawyers from the legal clinic", result: "Fresh graduates who grew up in neighbourhoods like yours. They work twice as hard.", fx: { rep: 5, flag: "hired_clinic_lawyers" } },
      { label: "Bring in a big corporate client", result: "A bank signs on with the firm, thanks to you. Profits rise, and so does your influence.", fx: { money: 200_000, flag: "corporate_client" } },
    ],
    reward: { money: 100_000, xp: 700 },
  },
  {
    id: "c8-tech-2", ch: 8, route: "tech", emoji: "📊", title: "Series A", place: "tower", cast: ["halima"],
    intro: "Bigger investors want in. A Series A round could bring in serious money to expand across Lagos. Or you could stay lean and profitable.",
    goal: "Pitch to investors twice and reach reputation 60.",
    tasks: [{ do: "pitch-deck", n: 2 }, { rep: 60 }],
    lines: [
      { who: "halima", text: "Big money brings big expectations. Know what you'll do with it before you take it." },
      { who: "you", if: "bootstrapped", text: "We've been profitable without investors. Do we need them now?" },
    ],
    choices: [
      { label: "Raise the round and expand", result: "₦3 million for the company. New offices in Yaba and Ikeja, and fifty new jobs.", fx: { money: 3_000_000, flag: "series_a" } },
      { label: "Stay lean and grow from profits", result: "Slower, but you answer to nobody. Your team respects the discipline.", fx: { skill: { hustle: 0.5 }, flag: "lean" } },
    ],
    reward: { money: 100_000, xp: 700 },
  },
  {
    id: "c8-ent-2", ch: 8, route: "ent", emoji: "🌟", title: "Signing new talent", place: "phone", cast: ["kola"],
    intro: "The label is set up. Now it needs artists. K-Wave has found three: a teenage rapper from Ajegunle, a gospel singer from Yaba and a comedian who sells puff-puff in Mushin.",
    goal: "Own your record label.",
    tasks: [{ bizId: "label" }],
    lines: [
      { who: "kola", text: "Fair contracts. Real advances. Clear accounts. And we teach them the business side, so nobody ever cheats them." },
      { who: "you", text: "The comedian made me laugh so hard I signed him on the spot." },
    ],
    choices: [
      { label: "Give every artist ownership of their master recordings", result: "Unheard of in Lagos. Artists queue to sign with you. Other labels are not happy.", fx: { rep: 7, flag: "artist_owned_masters" } },
      { label: "Standard contracts, but with a business mentor for each artist", result: "Your artists learn contracts, money and branding. None of them will ever be cheated.", fx: { rep: 5, flag: "mentored_artists" } },
    ],
    reward: { money: 100_000, xp: 700 },
  },

  {
    id: "c8-mentor", ch: 8, emoji: "🌱", title: "Someone like you", place: "park", cast: ["femi"],
    intro: "A young woman named Ayo finds you at Unity Park. She arrived in Lagos last month with one bag and big dreams. She's heard your story. She wants to know how you did it.",
    goal: "Play draughts at the park and reach reputation 55.",
    tasks: [{ do: "draughts" }, { rep: 55 }],
    lines: [
      { who: "femi", text: "Do you remember? You sat right there, and I beat you in eleven moves." },
      { who: "you", text: "Ayo, the first thing: find people who'll tell you the truth. The second: keep your promises, even small ones." },
    ],
    choices: [
      { label: "Mentor her every month", result: "Coffee every first Saturday. A year later, she has a job, a plan and a mentee of her own.", fx: { rep: 5, flag: "mentor_ayo" } },
      { label: "Pay for her training course", result: "₦80,000 for a certification. She gets a job two months later and sends you her first payslip.", fx: { cost: 80_000, rep: 5, flag: "sponsored_ayo" } },
      { label: "Give her a job in your work", result: "She's sharp and hungry. In a year she's one of your best people.", fx: { rep: 4, skill: { charisma: 0.2 }, flag: "hired_ayo" } },
    ],
    reward: { money: 40_000, xp: 620 },
  },

  // ----- routes, part 3 -----
  {
    id: "c8-biz-3", ch: 8, route: "biz", emoji: "🧑🏾‍💼", title: "Managers, not workers", place: "phone", cast: ["bisola"],
    intro: "You spend all day answering questions your managers should answer. Chief Bisola calls it \"the founder's trap\". To grow, you have to let go.",
    goal: "Get your businesses to 10 levels in total.",
    tasks: [{ bizLevel: 10 }],
    lines: [
      { who: "bisola", text: "If you're the smartest person in every room, you've hired badly." },
      { who: "you", text: "I don't know how to stop checking everything." },
    ],
    choices: [
      { label: "Train a management team and step back", result: "A painful month, then magic: things run without you. You start thinking about the future instead of tomorrow.", fx: { skill: { charisma: 0.4 }, flag: "management_team" } },
      { label: "Keep control, but hire an operations director", result: "One trusted person runs the day-to-day. You still sign every cheque.", fx: { skill: { hustle: 0.3 }, flag: "ops_director" } },
    ],
    reward: { money: 150_000, xp: 700 },
  },
  {
    id: "c8-med-3", ch: 8, route: "med", emoji: "👨🏾‍🏫", title: "Teaching the next generation", place: "campus", cast: ["adewale", "ngozi"],
    intro: "Lagoon University's medical school asks you to lecture. The same hall where you once sat terrified in the dissection hall now waits for you at the front.",
    goal: "Give lectures twice and work three shifts.",
    tasks: [{ do: "lecture", n: 2 }, { count: "work", n: 3 }],
    lines: [
      { who: "adewale", text: "I remember you at my public lecture, years ago, asking about admission. Now look." },
      { who: "ngozi", text: "Teach them to be kind as well as clever. The clever ones without kindness are dangerous." },
    ],
    choices: [
      { label: "Teach with real stories from your own wards", result: "Students remember your lectures for years. One writes: \"You taught me patients are people.\"", fx: { rep: 6, flag: "story_teacher" } },
      { label: "Start a scholarship for students from poor homes", result: "₦200,000 a year for two students. The first two are from Mushin.", fx: { cost: 200_000, rep: 8, flag: "med_scholarship" } },
    ],
    reward: { money: 100_000, xp: 700 },
  },
  {
    id: "c8-law-3", ch: 8, route: "law", emoji: "🌊", title: "The landmark case", place: "court", cast: ["emeka", "landlord"],
    intro: "Whole streets of Mushin flood every year because a developer built over the drainage channel. The residents want justice. You file a public interest case. The hearing is in five days.",
    goal: "Within 5 days: reach Charisma level 7 and watch two court sessions.",
    tasks: [{ skill: "charisma", min: 7 }, { do: "watch-court", n: 2 }],
    deadline: 5,
    fail: { text: "You weren't ready, and the developer's lawyers won an adjournment. The rains are coming. Prepare harder and try again.", rep: -5 },
    lines: [
      { who: "landlord", text: "Every year my compound floods. Every year I lose something. My tenants lose more." },
      { who: "emeka", text: "This case will be cited for decades if you win it. No pressure." },
      { who: "you", text: "My lord, the right to a safe home cannot be built over." },
    ],
    choices: [
      { label: "Ask the court to order the drainage restored", result: "The court orders the developer to restore the channel at his own cost. The next rainy season, Mushin stays dry.", fx: { rep: 10, flag: "drainage_case" } },
      { label: "Push for compensation for every affected family", result: "Compensation is awarded to over two hundred families. The developer appeals, and loses.", fx: { rep: 9, flag: "compensation_case" } },
    ],
    reward: { money: 120_000, xp: 720 },
  },
  {
    id: "c8-tech-3", ch: 8, route: "tech", emoji: "💸", title: "The acquisition offer", place: "tower", cast: ["halima", "ify"],
    intro: "A huge international company offers to buy most of your startup. Enough money to never work again. You'd stay as CEO, but they'd have the final say on the product and your users' data.",
    goal: "Reach a net worth of ₦2,000,000.",
    tasks: [{ worth: 2_000_000 }],
    lines: [
      { who: "halima", text: "It's a good price. But you have to ask: what happens to what you built, and the people who built it with you?" },
      { who: "ify", text: "Some founders sell and start again. Some keep going. Neither is wrong." },
    ],
    choices: [
      { label: "Sell a majority stake and stay on as CEO", result: "₦5 million lands in your account and your team gets bonuses. You still run the company, but now you answer to a board in another country.", fx: { money: 5_000_000, flag: "sold_startup" } },
      { label: "Keep building it yourself", result: "You turn them down. Your team cheers. The real work continues.", fx: { rep: 6, flag: "kept_startup" } },
    ],
    reward: { money: 100_000, xp: 720 },
  },
  {
    id: "c8-ent-3", ch: 8, route: "ent", emoji: "🏆", title: "Award night", place: "pavilion", cast: ["kola", "mummy"],
    intro: "The Eko Music & Film Awards at Royal Pavilion. You're nominated in two categories. Mummy has a new gele so tall it blocks the view of three rows.",
    goal: "Become a Headliner and reach reputation 65.",
    tasks: [{ career: "ent", level: 3 }, { rep: 65 }],
    lines: [
      { who: "kola", text: "Win or lose, you're here. Remember the eleven views." },
      { who: "mummy", text: "If they call your name, don't cry on stage. Cry at home like a proper person." },
      { who: "you", text: "\"And the winner is...\"" },
    ],
    choices: [
      { label: "Dedicate the award to Mushin", result: "\"To every street that raised me.\" The clip is played on every TV station the next morning.", fx: { rep: 8, flag: "mushin_award" } },
      { label: "Thank your mother, by name, first", result: "Mummy stands up and waves at the cameras. The internet falls in love with her.", fx: { rep: 6, bond: { mummy: 15 }, flag: "mummy_famous" } },
    ],
    reward: { money: 150_000, xp: 720 },
  },

  {
    id: "c8-borehole", ch: 8, emoji: "💧", title: "Clean water", place: "mushin-street", cast: ["landlord", "femi"],
    intro: "The street's only water supply is a well that's contaminated in the rainy season. A proper borehole with a treatment system would serve five hundred people. It costs ₦300,000.",
    goal: "Pay for the borehole and join the street clean-up.",
    tasks: [{ pay: 300_000 }, { do: "community-clean" }],
    lines: [
      { who: "landlord", text: "When I was young, we fetched water from a stream. Now look: clean water from a tap, in Mushin." },
      { who: "femi", text: "You've given this street something it will use every single day. That's how you build a name that lasts." },
    ],
    choices: [
      { label: "Name it after Mummy", result: "A small plaque: \"Given in honour of my mother.\" She visits it every time she's in Lagos.", fx: { bond: { mummy: 12 }, rep: 5 } },
      { label: "Keep it anonymous", result: "Nobody knows who paid. Everybody suspects. That's somehow better.", fx: { rep: 6, flag: "anonymous_giver" } },
      { label: "Let a community committee run it", result: "Trained residents maintain it. Ten years later, it still works perfectly.", fx: { rep: 7, flag: "community_borehole" } },
    ],
    reward: { money: 40_000, xp: 650, rep: 4 },
  },

  // ----- routes, part 4 -----
  {
    id: "c8-biz-4", ch: 8, route: "biz", emoji: "🏛️", title: "The Chamber of Commerce", place: "tower", cast: ["bisola", "halima"],
    intro: "The Lagos business community invites you to speak at the Chamber of Commerce. Bankers, ministers, journalists. They want to hear how a market trader built a company.",
    goal: "Network at Marina Point Tower twice and reach reputation 65.",
    tasks: [{ do: "tower-network", n: 2 }, { rep: 65 }],
    lines: [
      { who: "bisola", text: "Tell them the truth. The boring parts especially. Everyone tells the exciting parts." },
      { who: "halima", text: "Three people in that room could change your business with one phone call. Make them remember you." },
    ],
    choices: [
      { label: "Speak about honest business in Lagos", result: "\"Keep your scales honest, even when nobody checks.\" The room gives you a standing ovation.", fx: { rep: 8, flag: "honest_speech" } },
      { label: "Speak about creating jobs for young people", result: "You announce an apprenticeship scheme for 50 young people. Three companies join on the spot.", fx: { rep: 8, flag: "apprenticeships" } },
    ],
    reward: { money: 150_000, xp: 720 },
  },
  {
    id: "c8-med-4", ch: 8, route: "med", emoji: "🏥", title: "Clinic plans", place: "hospital", cast: ["ngozi", "tobi"],
    intro: "Many neighbourhoods have no good clinic nearby. You start to dream of your own: modern, affordable, and open to everyone. Tobi offers to design the building.",
    goal: "Reach a net worth of ₦2,000,000.",
    tasks: [{ worth: 2_000_000 }],
    lines: [
      { who: "ngozi", text: "Running a hospital is different from working in one. You'll be a doctor, a manager and a fundraiser." },
      { who: "tobi", text: "Natural light, good ventilation, a garden for patients to sit in. Let me draw it." },
    ],
    choices: [
      { label: "Plan a clinic with a sliding scale for poor patients", result: "Rich patients pay full price, poorer ones pay less. The numbers are tight, but they work.", fx: { rep: 5, flag: "sliding_scale" } },
      { label: "Plan a modern clinic and fund charity separately", result: "Profitable, efficient, and a separate foundation pays for those who can't afford it.", fx: { skill: { hustle: 0.3 }, flag: "clinic_foundation" } },
    ],
    reward: { money: 120_000, xp: 720, flag: "clinic_ready" },
  },
  {
    id: "c8-law-4", ch: 8, route: "law", emoji: "🚪", title: "Your own chambers?", place: "chambers", cast: ["emeka"],
    intro: "Clients follow you now, not the firm. Some lawyers in your position start their own chambers. Barrister Emeka sees it coming before you say it.",
    goal: "Reach a net worth of ₦2,000,000.",
    tasks: [{ worth: 2_000_000 }],
    lines: [
      { who: "emeka", text: "If you leave, leave well. Take no client who doesn't want to come. Burn no bridges. Lagos is small." },
      { who: "you", text: "What if I stay and build something new inside the firm?" },
    ],
    choices: [
      { label: "Plan your own chambers, with Emeka's blessing", result: "He helps you find an office. \"The best student leaves the teacher. That's how it should be.\" The 🏛️ chambers are now in your Business app.", fx: { flag: "own_chambers", rep: 4 } },
      { label: "Stay, and open a new branch of the firm under your lead", result: "Nwosu & Partners, Ikeja branch. Your chambers, inside the family. The 🏛️ chambers are now in your Business app.", fx: { flag: "own_chambers", bond: { mummy: 3 } } },
    ],
    reward: { money: 120_000, xp: 720 },
  },
  {
    id: "c8-tech-4", ch: 8, route: "tech", emoji: "🌍", title: "Tech for good", place: "hospital", cast: ["ify", "ngozi"],
    intro: "Dr Ngozi from Mainland General calls Ify: the hospital loses patients' records every week. Paper files, lost folders, repeated tests. Ify calls you.",
    goal: "Visit the hospital as a volunteer and attend a tech meetup.",
    tasks: [{ do: "volunteer|visit-patient" }, { do: "meetup" }],
    lines: [
      { who: "ngozi", text: "If your team can build payment apps, can you build something that helps a nurse find a file at 3 a.m.?" },
      { who: "ify", text: "This is why some of us stayed in Lagos. Problems like this." },
    ],
    choices: [
      { label: "Build it for free and give it to public hospitals", result: "Six months later, three public hospitals use your system. Waiting times drop by half.", fx: { rep: 10, flag: "hospital_system" } },
      { label: "Build it at cost and train hospital staff", result: "Hospitals pay only what it costs you. Your team trains two hundred nurses and records officers.", fx: { rep: 7, skill: { charisma: 0.3 }, flag: "hospital_system" } },
    ],
    reward: { money: 120_000, xp: 720 },
  },
  {
    id: "c8-ent-4", ch: 8, route: "ent", emoji: "🎞️", title: "Producing a film", place: "studio", cast: ["kola", "tobi"],
    intro: "You want to tell Lagos stories on the big screen, your way. A script about a young woman arriving in Mushin with one bag has been sitting on your desk for months.",
    goal: "Pay for the production and shoot content twice.",
    tasks: [{ pay: 500_000 }, { do: "shoot-content", n: 2 }],
    lines: [
      { who: "kola", text: "Film is ten times the work of music and a hundred times the people. Hire well." },
      { who: "tobi", text: "I can design the sets! A Mushin room, an Island penthouse. I know both." },
    ],
    choices: [
      { label: "Cast unknown actors from Lagos neighbourhoods", result: "Raw, real, unforgettable. Critics call it \"the most honest Lagos film in years\".", fx: { rep: 8, flag: "indie_film" } },
      { label: "Cast big Nollywood stars for wide release", result: "It fills cinemas across Nigeria. Your investment comes back twice.", fx: { money: 800_000, flag: "blockbuster" } },
    ],
    reward: { money: 120_000, xp: 720 },
  },

  {
    id: "c8-tobi", ch: 8, if: "tobi_dating", emoji: "💍", title: "The introduction", place: "family", cast: ["tobi", "jide", "mummy"],
    intro: "Tobi and you have decided: it's time for the families to formally meet. A traditional introduction, with both families, gifts, and Uncle Jide as spokesman.",
    goal: "Pay for the gifts and have Sunday lunch with the family.",
    tasks: [{ pay: 150_000 }, { do: "family-lunch" }],
    lines: [
      { who: "jide", text: "We have come because we saw a beautiful flower in your compound..." },
      { who: "mummy", text: "Jide, they know why we're here. Just say it." },
      { who: "tobi", text: "I've never seen your Uncle so nervous. Or so happy." },
    ],
    choices: [
      { label: "A big celebration with both families", result: "Two families, one compound, and enough jollof to feed Mushin. Everyone dances. Even Tobi's father.", fx: { cost: 50_000, bond: { mummy: 15 }, rep: 4, flag: "introduced" } },
      { label: "Keep it small and meaningful", result: "Close family only, a long lunch, and real conversations. Tobi squeezes your hand under the table.", fx: { bond: { mummy: 12 }, flag: "introduced" } },
    ],
    reward: { money: 40_000, xp: 680 },
  },
  {
    id: "c8-tobi-b", ch: 8, unless: "tobi_dating", emoji: "💒", title: "Tobi's big day", place: "pavilion", cast: ["tobi", "jide"],
    intro: "Tobi is getting married, and has asked you to be the best friend in the wedding party. You'll give a speech at Royal Pavilion in front of four hundred guests.",
    goal: "Attend the event at Royal Pavilion and pay for your gift.",
    tasks: [{ do: "attend-event" }, { pay: 50_000 }],
    lines: [
      { who: "tobi", text: "You were the first person who listened to my building ideas without laughing. Of course you're in my wedding." },
      { who: "jide", text: "I came even though I wasn't invited. I'm family by now, surely." },
    ],
    choices: [
      { label: "Give a funny speech about the night you met", result: "Four hundred people laughing, then quiet when you get serious. Tobi cries. So does the photographer.", fx: { rep: 4, skill: { charisma: 0.3 }, flag: "best_friend" } },
      { label: "Surprise them with a donation in their names", result: "₦100,000 to an affordable housing charity, in their names. Tobi hugs you for a full minute.", fx: { cost: 100_000, rep: 5, flag: "best_friend" } },
    ],
    reward: { money: 40_000, xp: 680 },
  },
  {
    id: "c8-odogwu", ch: 8, emoji: "🦅", title: "Odogwu", place: "island-street", cast: ["femi", "tunde"],
    intro: "People on the street call you \"Odogwu\" now: the strong one, the one who made it. Tunde says it with pride. Baba Femi says it with a warning.",
    goal: "Reach reputation 60 and a net worth of ₦1,500,000.",
    tasks: [{ rep: 60 }, { worth: 1_500_000 }],
    lines: [
      { who: "tunde", text: "From WhatsApp hustle to this! I tell everybody I knew you first." },
      { who: "femi", text: "The higher the monkey climbs, the more people see its backside. Stay humble, Odogwu." },
    ],
    choices: [
      { label: "Throw a street party for everyone who helped", result: "Mama Ronke cooks, Tunde plays DJ, Baba Landlord gives a speech nobody asked for. Perfect.", fx: { cost: 100_000, rep: 6, bond: { ronke: 10, tunde: 10 } } },
      { label: "Quietly pay a year's school fees for ten street kids", result: "Ten families find their fees paid, and a note: \"From someone who was once where you are.\"", fx: { cost: 150_000, rep: 8, flag: "school_fees_ten" } },
    ],
    reward: { money: 60_000, xp: 680, rep: 3 },
  },
];
