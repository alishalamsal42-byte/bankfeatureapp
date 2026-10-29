import { describe, expect, it } from "vitest";
import { calculateInputs, habitScore, locationScore, pointsScore, scoreReward, rankRewards, matchLabel, shouldNotify, models, usual_hour, distanceMiles, strongestFactor } from "./model";
import { mockPlaces, mockRewards } from "./model-fixtures";

describe("Python-trained habit model", () => {
  it("logs Tuesday 8 AM coffee after 20 hours, about 0.45", () => {
    const score = habitScore("coffee", 8, 2, 20);
    console.log("Tuesday 8 AM, coffee, 20 hours since last purchase: likely now", score);
    expect(score).toBeCloseTo(0.45, 2);
  });
  it("logs Tuesday noon food after 5 hours, about 0.51", () => {
    const score = habitScore("food", 12, 2, 5);
    console.log("Tuesday 12 PM, food, 5 hours since last purchase: likely now", score);
    expect(score).toBeCloseTo(0.51, 2);
  });
  it("logs Wednesday 8 PM food after 7 hours, about 0.16, and 10 PM after 4 hours, about 0.23", () => {
    const dinner = habitScore("food", 20, 3, 7);
    const late = habitScore("food", 22, 3, 4);
    console.log("Wednesday 8 PM food (7 h):", dinner, "· Wednesday 10 PM food (4 h):", late);
    expect(dinner).toBeCloseTo(0.16, 2);
    expect(late).toBeCloseTo(0.23, 2);
  });
  it("logs Wednesday 8 PM coffee after 12 hours, about 0.05", () => {
    expect(habitScore("coffee", 20, 3, 12)).toBeCloseTo(0.05, 2);
  });
  it("rounds 8:45 down to hour 8 before calculating inputs", () => {
    expect(calculateInputs(8.75, 2, 20)).toEqual(calculateInputs(8, 2, 20));
    expect(calculateInputs(10.99, 2, 20).morning).toBe(1);
    expect(calculateInputs(13.99, 2, 20, "food").lunch).toBe(1);
  });
  it("uses the exact category and day-type usual hours", () => {
    expect(usual_hour).toEqual({ coffee_weekend: 13, coffee_weekday: 9, food_weekend: 15, food_weekday: 13, grocery_weekend: 15, grocery_weekday: 17, online_weekend: 15, online_weekday: 20, ride_weekend: 22, ride_weekday: 15 });
    for (const category of ["coffee", "food", "grocery", "online", "ride"] as const) {
      for (const day of [0, 2, 6]) {
        const usual = usual_hour[`${category}_${day === 2 ? "weekday" : "weekend"}`];
        for (let hour = 0; hour < 24; hour++) {
          const inputs = calculateInputs(hour, day, 20, category);
          expect(inputs.at_usual_time).toBe(Number(Math.abs(hour - usual) <= 1));
          expect(inputs.hours_from_usual).toBe(Math.abs(hour - usual) / 12);
        }
      }
    }
  });
  it.each([
    ["morning", [7, 8, 9, 10]], ["lunch", [11, 12, 13]],
    ["afternoon", [14, 15, 16, 17]], ["evening", [18, 19, 20]], ["late_night", [21, 22, 23]],
  ] as const)("uses exact %s hours", (key, hours) => {
    for (let hour = 0; hour < 24; hour++) expect(calculateInputs(hour, 2, 20)[key]).toBe(Number((hours as readonly number[]).includes(hour)));
  });
  it("weekday is Monday through Friday only", () => {
    expect(Array.from({ length: 7 }, (_, day) => calculateInputs(8, day, 20).weekday)).toEqual([0, 1, 1, 1, 1, 1, 0]);
  });
  it("weekday_morning requires both conditions", () => {
    expect([calculateInputs(8, 2, 20).weekday_morning, calculateInputs(12, 2, 20).weekday_morning, calculateInputs(8, 0, 20).weekday_morning]).toEqual([1, 0, 0]);
  });
  it("weekend_afternoon requires both conditions", () => {
    expect([calculateInputs(14, 0, 20).weekend_afternoon, calculateInputs(14, 6, 20).weekend_afternoon, calculateInputs(14, 2, 20).weekend_afternoon, calculateInputs(12, 0, 20).weekend_afternoon]).toEqual([1, 1, 0, 0]);
  });
  it("days_since_last divides by 24 and caps at 7", () => {
    expect(calculateInputs(8, 2, 20).days_since_last).toBe(20 / 24);
    expect(calculateInputs(8, 2, 240).days_since_last).toBe(7);
  });
  it("bought_recently is strictly under 4 hours", () => {
    expect(calculateInputs(8, 2, 3.99).bought_recently).toBe(1);
    expect(calculateInputs(8, 2, 4).bought_recently).toBe(0);
  });
  it("grocery uses the supplied sigmoid weights", () => {
    const logit = -3.8509 + 0.2787 + 0.9169 + 0.2788 + 0.1414 * 2;
    expect(habitScore("grocery", 15, 6, 48)).toBeCloseTo(1 / (1 + Math.exp(-logit)), 10);
  });
  it("online uses the supplied sigmoid weights", () => {
    const logit = -5.0453 + 0.7756 + 0.8691 - 0.8697 * (2 / 12) + 0.0466 * 2;
    expect(habitScore("online", 22, 2, 48)).toBeCloseTo(1 / (1 + Math.exp(-logit)), 10);
    expect(Object.keys(models)).toEqual(["coffee", "food", "grocery", "online", "ride"]);
  });
  it("every category has a trained spend_velocity weight", () => {
    expect(Object.values(models).map(m => m.weights.spend_velocity)).toEqual([0.6702, 0.3583, -0.2718, -0.5932, 0.2543]);
  });
});

