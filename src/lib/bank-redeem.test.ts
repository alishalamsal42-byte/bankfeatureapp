import { describe, expect, it } from "vitest";
import { allCashBack, BANK, canAfford, giftCardCode, pointsFor } from "./bank";

describe("Chase points redemption options", () => {
  it("1 point = 1 cent", () => {
    expect(pointsFor(5)).toBe(500);
    expect(pointsFor(23.4)).toBe(2340);
    expect(BANK.startingPoints).toBe(2340);
  });
  it("checks the balance covers the amount", () => {
    expect(canAfford(2340, 20)).toBe(true);
    expect(canAfford(2340, 23.4)).toBe(true);
    expect(canAfford(2340, 25)).toBe(false);
    expect(canAfford(2340, 0)).toBe(false);
  });
  it("use-all cash back rounds down to whole dollars", () => {
    expect(allCashBack(2340)).toBe(23);
    expect(allCashBack(99)).toBe(0);
  });
  it("gift card codes look like real codes and are stable", () => {
    expect(giftCardCode("Starbucks", 1)).toMatch(/^STA-\d{4}-\d{4}$/);
    expect(giftCardCode("Starbucks", 1)).toBe(giftCardCode("Starbucks", 1));
    expect(giftCardCode("Chick-fil-A", 1)).toMatch(/^CHI-/);
  });
});
