import { describe, expect, it } from "vitest";
import { bannersAllowed, byExpiryThenValue, expiryAlertCandidate, inQuietHours, interestsFirst, toggleInterest } from "./preferences";
import { canNotify } from "./notifications";
import { scoreReward } from "./model";

describe("preferences rules", () => {
  it("keeps at least one interest selected", () => {
    expect(toggleInterest(["Coffee"], "Coffee")).toEqual(["Coffee"]);
    expect(toggleInterest(["Coffee", "Food"], "Coffee")).toEqual(["Food"]);
  });
  it("puts unselected categories lower", () => {
    const list = [{ id: "a", category: "Travel" }, { id: "b", category: "Coffee" }];
    expect(interestsFirst(list, ["Coffee"]).map(o => o.id)).toEqual(["b", "a"]);
  });
  it("history off sorts by expiry then value", () => {
    const list = [{ id: "a", expiresInDays: 5, value: 9 }, { id: "b", expiresInDays: 1, value: 2 }, { id: "c", expiresInDays: 1, value: 4 }];
    expect(byExpiryThenValue(list).map(o => o.id)).toEqual(["c", "b", "a"]);
  });
  it("quiet hours are 10 PM to 8 AM", () => {
    expect([22, 23, 0, 7].every(inQuietHours)).toBe(true);
    expect([8, 21].some(inQuietHours)).toBe(false);
    expect(bannersAllowed({ notify: true, quiet: true }, 23)).toBe(false);
    expect(bannersAllowed({ notify: false, quiet: false }, 12)).toBe(false);
  });
  it("expiry alert picks a reward expiring tomorrow once", () => {
    const list = [{ id: "x", expiresInDays: 0 }, { id: "y", expiresInDays: 1 }];
    expect(expiryAlertCandidate(list, [])?.id).toBe("y");
    expect(expiryAlertCandidate(list, ["y"])).toBeUndefined();
  });
  it("location off scores location 1.0", () => {
    const s = scoreReward({ modelCategory: "coffee", historyCategory: "coffee", distanceMiles: 3, value: 5 }, { hour: 8, dayOfWeek: 2, hoursSinceLast: { coffee: 20 }, ignoreLocation: true });
    expect(s.location).toBe(1);
  });
  it("daily limit and location toggle gate notifications", () => {
    const r = { id: "z", online: false, distanceMiles: 0.05, modelCategory: "coffee", historyCategory: "coffee", value: 5, scores: { trained: true, match: 0.2 } } as never;
    expect(canNotify(r, { day: "d", rewardIds: ["a"] }, "d", { limit: 1 })).toBe(false);
    expect(canNotify(r, { day: "d", rewardIds: ["a", "b", "c", "e"] }, "d", { limit: 5 })).toBe(true);
    expect(canNotify(r, { day: "d", rewardIds: [] }, "d", { locationOn: false })).toBe(false);
  });
});
