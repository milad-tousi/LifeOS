import { db } from "@/db/dexie";
import { createHabitModel } from "@/domains/habits/models";
import { Habit } from "@/domains/habits/types";

export const habitsRepository = {
  async getAll(): Promise<Habit[]> {
    return db.habits.orderBy("createdAt").reverse().toArray();
  },
  async add(name: string): Promise<string> {
    const habit = createHabitModel({ title: name });
    await db.habits.add(habit);
    return habit.id;
  },
  async update(habit: Habit): Promise<string> {
    await db.habits.put(habit);
    return habit.id;
  },
  async remove(id: string): Promise<void> {
    await db.habits.delete(id);
  },
};
