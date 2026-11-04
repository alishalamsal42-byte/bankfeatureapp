import { describe, expect, it } from "vitest";
import { habitScore } from "./model";
import { hoursSinceFromHistory, purchasesAsOf, spendVelocityFromHistory, HISTORY_CATEGORIES as CATS } from "./sarah-history";

describe("weekday lunchtime", () => {
  it.each([11, 12, 13])("predicts Sarah grabbing lunch at %i:30", h => {
    const now = new Date(2026, 10, 4, h, 30); const p = purchasesAsOf(now);
    const hs = hoursSinceFromHistory(p, now.getTime()); const v = spendVelocityFromHistory(p, now.getTime());
    const scores = CATS.map(c => [c, habitScore(c, h, now.getDay(), hs[c], undefined, v)] as const).sort((a, b) => b[1] - a[1]);
    expect(scores[0]![0]).toBe("food");
    expect(scores[0]![1]).toBeGreaterThan(0.4);
  });
});
