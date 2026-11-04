import { describe, expect, it } from "vitest";
import { pickBestNow, pickTop, rankRewards } from "./model";
import { mockPlaces } from "./model-fixtures";
import { demoOffers } from "./rewards";
import { presets } from "../hooks/recommendation-demo";

const run = (name: string) => {
  const p = presets[name]!;
  const ranked = rankRewards(demoOffers, { hour: p.hour, dayOfWeek: p.dayOfWeek, hoursSinceLast: p.hoursSinceLast, location: mockPlaces[p.place], spendVelocity: p.spendPace });
  return { ranked, top: pickTop(ranked, p.hour, () => true, p.dayOfWeek), best: pickBestNow(ranked, p.hour, () => true, p.dayOfWeek) };
};

describe("night demo presets", () => {
  it("Late-night food (Wed 10 PM, Residence halls, meal 4 h ago) picks Taco Bell at about 23%", () => {
    const { top } = run("Late-night food");
    expect(top?.merchant).toBe("Taco Bell");
    expect(top!.scores.habit).toBeCloseTo(0.23, 2);
    expect(top!.distanceMiles).toBeLessThanOrEqual(0.1);
    expect(top!.scores.match).toBeGreaterThanOrEqual(0.115);
  });
  it("Quiet night (Wed 9 PM, just had dinner) has no top pick", () => {
    expect(run("Quiet night").top).toBeUndefined();
  });
  it("the demo lunch deal is never suggested at night", () => {
    const { ranked } = run("Late-night food");
    const grill = ranked.find(r => r.id === "campus-grill");
    expect(grill?.validHours).toEqual([11, 15]);
  });
  it("Lunch break still picks Campus Grill", () => {
    expect(run("Lunch break").top?.id).toBe("campus-grill");
  });
  it("Quiet night has no strong pick, but Amazon is the best option right now", () => {
    const { top, best } = run("Quiet night");
    expect(top).toBeUndefined();
    expect(best?.merchant).toBe("Amazon");
  });
  it("Afternoon coffee (Tue 3:30 PM, Library) has no strong pick but shows coffee as the best option", () => {
    const { top, best } = run("Afternoon coffee");
    expect(top).toBeUndefined();
    expect(best?.merchant).toBe("Starbucks");
  });
  it("no ride offers are ranked, since Sarah drives", () => {
    expect(run("Afternoon coffee").ranked.some(r => r.modelCategory === "ride")).toBe(false);
  });
  it("the best option is never a closed or out-of-hours reward", () => {
    for (const name of Object.keys(presets)) {
      const p = presets[name]!;
      const { best } = run(name);
      if (best) expect(best.validHours === undefined || (p.hour >= best.validHours[0] && p.hour < best.validHours[1]), name).toBe(true);
    }
  });
});
