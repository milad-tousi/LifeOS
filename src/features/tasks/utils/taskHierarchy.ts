import { Task } from "@/domains/tasks/types";
import { Goal } from "@/domains/goals/types";

export interface TaskTreeNode {
  task: Task;
  children: TaskTreeNode[];
}

export function getRootTasksForGoal(tasks: Task[], goalId: string): Task[] {
  return tasks.filter((task) => task.goalId === goalId && !task.parentTaskId);
}

export function isSubtask(task: Task): boolean {
  return Boolean(task.parentTaskId);
}

export function getParentTask(task: Task, tasks: Task[]): Task | undefined {
  return task.parentTaskId ? tasks.find((item) => item.id === task.parentTaskId) : undefined;
}

export function getRootTask(task: Task, tasks: Task[]): Task {
  return tasks.find((item) => item.id === getRootTaskId(task.id, tasks)) ?? task;
}

export function getGoalForTask(task: Task, tasks: Task[], goals: Goal[]): Goal | undefined {
  const rootTask = getRootTask(task, tasks);
  const goalId = task.goalId ?? rootTask.goalId;

  return goalId ? goals.find((goal) => goal.id === goalId) : undefined;
}

export function getChildTasks(tasks: Task[], parentTaskId: string): Task[];
export function getChildTasks(parentTaskId: string, tasks: Task[]): Task[];
export function getChildTasks(first: Task[] | string, second: string | Task[]): Task[] {
  const tasks = Array.isArray(first) ? first : second;
  const parentTaskId = Array.isArray(first) ? second : first;

  if (!Array.isArray(tasks) || typeof parentTaskId !== "string") {
    return [];
  }

  return tasks.filter((task) => task.parentTaskId === parentTaskId);
}

export function buildTaskTree(tasks: Task[], rootTaskId: string): TaskTreeNode | null {
  const rootTask = tasks.find((task) => task.id === rootTaskId);

  if (!rootTask) {
    return null;
  }

  return buildTaskTreeNode(rootTask, tasks, new Set<string>());
}

export function buildGoalTaskTree(tasks: Task[], goalId: string): TaskTreeNode[] {
  return getRootTasksForGoal(tasks, goalId).map((task) =>
    buildTaskTreeNode(task, tasks, new Set<string>()),
  );
}

export function getAllDescendantTasks(tasks: Task[], parentTaskId: string): Task[];
export function getAllDescendantTasks(parentTaskId: string, tasks: Task[]): Task[];
export function getAllDescendantTasks(first: Task[] | string, second: string | Task[]): Task[] {
  const tasks = Array.isArray(first) ? first : second;
  const parentTaskId = Array.isArray(first) ? second : first;
  const descendants: Task[] = [];
  const visitedTaskIds = new Set<string>();

  if (!Array.isArray(tasks) || typeof parentTaskId !== "string") {
    return descendants;
  }

  collectDescendants(parentTaskId);
  return descendants;

  function collectDescendants(currentParentTaskId: string): void {
    if (visitedTaskIds.has(currentParentTaskId)) {
      return;
    }

    visitedTaskIds.add(currentParentTaskId);
    getChildTasks(tasks, currentParentTaskId).forEach((childTask) => {
      descendants.push(childTask);
      collectDescendants(childTask.id);
    });
  }
}

export function getTaskDepth(taskId: string, tasks: Task[]): number {
  let depth = 0;
  let cursor = tasks.find((task) => task.id === taskId);
  const visitedTaskIds = new Set<string>();

  while (cursor?.parentTaskId && !visitedTaskIds.has(cursor.id)) {
    visitedTaskIds.add(cursor.id);
    const parentTask = tasks.find((task) => task.id === cursor?.parentTaskId);

    if (!parentTask) {
      break;
    }

    depth += 1;
    cursor = parentTask;
  }

  return depth;
}

export function getRootTaskId(taskId: string, tasks: Task[]): string {
  let cursor = tasks.find((task) => task.id === taskId);
  const visitedTaskIds = new Set<string>();

  while (cursor?.parentTaskId && !visitedTaskIds.has(cursor.id)) {
    visitedTaskIds.add(cursor.id);
    const parentTask = tasks.find((task) => task.id === cursor?.parentTaskId);

    if (!parentTask) {
      break;
    }

    cursor = parentTask;
  }

  return cursor?.id ?? taskId;
}

export function ensureGoalIdForSubtree(tasks: Task[], rootTaskId: string, goalId: string): Task[] {
  const descendantIds = new Set(getAllDescendantTasks(tasks, rootTaskId).map((task) => task.id));
  descendantIds.add(rootTaskId);

  return tasks.map((task) => (descendantIds.has(task.id) ? { ...task, goalId } : task));
}

export function wouldCreateTaskHierarchyCycle(
  tasks: Task[],
  taskId: string,
  nextParentTaskId: string,
): boolean {
  if (taskId === nextParentTaskId) {
    return true;
  }

  let cursor = tasks.find((task) => task.id === nextParentTaskId);
  const visitedTaskIds = new Set<string>();

  while (cursor?.parentTaskId) {
    if (cursor.parentTaskId === taskId) {
      return true;
    }

    if (visitedTaskIds.has(cursor.id)) {
      return true;
    }

    visitedTaskIds.add(cursor.id);
    cursor = tasks.find((task) => task.id === cursor?.parentTaskId);
  }

  return false;
}

function buildTaskTreeNode(task: Task, tasks: Task[], visitedTaskIds: Set<string>): TaskTreeNode {
  if (visitedTaskIds.has(task.id)) {
    return { task, children: [] };
  }

  const nextVisitedTaskIds = new Set(visitedTaskIds);
  nextVisitedTaskIds.add(task.id);

  return {
    task,
    children: getChildTasks(tasks, task.id).map((childTask) =>
      buildTaskTreeNode(childTask, tasks, nextVisitedTaskIds),
    ),
  };
}
