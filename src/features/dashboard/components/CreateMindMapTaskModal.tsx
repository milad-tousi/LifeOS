import { FormEvent, useState } from "react";
import { Button } from "@/components/common/Button";
import { TaskPriority } from "@/domains/tasks/types";

interface CreateMindMapTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: { dueDate?: string; priority: TaskPriority; title: string }) => void;
}

export function CreateMindMapTaskModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateMindMapTaskModalProps): JSX.Element | null {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    onSubmit({ title: title.trim(), priority, dueDate: dueDate || undefined });
    setTitle("");
    setPriority("medium");
    setDueDate("");
    setError("");
  }

  return (
    <div className="dashboard-modal-backdrop" role="presentation">
      <section className="dashboard-modal" role="dialog" aria-modal="true" aria-label="Create linked task">
        <div className="dashboard-modal__header">
          <h2>Create Linked Task</h2>
          <button onClick={onClose} type="button">Close</button>
        </div>
        <form className="dashboard-modal-form" onSubmit={handleSubmit}>
          <label>
            <span>Title</span>
            <input onChange={(event) => setTitle(event.target.value)} value={title} />
          </label>
          <label>
            <span>Priority</span>
            <select onChange={(event) => setPriority(event.target.value as TaskPriority)} value={priority}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            <span>Due date</span>
            <input onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} />
          </label>
          {error ? <p className="dashboard-modal-form__error">{error}</p> : null}
          <div className="dashboard-modal__actions">
            <Button onClick={onClose} type="button" variant="ghost">Cancel</Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