describe("supplied map-based mock rewards", () => {
  const context = { hour: 8, dayOfWeek: 2, hoursSinceLast: { coffee: 20, food: 5, grocery: 150, online: 48 }, location: mockPlaces.Library };
  it("preserves supplied merchant values and coordinates", () => {
    expect(mockRewards.map(r => [r.merchant, r.points, r.value])).toEqual([
      ["Campus Brew", 200, 7], ["Campus Grill", 0, 1.8], ["Fresh Basket", 300, 3], ["Online store", 1000, 10],
    ]);
    expect(mockRewards.slice(0, 3).map(r => "mapPoint" in r ? r.mapPoint : undefined)).toEqual([[0.3, 0.3], [0.5, 0.4], [2, 0.5]]);
    expect(mockPlaces).toEqual({ Library: [0.3, 0.32], "Student Union": [0.5, 0.42], "Residence halls": [0.45, 0.75], "Town Center": [2, 0.5] });
  });
  it("calculates straight-line miles rather than axis distances", () => {
    expect(distanceMiles([0, 0], [0.3, 0.4])).toBeCloseTo(0.5, 12);
    expect(distanceMiles(mockPlaces.Library, mockRewards[0].mapPoint)).toBeCloseTo(0.02, 12);
    expect(distanceMiles(mockPlaces["Student Union"], mockRewards[1].mapPoint)).toBeCloseTo(0.02, 12);
  });
  it("ranks all four rewards with map-derived location scores", () => {
    const ranked = rankRewards(mockRewards, context);
    expect(ranked.map(r => r.id)).toEqual(["campus-brew", "campus-grill", "online-store", "fresh-basket"]);
    expect(scoreReward(mockRewards[0], context).location).toBe(1);
    expect(scoreReward(mockRewards[1], context).location).toBe(0.6);
    expect(scoreReward(mockRewards[2], context).location).toBe(0.1);
    expect(scoreReward(mockRewards[3], context).location).toBe(1);
    expect(scoreReward(mockRewards[2], { ...context, location: mockPlaces["Town Center"] }).location).toBe(1);
  });
  it("does not treat an offline reward with missing location as nearby", () => {
    const { location, ...withoutLocation } = context;
    expect(location).toEqual(mockPlaces.Library);
    expect(() => scoreReward(mockRewards[0], withoutLocation)).toThrow(/requires a distance/);
  });
});

