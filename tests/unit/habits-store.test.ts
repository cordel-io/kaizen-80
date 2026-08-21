import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { get } from "svelte/store";
import { db } from "../../src/lib/db/schema";
import {
  addHabit,
  deleteHabit,
  getHabits,
  habits,
  updateHabit,
} from "../../src/lib/stores/habits";
import { calculateStreak } from "../../src/lib/logic/streaks";

describe("habits store", () => {
  beforeEach(async () => {
    await db.habits.clear();
    await db.entries.clear();
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

  it("updateHabit renames a habit and updates the store", async () => {
    const habit = await addHabit("Meditate");

    const updated = await updateHabit(habit.id, "Meditate Daily");

    expect(updated.name).toBe("Meditate Daily");
    const current = get(habits);
    expect(current).toHaveLength(1);
    expect(current[0]).toMatchObject({ id: habit.id, name: "Meditate Daily" });
  });

  it("deleteHabit removes the habit from the active list", async () => {
    const keep = await addHabit("Meditate");
    const remove = await addHabit("Read");

    await deleteHabit(remove.id);

    const current = get(habits);
    expect(current).toHaveLength(1);
    expect(current[0]).toMatchObject({ id: keep.id, name: "Meditate" });
  });

  it("deleteHabit cascades to remove the habit's past entries", async () => {
    const habit = await addHabit("Meditate");
    await db.entries.add({ habitId: habit.id, date: "2026-08-18", completed: true } as never);
    await db.entries.add({ habitId: habit.id, date: "2026-08-19", completed: true } as never);

    await deleteHabit(habit.id);

    const entries = await db.entries.where({ habitId: habit.id }).sortBy("date");
    expect(entries).toHaveLength(0);
  });

  it("streak calculation for a renamed habit is unaffected", async () => {
    const habit = await addHabit("Meditate");
    await db.entries.add({ habitId: habit.id, date: "2026-08-17", completed: true } as never);
    await db.entries.add({ habitId: habit.id, date: "2026-08-18", completed: true } as never);
    await db.entries.add({ habitId: habit.id, date: "2026-08-19", completed: true } as never);

    const entriesBefore = await db.entries.where({ habitId: habit.id }).sortBy("date");
    const streakBefore = calculateStreak(entriesBefore, 0);

    await updateHabit(habit.id, "Meditate Daily");

    const entriesAfter = await db.entries.where({ habitId: habit.id }).sortBy("date");
    const streakAfter = calculateStreak(entriesAfter, 0);

    expect(streakAfter).toBe(streakBefore);
    expect(streakAfter).toBe(3);
  });
});
