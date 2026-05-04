import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { LocalizedDateInput } from "@/components/common/LocalizedDateInput";
import { ModalShell } from "@/components/common/ModalShell";
import { TaskPriority, TaskStatus } from "@/domains/tasks/types";
import {
  CreateMindMapTaskInput,
  EditMindMapTaskInput,
} from "@/features/dashboard/types/goalMindMap.types";

interface CreateMindMapTaskModalProps {
  mode?: "task" | "subtask";
  initialValue?: EditMindMapTaskInput;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateMindMapTaskInput) => void;
}

export function CreateMindMapTaskModal({
  mode = "task",
  initialValue,
  isOpen,
  onClose,
  onSubmit,
}: CreateMindMapTaskModalProps): JSX.Element | null {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTitle(initialValue?.title ?? "");
    setPriority(initialValue?.priority ?? "medium");
    setStatus(initialValue?.status ?? "todo");
    setDueDate(initialValue?.dueDate ?? "");
    setError("");
  }, [initialValue, isOpen]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    onSubmit({
      dueDate: dueDate || undefined,
      priority,
      status,
      title: title.trim(),
    });
  }

  const titleText = initialValue
    ? "Edit Task Node"
    : mode === "subtask"
      ? "Create Subtask"
      : "Create Task";

  return (
    <ModalShell
      description="Create or update the task that powers this canvas node."
      footer={
        <div className="modal-action-row">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button type="submit" form="mind-map-task-form">
            {initialValue ? "Save Task" : titleText}
          </Button>
        </div>
      }
      isOpen={isOpen}
      onRequestClose={onClose}
      title={titleText}
    >
      <form className="dashboard-modal-form" id="mind-map-task-form" onSubmit={handleSubmit}>
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
          <span>Status</span>
          <select onChange={(event) => setStatus(event.target.value as TaskStatus)} value={status}>
            <option value="todo">Todo</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label>
          <span>Due date</span>
          <LocalizedDateInput onChange={setDueDate} value={dueDate} />
        </label>
        {error ? <p className="dashboard-modal-form__error">{error}</p> : null}
      </form>
    </ModalShell>
  );
}
