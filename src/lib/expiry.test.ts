import { describe, expect, it } from "vitest";
import { DAY_MS, liveExpiry } from "./expiry";

const start = new Date(2026, 9, 28, 20, 0).getTime();
describe("fixed demo expiry", () => {
  it("Starbucks expires 1 day after first open", () => expect(liveExpiry(1, start, start)).toMatchObject({ expires: "Tomorrow", expired: false }));
  it("Best Buy shows 6 days at first open", () => expect(liveExpiry(6, start, start).expires).toBe("6 days"));
  it("counts down without moving: next morning Starbucks expires today", () => expect(liveExpiry(1, start, new Date(2026, 9, 29, 9).getTime()).expires).toBe("Today"));
  it("passes expiry exactly 24h later", () => {
    expect(liveExpiry(1, start, start + DAY_MS - 1).expired).toBe(false);
    expect(liveExpiry(1, start, start + DAY_MS).expired).toBe(true);
  });
});
