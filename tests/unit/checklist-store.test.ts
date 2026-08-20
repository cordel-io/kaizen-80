import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../src/lib/db/schema";
import {
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  getChecklistForDate,
} from "../../src/lib/stores/checklist";
import { calculateStreak } from "../../src/lib/logic/streaks";

describe("checklist store", () => {
  beforeEach(async () => {
    await db.checklistItems.clear();
    await db.habits.clear();
    await db.entries.clear();
  });

  it("creates items for a date", async () => {
    await createChecklistItem("2026-08-17", "Buy groceries");

    const items = await getChecklistForDate("2026-08-17");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      date: "2026-08-17",
      text: "Buy groceries",
      completed: false,
    });
  });

  it("edits an item's text", async () => {
    const item = await createChecklistItem("2026-08-17", "Buy groceries");

    await updateChecklistItem(item.id, "Buy more groceries");

    const items = await getChecklistForDate("2026-08-17");
    expect(items).toHaveLength(1);
    expect(items[0].text).toBe("Buy more groceries");
  });

  it("deletes an item", async () => {
    const item = await createChecklistItem("2026-08-17", "Buy groceries");

    await deleteChecklistItem(item.id);

    const items = await getChecklistForDate("2026-08-17");
    expect(items).toHaveLength(0);
  });

  it("returns an empty list for a date with no items", async () => {
    await createChecklistItem("2026-08-17", "Buy groceries");

    const items = await getChecklistForDate("2026-08-18");
    expect(items).toEqual([]);
  });

  it("does not affect calculateStreak output", async () => {
    const habitId = await db.habits.add({
      name: "Meditate",
      createdAt: "2026-08-14",
    } as never);

    const entries = [
      { date: "2026-08-14", completed: true },
      { date: "2026-08-15", completed: true },
      { date: "2026-08-16", completed: true },
      { date: "2026-08-17", completed: true },
    ];
    for (const entry of entries) {
      await db.entries.add({ habitId, ...entry });
    }

    await createChecklistItem("2026-08-14", "Freeform task one");
    await createChecklistItem("2026-08-16", "Freeform task two");

    const storedEntries = await db.entries
      .where("habitId")
      .equals(habitId)
      .toArray();

    expect(calculateStreak(storedEntries, 0)).toBe(4);
  });
});
