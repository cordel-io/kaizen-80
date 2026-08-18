import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../src/lib/db/schema";
import { toggleEntry } from "../../src/lib/logic/toggle-entry";

describe("toggleEntry", () => {
  beforeEach(async () => {
    await db.habits.clear();
    await db.entries.clear();
  });

  afterEach(async () => {
    await db.habits.clear();
    await db.entries.clear();
  });

  it("creates a new entry as completed when none exists", async () => {
    const habitId = await db.habits.add({
      name: "Meditate",
      createdAt: "2026-08-17",
    } as never);

    await toggleEntry(habitId, "2026-08-17");

    const entries = await db.entries
      .where({ habitId, date: "2026-08-17" })
      .toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      habitId,
      date: "2026-08-17",
      completed: true,
    });
  });

  it("flips an existing entry to not completed on the second toggle", async () => {
    const habitId = await db.habits.add({
      name: "Meditate",
      createdAt: "2026-08-17",
    } as never);

    await toggleEntry(habitId, "2026-08-17");
    await toggleEntry(habitId, "2026-08-17");

    const entries = await db.entries
      .where({ habitId, date: "2026-08-17" })
      .toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      habitId,
      date: "2026-08-17",
      completed: false,
    });
  });
});
