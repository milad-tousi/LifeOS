import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Task } from "@/domains/tasks/types";

interface LinkExistingTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskIds: string[]) => void;
  tasks: Task[];
}

export function LinkExistingTaskModal({
  isOpen,
  onClose,
  onSubmit,
  tasks,
}: LinkExistingTaskModalProps): JSX.Element | null {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) {
    return null;
  }

  function toggleTask(taskId: string): void {
    setSelectedIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId],
    );
  }

  function handleSubmit(): void {
    onSubmit(selectedIds);
    setSelectedIds([]);
  }

  return (
    <div className="dashboard-modal-backdrop" role="presentation">
      <section className="dashboard-modal" role="dialog" aria-modal="true" aria-label="Link existing tasks">
        <div className="dashboard-modal__header">
          <h2>Link Existing Tasks</h2>
          <button onClick={onClose} type="button">Close</button>
        </div>
        {tasks.length > 0 ? (
          <div className="dashboard-link-task-list">
            {tasks.map((task) => (
              <label key={task.id}>
                <input
                  checked={selectedIds.includes(task.id)}
                  onChange={() => toggleTask(task.id)}
                  type="checkbox"
                />
                <span>{task.title}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="dashboard-modal__empty">No unlinked tasks are available.</p>
        )}
        <div className="dashboard-modal__actions">
          <Button onClick={onClose} type="button" variant="ghost">Cancel</Button>
          <Button disabled={selectedIds.length === 0} onClick={handleSubmit} type="button">
            Link Selected
          </Button>
        </div>
      </section>
    </div>
  );
}
