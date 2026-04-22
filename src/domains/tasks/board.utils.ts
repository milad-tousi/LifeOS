import { createId } from "@/lib/id";
import { TaskBoardColumn } from "@/domains/tasks/board.types";
import { Task, TaskStatus } from "@/domains/tasks/types";

export const DEFAULT_BOARD_COLUMNS: TaskBoardColumn[] = [
  createDefaultBoardColumn("board-default-todo", "To do", "todo", 0),
  createDefaultBoardColumn("board-default-in-progress", "In progress", "in_progress", 1),
  createDefaultBoardColumn("board-default-done", "Done", "done", 2),
];

export function createDefaultBoardColumns(): TaskBoardColumn[] {
  return DEFAULT_BOARD_COLUMNS.map((column) => ({ ...column }));
}

export function createCustomBoardColumn(title: string, order: number): TaskBoardColumn {
  const timestamp = Date.now();

  return {
    id: createId(),
    title: title.trim(),
    kind: "custom",
    statusKey: null,
    order,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function normalizeBoardColumns(columns: TaskBoardColumn[]): TaskBoardColumn[] {
  const columnMap = new Map(columns.map((column) => [column.id, normalizeBoardColumn(column)]));

  return [...columnMap.values()].sort((left, right) => left.order - right.order);
}

export function getDefaultBoardColumnIdForStatus(status: TaskStatus): string {
  switch (status) {
    case "in_progress":
      return "board-default-in-progress";
    case "done":
      return "board-default-done";
    case "todo":
    case "cancelled":
    default:
      return "board-default-todo";
  }
}

export function getOrderedBoardColumns(columns: TaskBoardColumn[]): TaskBoardColumn[] {
  return normalizeBoardColumns(columns).sort((left, right) => left.order - right.order);
}

export function groupTasksByBoardColumn(
  tasks: Task[],
  columns: TaskBoardColumn[],
): Record<string, Task[]> {
  const orderedColumns = getOrderedBoardColumns(columns);
  const groups = orderedColumns.reduce<Record<string, Task[]>>((accumulator, column) => {
    accumulator[column.id] = [];
    return accumulator;
  }, {});

  tasks.forEach((task) => {
    if (orderedColumns.length === 0) {
      return;
    }

    const targetColumnId = task.boardColumnId ?? getDefaultBoardColumnIdForStatus(task.status);
    const matchingStatusColumn = orderedColumns.find((column) => column.statusKey === task.status);
    const fallbackColumnId = matchingStatusColumn?.id ?? orderedColumns[0]?.id;
    const safeColumnId = groups[targetColumnId] ? targetColumnId : fallbackColumnId;

    if (safeColumnId && groups[safeColumnId]) {
      groups[safeColumnId].push(task);
    }
  });

  return groups;
}

function createDefaultBoardColumn(
  id: string,
  title: string,
  statusKey: TaskStatus,
  order: number,
): TaskBoardColumn {
  return {
    id,
    title,
    kind: "default",
    statusKey,
    order,
    createdAt: 0,
    updatedAt: 0,
  };
}

function normalizeBoardColumn(column: TaskBoardColumn): TaskBoardColumn {
  return {
    ...column,
    title: column.title.trim(),
    statusKey: column.statusKey ?? null,
  };
}
