import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CalendarEvent } from "@/domains/calendar/types";
import { calendarEventsRepository } from "@/domains/calendar/repository";
import { goalsRepository } from "@/domains/goals/repository";
import { taskBoardColumnsRepository } from "@/domains/tasks/board.repository";
import { TaskBoardColumn } from "@/domains/tasks/board.types";
import { Goal } from "@/domains/goals/types";
import { tasksRepository } from "@/domains/tasks/repository";
import { Task } from "@/domains/tasks/types";

export interface UseTasksPageDataResult {
  boardColumns: TaskBoardColumn[];
  events: CalendarEvent[];
  goals: Goal[];
  tasks: Task[];
  loading: boolean;
  error: Error | null;
}

// Stable empty-array constants so that the fallback references never change
// between renders. Without this, data?.x ?? [] allocates a new [] every
// render while data is undefined, which causes the useEffect deps in
// TasksPage to fire on every render and trigger an infinite setState loop.
const EMPTY_BOARD_COLUMNS: TaskBoardColumn[] = [];
const EMPTY_EVENTS: CalendarEvent[] = [];
const EMPTY_TASKS: Task[] = [];
const EMPTY_GOALS: Goal[] = [];

export function useTasksPageData(): UseTasksPageDataResult {
  // Seed default board columns once on mount.
  // getAll() may perform a read-write transaction (to seed defaults or
  // normalise columns), which is forbidden inside a useLiveQuery callback.
  // Running it in a plain useEffect keeps it outside the liveQuery context.
  useEffect(() => {
    void taskBoardColumnsRepository.getAll().catch((err) => {
      console.error("[useTasksPageData] board columns init failed:", err);
    });
  }, []);

  const result = useLiveQuery(
    async () => {
      try {
        const [tasks, goals, boardColumns, events] = await Promise.all([
          tasksRepository.getAll(),
          goalsRepository.getAll(),
          // getForLiveQuery is read-only: safe inside useLiveQuery
          taskBoardColumnsRepository.getForLiveQuery(),
          calendarEventsRepository.getAll(),
        ]);
        return {
          data: { boardColumns, events, tasks, goals },
          error: null as Error | null,
        };
      } catch (err) {
        console.error("[useTasksPageData] failed to load:", err);
        return {
          data: null as null,
          error: err instanceof Error ? err : new Error(String(err)),
        };
      }
    },
    [],
  );

  if (result === undefined) {
    return {
      boardColumns: EMPTY_BOARD_COLUMNS,
      events: EMPTY_EVENTS,
      tasks: EMPTY_TASKS,
      goals: EMPTY_GOALS,
      loading: true,
      error: null,
    };
  }

  if (result.error !== null || result.data === null) {
    return {
      boardColumns: EMPTY_BOARD_COLUMNS,
      events: EMPTY_EVENTS,
      tasks: EMPTY_TASKS,
      goals: EMPTY_GOALS,
      loading: false,
      error: result.error,
    };
  }

  return {
    boardColumns: result.data.boardColumns,
    events: result.data.events,
    tasks: result.data.tasks,
    goals: result.data.goals,
    loading: false,
    error: null,
  };
}
