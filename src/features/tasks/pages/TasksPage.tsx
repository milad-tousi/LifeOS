import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { tasksRepository } from "@/domains/tasks/repository";
import { log } from "@/utils/logger";
import { useTasks } from "@/features/tasks/hooks/useTasks";

export function TasksPage(): JSX.Element {
  const { tasks, loading } = useTasks();

  async function handleAddTask(): Promise<void> {
    const title = window.prompt("Task title");

    if (!title || !title.trim()) {
      return;
    }

    try {
      await tasksRepository.add({ title: title.trim() });
    } catch (error) {
      log.error("Failed to add task", error);
    }
  }

  return (
    <>
      <ScreenHeader
        title="Tasks"
        description="Simple offline task storage with Dexie live updates."
      />
      <Button onClick={() => void handleAddTask()}>Add Task</Button>
      <Card title="Task list">
        {loading ? (
          <p className="text-muted">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Use the temporary Add Task action to create your first local task."
          />
        ) : (
          <div className="page-list">
            {tasks.map((task) => (
              <div key={task.id} className="page-list__item">
                <div>
                  <strong>{task.title}</strong>
                  <div className="text-muted">
                    Created {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span>{task.completed ? "Done" : "Open"}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
