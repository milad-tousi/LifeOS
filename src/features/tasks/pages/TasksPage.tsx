import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { formatDate } from "@/lib/date";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { AddTaskModal } from "@/features/tasks/components/AddTaskModal";

export function TasksPage(): JSX.Element {
  const { tasks, loading } = useTasks();
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  return (
    <>
      <ScreenHeader
        title="Tasks"
        description="Compact task records with efficient date and status indexing."
      />
      <Button onClick={() => setIsAddTaskModalOpen(true)}>Add Task</Button>
      <Card title="Task list">
        {loading ? (
          <p className="text-muted">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Open the task modal to create your first local task with richer detail."
          />
        ) : (
          <div className="page-list">
            {tasks.map((task) => (
              <div key={task.id} className="page-list__item">
                <div>
                  <strong>{task.title}</strong>
                  <div className="text-muted">Created {formatDate(task.createdAt)}</div>
                </div>
                <span>{task.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
      />
    </>
  );
}
