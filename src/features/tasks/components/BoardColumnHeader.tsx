import { KeyboardEvent, useEffect, useState } from "react";
import { DraggableAttributes } from "@dnd-kit/core";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { TaskBoardColumn } from "@/domains/tasks/board.types";
import { useI18n } from "@/i18n";

interface BoardColumnHeaderProps {
  column: TaskBoardColumn;
  count: number;
  dragAttributes: DraggableAttributes;
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
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(column.title);
  const title = getColumnTitle(column, t);

  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(column.title);
    }
  }, [column.title, isEditing]);

  async function commitRename(): Promise<void> {
    const nextTitle = draftTitle.trim();

    if (!nextTitle) {
      setDraftTitle(column.title);
      setIsEditing(false);
      return;
    }

    if (nextTitle !== column.title) {
      await onRenameColumn(column.id, nextTitle);
    }

    setIsEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      event.preventDefault();
      void commitRename();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setDraftTitle(column.title);
      setIsEditing(false);
    }
  }

  return (
    <div className="task-board-column__header">
      <div className="task-board-column__header-main">
        <button
          aria-label={`${t("common.edit")} ${title}`}
          className="task-board-column__drag-handle"
          ref={setDragHandleRef}
          type="button"
          {...dragAttributes}
          {...dragListeners}
        >
          <GripVertical size={16} />
        </button>
        {isEditing ? (
          <div className="task-board-column__rename">
            <input
              autoFocus
              className="auth-form__input"
              onBlur={() => void commitRename()}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={handleKeyDown}
              value={draftTitle}
            />
          </div>
        ) : (
          <h3 className="task-board-column__title">
            {title} <span className="task-board-column__count">({count})</span>
          </h3>
        )}
      </div>

      {!isEditing ? (
        <div className="task-board-column__actions">
          <button
            aria-label={`${t("common.edit")} ${title}`}
            className="task-board-column__action"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            <Pencil size={15} />
          </button>
          <button
            aria-label={`${t("common.delete")} ${title}`}
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

function getColumnTitle(column: TaskBoardColumn, t: ReturnType<typeof useI18n>["t"]): string {
  if (column.kind !== "default") {
    return column.title;
  }

  switch (column.statusKey) {
    case "in_progress":
      return t("tasks.inProgress");
    case "done":
      return t("tasks.done");
    case "todo":
    default:
      return t("tasks.todo");
  }
}
