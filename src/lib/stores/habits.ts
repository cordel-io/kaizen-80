import { writable, type Writable } from "svelte/store";
import { db, type Habit } from "../db/schema";

export const habits: Writable<Habit[]> = writable([]);

export async function getHabits(): Promise<Habit[]> {
  const all = await db.habits.toArray();
  habits.set(all);
  return all;
}

export async function addHabit(name: string): Promise<Habit> {
  const id = await db.habits.add({
    name,
    createdAt: new Date().toISOString(),
  });
  const habit = (await db.habits.get(id)) as Habit;
  await getHabits();
  return habit;
}
