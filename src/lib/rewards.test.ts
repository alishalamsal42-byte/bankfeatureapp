import { describe, it, expect } from "vitest";
import { netSavings, partners, offers, partnerLogo } from "./rewards";

describe("partners", () => {
  it("Sarah drives, so there are no ride offers", () => {
    expect(offers.filter(o => o.category === "Travel").map(o => o.merchant)).toEqual([]);
    expect(partnerLogo["Starbucks"]).toBeTruthy();
  });
  it("lists merchant programs; Amazon is a bank-funded offer, not a connected app", () => {
    expect([...partners]).toEqual([
      "Starbucks",
      "Chick-fil-A",
      "Taco Bell",
      "TJ Maxx",
      "McDonald's",
      "Burger King",
      "Chipotle",
      "Best Buy",
      "Nike",
    ]);
  });
});

describe("netSavings", () => {
  it("$8 off $25+ is a net loss when the student planned to spend $12", () => {
    expect(netSavings({ value: 8, minSpend: 25 }, 12)).toBe(-5);
  });
  it("offer with no minimum keeps its full value", () => {
    expect(netSavings({ value: 1.8, minSpend: 0 }, 12)).toBe(1.8);
  });
});

import { closestProgress as cp, offers as allOffers } from "./rewards";
describe("progress card", () => {
  it("shows McDonald's McFlurry at 380 / 500 (120 to go)", () => {
    expect(cp(allOffers)).toMatchObject({ merchant: "McDonald's", reward: "McFlurry", balance: 380, goal: 500, toGo: 120 });
  });
  it("never picks a merchant whose reward is already redeemable and picks fewest points to go", () => {
    const apps = [
      { merchant: "Starbucks", points: 750, unlock: { reward: "drink", goal: 750 } },
      { merchant: "A", points: 100, unlock: { reward: "x", goal: 500 } },
      { merchant: "B", points: 450, unlock: { reward: "y", goal: 500 } },
    ];
    expect(cp(apps)?.merchant).toBe("B");
  });
});