describe("reward matching rules", () => {
  it.each([[0.099, 1], [0.1, 0.6], [0.499, 0.6], [0.5, 0.3], [0.999, 0.3], [1, 0.1], [5, 0.1]])("location at %s miles is %s", (miles, expected) => {
    expect(locationScore(miles)).toBe(expected);
  });
  it("online location is always 1", () => expect(locationScore(100, true)).toBe(1));
  it("points uses dollar value, saturating at $10", () => {
    expect([0, 5, 10, 20].map(pointsScore)).toEqual([0.5, 0.75, 1, 1]);
  });
  const context = { hour: 8, dayOfWeek: 2, hoursSinceLast: { coffee: 20 } };
  const coffee = { modelCategory: "coffee", historyCategory: "coffee", distanceMiles: 0.05, value: 5 } as const;
  it("match is habit × location × points", () => {
    const score = scoreReward(coffee, context);
    expect(score.match).toBeCloseTo(habitScore("coffee", 8, 2, 20) * 1 * 0.75, 12);
  });
  it("ranks descending by match", () => {
    expect(rankRewards([{ ...coffee, id: "far", distanceMiles: 2 }, { ...coffee, id: "near" }], context).map(o => o.id)).toEqual(["near", "far"]);
  });
  it("only top matches >=0.115 qualify for notifications", () => {
    expect([undefined, 0.09999, 0.1149, 0.115, 0.5].map(shouldNotify)).toEqual([false, false, false, true, true]);
  });
  it("uses exact High, Medium, Low boundaries", () => {
    expect([0, 0.02999, 0.03, 0.09999, 0.10, 1].map(matchLabel)).toEqual(["Low", "Low", "Medium", "Medium", "High match", "High match"]);
  });
  it("missing category weights cannot produce a visit rate", () => {
    expect(() => scoreReward({ historyCategory: "travel", distanceMiles: 0, value: 3 }, context)).toThrow(/trained category/);
  });
  it("exports the usual-time context used by the visit-rate row", () => {
    expect(scoreReward(coffee, context)).toMatchObject({ atUsualTime: true, usualHour: 9 });
    expect(scoreReward(coffee, { ...context, hour: 11 })).toMatchObject({ atUsualTime: false, usualHour: 9 });
  });
  it("selects the strongest numeric factor for the reason", () => {
    expect(strongestFactor({ visitRate: 0.9, location: 0.6, points: 0.75 })).toBe("visitRate");
    expect(strongestFactor({ visitRate: 0.3, location: 1, points: 0.75 })).toBe("location");
    expect(strongestFactor({ visitRate: 0.3, location: 0.6, points: 1 })).toBe("points");
  });
});
import { defaultHoursSinceLast } from "./mock-history";
describe("dinnertime ranking (Wednesday 8 PM, default mock history)", () => {
  it("coffee ≈ 0.05 and food ≈ 0.16 likely now, so food ranks above coffee", () => {
    const coffee = habitScore("coffee", 20, 3, defaultHoursSinceLast.coffee);
    const food = habitScore("food", 20, 3, defaultHoursSinceLast.food);
    console.log("Wed 8 PM likely now: coffee", coffee.toFixed(3), "food", food.toFixed(3));
    expect(coffee).toBeCloseTo(0.05, 2);
    expect(food).toBeCloseTo(0.16, 2);
    const ranked = rankRewards([
      { id: "coffee", modelCategory: "coffee", historyCategory: "coffee", distanceMiles: 0.075, value: 5.25 },
      { id: "cfa", modelCategory: "food", historyCategory: "food", distanceMiles: 0.4, value: 6.5 },
    ] as const, { hour: 20, dayOfWeek: 3, hoursSinceLast: defaultHoursSinceLast });
    expect(ranked[0]?.id).toBe("cfa");
    for (const r of ranked) expect(r.scores.match).toBeCloseTo(r.scores.habit * r.scores.location * r.scores.points, 10);
  });
});

import { pickTop, TOP_PICK_MIN_LIKELY } from "./model";
describe("top pick requires likely now >= 8%", () => {
  const starbucks = { id: "coffee", modelCategory: "coffee", historyCategory: "coffee", mapPoint: mockPlaces.Library, value: 5.25 } as const;
  it("threshold is 0.08", () => expect(TOP_PICK_MIN_LIKELY).toBe(0.08));
  it("Wednesday 8 PM, coffee 12h ago: no top pick", () => {
    const ranked = rankRewards([starbucks], { hour: 20, dayOfWeek: 3, hoursSinceLast: { coffee: 12 }, location: mockPlaces.Library });
    expect(ranked[0]!.scores.habit).toBeLessThan(0.08);
    expect(pickTop(ranked, 20)).toBeUndefined();
  });
  it("Tuesday 8 AM at the Library, coffee 20h ago: Starbucks at ~45%", () => {
    const top = pickTop(rankRewards([starbucks], { hour: 8, dayOfWeek: 2, hoursSinceLast: { coffee: 20 }, location: mockPlaces.Library }), 8);
    expect(top?.id).toBe("coffee");
    expect(top!.scores.habit).toBeCloseTo(0.45, 2);
  });
});

