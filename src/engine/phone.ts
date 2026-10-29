// The in-game smartphone's rules: bank ledger, investments, businesses, contacts,
// invitations, messages and daily rewards. Pure functions, like the rest of the engine.
// game.ts calls `phoneStep` for phone commands and `newDay` at the start of every game day.

import type { GameState } from "./game";
import type { Needs } from "./needs";
import type { Skills } from "../data/skills";
import { meets } from "../data/skills";
import { FUNDS, fundById, MIN_INVEST, priceOn, SELL_KEEP, type FundId } from "../data/invest";
import { BIZ_RESALE, bizById, costs, MAX_BIZ_LEVEL, takings, type BizId, type OwnedBiz } from "../data/business";
import { CONTACTS, CLOSE, contactById, GIFT_COST, HELP_EVERY_DAYS, type ContactId } from "../data/contacts";
import { INVITE_CHANCE, INVITE_DAYS, INVITES, inviteById, MAX_OPEN_INVITES, type InviteId } from "../data/invites";
import type { MoodletId } from "../data/moodlets";
import { RENT, RENT_EVERY_DAYS, naira } from "./economy";
import { rand } from "./rng";
import { dayNumber, seedOf, statusTier } from "./progress";

// ---------- saved data (all optional, so older saves keep working) ----------

export type TxnCat =
  | "work" | "hustle" | "mission" | "reward" | "event" | "family" | "food" | "home" | "rent"
  | "transport" | "goals" | "invest" | "business" | "social" | "other";
export type Txn = { t: number; amt: number; cat: TxnCat; label: string };
export type Holding = { units: number; cost: number };
export type Trade = { t: number; fund: FundId; side: "buy" | "sell"; amount: number; pnl?: number };
export type ContactState = { rel: number; last: number; helped?: number; called?: number; texted?: number };
export type OpenInvite = { uid: number; id: InviteId; day: number; until: number; status: "open" | "accepted" | "declined" | "expired" };
export type PhoneMsg = {
  uid: number;
  from: ContactId | "bank" | "biz" | "club";
  t: number;
  key: string;                       // text key (shown in the player's language)
  vars?: Record<string, string | number>;
  read?: boolean;
  replies?: string[];                // quick replies (text keys)
  replied?: number;                  // which one you sent
};
export type DailyClaim = { id: string; streakDay: number; amount: number; t: number; server: boolean };

export const BANK_SIZE = 300;
export const MSG_SIZE = 80;

/** What game.ts lends the phone (to avoid a circular import). */
export type Kit = {
  say: (s: GameState, line: string) => GameState;
  msg: (s: GameState, key: string, vars?: Record<string, string | number>) => string;
  pay: (s: GameState, amount: number, cat: TxnCat, label: string) => GameState;
  charge: (s: GameState, amount: number, cat: TxnCat, label: string) => GameState;
  move: (s: GameState, amount: number, cat: TxnCat, label: string) => GameState; // money in/out that isn't income or spending
  passTime: (s: GameState, minutes: number, effect?: Partial<Needs>, asleep?: boolean) => GameState;
  learn: (s: GameState, gain: Partial<Skills> | undefined) => GameState;
  addMood: (s: GameState, id: MoodletId) => GameState;
  bump: (s: GameState, key: string, by?: number) => GameState;
};

// ---------- small helpers ----------

export const clampRep = (n: number) => Math.max(0, Math.min(100, n));
export const addRep = (s: GameState, by: number): GameState => ({ ...s, rep: clampRep((s.rep ?? 0) + by) });

export function contactState(s: GameState, id: ContactId): ContactState {
  const c = contactById(id)!;
  return s.contacts?.[id] ?? { rel: c.start, last: 0 };
}

function setContact(s: GameState, id: ContactId, patch: Partial<ContactState>): GameState {
  const cur = contactState(s, id);
  const next = { ...cur, ...patch, rel: Math.max(0, Math.min(100, patch.rel ?? cur.rel)) };
  return { ...s, contacts: { ...(s.contacts ?? {}), [id]: next } };
}

export const bond = (s: GameState, id: ContactId, by: number) =>
  setContact(s, id, { rel: contactState(s, id).rel + by, last: by > 0 ? dayNumber(s) : contactState(s, id).last });

function nextUid(s: GameState): [number, GameState] {
  const uid = s.uidSeq ?? 1;
  return [uid, { ...s, uidSeq: uid + 1 }];
}

