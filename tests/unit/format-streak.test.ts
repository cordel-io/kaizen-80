import { describe, expect, it } from "vitest";
import { formatStreakPercentage } from "../../src/lib/logic/format-streak";

describe("formatStreakPercentage", () => {
  it("returns '0.00% improvement' for a multiplier of 1", () => {
    expect(formatStreakPercentage(1)).toBe("0.00% improvement");
  });

  it("returns '34.78% improvement' for a multiplier of 1.3478", () => {
    expect(formatStreakPercentage(1.3478)).toBe("34.78% improvement");
  });

  it("throws an Error for a multiplier below 1", () => {
    expect(() => formatStreakPercentage(0.9)).toThrow(Error);
  });
});
