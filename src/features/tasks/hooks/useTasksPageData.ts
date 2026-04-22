import { useLiveQuery } from "dexie-react-hooks";
import { goalsRepository } from "@/domains/goals/repository";
import { taskBoardColumnsRepository } from "@/domains/tasks/board.repository";
import { TaskBoardColumn } from "@/domains/tasks/board.types";
import { Goal } from "@/domains/goals/types";
import { tasksRepository } from "@/domains/tasks/repository";
import { Task } from "@/domains/tasks/types";

export interface UseTasksPageDataResult {
  boardColumns: TaskBoardColumn[];
  goals: Goal[];
  tasks: Task[];
  loading: boolean;
}

export function useTasksPageData(): UseTasksPageDataResult {
  const data = useLiveQuery(
    async () => {
      const [tasks, goals, boardColumns] = await Promise.all([
        tasksRepository.getAll(),
        goalsRepository.getAll(),
        taskBoardColumnsRepository.getAll(),
      ]);
      return {
        boardColumns,
        tasks,
        goals,
      };
    },
    [],
  );

  return {
    boardColumns: data?.boardColumns ?? [],
    tasks: data?.tasks ?? [],
    goals: data?.goals ?? [],
    loading: data === undefined,
  };
}