export function addMessage(s: GameState, m: Omit<PhoneMsg, "uid" | "t">): GameState {
  const [uid, next] = nextUid(s);
  return { ...next, messages: [...(next.messages ?? []), { ...m, uid, t: s.time }].slice(-MSG_SIZE) };
}

export const unreadCount = (s: GameState) => (s.messages ?? []).filter(m => !m.read).length;
export const openInvites = (s: GameState) => (s.invites ?? []).filter(i => i.status === "open");

/** Income and spending since a time (for the bank's summary). */
export function flows(s: GameState, since = 0) {
  let income = 0;
  let spent = 0;
  const byCat: Partial<Record<TxnCat, number>> = {};
  for (const t of s.bank ?? []) {
    if (t.t < since) continue;
    if (t.amt > 0) income += t.amt;
    else spent -= t.amt;
    byCat[t.cat] = (byCat[t.cat] ?? 0) + t.amt;
  }
  return { income, spent, byCat };
}

export const fundPrice = (s: GameState, id: FundId) => priceOn(seedOf(s), fundById(id)!, dayNumber(s));

// ---------- the start of a new game day ----------

export function newDay(s: GameState, day: number, kit: Kit): GameState {
  let next = s;
  const seed = seedOf(s);

  // 1. Businesses: yesterday's takings minus wages and upkeep.
  let total = 0;
  const owned: OwnedBiz[] = [];
  for (const o of next.businesses ?? []) {
    const b = bizById(o.id);
    if (!b) continue;
    const r = rand(seed, "biz", o.id, day);
    const swing = r < 0.08 ? 0.3 : 0.8 + 0.4 * rand(seed, "bizswing", o.id, day); // now and then a bad day
    const profit = Math.round(takings(b, o, next.skills.hustle, swing) - costs(b, o));
    total += profit;
    owned.push({ ...o, lastProfit: profit });
  }
  if (owned.length) {
    next = { ...next, businesses: owned };
    const label = kit.msg(next, "bank.bizDay");
    next = total >= 0 ? kit.pay(next, total, "business", label) : kit.charge(next, -total, "business", label);
    next = addMessage(next, { from: "biz", key: total >= 0 ? "msg.biz.profit" : "msg.biz.loss", vars: { money: naira(Math.abs(total)), count: owned.length } });
  }

  // 2. Friendships fade a little if you don't keep in touch.
  for (const c of CONTACTS) {
    const cs = contactState(next, c.id);
    if (day - cs.last > 3 && cs.rel > (c.family ? 30 : 5)) {
      next = setContact(next, c.id, { rel: cs.rel - 1 });
      if (cs.rel - 1 === 14 && !c.family) next = addMessage(next, { from: c.id, key: "msg.missYou", replies: ["reply.sorry", "reply.busy"] });
    }
  }

  // 3. Invitations: old ones expire, sometimes a new one arrives.
  next = { ...next, invites: (next.invites ?? []).map(i => (i.status === "open" && i.until < day ? { ...i, status: "expired" as const } : i)).slice(-30) };
  if (openInvites(next).length < MAX_OPEN_INVITES && rand(seed, "invite", day) < INVITE_CHANCE) {
    const tier = statusTier(next);
    const open = new Set(openInvites(next).map(i => i.id));
    const pool = INVITES.filter(i => (i.minStatus ?? 0) <= tier && !open.has(i.id));
    if (pool.length) {
      const type = pool[Math.floor(rand(seed, "invitepick", day) * pool.length)];
      const [uid, n2] = nextUid(next);
      next = { ...n2, invites: [...(n2.invites ?? []), { uid, id: type.id, day, until: day + INVITE_DAYS, status: "open" }] };
      next = addMessage(next, { from: type.from ?? "club", key: "msg.invite", vars: { event: `invite.${type.id}.name` } });
    }
  }

  // 4. Story messages.
  if (day % RENT_EVERY_DAYS === 0 && next.money < RENT) {
    next = addMessage(next, { from: "landlord", key: "msg.landlord.rent", vars: { money: naira(RENT) }, replies: ["reply.willPay", "reply.beg"] });
  }
  if (day === 3) next = addMessage(next, { from: "tunde", key: "msg.tunde.invest", replies: ["reply.thanks", "reply.later"] });
  if (day === 5) next = addMessage(next, { from: "funke", key: "msg.funke.business", replies: ["reply.thanks", "reply.later"] });
  return next;
}

