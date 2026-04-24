import { db, ensureDatabaseReady } from "@/db/dexie";
import { normalizeGoal, normalizeGoalInput } from "@/domains/goals/goal.utils";
import { createGoalModel } from "@/domains/goals/models";
import { CreateGoalInput, Goal, GoalStatus } from "@/domains/goals/types";
import { tasksRepository } from "@/domains/tasks/repository";

export const goalsRepository = {
  async getAll(): Promise<Goal[]> {
    await ensureDatabaseReady();
    const goals = await db.goals.orderBy("createdAt").reverse().toArray();
    return goals.map(normalizeGoal);
  },
  async getActiveGoals(): Promise<Goal[]> {
    const goals = await this.getAll();
    return goals.filter((goal) => goal.status === "active");
  },
  async getById(goalId: string): Promise<Goal | undefined> {
    await ensureDatabaseReady();
    const goal = await db.goals.get(goalId);
    return goal ? normalizeGoal(goal) : undefined;
  },
  async add(input: CreateGoalInput): Promise<string> {
    await ensureDatabaseReady();
    const goal = createGoalModel(input);
    await db.goals.add(goal);
    return goal.id;
  },
  async update(goalId: string, patch: Partial<Omit<Goal, "id" | "createdAt">>): Promise<Goal> {
    await ensureDatabaseReady();
    const goal = await db.goals.get(goalId);

    if (!goal) {
      throw new Error("Goal not found.");
    }

    const updatedGoal = normalizeGoal({
      ...normalizeGoal(goal),
      ...normalizeGoalInput({
        title: patch.title ?? goal.title,
        description: patch.description ?? goal.description,
        category: patch.category ?? goal.category,
        priority: patch.priority ?? goal.priority,
        pace: patch.pace ?? goal.pace,
        deadline: patch.deadline ?? goal.deadline,
        progressType: patch.progressType ?? goal.progressType,
        targetType: patch.targetType ?? goal.targetType,
        targetValue: patch.targetValue ?? goal.targetValue,
        currentValue: patch.currentValue ?? goal.currentValue,
        manualProgress: patch.manualProgress ?? goal.manualProgress,
        notes: patch.notes ?? goal.notes,
      }),
      status: patch.status ?? goal.status,
      updatedAt: Date.now(),
      createdAt: goal.createdAt,
      id: goal.id,
    });

    await db.goals.put(updatedGoal);
    return updatedGoal;
  },
  async remove(id: string): Promise<void> {
    await ensureDatabaseReady();
    const linkedTasks = await tasksRepository.getByGoalId(id);
    await Promise.all(linkedTasks.map((task) => tasksRepository.unlinkTaskFromGoal(task.id)));
    await db.goals.delete(id);
  },
  async archive(goalId: string): Promise<Goal> {
    return this.update(goalId, { status: "archived" });
  },
  async pause(goalId: string): Promise<Goal> {
    return this.update(goalId, { status: "paused" });
  },
  async complete(goalId: string): Promise<Goal> {
    const linkedTasks = await tasksRepository.getByGoalId(goalId);
    const hasValidTasks = linkedTasks.some((task) => task.status !== "cancelled");

    if (!hasValidTasks) {
      throw new Error("A goal needs at least one valid task before it can be completed.");
    }

    return this.update(goalId, { status: "completed" });
  },
  async setStatus(goalId: string, status: GoalStatus): Promise<Goal> {
    return this.update(goalId, { status });
  },
};
