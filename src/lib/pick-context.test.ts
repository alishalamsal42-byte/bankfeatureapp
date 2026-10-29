import { describe, expect, it } from "vitest";
import { pickedForLabel, pickReason } from "./pick-context";

describe("pick context", () => {
  it("formats the picked-for line", () => {
    expect(pickedForLabel(3, 19, "Library")).toBe("Picked for Wednesday 7:00 PM · Library");
  });
  it("uses usual time when at_usual_time", () => {
    expect(pickReason({ hour: 8, category: "coffee", atUsualTime: true, usualHour: 9, distanceMiles: 0.02 })).toBe("It’s around your usual 9 AM coffee, and you’re right here.");
  });
  it("falls back to time of day plus distance", () => {
    expect(pickReason({ hour: 19, category: "food", atUsualTime: false, distanceMiles: 0.4 })).toBe("Dinnertime, and you’re 0.4 mi away.");
  });
  it("mentions expiry only within 7 days", () => {
    expect(pickReason({ hour: 12, category: "food", atUsualTime: false, distanceMiles: 0.4, expiresInDays: 3 })).toContain("Expires in 3 days.");
    expect(pickReason({ hour: 12, category: "food", atUsualTime: false, distanceMiles: 0.4, expiresInDays: 10 })).not.toContain("Expires");
  });
  it("online and ride reasons", () => {
    expect(pickReason({ hour: 21, category: "online", atUsualTime: true, usualHour: 20, online: true })).toBe("You often shop online around 8 PM.");
    expect(pickReason({ hour: 15, category: "ride", atUsualTime: true, usualHour: 15, merchant: "Lyft", distanceMiles: 0.08 })).toBe("You usually head home around 3 PM, and a Lyft is 0.1 mi away.");
    expect(pickReason({ hour: 12, category: "food", atUsualTime: true, merchant: "Campus Grill", distanceMiles: 0.02 })).toBe("Lunchtime, and Campus Grill is right here.");
  });
});
