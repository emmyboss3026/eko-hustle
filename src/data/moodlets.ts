// Moods: short feelings that push your mood up or down for a few hours.
// Your mood = the average of your six needs, plus every active mood below.
// A good mood makes you work better: shifts pay up to 15% more (or less in a bad mood).

export type MoodletId =
  | "fullTummy" | "squeaky" | "wellRested" | "floorSleeper" | "lightBack" | "sweatyNight"
  | "rentPressure" | "promoted" | "payday" | "goSlow" | "okadaRush" | "longWalk" | "gymGlow"
  | "goodGist" | "lonely" | "beachDay" | "bigNight" | "learned" | "mummyLove" | "hustleWin" | "mission" | "accident";

export type Moodlet = { label: string; emoji: string; value: number; hours: number; desc: string };

export const moodlets: Record<MoodletId, Moodlet> = {
  fullTummy:    { label: "Full tummy",       emoji: "😋", value: 8,   hours: 4,  desc: "That food hit the spot." },
  squeaky:      { label: "Squeaky clean",    emoji: "🛁", value: 6,   hours: 3,  desc: "Fresh from head to toe." },
  wellRested:   { label: "Well rested",      emoji: "😌", value: 10,  hours: 6,  desc: "A proper night's sleep." },
  floorSleeper: { label: "Stiff back",       emoji: "🥴", value: -10, hours: 6,  desc: "Slept on the hard floor." },
  accident:     { label: "So embarrassing",  emoji: "😳", value: -12, hours: 4,  desc: "Couldn't hold it. Use the toilet sooner next time." },
  lightBack:    { label: "Light is back!",   emoji: "💡", value: 6,   hours: 2,  desc: "The whole street cheered." },
  sweatyNight:  { label: "Sweaty night",     emoji: "🥵", value: -8,  hours: 4,  desc: "No light, no fan, no breeze." },
  rentPressure: { label: "Landlord wahala",  emoji: "😬", value: -15, hours: 24, desc: "Rent is owed and everyone knows." },
  promoted:     { label: "Promoted!",        emoji: "🎊", value: 20,  hours: 24, desc: "New title, new pay." },
  payday:       { label: "Alert don land",   emoji: "💰", value: 8,   hours: 4,  desc: "Money just entered." },
  goSlow:       { label: "Stuck in traffic", emoji: "🚦", value: -6,  hours: 2,  desc: "An hour to move one kilometre." },
  okadaRush:    { label: "Okada rush",       emoji: "🏍️", value: 5,   hours: 2,  desc: "Wind in your face, heart in your mouth." },
  longWalk:     { label: "Tired feet",       emoji: "🦶", value: -4,  hours: 2,  desc: "That trek was far." },
  gymGlow:      { label: "Gym glow",         emoji: "🏋🏾", value: 10,  hours: 3,  desc: "Every muscle is talking." },
  goodGist:     { label: "Good gist",        emoji: "😂", value: 8,   hours: 3,  desc: "Laughed until your belly hurt." },
  lonely:       { label: "Lonely",           emoji: "😔", value: -10, hours: 3,  desc: "Nobody to talk to today." },
  beachDay:     { label: "Beach day",        emoji: "🏖️", value: 12,  hours: 5,  desc: "Salt air and sunshine." },
  bigNight:     { label: "Big night out",    emoji: "🍾", value: 15,  hours: 6,  desc: "The club knows your name now." },
  learned:      { label: "Levelled up",      emoji: "📈", value: 8,   hours: 4,  desc: "You just got better at something." },
  mummyLove:    { label: "Mummy's prayers",  emoji: "🙏🏾", value: 6,   hours: 6,  desc: "Mummy prayed for you for ten minutes." },
  hustleWin:    { label: "Hustle paid off",  emoji: "🤑", value: 7,   hours: 3,  desc: "Side money is sweet money." },
  mission:      { label: "Mission done",     emoji: "🎯", value: 6,   hours: 3,  desc: "You did what you set out to do." },
};

export type ActiveMoodlet = { id: MoodletId; until: number };
