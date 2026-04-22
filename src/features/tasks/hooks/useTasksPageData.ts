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
}

export function useTasksPageData(): UseTasksPageDataResult {
  const data = useLiveQuery(
    async () => {
      const [tasks, goals, boardColumns, events] = await Promise.all([
        tasksRepository.getAll(),
        goalsRepository.getAll(),
        taskBoardColumnsRepository.getAll(),
        calendarEventsRepository.getAll(),
      ]);
      return {
        boardColumns,
        events,
        tasks,
        goals,
      };
    },
    [],
  );

  return {
    boardColumns: data?.boardColumns ?? [],
    events: data?.events ?? [],
    tasks: data?.tasks ?? [],
    goals: data?.goals ?? [],
    loading: data === undefined,
  };
}
