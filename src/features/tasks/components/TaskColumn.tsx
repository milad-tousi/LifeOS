import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskBoardColumn } from "@/domains/tasks/board.types";
import { Task } from "@/domains/tasks/types";
import { BoardColumnHeader } from "@/features/tasks/components/BoardColumnHeader";
import { TaskCard } from "@/features/tasks/components/TaskCard";

interface TaskColumnProps {
  allTasks: Task[];
  column: TaskBoardColumn;
  goalTitlesById: Record<string, string>;
  onDeleteColumn: (column: TaskBoardColumn) => void;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onRenameColumn: (columnId: string, title: string) => Promise<void> | void;
  tasks: Task[];
}

export function TaskColumn({
  allTasks,
  column,
  goalTitlesById,
  onDeleteColumn,
  onDeleteTask,
  onEditTask,
  onRenameColumn,
  tasks,
}: TaskColumnProps): JSX.Element {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
  } = useSortable({
    id: column.id,
    data: {
      type: "board-column",
      columnId: column.id,
    },
  });
  const { isOver, setNodeRef } = useDroppable({
    id: `column-drop-${column.id}`,
    data: {
      type: "board-column",
      columnId: column.id,
      statusKey: column.statusKey,
    },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      className={`task-board-column${isOver ? " task-board-column--over" : ""}`}
      ref={setSortableNodeRef}
      style={style}
    >
      <BoardColumnHeader
        column={column}
        count={tasks.length}
        dragAttributes={attributes}
        dragListeners={listeners}
        onDeleteColumn={onDeleteColumn}
        onRenameColumn={onRenameColumn}
        setDragHandleRef={setActivatorNodeRef}
      />

      <div className="task-board-column__body" ref={setNodeRef}>
        {tasks.length === 0 ? (
          <div className="task-board-column__empty">Drop a task here</div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              allTasks={allTasks}
              goalTitlesById={goalTitlesById}
              goalTitle={task.goalId ? goalTitlesById[task.goalId] : undefined}
              key={task.id}
              onDelete={onDeleteTask}
              onEdit={onEditTask}
              task={task}
            />
          ))
        )}
      </div>
    </section>
  );
}
