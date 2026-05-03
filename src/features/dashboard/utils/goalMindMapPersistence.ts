import { tasksRepository } from "@/domains/tasks/repository";
import { CreateTaskInput, Task } from "@/domains/tasks/types";
import {
  loadGoalMindMapLayout,
  saveGoalMindMapLayout,
} from "@/features/dashboard/utils/goalMindMapStorage";
import { getAllDescendantTasks } from "@/features/tasks/utils/taskHierarchy";

export async function linkTaskToGoal(taskId: string, goalId: string): Promise<Task | undefined> {
  const task = await findTask(taskId);

  if (!task) {
    return undefined;
  }

  const updatedTask = await tasksRepository.update({
    ...task,
    goalId,
    parentTaskId: null,
  });
  await updateDescendantGoalIds(task.id, goalId);
  return updatedTask;
}

export async function linkSubtaskToParent(
  subtaskId: string,
  parentTaskId: string,
  fallbackGoalId?: string,
): Promise<Task | undefined> {
  const [subtask, parentTask] = await Promise.all([findTask(subtaskId), findTask(parentTaskId)]);

  if (!subtask || !parentTask) {
    return undefined;
  }

  if (subtask.parentTaskId && subtask.parentTaskId !== parentTaskId) {
    const previousParentTask = await findTask(subtask.parentTaskId);
    if (previousParentTask) {
      await removeEmbeddedSubtaskFromParent(previousParentTask, subtask.id);
    }
  }

  const updatedSubtask = await tasksRepository.update({
    ...subtask,
    goalId: parentTask.goalId ?? fallbackGoalId,
    parentTaskId,
  });
  if (updatedSubtask.goalId) {
    await updateDescendantGoalIds(updatedSubtask.id, updatedSubtask.goalId);
  }
  await addEmbeddedSubtaskToParent(parentTask, updatedSubtask);
  return updatedSubtask;
}

export function unlinkVisualEdge(edgeId: string): void {
  const layout = loadGoalMindMapLayout();

  saveGoalMindMapLayout({
    ...layout,
    manualEdges: layout.manualEdges.filter((edge) => edge.id !== edgeId),
    updatedAt: new Date().toISOString(),
  });
}

export async function unlinkTaskFromGoal(taskId: string): Promise<Task | undefined> {
  const task = await findTask(taskId);

  if (!task) {
    return undefined;
  }

  const updatedTask = await tasksRepository.update({
    ...task,
    goalId: undefined,
    parentTaskId: null,
  });
  await clearDescendantGoalIds(task.id);
  return updatedTask;
}

export async function unlinkSubtaskFromParent(taskId: string): Promise<Task | undefined> {
  const task = await findTask(taskId);

  if (!task) {
    return undefined;
  }

  if (task.parentTaskId) {
    const parentTask = await findTask(task.parentTaskId);
    if (parentTask) {
      await removeEmbeddedSubtaskFromParent(parentTask, task.id);
    }
  }

  return tasksRepository.update({
    ...task,
    parentTaskId: null,
  });
}

export async function createRealTaskFromMindMap(input: CreateTaskInput & { goalId: string }): Promise<Task> {
  return tasksRepository.add({
    ...input,
    goalId: input.goalId,
    parentTaskId: null,
  });
}

export async function createRealSubtaskFromMindMap(
  input: CreateTaskInput & { parentTaskId: string; goalId?: string },
): Promise<Task | undefined> {
  const parentTask = await findTask(input.parentTaskId);

  if (!parentTask) {
    return undefined;
  }

  const subtask = await tasksRepository.add({
    ...input,
    goalId: parentTask.goalId ?? input.goalId,
    parentTaskId: input.parentTaskId,
  });
  await addEmbeddedSubtaskToParent(parentTask, subtask);
  return subtask;
}

async function findTask(taskId: string): Promise<Task | undefined> {
  const tasks = await tasksRepository.getAll();
  return tasks.find((task) => task.id === taskId);
}

async function updateDescendantGoalIds(rootTaskId: string, goalId: string): Promise<void> {
  const tasks = await tasksRepository.getAll();
  const descendants = getAllDescendantTasks(tasks, rootTaskId);

  await Promise.all(
    descendants
      .filter((task) => task.goalId !== goalId)
      .map((task) =>
        tasksRepository.update({
          ...task,
          goalId,
        }),
      ),
  );
}

async function clearDescendantGoalIds(rootTaskId: string): Promise<void> {
  const tasks = await tasksRepository.getAll();
  const descendants = getAllDescendantTasks(tasks, rootTaskId);

  await Promise.all(
    descendants
      .filter((task) => task.goalId)
      .map((task) =>
        tasksRepository.update({
          ...task,
          goalId: undefined,
        }),
      ),
  );
}

async function addEmbeddedSubtaskToParent(parentTask: Task, subtask: Task): Promise<void> {
  const nextEmbeddedSubtask = {
    id: subtask.id,
    title: subtask.title,
    description: subtask.description,
    completed: subtask.status === "done",
  };
  const subtasks = [
    ...parentTask.subtasks.filter((embeddedSubtask) => embeddedSubtask.id !== subtask.id),
    nextEmbeddedSubtask,
  ];

  await tasksRepository.update({
    ...parentTask,
    subtasks,
  });
}

async function removeEmbeddedSubtaskFromParent(parentTask: Task, subtaskId: string): Promise<void> {
  await tasksRepository.update({
    ...parentTask,
    subtasks: parentTask.subtasks.filter((embeddedSubtask) => embeddedSubtask.id !== subtaskId),
  });
}
