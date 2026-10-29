import { describe, expect, it } from "vitest";
import { defaultHoursSinceLast, hoursSinceLast, msUntilMidnight } from "./mock-history";
import { getOffer } from "./rewards";

describe("realistic mock data over time", () => {
  it("expiries are relative to opening the app", () => {
    expect(getOffer("coffee").expires).toBe("Tomorrow");
    expect(getOffer("amazon").expires).toBe("2 days");
    expect(getOffer("cfa").expires).toBe("3 days");
    expect(getOffer("bb").expires).toBe("6 days");
  });
  it("a redemption sets that category's hours since last purchase from the real clock", () => {
    const now = Date.parse("2026-10-28T20:00:00");
    const h = hoursSinceLast(defaultHoursSinceLast, { coffee: now - 2 * 3_600_000 }, now);
    expect(h.coffee).toBe(2);
    expect(h.food).toBe(7);
  });
  it("caps elapsed time at 168 hours", () => expect(hoursSinceLast(defaultHoursSinceLast, { food: 0 }, Date.parse("2026-10-28")).food).toBe(168));
  it("next reset is at local midnight", () => expect(msUntilMidnight(new Date(2026, 9, 28, 23, 0, 0))).toBe(3_600_000));
});
