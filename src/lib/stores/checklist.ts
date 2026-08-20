import { writable, type Writable } from "svelte/store";
import { db, type ChecklistItem } from "../db/schema";

export const checklistItems: Writable<ChecklistItem[]> = writable([]);

export async function getChecklistForDate(
  dateKey: string,
): Promise<ChecklistItem[]> {
  const items = await db.checklistItems.where({ date: dateKey }).sortBy("id");
  checklistItems.set(items);
  return items;
}

export async function createChecklistItem(
  dateKey: string,
  text: string,
): Promise<ChecklistItem> {
  const id = await db.checklistItems.add({
    date: dateKey,
    text,
    completed: false,
    createdAt: new Date().toISOString(),
  });
  const item = (await db.checklistItems.get(id)) as ChecklistItem;
  await getChecklistForDate(dateKey);
  return item;
}

export async function updateChecklistItem(
  id: number,
  patch: Partial<Pick<ChecklistItem, "text" | "completed">>,
): Promise<void> {
  const item = await db.checklistItems.get(id);
  if (!item) return;
  await db.checklistItems.update(id, patch);
  await getChecklistForDate(item.date);
}

export async function deleteChecklistItem(id: number): Promise<void> {
  const item = await db.checklistItems.get(id);
  if (!item) return;
  await db.checklistItems.delete(id);
  await getChecklistForDate(item.date);
}