/** Messages for a brand-new life. */
export function startPhone(s: GameState): GameState {
  let next = addMessage(s, { from: "mummy", key: "msg.mummy.welcome", replies: ["reply.thanks", "reply.busy"] });
  next = addMessage(next, { from: "bank", key: "msg.bank.welcome" });
  return next;
}

// ---------- phone commands ----------

export type PhoneCommand =
  | { type: "invest"; fund: FundId; amount: number }
  | { type: "sellFund"; fund: FundId; share: number }   // 0–1 of what you hold
  | { type: "buyBiz"; id: BizId }
  | { type: "upgradeBiz"; id: BizId }
  | { type: "staff"; id: BizId; by: 1 | -1 }
  | { type: "sellBiz"; id: BizId }
  | { type: "contact"; id: ContactId; how: "call" | "text" | "gift" | "help" }
  | { type: "invite"; uid: number; accept: boolean }
  | { type: "readMsgs"; from: PhoneMsg["from"] }
  | { type: "reply"; uid: number; choice: number }
  | { type: "daily"; id: string; streakDay: number; amount: number; server: boolean }
  | { type: "camera"; mode: "top" | "first" };


/** Why a phone action can't happen right now (a text key), or null. */
export function phoneBlocker(s: GameState, cmd: PhoneCommand): string | null {
  switch (cmd.type) {
    case "invest": {
      const f = fundById(cmd.fund);
      if (!f) return "phone.err.unknown";
      if (!(cmd.amount >= Math.max(MIN_INVEST, f.min ?? 0))) return "phone.err.tooSmall";
      if (cmd.amount > s.money) return "problem.noMoney";
      return null;
    }
    case "sellFund":
      return (s.portfolio?.[cmd.fund]?.units ?? 0) > 0 ? null : "phone.err.nothing";
    case "buyBiz": {
      const b = bizById(cmd.id);
      if (!b) return "phone.err.unknown";
      if ((s.businesses ?? []).some(o => o.id === cmd.id)) return "phone.err.owned";
      if (b.req && !meets(s.skills, b.req)) return "phone.err.skill";
      if (s.money < b.price) return "problem.noMoney";
      return null;
    }
    case "upgradeBiz": {
      const o = (s.businesses ?? []).find(x => x.id === cmd.id);
      const b = bizById(cmd.id);
      if (!o || !b) return "phone.err.nothing";
      if (o.level >= MAX_BIZ_LEVEL) return "phone.err.maxLevel";
      if (s.money < b.upgrade * o.level) return "problem.noMoney";
      return null;
    }
    case "staff": {
      const o = (s.businesses ?? []).find(x => x.id === cmd.id);
      const b = bizById(cmd.id);
      if (!o || !b) return "phone.err.nothing";
      if (cmd.by > 0 && o.staff >= b.maxStaff) return "phone.err.fullStaff";
      if (cmd.by < 0 && o.staff <= 0) return "phone.err.noStaff";
      return null;
    }
    case "sellBiz":
      return (s.businesses ?? []).some(o => o.id === cmd.id) ? null : "phone.err.nothing";
    case "contact": {
      const cs = contactState(s, cmd.id);
      const day = dayNumber(s);
      if (cmd.how === "gift" && s.money < GIFT_COST) return "problem.noMoney";
      if (cmd.how === "help") {
        if (cs.rel < CLOSE) return "phone.err.notClose";
        if (cs.helped !== undefined && day - cs.helped < HELP_EVERY_DAYS) return "phone.err.helpedRecently";
      }
      return null;
    }
    case "invite": {
      const i = (s.invites ?? []).find(x => x.uid === cmd.uid);
      if (!i || i.status !== "open" || i.until < dayNumber(s)) return "phone.err.inviteGone";
      if (!cmd.accept) return null;
      const type = inviteById(i.id)!;
      if (s.money < type.cost) return "problem.noMoney";
      if (s.needs.energy < (type.minEnergy ?? 10)) return "phone.err.tired";
      return null;
    }
    default:
      return null;
  }
}

