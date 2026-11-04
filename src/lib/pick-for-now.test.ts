import { describe, expect, it } from "vitest";
import { pickForNow, pickTop } from "./model";

describe("AI pick fallback", () => {
  const closed = { id: "closed", scores: { habit: 0.5, match: 0.4 }, distanceMiles: 0.2, openHours: { open: 7, close: 15 } };
  const lunch = { id: "lunch", scores: { habit: 0.4, match: 0.3 }, distanceMiles: 0.1, validHours: [11, 15] as const };
  const distant = { id: "distant", scores: { habit: 0.01, match: 0.001 }, distanceMiles: 2 };
  it("does not label a closed or out-of-hours offer as the current pick", () => {
    expect(pickForNow([closed, lunch, distant], 16.5, () => true, 3)?.id).toBe("distant");
    expect(pickForNow([closed, lunch], 16.5, () => true, 3)).toBeUndefined();
  });
  it("keeps a scored AI fallback without promoting it to notification eligibility", () => {
    expect(pickForNow([distant], 16.5, () => true, 3)?.id).toBe("distant");
    expect(pickTop([distant], 16.5, () => true, 3)).toBeUndefined();
  });
  it("respects interests even when choosing a fallback", () => {
    expect(pickForNow([distant], 16.5, () => false, 3)).toBeUndefined();
  });
});