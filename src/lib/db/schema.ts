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
}

export class KaizenDatabase extends Dexie {
  habits!: EntityTable<Habit, "id">;
  entries!: EntityTable<Entry, "id">;
  dailyLogs!: EntityTable<DailyLog, "id">;

  constructor() {
    super("kaizen-80");

    this.version(1).stores({
      habits: "++id, name, createdAt",
      entries: "++id, habitId, date, completed"
    });

    this.version(2).stores({
      habits: "++id, name, createdAt",
      entries: "++id, habitId, date, completed",
      dailyLogs: "++id, &date"
    });
  }
}

export const db = new KaizenDatabase();
