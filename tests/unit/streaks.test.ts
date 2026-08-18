import { describe, expect, it } from "vitest";
import { calculateStreak } from "../../src/lib/logic/streaks";

describe("calculateStreak", () => {
  it("counts every day when none are missed", () => {
    const entries = [
      { date: "2026-08-14", completed: true },
      { date: "2026-08-15", completed: true },
      { date: "2026-08-16", completed: true },
      { date: "2026-08-17", completed: true },
    ];

    expect(calculateStreak(entries, 0)).toBe(4);
  });

  it("preserves the streak through a missed day when a freeze is available", () => {
    const entries = [
      { date: "2026-08-14", completed: true },
      { date: "2026-08-15", completed: true },
      { date: "2026-08-16", completed: false },
      { date: "2026-08-17", completed: true },
    ];

    expect(calculateStreak(entries, 1)).toBe(3);
  });

  it("resets the streak to 0 on a missed day with no freezes remaining", () => {
    const entries = [
      { date: "2026-08-14", completed: true },
      { date: "2026-08-15", completed: true },
      { date: "2026-08-16", completed: false },
      { date: "2026-08-17", completed: true },
    ];

    expect(calculateStreak(entries, 0)).toBe(1);
  });
});
