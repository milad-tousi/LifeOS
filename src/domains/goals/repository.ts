import { db } from "@/db/dexie";
import { createGoalModel } from "@/domains/goals/models";
import { Goal } from "@/domains/goals/types";

export const goalsRepository = {
  async getAll(): Promise<Goal[]> {
    return db.goals.toArray();
  },
  async add(title: string): Promise<string> {
    const goal = createGoalModel(title);
    await db.goals.add(goal);
    return goal.id;
  },
  async update(goal: Goal): Promise<string> {
    await db.goals.put(goal);
    return goal.id;
  },
  async remove(id: string): Promise<void> {
    await db.goals.delete(id);
  },
};
