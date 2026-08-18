import { db } from "../db/schema";

export async function toggleEntry(
  habitId: number,
  dateKey: string,
): Promise<void> {
  const existing = await db.entries.where({ habitId, date: dateKey }).first();

  if (!existing) {
    await db.entries.add({
      habitId,
      date: dateKey,
      completed: true,
    } as never);
    return;
  }

  await db.entries.update(existing.id, { completed: !existing.completed });
}
