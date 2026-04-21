import { db, ensureDatabaseReady } from "@/db/dexie";
import { createGoalModel } from "@/domains/goals/models";
import { CreateGoalInput, Goal, GoalStatus } from "@/domains/goals/types";
import { tasksRepository } from "@/domains/tasks/repository";

export const goalsRepository = {
  async getAll(): Promise<Goal[]> {
    await ensureDatabaseReady();
    return db.goals.orderBy("createdAt").reverse().toArray();
  },
  async getById(goalId: string): Promise<Goal | undefined> {
    await ensureDatabaseReady();
    return db.goals.get(goalId);
  },
  async add(input: CreateGoalInput): Promise<string> {
    await ensureDatabaseReady();
    const goal = createGoalModel(input);
    await db.goals.add(goal);
    return goal.id;
  },
  async update(goalId: string, patch: Partial<Omit<Goal, "id" | "createdAt">>): Promise<string> {
    await ensureDatabaseReady();
    const goal = await db.goals.get(goalId);

    if (!goal) {
      throw new Error("Goal not found.");
    }

    const updatedGoal: Goal = {
      ...goal,
      ...patch,
      updatedAt: Date.now(),
    };

    await db.goals.put(updatedGoal);
    return updatedGoal.id;
  },
  async remove(id: string): Promise<void> {
    await ensureDatabaseReady();
    const linkedTasks = await tasksRepository.getByGoalId(id);
    await Promise.all(linkedTasks.map((task) => tasksRepository.unlinkTaskFromGoal(task.id)));
    await db.goals.delete(id);
  },
  async archive(goalId: string): Promise<string> {
    return this.update(goalId, { status: "archived" });
  },
  async pause(goalId: string): Promise<string> {
    return this.update(goalId, { status: "paused" });
  },
  async complete(goalId: string): Promise<string> {
    const linkedTasks = await tasksRepository.getByGoalId(goalId);
    const hasValidTasks = linkedTasks.some((task) => task.status !== "cancelled");

    if (!hasValidTasks) {
      throw new Error("A goal needs at least one valid task before it can be completed.");
    }

    return this.update(goalId, { status: "completed" });
  },
  async setStatus(goalId: string, status: GoalStatus): Promise<string> {
    return this.update(goalId, { status });
  },
};
