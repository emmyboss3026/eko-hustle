import { describe, it, expect } from "vitest";
import { newGame, reduce, passTime, upgrade, type GameState } from "./game";
import { netWorth, level, statusTier, score, scoreFrom, scoreParts, achievements, levelFor } from "./progress";
import { contactState, flows, holdings, unreadCount, openInvites, fundPrice } from "./phone";
import { priceHistory, FUNDS } from "../data/invest";
import { GIFT_COST } from "../data/contacts";

const sim = { name: "Ada", trait: "hustler" as const, avatar: "👩🏾" };
const fresh = (patch: Partial<GameState> = {}): GameState => ({ ...newGame(sim, "en", 42), ...patch });
const rich = () => fresh({ money: 2_000_000, skills: { hustle: 6, study: 0, charisma: 4, fitness: 0, cooking: 0 } });

describe("bank ledger", () => {
  it("records money in and out with categories", () => {
    let s = fresh();
    s = reduce(s, { type: "act", id: "whatsapp-hustle" });
    s = reduce(s, { type: "act", id: "puff-puff" });
    const f = flows(s, 8 * 60 + 1);
    expect(f.income).toBeGreaterThan(0);
    expect(f.spent).toBe(300);
    expect(f.byCat.hustle).toBeGreaterThan(0);
    expect(f.byCat.food).toBe(-300);
    // the ledger always adds up to the wallet
    expect((s.bank ?? []).reduce((a, t) => a + t.amt, 0)).toBe(s.money);
  });

  it("old saves without a phone still load and play", () => {
    const old = { ...fresh() } as Partial<GameState>;
    delete old.bank; delete old.messages; delete old.rep; delete old.seed; delete old.contacts;
    const s = upgrade(old)!;
    const next = reduce(s, { type: "act", id: "puff-puff" });
    expect(next.money).toBe(s.money - 300);
    expect(netWorth(next)).toBeGreaterThan(0);
  });
});

describe("investments", () => {
  it("prices are repeatable and stay positive", () => {
    for (const f of FUNDS) {
      const a = priceHistory(1, f, 120);
      const b = priceHistory(1, f, 120);
      expect(a).toEqual(b);
      expect(Math.min(...a)).toBeGreaterThan(0);
    }
  });

  it("buying moves cash into the portfolio without changing net worth much", () => {
    const s = fresh({ money: 50_000 });
    const before = netWorth(s);
    const next = reduce(s, { type: "invest", fund: "savings", amount: 20_000 });
    expect(next.money).toBe(30_000);
    expect(holdings(next)[0].value).toBeGreaterThan(19_000);
    expect(Math.abs(netWorth(next) - before)).toBeLessThan(500); // only the 1% sell fee
    expect(next.stats.spent).toBe(s.stats.spent); // investing isn't spending
  });

  it("selling books a profit or loss", () => {
    let s = reduce(fresh({ money: 50_000 }), { type: "invest", fund: "tech", amount: 30_000 });
    s = { ...s, time: s.time + 20 * 1440 };
    const value = holdings(s)[0].value;
    const next = reduce(s, { type: "sellFund", fund: "tech", share: 1 });
    expect(next.money).toBe(s.money + value);
    expect(next.portfolio?.tech).toBeUndefined();
    expect(next.trades?.at(-1)?.pnl).toBe(value - 30_000);
  });

  it("refuses tiny or unaffordable investments", () => {
    const s = fresh({ money: 5_000 });
    expect(reduce(s, { type: "invest", fund: "savings", amount: 500 }).money).toBe(5_000);
    expect(reduce(s, { type: "invest", fund: "savings", amount: 9_000 }).money).toBe(5_000);
    expect(fundPrice(s, "savings")).toBe(100);
  });
});

describe("businesses", () => {
  it("buy, earn every morning, upgrade, hire and sell", () => {
    let s = reduce(rich(), { type: "buyBiz", id: "suya" });
    expect(s.businesses?.length).toBe(1);
    const cash = s.money;
    s = passTime(s, 24 * 60);
    expect(s.money).not.toBe(cash);
    expect(s.businesses![0].lastProfit).toBeDefined();
    s = reduce(s, { type: "upgradeBiz", id: "suya" });
    expect(s.businesses![0].level).toBe(2);
    s = reduce(s, { type: "staff", id: "suya", by: 1 });
    expect(s.businesses![0].staff).toBe(2);
    const before = s.money;
    s = reduce(s, { type: "sellBiz", id: "suya" });
    expect(s.businesses).toEqual([]);
    expect(s.money).toBeGreaterThan(before);
  });

  it("needs the skill and the money", () => {
    const s = fresh({ money: 1_000_000 });
    expect(reduce(s, { type: "buyBiz", id: "pos" }).businesses ?? []).toEqual([]); // needs Hustle 2
    expect(reduce(fresh(), { type: "buyBiz", id: "water" }).businesses ?? []).toEqual([]); // ₦10,000 isn't enough
  });
});

