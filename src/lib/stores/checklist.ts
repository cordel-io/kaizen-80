import { db, type ChecklistItem } from "../db/schema";

export async function createChecklistItem(
  date: string,
  text: string,
): Promise<ChecklistItem> {
  const id = await db.checklistItems.add({
    date,
    text,
    completed: false,
  });
  return (await db.checklistItems.get(id)) as ChecklistItem;
}

export async function updateChecklistItem(
  id: number,
  newText: string,
): Promise<void> {
  await db.checklistItems.update(id, { text: newText });
}

export async function deleteChecklistItem(id: number): Promise<void> {
  await db.checklistItems.delete(id);
}

export async function getChecklistForDate(
  date: string,
): Promise<ChecklistItem[]> {
  return db.checklistItems.where("date").equals(date).toArray();
}