export function phoneStep(s: GameState, cmd: PhoneCommand, kit: Kit): GameState {
  const problem = phoneBlocker(s, cmd);
  if (problem) return kit.say(s, `❌ ${kit.msg(s, problem)}`);
  const day = dayNumber(s);

  switch (cmd.type) {
    case "invest": {
      const f = fundById(cmd.fund)!;
      const price = fundPrice(s, f.id);
      const amount = Math.floor(cmd.amount);
      const held = s.portfolio?.[f.id] ?? { units: 0, cost: 0 };
      let next = kit.move(s, -amount, "invest", kit.msg(s, `fund.${f.id}.name`));
      next = { ...next, portfolio: { ...(next.portfolio ?? {}), [f.id]: { units: held.units + amount / price, cost: held.cost + amount } } };
      next = { ...kit.bump(next, "invest"), trades: [...(next.trades ?? []), { t: s.time, fund: f.id, side: "buy" as const, amount }].slice(-60) };
      return kit.say(next, kit.msg(s, "log.invested", { money: naira(amount), fund: kit.msg(s, `fund.${f.id}.name`) }));
    }

    case "sellFund": {
      const held = s.portfolio![cmd.fund]!;
      const share = Math.max(0.01, Math.min(1, cmd.share));
      const units = held.units * share;
      const value = Math.round(units * fundPrice(s, cmd.fund) * SELL_KEEP);
      const costPart = held.cost * share;
      const pnl = Math.round(value - costPart);
      const left = share >= 0.999 ? undefined : { units: held.units - units, cost: held.cost - costPart };
      const portfolio = { ...(s.portfolio ?? {}) };
      if (left) portfolio[cmd.fund] = left;
      else delete portfolio[cmd.fund];
      let next = kit.move({ ...s, portfolio }, value, "invest", kit.msg(s, `fund.${cmd.fund}.name`));
      next = { ...next, trades: [...(next.trades ?? []), { t: s.time, fund: cmd.fund, side: "sell" as const, amount: value, pnl }].slice(-60) };
      return kit.say(next, kit.msg(s, pnl >= 0 ? "log.soldFundUp" : "log.soldFundDown", { money: naira(value), pnl: naira(Math.abs(pnl)), fund: kit.msg(s, `fund.${cmd.fund}.name`) }));
    }

    case "buyBiz": {
      const b = bizById(cmd.id)!;
      let next = kit.charge(s, b.price, "business", kit.msg(s, `biz.${b.id}.name`));
      next = { ...next, businesses: [...(next.businesses ?? []), { id: b.id, level: 1, staff: 1, invested: b.price, since: day }] };
      next = addRep(kit.bump(next, "business"), 3);
      return kit.say(next, kit.msg(s, "log.bizBought", { emoji: b.emoji, name: kit.msg(s, `biz.${b.id}.name`), money: naira(b.price) }));
    }

    case "upgradeBiz": {
      const b = bizById(cmd.id)!;
      const o = s.businesses!.find(x => x.id === cmd.id)!;
      const price = b.upgrade * o.level;
      let next = kit.charge(s, price, "business", kit.msg(s, `biz.${b.id}.name`));
      next = { ...next, businesses: next.businesses!.map(x => (x.id === cmd.id ? { ...x, level: x.level + 1, invested: x.invested + price } : x)) };
      return kit.say(addRep(next, 1), kit.msg(s, "log.bizUpgraded", { name: kit.msg(s, `biz.${b.id}.name`), level: o.level + 1 }));
    }

    case "staff": {
      const next = { ...s, businesses: s.businesses!.map(x => (x.id === cmd.id ? { ...x, staff: x.staff + cmd.by } : x)) };
      return kit.say(next, kit.msg(s, cmd.by > 0 ? "log.hiredStaff" : "log.firedStaff", { name: kit.msg(s, `biz.${cmd.id}.name`) }));
    }

    case "sellBiz": {
      const o = s.businesses!.find(x => x.id === cmd.id)!;
      const value = Math.round(o.invested * BIZ_RESALE);
      const next = kit.move({ ...s, businesses: s.businesses!.filter(x => x.id !== cmd.id) }, value, "business", kit.msg(s, `biz.${cmd.id}.name`));
      return kit.say(next, kit.msg(s, "log.bizSold", { name: kit.msg(s, `biz.${cmd.id}.name`), money: naira(value) }));
    }

    case "contact": {
      const c = contactById(cmd.id)!;
      const cs = contactState(s, cmd.id);
      const name = kit.msg(s, `contact.${c.id}.name`);
      if (cmd.how === "call") {
        let next = kit.passTime(s, 20, { social: 15, fun: 3 });
        if (next.ending) return next;
        next = setContact(bond(next, c.id, cs.called === day ? 1 : 4), c.id, { called: day });
        return kit.say(kit.bump(next, "call"), kit.msg(s, "log.called", { name }));
      }
      if (cmd.how === "text") {
        let next = kit.passTime(s, 5, { social: 5 });
        if (next.ending) return next;
        next = setContact(bond(next, c.id, cs.texted === day ? 0 : 2), c.id, { texted: day });
        return kit.say(next, kit.msg(s, "log.texted", { name }));
      }
      if (cmd.how === "gift") {
        let next = kit.charge(s, GIFT_COST, c.family ? "family" : "social", kit.msg(s, "bank.gift", { name }));
        if (c.family) next = { ...next, stats: { ...next.stats, sentHome: next.stats.sentHome + GIFT_COST } };
        next = addRep(bond(next, c.id, 8), 1);
        return kit.say(next, kit.msg(s, "log.gift", { name, money: naira(GIFT_COST) }));
      }
      // help
      let next = setContact(s, c.id, { helped: day, rel: cs.rel - 3 });
      if (c.help.money) next = kit.pay(next, c.help.money, c.family ? "family" : "social", kit.msg(s, "bank.helpFrom", { name }));
      if (c.help.food) next = { ...next, home: { ...next.home, food: next.home.food + c.help.food } };
      if (c.help.effect) next = kit.passTime(next, 0, c.help.effect);
      next = kit.learn(next, c.help.skill);
      return kit.say(next, kit.msg(s, `help.from.${c.id}`, { name }));
    }

    case "invite": {
      const inv = s.invites!.find(x => x.uid === cmd.uid)!;
      const type = inviteById(inv.id)!;
      const mark = (st: GameState, status: OpenInvite["status"]): GameState => ({ ...st, invites: (st.invites ?? []).map(x => (x.uid === inv.uid ? { ...x, status } : x)) });
      const title = kit.msg(s, `invite.${type.id}.name`);
      if (!cmd.accept) {
        let next = mark(s, "declined");
        if (type.from) next = bond(next, type.from, -2);
        return kit.say(next, kit.msg(s, "log.inviteDeclined", { event: title }));
      }
      let next: GameState = mark(kit.charge(s, type.cost, "social", title), "accepted");
      next = kit.passTime(next, type.minutes, type.effect);
      if (next.ending) return next;
      next = kit.learn(next, type.skill);
      next = addRep(kit.bump(next, "invite"), type.rep);
      if (type.from && type.bond) next = bond(next, type.from, type.bond);
      if (type.mood) next = kit.addMood(next, type.mood);
      if (type.pay) next = kit.pay(next, type.pay, "hustle", title);
      return kit.say(next, kit.msg(s, "log.inviteWent", { emoji: type.emoji, event: title, rep: type.rep }) + (type.pay ? ` +${naira(type.pay)}` : ""));
    }

    case "readMsgs":
      return { ...s, messages: (s.messages ?? []).map(m => (m.from === cmd.from && !m.read ? { ...m, read: true } : m)) };

    case "reply": {
      const m = (s.messages ?? []).find(x => x.uid === cmd.uid);
      if (!m?.replies || m.replied !== undefined || !m.replies[cmd.choice]) return s;
      let next: GameState = { ...s, messages: s.messages!.map(x => (x.uid === m.uid ? { ...x, replied: cmd.choice, read: true } : x)) };
      const warm = cmd.choice === 0;
      if (contactById(m.from)) next = bond(next, m.from as ContactId, warm ? 3 : 1);
      return next;
    }

    case "daily": {
      if ((s.daily ?? []).some(d => d.id === cmd.id)) return s; // already credited
      const amount = Math.max(0, Math.min(50_000, Math.round(cmd.amount)));
      let next = kit.pay(s, amount, "reward", kit.msg(s, "bank.daily", { day: cmd.streakDay }));
      next = { ...next, daily: [...(next.daily ?? []), { id: cmd.id, streakDay: cmd.streakDay, amount, t: s.time, server: cmd.server }].slice(-60) };
      next = addMessage(next, { from: "bank", key: "msg.bank.daily", vars: { money: naira(amount), day: cmd.streakDay } });
      return kit.say(next, kit.msg(s, "log.daily", { money: naira(amount), day: cmd.streakDay }));
    }

    case "camera":
      return { ...s, camera: cmd.mode };
  }
}

/** Every fund's value in your portfolio, for the Invest app. */
export function holdings(s: GameState) {
  return FUNDS.flatMap(f => {
    const h = s.portfolio?.[f.id];
    if (!h || h.units <= 0) return [];
    const value = Math.round(h.units * fundPrice(s, f.id) * SELL_KEEP);
    return [{ fund: f, units: h.units, cost: Math.round(h.cost), value, pnl: value - Math.round(h.cost) }];
  });
}
