import { describe, expect, it } from "vitest";
import { calculateInputs, habitScore, models } from "./model";
import { eventLabel, initialLearning, learn } from "./learning";

const ctx = { hour: 20, dayOfWeek: 3, hoursSinceLast: 12 };

describe("online learning", () => {
  it("Not now: weight += 0.3 × (0 − predicted) × input, intercept with input 1", () => {
    const p = habitScore("coffee", 20, 3, 12);
    const x = calculateInputs(20, 3, 12, "coffee");
    const s = learn(initialLearning(), "coffee", "skip", ctx);
    expect(s.models.coffee.intercept).toBeCloseTo(models.coffee.intercept - 0.3 * p, 12);
    expect(s.models.coffee.weights.evening).toBeCloseTo(models.coffee.weights.evening - 0.3 * p * x.evening, 12);
    expect(s.models.coffee.weights.morning).toBe(models.coffee.weights.morning);
    expect(s.models.food).toEqual(models.food);
  });
  it("ignored notification uses half the learning rate", () => {
    const p = habitScore("coffee", 20, 3, 12);
    expect(learn(initialLearning(), "coffee", "ignored", ctx).models.coffee.intercept).toBeCloseTo(models.coffee.intercept - 0.15 * p, 12);
  });
  it("redeem raises likely now and moves usual hour 20% toward now", () => {
    const s = learn(initialLearning(), "coffee", "redeem", ctx);
    expect(habitScore("coffee", 20, 3, 12, s)).toBeGreaterThan(habitScore("coffee", 20, 3, 12));
    expect(s.usualHour.coffee_weekday).toBeCloseTo(9 + 0.2 * 11, 12);
    expect(s.usualHour.coffee_weekend).toBe(13);
  });
  it("never mutates the trained weights", () => {
    learn(initialLearning(), "coffee", "redeem", ctx);
    expect(models.coffee.intercept).toBe(-3.8075);
  });
  it("labels events", () => expect(eventLabel({ category: "coffee", kind: "skip", dayOfWeek: 3, hour: 20, at: "" })).toBe("Coffee · Not now · Wed 8 PM"));
});
