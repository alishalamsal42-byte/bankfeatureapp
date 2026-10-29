import { describe, expect, it } from "vitest";
import { pointsEarned, recentTransactions, spendingSummary, typicalAmount } from "./banking";
import type { Purchase } from "./sarah-history";

const DAY = 86_400_000, now = 100 * DAY;
const p = (daysAgo: number, category: string, merchant = "X"): Purchase => ({ at: now - daysAgo * DAY, category, merchant });

describe("bank helpers", () => {
  it("card earns 1 point per dollar", () => expect([5.75, 11.4, 38.2].map(pointsEarned)).toEqual([5, 11, 38]));
  it("recent transactions are newest first with typical amounts", () => {
    const t = recentTransactions([p(3, "coffee", "Starbucks"), p(1, "food", "Chipotle"), p(-1, "ride")], now, 5);
    expect(t.map(x => x.merchant)).toEqual(["Chipotle", "Starbucks"]);
    expect(t[0]).toMatchObject({ amount: typicalAmount["food"], points: 11 });
  });
  it("compares this week to the usual week", () => {
    const list = [p(1, "coffee"), p(2, "coffee"), p(9, "coffee"), p(16, "coffee"), p(23, "coffee")];
    const s = spendingSummary(list, now);
    expect(s.thisWeek).toBeCloseTo(11.5, 2);
    expect(s.usualWeek).toBeCloseTo((5 * 5.75) / 4, 2);
    expect(s.byCategory[0]).toEqual({ category: "coffee", amount: 28.75 });
  });
});