import { offers } from "./rewards";
import { hoursLabel, isValidAt } from "./model";
import { pickReason } from "./pick-context";
describe("dinnertime food pick (Wednesday 8 PM, meal 7h ago, coffee 12h ago)", () => {
  const ctx = { hour: 20, dayOfWeek: 3, hoursSinceLast: { coffee: 12, food: 7, grocery: 72, online: 100 } };
  const ranked = rankRewards(offers.filter(o => !(o.unlock && o.points < o.unlock.goal)), ctx);
  it("logs every food reward and picks the closest qualifying food reward within 1 mile", () => {
    for (const r of ranked.filter(r => r.historyCategory === "food"))
      console.log(`${r.merchant}: likely now ${r.scores.habit.toFixed(3)} · location ${r.scores.location} (${r.distanceMiles} mi) · points ${r.scores.points.toFixed(3)} · match ${r.scores.match.toFixed(4)} · valid ${isValidAt(r, 20)}`);
    const top = pickTop(ranked, 20);
    expect(top?.merchant).toBe("Chick-fil-A");
    const qualifyingFood = ranked.filter(r => r.historyCategory === "food" && isValidAt(r, 20) && (r.distanceMiles ?? 9) <= 1);
    expect(Math.min(...qualifyingFood.map(r => r.distanceMiles ?? 9))).toBe(top!.distanceMiles);
  });
  it("Chipotle lunch is only valid 11 AM–3 PM", () => {
    const chipotle = offers.find(o => o.id === "lunch")!;
    expect([isValidAt(chipotle, 10.99), isValidAt(chipotle, 11), isValidAt(chipotle, 14.5), isValidAt(chipotle, 15)]).toEqual([false, true, true, false]);
    expect(hoursLabel(chipotle.validHours!)).toBe("Available 11 AM–3 PM");
  });
  it("rewards beyond 1 mile can't be top pick", () => {
    const bk = ranked.find(r => r.id === "bk")!;
    expect(pickTop([{ ...bk, scores: { ...bk.scores, habit: 0.5 } }], 20)).toBeUndefined();
  });
  it("food reason names time of day and merchant distance", () => {
    expect(pickReason({ hour: 20, category: "food", atUsualTime: false, merchant: "Chick-fil-A", distanceMiles: 0.4 })).toBe("Dinnertime, and Chick-fil-A is 0.4 mi away.");
    expect(pickReason({ hour: 12, category: "food", atUsualTime: true, usualHour: 12.5, merchant: "Chipotle", distanceMiles: 0.2 })).toBe("Lunchtime, and Chipotle is 0.2 mi away.");
  });
});

import { spendVelocityFromHistory, spendPaceLabel, type Purchase } from "./sarah-history";
describe("spend velocity", () => {
  it("Tuesday noon food: about 0.48 at 0.6, 0.51 at 1.0, 0.55 at 1.4", () => {
    const at = (v: number) => habitScore("food", 12, 2, 5, undefined, v);
    console.log("Tuesday noon food by spending pace: 0.6 →", at(0.6), "1.0 →", at(1), "1.4 →", at(1.4));
    expect(at(0.6)).toBeCloseTo(0.48, 2);
    expect(at(1)).toBeCloseTo(0.51, 2);
    expect(at(1.4)).toBeCloseTo(0.55, 2);
  });
  it("model input is velocity − 1, capped at 2.5", () => {
    expect(calculateInputs(12, 2, 5, "food", usual_hour, 1).spend_velocity).toBe(0);
    expect(calculateInputs(12, 2, 5, "food", usual_hour, 1.4).spend_velocity).toBeCloseTo(0.4, 12);
    expect(calculateInputs(12, 2, 5, "food", usual_hour, 9).spend_velocity).toBe(1.5);
    expect(calculateInputs(12, 2, 5).spend_velocity).toBe(0);
  });
  it("scoring context passes spend velocity through to the match", () => {
    const r = { modelCategory: "food", historyCategory: "food", distanceMiles: 0.05, value: 8 } as const;
    const ctx = { hour: 12, dayOfWeek: 2, hoursSinceLast: { food: 5 } };
    expect(scoreReward(r, { ...ctx, spendVelocity: 1.4 }).habit).toBeGreaterThan(scoreReward(r, { ...ctx, spendVelocity: 0.6 }).habit);
  });
  it("is last 7 days ÷ (last 28 days ÷ 4), all categories, 1.0 with no history", () => {
    const day = 86_400_000, now = 100 * day;
    const p = (daysAgo: number): Purchase => ({ at: now - daysAgo * day, category: "coffee", merchant: "Starbucks" });
    expect(spendVelocityFromHistory([], now)).toBe(1);
    const even = [1, 2, 8, 9, 15, 16, 22, 23].map(p);          // 2 a week, every week
    expect(spendVelocityFromHistory(even, now)).toBe(1);
    const busy = [1, 2, 3, 4, 8, 15, 22, 25].map(p);           // 4 this week, 8 in 28 days
    expect(spendVelocityFromHistory(busy, now)).toBe(2);
    expect(spendVelocityFromHistory(Array.from({ length: 20 }, (_, i) => p(i / 4)), now)).toBe(2.5);
  });
  it("pace labels: below 0.9 lighter, above 1.1 higher", () => {
    expect([0.6, 0.89, 0.9, 1, 1.1, 1.11, 1.4].map(spendPaceLabel)).toEqual(["lighter than usual", "lighter than usual", "normal", "normal", "normal", "a bit higher than usual", "a bit higher than usual"]);
  });
});
