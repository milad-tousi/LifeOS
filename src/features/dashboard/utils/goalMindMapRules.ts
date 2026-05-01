import { Task } from "@/domains/tasks/types";
import { GoalMindMapNode } from "@/features/dashboard/types/goalMindMap.types";

const GOAL_NODE_ID = "goal";
const TASK_NODE_PREFIX = "task-";

export function isGoalNode(node: GoalMindMapNode | undefined): boolean {
  return Boolean(node && (node.id === GOAL_NODE_ID || node.data.kind === "goal"));
}

export function isTaskNode(node: GoalMindMapNode | undefined): boolean {
  return Boolean(node && node.data.kind === "task");
}

export function isSubtaskNode(node: GoalMindMapNode | undefined, tasks: Task[]): boolean {
  if (node?.data.kind === "task" && node.data.parentTaskId) {
    return true;
  }

  const task = getTaskForNode(node, tasks);
  return Boolean(task?.parentTaskId);
}

export function getTaskLevel(task: Task, tasks: Task[]): number {
  let level = 0;
  let cursor: Task | undefined = task;
  const visitedTaskIds = new Set<string>();

  while (cursor?.parentTaskId && !visitedTaskIds.has(cursor.id)) {
    visitedTaskIds.add(cursor.id);
    const parentTask = tasks.find((item) => item.id === cursor?.parentTaskId);

    if (!parentTask) {
      break;
    }

    level += 1;
    cursor = parentTask;
  }

  return level;
}

export function canConnectMindMapNodes(
  sourceNode: GoalMindMapNode | undefined,
  targetNode: GoalMindMapNode | undefined,
  tasks: Task[],
): boolean {
  if (!sourceNode || !targetNode || sourceNode.id === targetNode.id) {
    return false;
  }

  if (isGoalNode(targetNode)) {
    return false;
  }

  if (isGoalNode(sourceNode)) {
    return isTaskNode(targetNode) && !isSubtaskNode(targetNode, tasks);
  }

  return isTaskNode(sourceNode) && isTaskNode(targetNode);
}

export function getTaskIdFromMindMapNodeId(nodeId: string): string {
  return nodeId.startsWith(TASK_NODE_PREFIX) ? nodeId.slice(TASK_NODE_PREFIX.length) : nodeId;
}

function getTaskForNode(node: GoalMindMapNode | undefined, tasks: Task[]): Task | undefined {
  if (!node || !isTaskNode(node)) {
    return undefined;
  }

  return tasks.find((task) => task.id === getTaskIdFromMindMapNodeId(node.id));
}
