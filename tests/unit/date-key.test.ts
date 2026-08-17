import { describe, expect, it } from "vitest";
import { toDateKey } from "../../src/lib/logic/date-key";

describe("toDateKey", () => {
  it("zero-pads single-digit month and day", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("rolls over correctly across a full year", () => {
    expect(toDateKey(new Date(2025, 11, 31))).toBe("2025-12-31");
    expect(toDateKey(new Date(2026, 0, 1))).toBe("2026-01-01");
  });
});
