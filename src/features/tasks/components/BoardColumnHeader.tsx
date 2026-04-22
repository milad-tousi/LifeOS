import { FormEvent, useState } from "react";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { TaskBoardColumn } from "@/domains/tasks/board.types";

interface BoardColumnHeaderProps {
  column: TaskBoardColumn;
  count: number;
  dragAttributes: Record<string, unknown>;
  dragListeners: Record<string, unknown> | undefined;
  onDeleteColumn: (column: TaskBoardColumn) => void;
  onRenameColumn: (columnId: string, title: string) => Promise<void> | void;
  setDragHandleRef?: (node: HTMLButtonElement | null) => void;
}

export function BoardColumnHeader({
  column,
  count,
  dragAttributes,
  dragListeners,
  onDeleteColumn,
  onRenameColumn,
  setDragHandleRef,
}: BoardColumnHeaderProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(column.title);

  async function handleRename(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!draftTitle.trim()) {
      return;
    }

    await onRenameColumn(column.id, draftTitle.trim());
    setIsEditing(false);
  }

  return (
    <div className="task-board-column__header">
      <div className="task-board-column__header-main">
        <button
          aria-label={`Reorder column ${column.title}`}
          className="task-board-column__drag-handle"
          ref={setDragHandleRef}
          type="button"
          {...dragAttributes}
          {...dragListeners}
        >
          <GripVertical size={16} />
        </button>
        {isEditing ? (
          <form className="task-board-column__rename" onSubmit={(event) => void handleRename(event)}>
            <input
              className="auth-form__input"
              onChange={(event) => setDraftTitle(event.target.value)}
              value={draftTitle}
            />
            <div className="task-board-column__rename-actions">
              <Button disabled={!draftTitle.trim()} type="submit">
                Save
              </Button>
              <Button
                onClick={() => {
                  setDraftTitle(column.title);
                  setIsEditing(false);
                }}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <h3 className="task-board-column__title">
            {column.title} <span className="task-board-column__count">({count})</span>
          </h3>
        )}
      </div>

      {!isEditing ? (
        <div className="task-board-column__actions">
          <button
            aria-label={`Rename column ${column.title}`}
            className="task-board-column__action"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            <Pencil size={15} />
          </button>
          <button
            aria-label={`Delete column ${column.title}`}
            className="task-board-column__action"
            onClick={() => onDeleteColumn(column)}
            type="button"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
