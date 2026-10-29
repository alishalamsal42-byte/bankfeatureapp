import { describe, expect, it } from "vitest";
import { bankOfferOrder, bankPointsForOffer, bankSelectionEnabled } from "./bank";

describe("Bank points on picked offers", () => {
  it("shows the current AI pick first without duplicating it or changing the remaining ranking", () => {
    const a = { id: "coffee" }, b = { id: "food" }, c = { id: "shopping" };
    expect(bankOfferOrder(b, [a, b], [c])).toEqual([b, a, c]);
    expect(bankOfferOrder(null, [], [c, a])).toEqual([c, a]);
  });
  it("shows the same 330 Bank points used by a $9.80 lunch with a $6.50 reward", () => {
    expect(bankPointsForOffer({ category: "Food", minSpend: 0, value: 6.5 }, 2340)).toBe(330);
    expect(bankPointsForOffer({ category: "Food", minSpend: 0, value: 6.5 }, 100)).toBe(100);
  });
  it("Use points enables Bank points even when automatic use is off", () => {
    expect(bankSelectionEnabled(true, false, true)).toBe(true);
    expect(bankSelectionEnabled(false, false, true)).toBe(false);
    expect(bankSelectionEnabled(true, true, false)).toBe(false);
  });
});

import { offerRewardValue as orv, bankPointsForOffer as bpo } from "./bank";
import { getOffer as go, examplePartnerIds as ep } from "./rewards";
describe("bank-funded card offers", () => {
  it("Netflix and Spotify use 700 and 600 Bank points and are not connected apps", () => {
    expect(bpo(go("netflix"), 2340)).toBe(700);
    expect(bpo(go("spotify"), 2340)).toBe(600);
    expect(orv(go("netflix"))).toBe(0);
    expect(ep).not.toContain("netflix");
    expect(ep).not.toContain("spotify");
  });
});
