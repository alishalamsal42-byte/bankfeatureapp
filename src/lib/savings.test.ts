import { describe, expect, it } from "vitest";
import { byScope, rescued, seedRedemptions, smartPicks, weekly, stats } from "./savings";

const now = new Date("2026-10-28T20:00:00");
const seed = seedRedemptions(now);

describe("savings", () => {
  it("seeds 12 redemptions over 8 weeks", () => {
    expect(seed).toHaveLength(12);
    expect(weekly(seed, now)).toHaveLength(8);
  });
  it("rescued from expiring totals $31.50 all time", () => expect(rescued(seed)).toBe(31.5));
  it("8 of 12 came from a suggestion", () => {
    const s = smartPicks(seed);
    expect([s.suggested, s.total]).toEqual([8, 12]);
  });
  it("this month only counts October", () => expect(stats(byScope(seed, "month", now)).count).toBe(7));
  it("current week is last bar", () => expect(weekly(seed, now)[7]).toBe(25.05));
});
