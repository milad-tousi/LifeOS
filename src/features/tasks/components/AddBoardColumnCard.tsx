import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/common/Button";

interface AddBoardColumnCardProps {
  onAddColumn: (title: string) => Promise<void> | void;
}

export function AddBoardColumnCard({ onAddColumn }: AddBoardColumnCardProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!value.trim()) {
      return;
    }

    await onAddColumn(value.trim());
    setValue("");
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        aria-label="Add board column"
        className="task-board-add-column"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Plus size={18} />
        <span>Add column</span>
      </button>
    );
  }

  return (
    <form className="task-board-add-column task-board-add-column--open" onSubmit={(event) => void handleSubmit(event)}>
      <label className="task-board-add-column__field" htmlFor="task-board-new-column">
        <span className="task-board-add-column__label">Column title</span>
        <input
          className="auth-form__input"
          id="task-board-new-column"
          onChange={(event) => setValue(event.target.value)}
          placeholder="Blocked"
          value={value}
        />
      </label>
      <div className="task-board-add-column__actions">
        <Button disabled={!value.trim()} type="submit">
          Add
        </Button>
        <Button onClick={() => setIsOpen(false)} type="button" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  );
}
