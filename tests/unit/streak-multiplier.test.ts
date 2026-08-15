import { describe, expect, it } from "vitest";
import { calculateStreakMultiplier } from "../../src/lib/logic/streak-multiplier";

describe("calculateStreakMultiplier", () => {
  it("returns 1 for 0 days", () => {
    expect(calculateStreakMultiplier(0)).toBe(1);
  });

  it("returns 1.01 for 1 day", () => {
    expect(calculateStreakMultiplier(1)).toBeCloseTo(1.01, 3);
  });

  it("returns approximately 1.3478 for 30 days", () => {
    expect(calculateStreakMultiplier(30)).toBeCloseTo(1.3478, 3);
  });
});
