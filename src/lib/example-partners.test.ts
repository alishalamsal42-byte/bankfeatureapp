import { describe, expect, it } from "vitest";
import { pickBestNow, pickTop, rankRewards } from "./model";
import { mockPlaces } from "./model-fixtures";
import { demoOffers, getOffer, expiryLabel, offers } from "./rewards";
import { presets } from "../hooks/recommendation-demo";
import { sarahHistory } from "./sarah-history";

const run = (name: string) => {
  const p = presets[name]!;
  const ranked = rankRewards(demoOffers, { hour: p.hour, dayOfWeek: p.dayOfWeek, hoursSinceLast: p.hoursSinceLast, location: mockPlaces[p.place], spendVelocity: p.spendPace });
  return { top: pickTop(ranked, p.hour, () => true, p.dayOfWeek), best: pickBestNow(ranked, p.hour, () => true, p.dayOfWeek) };
};

describe("example grocery and online partners", () => {
  it("uses the supplied values", () => {
    expect(getOffer("publix")).toMatchObject({ title: "$5 off $40+", value: 5, minSpend: 40, expiresInDays: 6, distanceMiles: 0.8, openHours: { open: 7, close: 22 }, modelCategory: "grocery" });
    expect(getOffer("target")).toMatchObject({ title: "$4 off $30+ groceries", points: 400, value: 4, minSpend: 30, expiresInDays: 9, distanceMiles: 1.6, openHours: { open: 8, close: 22 } });
    expect(getOffer("walmart")).toMatchObject({ points: 300, value: 3, expiresInDays: 14, distanceMiles: 2.4, openHours: { open: 6, close: 23 } });
    expect(getOffer("netflix")).toMatchObject({ points: 0, bankFunded: true, value: 7, title: "$7 credit on your next bill", expiresInDays: 3, online: true, modelCategory: "online", renews: true });
    expect(getOffer("spotify")).toMatchObject({ points: 0, bankFunded: true, value: 6, title: "$6 credit on Premium Student", expiresInDays: 5, online: true, modelCategory: "online", renews: true });
  });
  it("every Grocery and Online reward uses its trained model", () => {
    for (const o of offers) {
      if (o.category === "Grocery") expect(o.modelCategory).toBe("grocery");
      if (o.category === "Online") expect(o.modelCategory).toBe("online");
    }
  });
  it("subscriptions say Renews", () => {
    expect(expiryLabel({ renews: true, expiresInDays: 3 })).toBe("Renews in 3 days");
    expect(expiryLabel({ expiresInDays: 6 })).toBe("Expires in 6 days");
  });
  it("demo places the stores near Town Center and drops Fresh Basket", () => {
    expect(demoOffers.find(o => o.id === "fresh-basket")).toBeUndefined();
    expect(demoOffers.find(o => o.id === "publix")?.mapPoint).toEqual([2, 0.5]);
    expect(demoOffers.find(o => o.id === "walmart")?.mapPoint).toEqual([2.3, 0.6]);
    expect(getOffer("target").mapPoint).toEqual([2.05, 0.55]);
    expect(demoOffers.filter(o => o.online).map(o => o.merchant).sort()).toEqual(["Amazon", "Netflix", "Spotify"]);
  });
  it("Sunday errands picks Publix at about 18%", () => {
    const { top } = run("Sunday errands");
    expect(top?.merchant).toBe("Publix");
    expect(top!.scores.habit).toBeCloseTo(0.18, 2);
  });
  it("Quiet night's good option is online", () => expect(run("Quiet night").best?.online).toBe(true));
  it("other presets keep their picks", () => {
    expect(run("Morning coffee").top?.merchant).toBe("Starbucks");
    expect(run("Morning coffee").top!.scores.habit).toBeCloseTo(0.45, 2);
    expect(run("Lunch break").top!.scores.habit).toBeCloseTo(0.51, 2);
  });
  it("history no longer says Grocery store", () => {
    const g = sarahHistory.filter(e => e[2] === "grocery").map(e => e[3]);
    expect(g.length).toBeGreaterThan(0);
    expect(new Set(g)).toEqual(new Set(["Publix", "Target", "Walmart"]));
  });
});
