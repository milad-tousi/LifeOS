import { db, ensureDatabaseReady } from "@/db/dexie";
import { createTaskModel } from "@/domains/tasks/models";
import { CreateTaskInput, Task } from "@/domains/tasks/types";
import { getGoalTaskStats } from "@/domains/goals/goal-progress";
import { normalizeTask } from "@/domains/tasks/task.utils";
import { createLogger } from "@/utils/logger";

const taskLogger = createLogger("tasks");

async function syncGoalStatus(goalId: string): Promise<void> {
  const goal = await db.goals.get(goalId);

  if (!goal || goal.status === "paused" || goal.status === "archived") {
    return;
  }

  const tasks = await db.tasks.where("goalId").equals(goalId).toArray();
  const stats = getGoalTaskStats(tasks.map(normalizeTask));
  const nextStatus =
    stats.total > 0 && stats.completed === stats.total ? "completed" : "active";

  if (goal.status !== nextStatus) {
    await db.goals.put({
      ...goal,
      status: nextStatus,
      updatedAt: Date.now(),
    });
  }
}

export const tasksRepository = {
  async getAll(): Promise<Task[]> {
    await ensureDatabaseReady();
    const tasks = await db.tasks.orderBy("createdAt").reverse().toArray();
    return tasks.map(normalizeTask);
  },
  async getByGoalId(goalId: string): Promise<Task[]> {
    await ensureDatabaseReady();
    const tasks = await db.tasks.where("goalId").equals(goalId).sortBy("createdAt");
    return tasks.map(normalizeTask);
  },
  async add(input: CreateTaskInput): Promise<string> {
    await ensureDatabaseReady();
    const task = createTaskModel(input);
    await db.tasks.add(task);

    if (task.goalId) {
      await syncGoalStatus(task.goalId);
    }

    return task.id;
  },
  async addTaskToGoal(goalId: string, input: CreateTaskInput): Promise<string> {
    return this.add({
      ...input,
      goalId,
    });
  },
  async update(task: Task): Promise<string> {
    await ensureDatabaseReady();
    const normalizedTask = normalizeTask(task);
    await db.tasks.put({
      ...normalizedTask,
      updatedAt: Date.now(),
    });

    if (normalizedTask.goalId) {
      await syncGoalStatus(normalizedTask.goalId);
    }

    return normalizedTask.id;
  },
  async toggleTaskComplete(taskId: string): Promise<void> {
    await ensureDatabaseReady();
    const task = await db.tasks.get(taskId);

    if (!task) {
      return;
    }

    const normalizedTask = normalizeTask(task);
    const nextStatus = normalizedTask.status === "done" ? "todo" : "done";
    const updatedTask: Task = {
      ...normalizedTask,
      status: nextStatus,
      completedAt: nextStatus === "done" ? Date.now() : undefined,
      updatedAt: Date.now(),
    };

    await db.tasks.put(updatedTask);

    if (task.goalId) {
      await syncGoalStatus(task.goalId);
    }
  },
  async unlinkTaskFromGoal(taskId: string): Promise<void> {
    await ensureDatabaseReady();
    const task = await db.tasks.get(taskId);

    if (!task) {
      return;
    }

    const normalizedTask = normalizeTask(task);

    await db.tasks.put({
      ...normalizedTask,
      goalId: undefined,
      updatedAt: Date.now(),
    });

    if (normalizedTask.goalId) {
      await syncGoalStatus(normalizedTask.goalId);
    }
  },
  async remove(id: string): Promise<void> {
    await ensureDatabaseReady();
    const task = await db.tasks.get(id);
    await db.tasks.delete(id);

    if (task?.goalId) {
      await syncGoalStatus(task.goalId);
    }
  },
  reorderGoalTasks(): void {
    taskLogger.info("goal task reordering is skipped for MVP because task ordering is not stored");
  },
};
