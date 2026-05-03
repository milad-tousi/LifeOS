import { DndContext, DragEndEvent, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { TaskBoardColumn } from "@/domains/tasks/board.types";
import { Task } from "@/domains/tasks/types";
import { TaskCard } from "@/features/tasks/components/TaskCard";
import { TaskColumn } from "@/features/tasks/components/TaskColumn";
import { getOrderedBoardColumns, groupTasksByBoardColumn } from "@/domains/tasks/board.utils";

interface TaskBoardViewProps {
  boardColumns: TaskBoardColumn[];
  goalTitlesById: Record<string, string>;
  onDeleteColumn: (columnId: string) => Promise<void> | void;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onMoveTask: (task: Task, nextColumn: TaskBoardColumn) => void;
  onRenameColumn: (columnId: string, title: string) => Promise<void> | void;
  onReorderColumns: (orderedColumnIds: string[]) => void;
  tasks: Task[];
}

export function TaskBoardView({
  boardColumns,
  goalTitlesById,
  onDeleteColumn,
  onDeleteTask,
  onEditTask,
  onMoveTask,
  onRenameColumn,
  onReorderColumns,
  tasks,
}: TaskBoardViewProps): JSX.Element {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [columnPendingDelete, setColumnPendingDelete] = useState<TaskBoardColumn | null>(null);
  const columns = useMemo(() => getOrderedBoardColumns(boardColumns), [boardColumns]);
  const tasksByColumnId = useMemo(() => groupTasksByBoardColumn(tasks, columns), [columns, tasks]);
  const activeTask = activeTaskId ? tasks.find((task) => task.id === activeTaskId) ?? null : null;
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const activeColumn = activeColumnId
    ? columns.find((column) => column.id === activeColumnId) ?? null
    : null;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
  );

  function resolveDropColumn(overId: string): TaskBoardColumn | null {
    if (overId.startsWith("column-drop-")) {
      const columnId = overId.replace("column-drop-", "");
      return columns.find((column) => column.id === columnId) ?? null;
    }

    const directColumn = columns.find((column) => column.id === overId);

    if (directColumn) {
      return directColumn;
    }

    const overTask = tasks.find((task) => task.id === overId);

    if (!overTask) {
      return null;
    }

    return columns.find((column) => column.id === overTask.boardColumnId) ?? null;
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    setActiveTaskId(null);
    setActiveColumnId(null);

    if (!over) {
      return;
    }

    const activeType = active.data.current?.type as string | undefined;

    if (activeType === "board-column") {
      if (active.id === over.id) {
        return;
      }

      const oldIndex = columns.findIndex((column) => column.id === active.id);
      const newIndex = columns.findIndex((column) => column.id === over.id);

      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      const reorderedColumns = [...columns];
      const [movedColumn] = reorderedColumns.splice(oldIndex, 1);
      reorderedColumns.splice(newIndex, 0, movedColumn);
      onReorderColumns(reorderedColumns.map((column) => column.id));
      return;
    }

    if (activeType !== "task-card") {
      return;
    }

    const activeTaskItem = tasks.find((task) => task.id === active.id);

    if (!activeTaskItem) {
      return;
    }

    const nextColumn = resolveDropColumn(String(over.id));

    if (!nextColumn || nextColumn.id === activeTaskItem.boardColumnId) {
      return;
    }

    onMoveTask(activeTaskItem, nextColumn);
  }

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={(event) => {
        const activeType = event.active.data.current?.type as string | undefined;

        if (activeType === "task-card") {
          setActiveTaskId(String(event.active.id));
        }

        if (activeType === "board-column") {
          setActiveColumnId(String(event.active.id));
        }
      }}
      onDragCancel={() => {
        setActiveTaskId(null);
        setActiveColumnId(null);
      }}
      sensors={sensors}
    >
      <SortableContext items={columns.map((column) => column.id)} strategy={horizontalListSortingStrategy}>
        <div className="task-board">
          {columns.map((column) => (
            <TaskColumn
              column={column}
              goalTitlesById={goalTitlesById}
              key={column.id}
              onDeleteColumn={setColumnPendingDelete}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
              onRenameColumn={onRenameColumn}
              allTasks={tasks}
              tasks={tasksByColumnId[column.id] ?? []}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeTask ? (
          <TaskCard
            allTasks={tasks}
            goalTitlesById={goalTitlesById}
            goalTitle={activeTask.goalId ? goalTitlesById[activeTask.goalId] : undefined}
            onDelete={onDeleteTask}
            onEdit={onEditTask}
            task={activeTask}
          />
        ) : activeColumn ? (
          <div className="task-board-column task-board-column--overlay">
            <div className="task-board-column__header">
              <h3 className="task-board-column__title">{activeColumn.title}</h3>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Delete column"
        description="Tasks in this column will be moved to the first available remaining column."
        isOpen={Boolean(columnPendingDelete)}
        onCancel={() => setColumnPendingDelete(null)}
        onConfirm={() => {
          if (!columnPendingDelete) {
            return;
          }

          void onDeleteColumn(columnPendingDelete.id);
          setColumnPendingDelete(null);
        }}
        title="Delete this column?"
        tone="danger"
      />
    </DndContext>
  );
}
