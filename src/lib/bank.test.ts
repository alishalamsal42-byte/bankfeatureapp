import { describe, expect, it } from "vitest";
import { BANK, bankCoversRest, bankDollars, paymentSplit, typicalPurchase } from "./bank";

describe("Chase bank points", () => {
  it("starts at 2,340 pts worth $23.40 (1 cent each)", () => {
    expect(BANK.startingPoints).toBe(2340);
    expect(bankDollars(2340)).toBe(23.4);
  });
  it("$9.80 lunch with $6.50 credit uses 330 Chase pts and charges $0.00", () => {
    expect(paymentSplit(9.8, 6.5, 2340, true)).toEqual({ total: 9.8, rewardCovered: 6.5, bankPts: 330, bankCovered: 3.3, charged: 0 });
  });
  it("toggle off charges the remainder to the card", () => {
    expect(paymentSplit(9.8, 6.5, 2340, false).charged).toBe(3.3);
  });
  it("partial coverage when the balance is too small", () => {
    expect(paymentSplit(9.8, 6.5, 100, true)).toMatchObject({ bankPts: 100, charged: 2.3 });
    expect(bankCoversRest(9.8, 6.5, 100)).toBe(false);
  });
  it("typical food purchase is $9.80", () => expect(typicalPurchase({ category: "Food", minSpend: 0, value: 6.5 })).toBe(9.8));
});
