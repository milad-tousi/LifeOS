import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { ModalShell } from "@/components/common/ModalShell";
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

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
    }
  }, [isOpen]);

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
    <ModalShell
      description="Choose tasks to add as nodes on this goal canvas."
      footer={
        <div className="modal-action-row">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button disabled={selectedIds.length === 0} onClick={handleSubmit} type="button">
            Link Selected
          </Button>
        </div>
      }
      isOpen={isOpen}
      onRequestClose={onClose}
      title="Link Existing Tasks"
    >
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
    </ModalShell>
  );
}
