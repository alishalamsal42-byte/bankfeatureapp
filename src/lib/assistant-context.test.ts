import { describe, expect, it } from "vitest";
import { buildAssistantContext } from "./assistant-context";
import { getOffer } from "./rewards";

const contextFor = (points: number, connected = true) => buildAssistantContext({
  dayOfWeek: 3, hour: 16.5, place: "Campus", ranked: [],
  unscored: [getOffer("netflix"), getOffer("spotify")], topPickId: "netflix",
  bank: { connected, points, dollars: points / 100 }, weekly: {}, usualHour: {}, purchases: [], prefs: {},
});

describe("assistant live reward context", () => {
  it("uses the live 1,640-point balance after a 700-point Netflix payment", () => {
    expect(contextFor(1640).context.creditPoints).toMatchObject({ points: 1640, dollars: 16.4 });
  });
  it("provides the full bank-funded cost without inventing a merchant reward", () => {
    expect(contextFor(2340).context.rewards.find(r => r.id === "netflix")).toMatchObject({
      points: 0, creditPointsCost: 700, typicalPurchase: 7, merchantRewardValue: 0, renews: true,
    });
  });
  it("does not offer a payment button without the full required balance or connected card", () => {
    expect(contextFor(640).allowedRewardIds).toEqual(["spotify"]);
    expect(contextFor(2340, false).allowedRewardIds).toEqual([]);
  });
});