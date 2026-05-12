import { db, ensureDatabaseReady } from "@/db/dexie";
import { TaskBoardColumn } from "@/domains/tasks/board.types";
import {
  createDefaultBoardColumns,
  createCustomBoardColumn,
  normalizeBoardColumns,
} from "@/domains/tasks/board.utils";
import { normalizeTask } from "@/domains/tasks/task.utils";

export const taskBoardColumnsRepository = {
  // getAll: reads + seeds/normalizes (writes). Safe to call from useEffect,
  // event handlers, mutations — NOT safe inside useLiveQuery.
  async getAll(): Promise<TaskBoardColumn[]> {
    await ensureDatabaseReady();
    const storedColumns = await db.taskBoardColumns.toArray();

    if (storedColumns.length === 0) {
      const defaultColumns = createDefaultBoardColumns();
      await db.transaction("rw", db.taskBoardColumns, async () => {
        await Promise.all(defaultColumns.map((column) => db.taskBoardColumns.put(column)));
      });
      return defaultColumns;
    }

    const normalizedColumns = normalizeBoardColumns(storedColumns);

    if (storedColumns.length !== normalizedColumns.length) {
      await db.transaction("rw", db.taskBoardColumns, async () => {
        await Promise.all(normalizedColumns.map((column) => db.taskBoardColumns.put(column)));
      });
    }

    return normalizedColumns;
  },

  // getForLiveQuery: read-only, safe inside useLiveQuery / liveQuery contexts.
  // Returns persisted columns, or in-memory defaults when the table is empty
  // (does NOT write — seeding must happen outside via getAll()).
  async getForLiveQuery(): Promise<TaskBoardColumn[]> {
    await ensureDatabaseReady();
    const storedColumns = await db.taskBoardColumns.toArray();

    if (storedColumns.length === 0) {
      return createDefaultBoardColumns();
    }

    return normalizeBoardColumns(storedColumns);
  },

  async add(title: string): Promise<TaskBoardColumn[]> {
    await ensureDatabaseReady();
    const existingColumns = await this.getAll();
    const nextColumn = createCustomBoardColumn(title, existingColumns.length);
    await db.taskBoardColumns.put(nextColumn);
    return this.getAll();
  },
  async rename(columnId: string, title: string): Promise<TaskBoardColumn[]> {
    await ensureDatabaseReady();
    const column = await db.taskBoardColumns.get(columnId);

    if (!column) {
      throw new Error("Column not found.");
    }

    await db.taskBoardColumns.put({
      ...column,
      title: title.trim(),
      updatedAt: Date.now(),
    });

    return this.getAll();
  },
  async delete(columnId: string): Promise<{
    columns: TaskBoardColumn[];
    fallbackColumnId: string;
    fallbackStatusKey: TaskBoardColumn["statusKey"];
    movedTaskIds: string[];
  }> {
    await ensureDatabaseReady();
    const existingColumns = await this.getAll();
    const column = existingColumns.find((entry) => entry.id === columnId);

    if (!column) {
      throw new Error("Column not found.");
    }

    if (existingColumns.length <= 1) {
      throw new Error("At least one board column must remain.");
    }

    const remainingColumns = existingColumns.filter((entry) => entry.id !== columnId);
    const fallbackColumn = remainingColumns[0];
    const tasksToMove = (await db.tasks.toArray())
      .map(normalizeTask)
      .filter((task) => task.boardColumnId === columnId);

    await db.transaction("rw", db.taskBoardColumns, db.tasks, async () => {
      await Promise.all(
        tasksToMove.map((task) =>
          db.tasks.put({
            ...task,
            status: fallbackColumn.statusKey ?? task.status,
            boardColumnId: fallbackColumn.id,
            updatedAt: Date.now(),
          }),
        ),
      );
      await db.taskBoardColumns.delete(columnId);
    });

    return {
      columns: await this.getAll(),
      fallbackColumnId: fallbackColumn.id,
      fallbackStatusKey: fallbackColumn.statusKey,
      movedTaskIds: tasksToMove.map((task) => task.id),
    };
  },
  async reorder(orderedColumnIds: string[]): Promise<TaskBoardColumn[]> {
    await ensureDatabaseReady();
    const existingColumns = await this.getAll();
    const columnMap = new Map(existingColumns.map((column) => [column.id, column]));
    const orderedColumns = orderedColumnIds
      .map((columnId) => columnMap.get(columnId))
      .filter((column): column is TaskBoardColumn => Boolean(column));
    const trailingColumns = existingColumns.filter((column) => !orderedColumnIds.includes(column.id));
    const timestamp = Date.now();
    const nextColumns = [...orderedColumns, ...trailingColumns].map((column, index) => ({
      ...column,
      order: index,
      updatedAt: timestamp,
    }));

    await db.transaction("rw", db.taskBoardColumns, async () => {
      await Promise.all(nextColumns.map((column) => db.taskBoardColumns.put(column)));
    });

    return nextColumns;
  },
};
