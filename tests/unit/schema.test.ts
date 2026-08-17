import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { KaizenDatabase, db } from "../../src/lib/db/schema";

describe("db", () => {
  it("is exported as a singleton instance", async () => {
    const { db: dbAgain } = await import("../../src/lib/db/schema");
    expect(dbAgain).toBe(db);
  });
});

describe("KaizenDatabase", () => {
  let testDb: KaizenDatabase;

  beforeEach(() => {
    testDb = new KaizenDatabase();
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it("adds a habit and retrieves it", async () => {
    const id = await testDb.habits.add({
      name: "Meditate",
      createdAt: "2026-08-17"
    });

    const habit = await testDb.habits.get(id);

    expect(habit).toMatchObject({
      id,
      name: "Meditate",
      createdAt: "2026-08-17"
    });
  });

  it("adds an entry and queries it by habitId", async () => {
    const habitId = await testDb.habits.add({
      name: "Meditate",
      createdAt: "2026-08-17"
    } as never);

    await testDb.entries.add({
      habitId,
      date: "2026-08-17",
      completed: true
    });
    await testDb.entries.add({
      habitId: habitId + 1,
      date: "2026-08-17",
      completed: false
    });

    const entries = await testDb.entries.where("habitId").equals(habitId).toArray();

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      habitId,
      date: "2026-08-17",
      completed: true
    });
  });
});
