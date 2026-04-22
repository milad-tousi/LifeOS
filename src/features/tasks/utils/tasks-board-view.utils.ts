import { Task, TaskStatus } from "@/domains/tasks/types";

export interface TaskBoardColumn {
  key: TaskStatus;
  title: string;
  tasks: Task[];
}

export function groupTasksForBoardView(tasks: Task[]): TaskBoardColumn[] {
  return [
    createColumn("todo", "To do", tasks),
    createColumn("in_progress", "In progress", tasks),
    createColumn("done", "Done", tasks),
  ];
}

function createColumn(status: TaskStatus, title: string, tasks: Task[]): TaskBoardColumn {
  return {
    key: status,
    title,
    tasks: tasks.filter((task) => task.status === status),
  };
}
