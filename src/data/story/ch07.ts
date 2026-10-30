// Chapter 7 — The Price of Success (missions 61–70). Old shortcuts come back, rivals push,
// and some choices only you will ever know about.

import type { StoryMission } from "./types";

export const ch07: StoryMission[] = [
  {
    id: "c7-damola", ch: 7, if: "took_damola", emoji: "🚨", title: "The deal comes back", place: "island-street", cast: ["damola", "emeka"],
    intro: "Damola's \"small deal\" from years ago has surfaced. Investigators are asking questions, a blog has your name in the same sentence as his, and your phone won't stop ringing.",
    goal: "Get legal advice at the clinic and reach reputation 30.",
    tasks: [{ do: "legal-clinic|networking" }, { rep: 30 }],
    lines: [
      { who: "damola", text: "Don't panic. Say nothing. I know people. This will go away." },
      { who: "emeka", text: "Things like this don't go away. They go quiet, then they come back louder. Tell the truth, with a lawyer next to you." },
      { who: "you", text: "I took ₦20,000 and thought nobody would ever know." },
    ],
    choices: [
      { label: "Come clean, repay the money and cooperate", result: "It's humiliating for a week. Then people respect that you owned it. The investigators thank you.", fx: { cost: 50_000, rep: 5, flag: "came_clean", unflag: "took_damola" } },
      { label: "Stay silent and let Damola handle it", result: "It goes quiet. For now. But you notice some people no longer return your calls.", fx: { rep: -6, flag: "covered_up" } },
    ],
    reward: { money: 10_000, xp: 500 },
  },
  {
    id: "c7-damola-b", ch: 7, unless: "took_damola", emoji: "🕶️", title: "Damola needs a favour", place: "island-street", cast: ["damola"],
    intro: "Damola calls, his usual swagger gone. One of his schemes has collapsed, investors want their money back, and he needs someone respectable to vouch for him at a meeting.",
    goal: "Meet Damola at a networking mixer and reach reputation 30.",
    tasks: [{ do: "networking|tower-network" }, { rep: 30 }],
    lines: [
      { who: "damola", text: "You always said no to my deals. That's exactly why they'll believe you. Just say I'm a good guy." },
      { who: "you", text: "Are you a good guy, Damola?" },
      { who: "damola", text: "...I'm trying to be. Today, I'm trying." },
    ],
    choices: [
      { label: "Refuse to vouch, but offer to help him make an honest plan", result: "He's angry, then quiet. Two weeks later he sends a message: \"The plan is working. Thank you.\"", fx: { rep: 3, flag: "helped_damola_honest" } },
      { label: "Refuse and walk away for good", result: "You block his number. It feels like closing a window in a storm.", fx: { flag: "cut_damola" } },
    ],
    reward: { money: 10_000, xp: 500 },
  },

  // ----- routes, part 1 -----
  {
    id: "c7-biz-1", ch: 7, route: "biz", emoji: "📉", title: "The undercut", place: "market", cast: ["damola", "bisola"],
    intro: "QuickMart is back with investor money and prices below cost across all of Mushin. Your sales fall twenty percent in a week. Chief Bisola calls it a war of patience.",
    goal: "Get your businesses to 7 levels in total and hold on for two days.",
    tasks: [{ bizLevel: 7 }, { days: 2 }],
    lines: [
      { who: "bisola", text: "He's burning money to buy customers. Money burns fast. Loyalty burns slow. Who runs out first?" },
      { who: "you", if: "service_first", text: "My regulars are still coming. They say QuickMart's staff don't greet them." },
    ],
    choices: [
      { label: "Launch a loyalty scheme for regular customers", result: "A stamp card and a free bag of rice for every tenth visit. Your regulars stay, and bring friends.", fx: { cost: 20_000, rep: 4, flag: "loyalty" } },
      { label: "Wait it out and save cash", result: "Three months later, QuickMart runs out of investor money and closes two branches. You're still standing.", fx: { skill: { hustle: 0.4 }, flag: "outlasted" } },
    ],
    reward: { money: 50_000, xp: 550 },
  },
  {
    id: "c7-med-1", ch: 7, route: "med", emoji: "💊", title: "The fake drugs", place: "hospital", cast: ["ngozi"],
    intro: "Three patients on antimalarial drugs aren't getting better. You test the tablets. They contain almost no active ingredient. Someone is selling counterfeit medicine to the hospital pharmacy.",
    goal: "Work three shifts at the hospital.",
    tasks: [{ count: "work", n: 3 }],
    lines: [
      { who: "ngozi", text: "Fake medicine kills quietly. Patients think the disease won. It was the drug." },
      { who: "you", text: "The supplier is the hospital administrator's cousin." },
      { who: "ngozi", text: "Then this will be uncomfortable. Do it anyway." },
    ],
    choices: [
      { label: "Report it to the drug regulator (NAFDAC) with the evidence", result: "Officials raid the supplier's warehouse. The administrator stops greeting you. Patients start recovering.", fx: { rep: 7, flag: "reported_fakes" } },
      { label: "Raise it with the hospital board first", result: "The board quietly changes supplier. No scandal, no headlines, and the fake drugs end up in another hospital.", fx: { rep: 2, flag: "quiet_fix" } },
    ],
    reward: { money: 40_000, xp: 550 },
  },
  {
    id: "c7-law-1", ch: 7, route: "law", emoji: "💰", title: "The envelope", place: "chambers", cast: ["emeka"],
    intro: "Before a big hearing, a man you've never met leaves an envelope on your desk with ₦1 million inside and a note: \"Lose the file.\"",
    goal: "Work two shifts at the firm.",
    tasks: [{ count: "work", n: 2 }],
    lines: [
      { who: "emeka", text: "Every lawyer gets an envelope one day. What you do with the first one decides what kind of lawyer you'll be." },
      { who: "you", text: "My client trusts me. The envelope says I'm for sale." },
    ],
    choices: [
      { label: "Report it to the Bar Association and the court", result: "The man is identified. The opposing lawyer is disciplined. Barrister Emeka frames your report.", fx: { rep: 8, flag: "reported_bribe" } },
      { label: "Return it quietly and win the case", result: "You send the envelope back unopened. You win the case on the facts. Nobody ever knows.", fx: { rep: 3, skill: { charisma: 0.3 }, flag: "returned_bribe" } },
    ],
    reward: { money: 40_000, xp: 550 },
  },
  {
    id: "c7-tech-1", ch: 7, route: "tech", emoji: "📄", title: "The term sheet", place: "tower", cast: ["halima"],
    intro: "Lagoon Ventures offers ₦1.5 million for twenty percent of your company. Enough to hire a team. Twenty percent forever, and an investor on your board who asks hard questions.",
    goal: "Pitch to investors again and reach reputation 40.",
    tasks: [{ do: "pitch-deck" }, { rep: 40 }],
    lines: [
      { who: "halima", text: "I'm not buying your app. I'm buying your next five years. Are you ready to give them?" },
      { who: "you", if: "halima_trust", text: "You told me I was honest. Can we talk about the valuation, honestly?" },
    ],
    choices: [
      { label: "Accept the investment", result: "₦1.5 million lands in the company account. Halima sends a calendar invite for every Monday at 8 a.m.", fx: { money: 1_500_000, flag: "funded" } },
      { label: "Negotiate for a better deal", result: "You push back on the numbers.", fx: { money: 1_200_000, flag: "funded" }, need: { skill: { charisma: 4 } }, chance: { odds: 0.6, win: "Halima laughs. \"Fine. ₦1.5 million for fifteen percent. You're stubborn. Good.\"", winFx: { money: 1_500_000, flag: ["funded", "good_terms"] } } },
      { label: "Stay independent and grow from revenue", result: "Slower, scrappier, and every naira of the company is still yours.", fx: { skill: { hustle: 0.5 }, flag: "bootstrapped" } },
    ],
    reward: { money: 30_000, xp: 550 },
  },
  {
    id: "c7-ent-1", ch: 7, route: "ent", emoji: "🗞️", title: "The rumour", place: "phone", cast: ["kola", "damola"],
    intro: "You wake up to 300 notifications. A gossip page posted a fake story about you, with a blurry photo and a made-up quote. It's trending.",
    goal: "Reach reputation 40.",
    tasks: [{ rep: 40 }],
    lines: [
      { who: "kola", text: "Don't post anything angry in the next hour. Breathe. Then decide." },
      { who: "damola", text: "Any publicity is good publicity! Ride it!" },
      { who: "you", text: "My mother saw it. She called crying." },
    ],
    choices: [
      { label: "Post a calm statement with the facts", result: "Short, clear, no insults. Most people believe you. The gossip page deletes the post.", fx: { rep: 5, flag: "calm_statement" } },
      { label: "Take the gossip page to court for defamation", result: "Your lawyer sends a letter. The page apologises publicly and pays damages.", fx: { cost: 30_000, money: 100_000, rep: 3, flag: "sued_blog" } },
      { label: "Say nothing and let it blow over", result: "It blows over in a week. Some people still believe it.", fx: { rep: -2 } },
    ],
    reward: { money: 30_000, xp: 550 },
  },

  {
    id: "c7-health", ch: 7, if: "ignored_health", emoji: "🏥", title: "The warning", place: "hospital", cast: ["sule", "ngozi"],
    intro: "You collapse in the middle of a busy day. Not for long, but long enough. At Mainland General, Dr Ngozi reads your blood pressure twice and frowns.",
    goal: "Pay for tests, rest properly and exercise.",
    tasks: [{ pay: 30_000 }, { do: "sleep|sleep-bed" }, { do: "gym|jog|aerobics|home-workout|swim" }],
    lines: [
      { who: "ngozi", text: "Your blood pressure is far too high for your age. Stress, salt, no sleep. Your body is sending you a bill." },
      { who: "sule", text: "Remember when you said you'd 'push through'? This is what pushing through looks like." },
      { who: "you", text: "I thought rest was for people who could afford it." },
    ],
    choices: [
      { label: "Change your habits: sleep, food and exercise", result: "Early nights, less salt, a walk every morning. In two months your numbers are normal.", fx: { flag: "healthy_habits", unflag: "ignored_health", skill: { fitness: 0.3 } } },
      { label: "Take the medicine and carry on as before", result: "The tablets help. You promise yourself you'll slow down next month.", fx: { flag: "on_tablets" } },
    ],
    reward: { xp: 500 },
  },
  {
    id: "c7-health-b", ch: 7, unless: "ignored_health", emoji: "🩺", title: "Check-up", place: "hospital", cast: ["sule", "ngozi"],
    intro: "Success is stressful. Coach Sule insists everyone on his team gets a yearly check-up. \"Cars get serviced. So do people.\"",
    goal: "Get a check-up, rest properly and exercise.",
    tasks: [{ pay: 10_000 }, { do: "sleep|sleep-bed" }, { do: "gym|jog|aerobics|home-workout|swim" }],
    lines: [
      { who: "ngozi", text: "Blood pressure fine, sugar fine, heart fine. Whatever you're doing, keep doing it." },
      { who: "sule", if: "checkup", text: "You listened back then. Look at you now." },
      { who: "you", text: "I thought I'd feel guilty for resting. I feel stronger." },
    ],
    choices: [
      { label: "Make check-ups a yearly habit", result: "You set a reminder. Future you says thank you.", fx: { flag: "healthy_habits", skill: { fitness: 0.2 } } },
      { label: "Pay for your parents' check-ups too", result: "Mummy grumbles, then goes. The doctor catches something early. It's treatable.", fx: { cost: 20_000, bond: { mummy: 12 }, flag: "mummy_checkup" } },
    ],
    reward: { money: 10_000, xp: 500 },
  },

  // ----- routes, part 2 -----
  {
    id: "c7-biz-2", ch: 7, route: "biz", emoji: "✊🏾", title: "The strike", place: "phone", cast: ["bisola"],
    intro: "Your staff stop work on Monday morning. Prices have risen and their wages haven't. They're polite, organised and serious.",
    goal: "Own three businesses and have ₦300,000 in cash.",
    tasks: [{ biz: 3 }, { money: 300_000 }],
    lines: [
      { who: "bisola", text: "When your people strike, the problem is usually you. Listen first. Argue second." },
      { who: "you", text: "They want a thirty percent raise. I can afford fifteen." },
    ],
    choices: [
      { label: "Show them the books and agree on twenty percent", result: "Open numbers, honest talk. They accept, and two of them tell you about waste you didn't know about.", fx: { cost: 60_000, rep: 5, flag: "fair_boss" } },
      { label: "Give them the full thirty percent", result: "Expensive, but your staff become the most loyal in Mushin. Nobody leaves for years.", fx: { cost: 100_000, rep: 6, flag: "generous_boss" } },
      { label: "Replace the strikers with new staff", result: "You keep your costs. The new staff are slow, and the story spreads around the market.", fx: { rep: -5, flag: "replaced_staff" } },
    ],
    reward: { money: 50_000, xp: 550 },
  },
  {
    id: "c7-med-2", ch: 7, route: "med", emoji: "🛫", title: "The offer abroad", place: "phone", cast: ["ngozi", "chiamaka"],
    intro: "A recruiter emails: a hospital abroad wants Nigerian doctors. Salary ten times yours, visa sponsored, start in three months. Three of your colleagues have already gone.",
    goal: "Call two people you trust.",
    tasks: [{ count: "call", n: 2 }],
    lines: [
      { who: "chiamaka", if: "chiamaka_abroad", text: "It's good here. Cold, but good. There's a job for you if you want it." },
      { who: "ngozi", text: "I won't tell you to stay. Many good doctors left and I don't blame them. But every one who leaves makes the queue here longer." },
      { who: "you", text: "If I stay, I want to change something. Not just survive." },
    ],
    choices: [
      { label: "Stay, and push for better conditions with your colleagues", result: "You help write a proposal for fair call schedules and safe staffing. The board accepts half of it. Half is a start.", fx: { rep: 6, flag: "stayed_doctor" } },
      { label: "Accept, but plan to come back in five years", result: "You keep the offer letter in a drawer. It's there if you need it. The ✈️ Goals tab is always open.", fx: { flag: "japa_plan", skill: { study: 0.3 } } },
    ],
    reward: { money: 40_000, xp: 550 },
  },
  {
    id: "c7-law-2", ch: 7, route: "law", emoji: "🔓", title: "Pro bono", place: "court", cast: ["emeka", "funke"],
    intro: "Aunty Funke's nephew Sodiq, nineteen, was picked up in a street raid and has been held for weeks without being charged. His mother has no money for a lawyer.",
    goal: "Help at the legal clinic twice and watch a court session.",
    tasks: [{ do: "legal-clinic", n: 2 }, { do: "watch-court" }],
    lines: [
      { who: "funke", text: "He sells phone cards. He was waiting for a danfo. That's all." },
      { who: "emeka", text: "Nobody can be held for weeks without charge. File for his release and enforce his rights. Today." },
      { who: "you", text: "The court orders his release. His mother faints on the courthouse steps." },
    ],
    choices: [
      { label: "Help the family claim compensation", result: "It takes months, but the state pays. Sodiq uses it to go back to school.", fx: { rep: 6, bond: { funke: 12 }, flag: "sodiq_freed" } },
      { label: "Start a monthly free clinic for detention cases", result: "Twelve young people freed in a year. A newspaper calls you \"the people's lawyer\".", fx: { rep: 8, flag: "detention_clinic" } },
    ],
    reward: { money: 30_000, xp: 560 },
  },
  {
    id: "c7-tech-2", ch: 7, route: "tech", emoji: "🧬", title: "The copycat", place: "hub", cast: ["damola", "ify"],
    intro: "A new app appears with your features, your colours and almost your name. The founder smiling in the press release: Damola Pedro.",
    goal: "Work three shifts.",
    tasks: [{ count: "work", n: 3 }],
    lines: [
      { who: "damola", text: "Ideas belong to everybody, my friend. Execution belongs to whoever has more money." },
      { who: "ify", text: "Copies copy what you did yesterday. Build what you'll do tomorrow, and talk to your users more than he does." },
    ],
    choices: [
      { label: "Out-build him: ship faster and listen harder", result: "Three big features in a month. His app can't keep up. In six months it's gone.", fx: { skill: { study: 0.4 }, rep: 4, flag: "outbuilt" } },
      { label: "Send a lawyer's letter over the copied design", result: "His app changes its name and colours within a week. Your users notice.", fx: { cost: 30_000, rep: 2, flag: "legal_letter" } },
    ],
    reward: { money: 40_000, xp: 560 },
  },
  {
    id: "c7-ent-2", ch: 7, route: "ent", if: "signed_label", emoji: "🧾", title: "Contract trouble", place: "studio", cast: ["kola"],
    intro: "The label wants your next single to be a song you hate, with a feature from an artist you don't respect. The contract says they choose singles.",
    goal: "Work three shifts in Entertainment.",
    tasks: [{ count: "work", n: 3 }],
    lines: [
      { who: "kola", text: "I'm in the middle. I work for the label, but I believe in you. Let's find a way that doesn't break anything." },
      { who: "you", text: "If I release this, it's not me anymore." },
    ],
    choices: [
      { label: "Negotiate: their single, then your single", result: "They agree. Their song does okay. Yours does better. Next time, they ask your opinion first.", fx: { skill: { charisma: 0.4 }, flag: "negotiated_label" } },
      { label: "Refuse and accept the consequences", result: "They shelve your project for months. Your fans start a hashtag to free your music. It works.", fx: { rep: 5, flag: "free_my_music" } },
    ],
    reward: { money: 40_000, xp: 560 },
  },
  {
    id: "c7-ent-2b", ch: 7, route: "ent", unless: "signed_label", emoji: "📦", title: "Doing it alone", place: "studio", cast: ["kola"],
    intro: "Independence is freedom, and also paperwork. Your distributor's payments are late, a radio promotion campaign costs more than you have, and you're your own manager, accountant and driver.",
    goal: "Work three shifts in Entertainment.",
    tasks: [{ count: "work", n: 3 }],
    lines: [
      { who: "kola", text: "Independent artists win when they build a team. You can't do everything and still make good music." },
      { who: "you", text: "I can't afford a team." },
      { who: "kola", text: "You can afford one good person. Start there." },
    ],
    choices: [
      { label: "Hire a manager on a percentage", result: "She's sharp and fearless. Late payments become on-time payments within a month.", fx: { skill: { hustle: 0.3 }, flag: "has_manager" } },
      { label: "Form a collective with other independent artists", result: "Shared costs, shared studio time, shared stages. Together you're loud enough to be heard.", fx: { rep: 4, flag: "collective" } },
    ],
    reward: { money: 40_000, xp: 560 },
  },

  {
    id: "c7-fire", ch: 7, emoji: "🔥", title: "Market fire", place: "market", cast: ["funke", "ronke"],
    intro: "Night. Sirens. Oja Tuntun Market is burning. By morning, a whole row of stalls is ash, including Aunty Funke's, where she has traded for twenty-five years.",
    goal: "Go to the market and see Aunty Funke.",
    tasks: [{ visit: "market" }],
    lines: [
      { who: "funke", text: "Twenty-five years. Everything I had was in that stall. Everything." },
      { who: "ronke", text: "Everybody is asking what we can do. You know people now. Tell us what to do." },
      { who: "you", text: "We rebuild. Together." },
    ],
    choices: [
      { label: "Give ₦50,000 to help Aunty Funke restock", result: "She holds your hands and can't speak. A week later her stall is open again, smaller, but open.", fx: { cost: 50_000, bond: { funke: 15 }, rep: 4, flag: "helped_funke" } },
      { label: "Organise a fundraiser for all the traders", result: "Your network gives ₦2 million in a week. Every affected trader gets something. The market names a walkway after you, jokingly. Then not jokingly.", fx: { rep: 8, bond: { funke: 10, ronke: 8 }, flag: "market_fundraiser" }, need: { rep: 35 } },
      { label: "Offer her space in one of your businesses", result: "She shares your counter for six months while she rebuilds. Your customers love her.", fx: { bond: { funke: 12 }, rep: 3 } },
    ],
    reward: { xp: 550 },
  },

  // ----- routes, part 3 -----
  {
    id: "c7-biz-3", ch: 7, route: "biz", emoji: "📦", title: "Fake goods", place: "market", cast: ["bisola"],
    intro: "A supplier delivered a batch of cooking oil that is mostly water and colouring. Some of it is already on your shelves. Customers will notice, and some may get sick.",
    goal: "Within 3 days: trade at the market twice and have ₦200,000 for refunds.",
    tasks: [{ do: "market-trade", n: 2 }, { money: 200_000 }],
    deadline: 3,
    fail: { text: "Customers found the fake oil before you could act. Angry posts spread. You still have to fix it, but your name took a hit.", rep: -6 },
    lines: [
      { who: "bisola", text: "In business, your name is your most expensive asset. Protect it, even when it costs." },
      { who: "you", text: "If I recall everything, I lose ₦150,000." },
    ],
    choices: [
      { label: "Recall it all and refund every customer", result: "You post a notice, refund everyone and report the supplier. Customers trust you more than before.", fx: { cost: 150_000, rep: 8, flag: "recalled" } },
      { label: "Quietly pull the rest but don't announce it", result: "No refunds, no noise. Some customers bought it. You hope nobody connects it to you.", fx: { rep: -3, flag: "quiet_recall" } },
    ],
    reward: { money: 60_000, xp: 580 },
  },
  {
    id: "c7-med-3", ch: 7, route: "med", emoji: "🕯️", title: "The patient you lost", place: "hospital", cast: ["ngozi"],
    intro: "Mrs Adebayo, the pepper seller from your first ward round, came back years later, too late. You did everything right, and she still died. You can't stop thinking about it.",
    goal: "Take time to grieve and work two shifts.",
    tasks: [{ do: "worship|park-relax|beach|call-mummy" }, { count: "work", n: 2 }],
    lines: [
      { who: "ngozi", text: "If you ever stop feeling it, that's when you should worry. But you can't carry every patient forever. Put them down gently." },
      { who: "you", text: "Her daughter thanked me. I couldn't say anything." },
    ],
    choices: [
      { label: "Talk to a counsellor and to Dr Ngozi", result: "It helps more than you expected. You learn that doctors need doctors too.", fx: { flag: "counselling", mood: "wellRested" } },
      { label: "Start a screening day for market women", result: "Free blood pressure and sugar checks every month at Oja Tuntun, in her name.", fx: { rep: 7, flag: "screening_day" } },
    ],
    reward: { money: 40_000, xp: 560 },
  },
  {
    id: "c7-law-3", ch: 7, route: "law", emoji: "📈", title: "Senior associate", place: "chambers", cast: ["emeka"],
    intro: "Your record speaks: the tenancy case, the detention clinic, clients who recommend you. The partners are discussing a promotion to senior associate.",
    goal: "Get promoted to Senior associate in Law.",
    tasks: [{ career: "law", level: 2 }],
    lines: [
      { who: "emeka", text: "Senior associate. Juniors will look at you the way you looked at me. Behave accordingly." },
      { who: "you", text: "A junior made a mistake that cost a client a deadline." },
    ],
    choices: [
      { label: "Take responsibility in front of the client", result: "The client respects it. The junior never misses a deadline again.", fx: { rep: 5, flag: "covers_juniors" } },
      { label: "Fix it quietly and train the junior", result: "You file an emergency motion at midnight and it's granted. Then a long talk with the junior.", fx: { skill: { study: 0.3, charisma: 0.2 } } },
    ],
    reward: { money: 50_000, xp: 580 },
  },
  {
    id: "c7-tech-3", ch: 7, route: "tech", emoji: "🔥", title: "The outage", place: "hub", cast: ["ify"],
    intro: "Your servers go down on a Friday evening. Payments fail, users rage on social media, and your phone is too hot to hold.",
    goal: "Within 2 days: reach Study level 8 and work two shifts.",
    tasks: [{ skill: "study", min: 8 }, { count: "work", n: 2 }],
    deadline: 2,
    fail: { text: "The outage lasted all weekend. You fixed it eventually, but users noticed. Write the post-mortem and try again.", rep: -6 },
    lines: [
      { who: "ify", text: "Fix first, blame never. Then write down exactly what happened so it never happens again." },
      { who: "you", text: "A database disk filled up. One line of monitoring would have warned us." },
    ],
    choices: [
      { label: "Publish an honest post-mortem for users", result: "Users appreciate the honesty. Other startups use your post-mortem to fix their own systems.", fx: { rep: 5, flag: "postmortem" } },
      { label: "Give every user a month free as an apology", result: "It costs you, but users forgive you fast. Some even upgrade.", fx: { cost: 40_000, rep: 4 } },
    ],
    reward: { money: 50_000, xp: 580 },
  },
  {
    id: "c7-ent-3", ch: 7, route: "ent", emoji: "😵‍💫", title: "Burnout on tour", place: "pavilion", cast: ["kola", "mummy"],
    intro: "Twelve shows in twenty days. Your voice is cracking, you can't remember which city you're in, and you cried in a hotel bathroom last night.",
    goal: "Sleep properly twice and do something that relaxes you.",
    tasks: [{ do: "sleep|sleep-bed|nap", n: 2 }, { do: "beach|pool|park-relax|relax" }],
    lines: [
      { who: "kola", text: "Your voice is your instrument. Nobody buys a broken guitar." },
      { who: "mummy", text: "Come home for a few days. I'll cook. You'll sleep. The fans will wait." },
    ],
    choices: [
      { label: "Postpone three shows and rest", result: "Some fans are upset, most understand. You come back stronger, and the rescheduled shows sell out.", fx: { rep: 2, flag: "rested_tour", mood: "wellRested" } },
      { label: "Push through every show", result: "You finish the tour. You're proud and exhausted, and your voice takes months to recover.", fx: { skill: { charisma: 0.2 }, flag: "pushed_tour" } },
    ],
    reward: { money: 50_000, xp: 580 },
  },

  {
    id: "c7-tax", ch: 7, emoji: "🧾", title: "Tax season", place: "tower", cast: ["bisola", "femi"],
    intro: "A letter from the state tax office: they want your tax returns for the last two years. You've been meaning to sort it out. You haven't.",
    goal: "Pay what you owe and attend a business seminar.",
    tasks: [{ pay: 25_000 }, { do: "biz-class|tower-network" }],
    lines: [
      { who: "femi", text: "Taxes pay for the roads you complain about. Pay them, then complain properly." },
      { who: "bisola", text: "Keep clean books and the tax man is just another visitor. Keep dirty books and he's a nightmare." },
    ],
    choices: [
      { label: "Hire a proper accountant", result: "₦30,000 a quarter. She finds allowances you didn't know about and saves you more than she costs.", fx: { cost: 30_000, skill: { hustle: 0.3 }, flag: "accountant" } },
      { label: "Learn to do it yourself", result: "Two weekends of forms and calculators. Painful. You'll never be confused by a tax letter again.", fx: { skill: { study: 0.4 }, flag: "tax_savvy" } },
    ],
    reward: { money: 20_000, xp: 520, rep: 2 },
  },

  // ----- routes, part 4 -----
  {
    id: "c7-biz-4", ch: 7, route: "biz", emoji: "💪🏾", title: "Million-naira month", place: "phone", cast: ["bisola"],
    intro: "Through the price war, the strike and the fake oil, you kept going. Chief Bisola says the real test of a business owner is what you have left after a bad year.",
    goal: "Have ₦1,000,000 in cash.",
    tasks: [{ money: 1_000_000 }],
    lines: [
      { who: "bisola", text: "One million in the bank, after the year you've had. Now I can talk to you about something serious." },
      { who: "you", text: "What kind of serious?" },
      { who: "bisola", text: "The kind with trucks." },
    ],
    choices: [
      { label: "\"I'm ready. Tell me everything.\"", result: "She smiles for the first time in the meeting. \"Come to my office on Monday. Bring your lawyer.\"", fx: { flag: "cole_ready" } },
      { label: "\"I want to understand the risks first.\"", result: "\"Good. The ones who rush in are the ones I don't trust.\" She sends you two years of accounts to study.", fx: { flag: "cole_ready", skill: { hustle: 0.3 } } },
    ],
    reward: { money: 80_000, xp: 600, rep: 3 },
  },
  {
    id: "c7-med-4", ch: 7, route: "med", emoji: "🎓", title: "Fellowship exams", place: "campus", cast: ["ngozi", "chiamaka"],
    intro: "The final exams of residency: written papers, clinical cases, a dissertation defence. Pass, and you become a Fellow of the postgraduate medical college, ready to be a consultant.",
    goal: "Pay the exam fees and reach Study level 8.5.",
    tasks: [{ pay: 100_000 }, { skill: "study", min: 8.5 }],
    lines: [
      { who: "ngozi", text: "I've watched you grow from the person who stayed with Tunde in the queue to this. Go and finish it." },
      { who: "chiamaka", if: "chiamaka_friend", text: "Fellow! Doctor! Consultant! Okay, maybe I'm getting ahead of myself. Good luck!" },
      { who: "you", text: "I passed. I'm a Fellow." },
    ],
    choices: [
      { label: "Celebrate with the whole ward team", result: "Nurses, porters, cleaners, doctors, all in one room with jollof and loud music. Everyone who helped.", fx: { cost: 20_000, rep: 5, mood: "bigNight" } },
      { label: "Call Mummy first, before anyone", result: "She doesn't understand what a Fellow is. She understands you're happy. That's enough.", fx: { bond: { mummy: 12 } } },
    ],
    reward: { money: 60_000, xp: 620, flag: "fellowship" },
  },
  {
    id: "c7-law-4", ch: 7, route: "law", emoji: "⚔️", title: "Conflict of interest", place: "chambers", cast: ["emeka", "bisola"],
    intro: "A big new client wants the firm to sue Cole Trading, Chief Bisola's company. You know Chief Bisola personally. The fee would be the biggest of your career.",
    goal: "Work two shifts and reach reputation 50.",
    tasks: [{ count: "work", n: 2 }, { rep: 50 }],
    lines: [
      { who: "emeka", text: "A lawyer must not act where personal loyalty could cloud judgment. Disclose. Always disclose." },
      { who: "bisola", text: "I heard you might be on the other side. I hope you'll do the right thing, whatever that is." },
    ],
    choices: [
      { label: "Disclose the relationship and step aside", result: "The client is surprised by your honesty and keeps the firm. Another partner takes the case.", fx: { rep: 6, flag: "disclosed_conflict" } },
      { label: "Help both sides settle out of court", result: "With both parties' consent, you broker a fair agreement. Both companies send business your way.", fx: { rep: 7, skill: { charisma: 0.4 }, flag: "peacemaker" }, need: { skill: { charisma: 6 } } },
    ],
    reward: { money: 60_000, xp: 600 },
  },
  {
    id: "c7-tech-4", ch: 7, route: "tech", emoji: "👩🏾‍💻", title: "Build the team", place: "phone", cast: ["ify", "halima"],
    intro: "You can't write all the code anymore. It's time to turn your project into a real company with a team: engineers, a designer, someone who answers customers.",
    goal: "Own your startup (🏪 Business app).",
    tasks: [{ bizId: "startup" }],
    lines: [
      { who: "ify", text: "Hire people smarter than you, then get out of their way." },
      { who: "halima", if: "funded", text: "The investment is for people. Hire well. Hire slowly. Fire quickly if you must." },
      { who: "you", text: "Ten people depend on my decisions now." },
    ],
    choices: [
      { label: "Hire juniors from the Brainbox bootcamp and train them", result: "Cheaper, hungrier, loyal. In a year they're as good as anyone in Lagos.", fx: { rep: 5, flag: "trains_juniors" } },
      { label: "Hire experienced engineers, even if they cost more", result: "They move fast and teach you management. Your product leaps forward.", fx: { skill: { study: 0.3, charisma: 0.2 }, flag: "senior_team" } },
    ],
    reward: { money: 60_000, xp: 600 },
  },
  {
    id: "c7-ent-4", ch: 7, route: "ent", emoji: "⭐", title: "Headline status", place: "pavilion", cast: ["kola"],
    intro: "Promoters are calling. Not to open for someone else: to headline. Your name at the top of the poster, your fans filling the hall.",
    goal: "Reach Charisma level 7 and reputation 50.",
    tasks: [{ skill: "charisma", min: 7 }, { rep: 50 }],
    lines: [
      { who: "kola", text: "Remember the open mic? Five minutes, shaking hands? Look at you." },
      { who: "you", text: "I want the people from my street in the front row." },
    ],
    choices: [
      { label: "Reserve fifty free tickets for your street", result: "Mama Ronke, Baba Femi, Baba Landlord, the danfo conductor: all in the front row, singing every word.", fx: { rep: 6, bond: { ronke: 10 }, flag: "street_front_row" } },
      { label: "Invite young artists to open for you", result: "Three unknown acts get their first big stage. One of them becomes a star.", fx: { rep: 5, flag: "opened_for_young" } },
    ],
    reward: { money: 60_000, xp: 600, flag: "headliner" },
  },

  {
    id: "c7-tunde", ch: 7, emoji: "📵", title: "Tunde's debt", place: "phone", cast: ["tunde"],
    intro: "Tunde borrowed from a loan app for his business. Now the app is calling his contacts, including you, Mummy and his pastor, with insulting messages.",
    goal: "Call Tunde and have ₦50,000 available.",
    tasks: [{ count: "call", n: 1 }, { money: 50_000 }],
    lines: [
      { who: "tunde", text: "I borrowed ₦30,000. Now they say I owe ₦90,000. They sent my photo to everyone with 'THIEF' on it." },
      { who: "you", text: "That's illegal harassment. There are rules for these apps now." },
      { who: "tunde", text: "I'm so ashamed." },
    ],
    choices: [
      { label: "Help him report the app to the consumer protection regulator", result: "You file the complaint together, with screenshots. The calls stop within a week.", fx: { rep: 3, bond: { tunde: 12 }, flag: "reported_loan_app" } },
      { label: "Pay off the real amount he borrowed, plus fair interest", result: "₦35,000, paid through proper channels with a receipt. Tunde promises to repay you. He does, slowly.", fx: { cost: 35_000, bond: { tunde: 15 } } },
      { label: "Stay out of it", result: "He handles it himself, eventually. Your friendship is quieter after that.", fx: { bond: { tunde: -10 } } },
    ],
    reward: { money: 20_000, xp: 520 },
  },
  {
    id: "c7-wallet", ch: 7, emoji: "👛", title: "The quiet test", place: "mushin-street", cast: ["conductor", "femi"],
    intro: "In an empty danfo, under the seat: a brown envelope with ₦200,000 in cash and a hospital receipt with a name on it. Nobody saw you pick it up.",
    goal: "Take a trip across town.",
    tasks: [{ count: "travel|walk", n: 1 }],
    lines: [
      { who: "conductor", text: "Oga, last stop! Everybody comot! ...Wetin you dey look like that for?" },
      { who: "femi", text: "Character is what you do when nobody is watching. Lagos is always watching, by the way." },
    ],
    choices: [
      { label: "Find the owner through the hospital receipt", result: "A frightened father, his son's surgery money. He kneels in the road. You lift him up.", fx: { rep: 6, flag: "returned_wallet", mood: "mummyLove" } },
      { label: "Hand it to the bus park chairman", result: "The chairman finds the owner by evening. The story is told in every danfo for a week.", fx: { rep: 4, flag: "returned_wallet" } },
      { label: "Keep it. Nobody will ever know.", result: "₦200,000. It sits in your account. Sometimes, at night, you think about the hospital receipt.", fx: { money: 200_000, flag: "kept_wallet" } },
    ],
    reward: { xp: 550 },
  },
];
