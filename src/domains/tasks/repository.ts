import { db } from "@/db/dexie";
import { createTaskModel } from "@/domains/tasks/models";
import { CreateTaskInput, Task } from "@/domains/tasks/types";

export const tasksRepository = {
  async getAll(): Promise<Task[]> {
    return db.tasks.orderBy("createdAt").reverse().toArray();
  },
  async add(input: CreateTaskInput): Promise<string> {
    const task = createTaskModel(input.title, input.scheduledAt);
    await db.tasks.add(task);
    return task.id;
  },
  async update(task: Task): Promise<string> {
    await db.tasks.put(task);
    return task.id;
  },
  async remove(id: string): Promise<void> {
    await db.tasks.delete(id);
  },
};
