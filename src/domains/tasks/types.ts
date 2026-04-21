export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  scheduledAt?: number;
}

export interface CreateTaskInput {
  title: string;
  scheduledAt?: number;
}
