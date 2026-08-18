import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { get } from "svelte/store";
import { db } from "../../src/lib/db/schema";
import { addHabit, getHabits, habits } from "../../src/lib/stores/habits";

describe("habits store", () => {
  beforeEach(async () => {
    await db.habits.clear();
    habits.set([]);
  });

  it("updates the store when a habit is added", async () => {
    await addHabit("Meditate");

    const current = get(habits);
    expect(current).toHaveLength(1);
    expect(current[0]).toMatchObject({ name: "Meditate" });
  });

  it("getHabits returns all habits currently in the table", async () => {
    await addHabit("Meditate");
    await addHabit("Read");

    const result = await getHabits();

    expect(result).toHaveLength(2);
    expect(result.map((h) => h.name).sort()).toEqual(["Meditate", "Read"]);
    expect(get(habits)).toEqual(result);
  });
});
