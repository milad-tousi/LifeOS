import { FormEvent } from "react";
import { Button } from "@/components/common/Button";

interface TasksQuickAddProps {
  isSubmitting: boolean;
  value: string;
  onChange: (value: string) => void;
  onOpenAddTaskModal: () => void;
  onSubmit: () => void;
}

export function TasksQuickAdd({
  isSubmitting,
  onChange,
  onOpenAddTaskModal,
  onSubmit,
  value,
}: TasksQuickAddProps): JSX.Element {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="tasks-quick-add" onSubmit={handleSubmit}>
      <label className="tasks-quick-add__field" htmlFor="tasks-quick-add-input">
        <span className="tasks-quick-add__label">Quick add</span>
        <input
          className="auth-form__input"
          id="tasks-quick-add-input"
          onChange={(event) => onChange(event.target.value)}
          placeholder="What do you want to do today?"
          value={value}
        />
      </label>
      <div className="tasks-quick-add__actions">
        <Button disabled={isSubmitting || !value.trim()} type="submit">
          {isSubmitting ? "Adding..." : "Add"}
        </Button>
        <Button onClick={onOpenAddTaskModal} type="button" variant="secondary">
          Open full task form
        </Button>
      </div>
    </form>
  );
}