describe("contacts and messages", () => {
  it("starts with a welcome message from Mummy", () => {
    const s = fresh();
    expect(unreadCount(s)).toBeGreaterThan(0);
    expect(s.messages?.[0].from).toBe("mummy");
    const read = reduce(s, { type: "readMsgs", from: "mummy" });
    expect(read.messages?.find(m => m.from === "mummy")?.read).toBe(true);
  });

  it("calls and gifts build relationships; help needs a close bond", () => {
    let s = fresh({ money: 20_000 });
    const start = contactState(s, "tunde").rel;
    s = reduce(s, { type: "contact", id: "tunde", how: "call" });
    s = reduce(s, { type: "contact", id: "tunde", how: "gift" });
    expect(contactState(s, "tunde").rel).toBe(start + 12);
    expect(s.money).toBe(20_000 - GIFT_COST);
    expect(reduce(s, { type: "contact", id: "tunde", how: "help" }).skills).toEqual(s.skills); // not close yet
    const m = reduce(fresh(), { type: "contact", id: "mummy", how: "help" }); // Mummy starts at 70
    expect(m.money).toBe(fresh().money + 5_000);
    expect(reduce(m, { type: "contact", id: "mummy", how: "help" }).money).toBe(m.money); // once a week
  });

  it("a quick reply is sent once", () => {
    let s = fresh();
    const uid = s.messages![0].uid;
    const rel = contactState(s, "mummy").rel;
    s = reduce(s, { type: "reply", uid, choice: 0 });
    s = reduce(s, { type: "reply", uid, choice: 1 });
    expect(contactState(s, "mummy").rel).toBe(rel + 3);
  });
});

describe("invitations", () => {
  it("arrive over the days, and can be accepted or declined", () => {
    let s = fresh({ money: 100_000 });
    const full = { hunger: 100, energy: 100, fun: 100, social: 100, hygiene: 100, bladder: 100 };
    for (let d = 0; d < 6; d++) s = passTime({ ...s, needs: full }, 24 * 60);
    expect(s.ending).toBeNull();
    const open = openInvites(s);
    expect(open.length).toBeGreaterThan(0);
    const rep = s.rep ?? 0;
    const accepted = reduce({ ...s, needs: { ...s.needs, energy: 90 } }, { type: "invite", uid: open[0].uid, accept: true });
    expect(accepted.invites?.find(i => i.uid === open[0].uid)?.status).toBe("accepted");
    expect(accepted.rep ?? 0).toBeGreaterThan(rep);
    const declined = reduce(s, { type: "invite", uid: open[0].uid, accept: false });
    expect(declined.invites?.find(i => i.uid === open[0].uid)?.status).toBe("declined");
  });
});

describe("daily rewards", () => {
  it("credits once per claim id", () => {
    let s = fresh();
    s = reduce(s, { type: "daily", id: "2026-10-29", streakDay: 3, amount: 2_000, server: true });
    s = reduce(s, { type: "daily", id: "2026-10-29", streakDay: 3, amount: 2_000, server: true });
    expect(s.money).toBe(fresh().money + 2_000);
    expect(s.daily?.length).toBe(1);
  });
});

describe("progress", () => {
  it("level, status and score grow as you progress", () => {
    const s = fresh();
    expect(level(s)).toBe(1);
    expect(statusTier(s)).toBe(0);
    const big = { ...rich(), rep: 70, stats: { ...s.stats, promotions: 3, shifts: 40 } };
    expect(level(big)).toBeGreaterThan(level(s));
    expect(statusTier(big)).toBe(4);
    expect(score(big)).toBeGreaterThan(score(s));
    expect(achievements(big).map(a => a.id)).toContain("worth1m");
    expect(scoreFrom(scoreParts(s))).toBe(score(s));
    expect(levelFor(150)).toBe(2);
  });
});

describe("camera", () => {
  it("remembers the view mode in the save", () => {
    expect(reduce(fresh(), { type: "camera", mode: "first" }).camera).toBe("first");
  });
});
