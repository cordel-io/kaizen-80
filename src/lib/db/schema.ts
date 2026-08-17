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

export class KaizenDatabase extends Dexie {
  habits!: EntityTable<Habit, "id">;
  entries!: EntityTable<Entry, "id">;

  constructor() {
    super("kaizen-80");

    this.version(1).stores({
      habits: "++id, name, createdAt",
      entries: "++id, habitId, date, completed"
    });
  }
}

export const db = new KaizenDatabase();
