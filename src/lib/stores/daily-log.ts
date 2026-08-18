import { writable, type Writable } from "svelte/store";
import { db } from "../db/schema";

export type DailyLogDraft = {
  spiritualWin: string;
  mentalWin: string;
  physicalWin: string;
  gratitude: string[];
  reflection: string;
};

function emptyDraft(): DailyLogDraft {
  return {
    spiritualWin: "",
    mentalWin: "",
    physicalWin: "",
    gratitude: ["", "", ""],
    reflection: ""
  };
}

export const dailyLog: Writable<DailyLogDraft> = writable(emptyDraft());

export async function getDailyLog(dateKey: string): Promise<DailyLogDraft> {
  const existing = await db.dailyLogs.where("date").equals(dateKey).first();

  const draft: DailyLogDraft = existing
    ? {
        spiritualWin: existing.spiritualWin,
        mentalWin: existing.mentalWin,
        physicalWin: existing.physicalWin,
        gratitude: existing.gratitude,
        reflection: existing.reflection
      }
    : emptyDraft();

  dailyLog.set(draft);
  return draft;
}

export async function saveDailyLog(
  dateKey: string,
  patch: Partial<DailyLogDraft>
): Promise<DailyLogDraft> {
  const existing = await db.dailyLogs.where("date").equals(dateKey).first();

  if (existing) {
    await db.dailyLogs.update(existing.id, patch);
  } else {
    await db.dailyLogs.add({ date: dateKey, ...emptyDraft(), ...patch });
  }

  return getDailyLog(dateKey);
}
