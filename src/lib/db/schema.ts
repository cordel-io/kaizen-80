import Dexie, { type EntityTable } from "dexie";

export interface Habit {
  id: number;
  name: string;
  createdAt: string;
}

export interface Entry {
  id: number;
  habitId: number;
  date: string;
  completed: boolean;
}

export interface DailyLog {
  id: number;
  date: string;
  spiritualWin: string;
  mentalWin: string;
  physicalWin: string;
  gratitude: string[];
  reflection: string;
  updatedAt?: string;
}

export interface ChecklistItem {
  id: number;
  date: string;
  text: string;
  completed: boolean;
}

export class KaizenDatabase extends Dexie {
  habits!: EntityTable<Habit, "id">;
  entries!: EntityTable<Entry, "id">;
  dailyLogs!: EntityTable<DailyLog, "id">;
  checklistItems!: EntityTable<ChecklistItem, "id">;

  constructor() {
    super("kaizen-80");

    this.version(1).stores({
      habits: "++id, name, createdAt",
      entries: "++id, habitId, date, completed",
    });

    this.version(2).stores({
      habits: "++id, name, createdAt",
      entries: "++id, habitId, date, completed",
      dailyLogs: "++id, &date",
    });

    this.version(3).stores({
      habits: "++id, name, createdAt",
      entries: "++id, habitId, date, completed",
      dailyLogs: "++id, &date",
      checklistItems: "++id, date",
    });
  }
}

export const db = new KaizenDatabase();
