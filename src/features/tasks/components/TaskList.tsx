import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Task } from "@/domains/tasks/types";

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps): JSX.Element {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No tasks yet"
        description="Task records are stored locally and will appear here."
      />
    );
  }

  return (
    <Card title="Tasks">
      <div className="page-list">
        {tasks.map((task) => (
          <div key={task.id} className="page-list__item">
            <strong>{task.title}</strong>
            <span className="text-muted">{task.completed ? "Done" : "Open"}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
