import { db, ensureDatabaseReady } from "@/db/dexie";
import { createTaskModel } from "@/domains/tasks/models";
import { CreateTaskInput, Task } from "@/domains/tasks/types";
import { computeGoalProgress } from "@/domains/goals/goal-progress";
import { normalizeTask, sortTasksByOrder } from "@/domains/tasks/task.utils";
import { createLogger } from "@/utils/logger";

const taskLogger = createLogger("tasks");

async function syncGoalStatus(goalId: string): Promise<void> {
  const goal = await db.goals.get(goalId);

  if (!goal || goal.status === "paused" || goal.status === "archived") {
    return;
  }

  const tasks = await db.tasks.where("goalId").equals(goalId).toArray();
  const progress = computeGoalProgress(goal, tasks.map(normalizeTask));
  const nextStatus =
    progress.total > 0 && progress.percentage >= 100 ? "completed" : "active";

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
    const tasks = await db.tasks.where("goalId").equals(goalId).toArray();
    return sortTasksByOrder(tasks.map(normalizeTask));
  },
  async add(input: CreateTaskInput): Promise<Task> {
    await ensureDatabaseReady();
    let nextInput = input;

    if (input.goalId && input.sortOrder === undefined) {
      const existingGoalTasks = await db.tasks.where("goalId").equals(input.goalId).toArray();
      const orderedGoalTasks = sortTasksByOrder(existingGoalTasks.map(normalizeTask));
      const lastTask = orderedGoalTasks[orderedGoalTasks.length - 1];

      nextInput = {
        ...input,
        sortOrder: lastTask ? lastTask.sortOrder + 1 : Date.now(),
      };
    }

    const task = createTaskModel(nextInput);
    await db.tasks.add(task);

    if (task.goalId) {
      await syncGoalStatus(task.goalId);
    }

    return task;
  },
  async addTaskToGoal(goalId: string, input: CreateTaskInput): Promise<Task> {
    return this.add({
      ...input,
      goalId,
    });
  },
  async update(task: Task): Promise<Task> {
    await ensureDatabaseReady();
    const existingTask = await db.tasks.get(task.id);
    const normalizedTask = normalizeTask(task);
    await db.tasks.put({
      ...normalizedTask,
      updatedAt: Date.now(),
    });

    if (existingTask?.goalId && existingTask.goalId !== normalizedTask.goalId) {
      await syncGoalStatus(existingTask.goalId);
    }

    if (normalizedTask.goalId) {
      await syncGoalStatus(normalizedTask.goalId);
    }

    return normalizedTask;
  },
  async toggleTaskComplete(taskId: string): Promise<Task | undefined> {
    await ensureDatabaseReady();
    const task = await db.tasks.get(taskId);

    if (!task) {
      return undefined;
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

    return updatedTask;
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
  async remove(id: string): Promise<Task | undefined> {
    await ensureDatabaseReady();
    const task = await db.tasks.get(id);
    await db.tasks.delete(id);

    if (task?.goalId) {
      await syncGoalStatus(task.goalId);
    }

    return task ? normalizeTask(task) : undefined;
  },
  async reorderGoalTasks(goalId: string, orderedTaskIds: string[]): Promise<Task[]> {
    await ensureDatabaseReady();
    const existingTasks = (await db.tasks.where("goalId").equals(goalId).toArray()).map(normalizeTask);
    const taskById = new Map(existingTasks.map((task) => [task.id, task]));
    const orderedTasks = orderedTaskIds
      .map((taskId) => taskById.get(taskId))
      .filter((task): task is Task => Boolean(task));
    const trailingTasks = sortTasksByOrder(existingTasks).filter(
      (task) => !orderedTaskIds.includes(task.id),
    );
    const timestamp = Date.now();
    const nextTasks = [...orderedTasks, ...trailingTasks].map((task, index) => ({
      ...task,
      sortOrder: index,
      updatedAt: timestamp,
    }));

    await db.transaction("rw", db.tasks, async () => {
      await Promise.all(nextTasks.map((task) => db.tasks.put(task)));
    });

    taskLogger.info("goal task order updated", {
      goalId,
      taskCount: nextTasks.length,
    });

    return nextTasks;
  },
};
