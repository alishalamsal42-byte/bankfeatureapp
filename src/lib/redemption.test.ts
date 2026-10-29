import { describe, expect, it } from "vitest";
import { cardPayment, formatCountdown, isCardOffer, redemptionCode } from "./redemption";

describe("redemption", () => {
  it("builds codes like RW-COFFEE-4821", () => expect(redemptionCode("coffee", 4821)).toBe("RW-COFFEE-4821"));
  it("counts down mm:ss and stops at zero", () => {
    expect(formatCountdown(14 * 60_000 + 32_000)).toBe("14:32");
    expect(formatCountdown(-5)).toBe("0:00");
  });
  it("card offers are the ones with no points cost", () => {
    expect(isCardOffer({ points: 0 })).toBe(true);
    expect(isCardOffer({ points: 750 })).toBe(false);
  });
  it("splits a card payment into points covered and charged", () => {
    expect(cardPayment({ value: 8, minSpend: 25 })).toEqual({ total: 25, covered: 8, charged: 17 });
    expect(cardPayment({ value: 1.8, minSpend: 0 })).toEqual({ total: 12, covered: 1.8, charged: 10.2 });
  });
});

import { detailAction, expiryDays, minSpendShortfall } from "./redemption";
describe("connect detail actions", () => {
  it("Best Buy $90 total needs $10 more for $100+", () => expect(minSpendShortfall(90, 100)).toBe(10));
  it("qualifying total has no shortfall", () => expect(minSpendShortfall(120, 100)).toBe(0));
  it("McDonald's 380/500 hands off", () => expect(detailAction({ id: "mcd", points: 380, unlock: { goal: 500 } })).toBe("handoff"));
  it("card offers use offer, points use reward, Chase pays", () => {
    expect(detailAction({ id: "taco", points: 0 })).toBe("offer");
    expect(detailAction({ id: "coffee", points: 750 })).toBe("reward");
    expect(detailAction({ id: "chase", points: 2340 })).toBe("bank");
  });
  it("parses expiry days", () => { expect(expiryDays("6 days")).toBe(6); expect(expiryDays("No expiry")).toBeUndefined(); });
});
