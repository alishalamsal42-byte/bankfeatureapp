import { describe, expect, it } from "vitest";
import { bankOfferOrder, bankPointsForOffer, bankSelectionEnabled, canFundOffer, offerSavings } from "./bank";

describe("Credit points on picked offers", () => {
  it("shows the current AI pick first without duplicating it or changing the remaining ranking", () => {
    const a = { id: "coffee" }, b = { id: "food" }, c = { id: "shopping" };
    expect(bankOfferOrder(b, [a, b], [c])).toEqual([b, a, c]);
    expect(bankOfferOrder(null, [], [c, a])).toEqual([c, a]);
  });
  it("shows the same 330 Credit points used by a $9.80 lunch with a $6.50 reward", () => {
    expect(bankPointsForOffer({ category: "Food", minSpend: 0, value: 6.5 }, 2340)).toBe(330);
    expect(bankPointsForOffer({ category: "Food", minSpend: 0, value: 6.5 }, 100)).toBe(100);
  });
  it("Use points enables Credit points even when automatic use is off", () => {
    expect(bankSelectionEnabled(true, false, true)).toBe(true);
    expect(bankSelectionEnabled(false, false, true)).toBe(false);
    expect(bankSelectionEnabled(true, true, false)).toBe(false);
  });
});

import { offerRewardValue as orv, bankPointsForOffer as bpo } from "./bank";
import { getOffer as go, examplePartnerIds as ep } from "./rewards";
describe("bank-funded card offers", () => {
  it("Netflix and Spotify use 700 and 600 Credit points and are not connected apps", () => {
    expect(bpo(go("netflix"), 2340)).toBe(700);
    expect(bpo(go("spotify"), 2340)).toBe(600);
    expect(orv(go("netflix"))).toBe(0);
    expect(ep).not.toContain("netflix");
    expect(ep).not.toContain("spotify");
  });
  it("requires all 700 points and a connected card to fund Netflix", () => {
    expect(canFundOffer(go("netflix"), 700, true)).toBe(true);
    expect(canFundOffer(go("netflix"), 699, true)).toBe(false);
    expect(canFundOffer(go("netflix"), 2340, false)).toBe(false);
  });
  it("counts the $7 Netflix points payment once in savings", () => {
    expect(offerSavings(go("netflix"), 700)).toBe(7);
    expect(offerSavings(go("coffee"), 75)).toBe(6);
  });
});

import { offerCostLabel } from "./rewards";
describe("offer cost wording", () => {
  it("never says Card offer", () => {
    expect(offerCostLabel(go("netflix"))).toBe("Use 700 Credit points · $7.00");
    expect(offerCostLabel(go("amazon"))).toBe("Use 1,000 Credit points · $10.00");
    expect(offerCostLabel(go("lunch"))).toBe("$1.80 off");
    expect(bpo(go("amazon"), 2340)).toBe(1000);
  });
});

import { offerCostShort } from "./rewards";
describe("compact cost under offers", () => {
  it("shows just the points number for card offers", () => {
    expect(offerCostShort(go("netflix"))).toBe("700 pts");
    expect(offerCostShort(go("spotify"))).toBe("600 pts");
    expect(offerCostShort(go("amazon"))).toBe("1,000 pts");
    for (const id of ["netflix", "spotify", "amazon"]) {
      expect(offerCostShort(go(id))).not.toContain("Credit points");
    }
  });
  it("keeps merchant and no-points wording", () => {
    expect(offerCostShort(go("coffee"))).toBe("750 pts · $5.25");
    expect(offerCostShort(go("lunch"))).toBe("$1.80 off");
  });
});
