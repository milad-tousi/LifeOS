import { useLiveQuery } from "dexie-react-hooks";
import { tasksRepository } from "@/domains/tasks/repository";
import { Task } from "@/domains/tasks/types";

export interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
}

export function useTasks(): UseTasksResult {
  const tasks = useLiveQuery(() => tasksRepository.getAll(), []);

  return {
    tasks: tasks ?? [],
    loading: tasks === undefined,
  };
}
