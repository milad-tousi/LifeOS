import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/common/Card";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CalendarEvent } from "@/domains/calendar/types";
import { taskBoardColumnsRepository } from "@/domains/tasks/board.repository";
import { TaskBoardColumn } from "@/domains/tasks/board.types";
import { TaskModal } from "@/features/tasks/components/AddTaskModal";
import { TaskBoardView } from "@/features/tasks/components/TaskBoardView";
import { TaskCalendarView } from "@/features/tasks/components/TaskCalendarView";
import { TaskViewSwitcher, TaskView } from "@/features/tasks/components/TaskViewSwitcher";
import { TasksListView } from "@/features/tasks/components/TasksListView";
import { TasksPageHeader } from "@/features/tasks/components/TasksPageHeader";
import { TasksQuickAdd } from "@/features/tasks/components/TasksQuickAdd";
import { useTasksPageData } from "@/features/tasks/hooks/useTasksPageData";
import { groupTasksForListView } from "@/features/tasks/utils/tasks-list-view.utils";
import { tasksRepository } from "@/domains/tasks/repository";
import { Task } from "@/domains/tasks/types";
import { sortTasksByOrder } from "@/domains/tasks/task.utils";

export function TasksPage(): JSX.Element {
  const { boardColumns, events, goals, loading, tasks } = useTasksPageData();
  const [activeTaskView, setActiveTaskView] = useState<TaskView>("list");
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [taskDraftDueDate, setTaskDraftDueDate] = useState<string | undefined>(undefined);
  const [quickAddValue, setQuickAddValue] = useState("");
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [taskBeingEdited, setTaskBeingEdited] = useState<Task | null>(null);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [taskListState, setTaskListState] = useState<Task[]>([]);
  const [boardColumnsState, setBoardColumnsState] = useState<TaskBoardColumn[]>([]);
  const [eventListState, setEventListState] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    setTaskListState(sortTasksByOrder(tasks));
  }, [tasks]);

  useEffect(() => {
    setBoardColumnsState(boardColumns);
  }, [boardColumns]);

  useEffect(() => {
    setEventListState(events);
  }, [events]);

  const goalTitlesById = useMemo(
    () =>
      goals.reduce<Record<string, string>>((lookup, goal) => {
        lookup[goal.id] = goal.title;
        return lookup;
      }, {}),
    [goals],
  );
  const groupedTasks = useMemo(() => groupTasksForListView(taskListState), [taskListState]);
  const addTaskInitialValues = useMemo(
    () => (taskDraftDueDate ? { dueDate: taskDraftDueDate } : undefined),
    [taskDraftDueDate],
  );

  function replaceTaskInState(task: Task): void {
    setTaskListState((currentTasks) => {
      const hasExistingTask = currentTasks.some((currentTask) => currentTask.id === task.id);

      if (!hasExistingTask) {
        return sortTasksByOrder([task, ...currentTasks]);
      }

      return sortTasksByOrder(
        currentTasks.map((currentTask) => (currentTask.id === task.id ? task : currentTask)),
      );
    });
  }

  async function handleQuickAdd(): Promise<void> {
    if (!quickAddValue.trim()) {
      return;
    }

    setIsQuickAdding(true);

    try {
      const task = await tasksRepository.add({
        title: quickAddValue.trim(),
        priority: "medium",
        status: "todo",
      });
      replaceTaskInState(task);
      setQuickAddValue("");
    } finally {
      setIsQuickAdding(false);
    }
  }

  function handleToggleTask(task: Task): void {
    handleTaskStatusChange(task, task.status === "done" ? "todo" : "done");
  }

  function handleTaskStatusChange(task: Task, nextStatus: Task["status"]): void {
    const updatedTask: Task = {
      ...task,
      status: nextStatus,
      boardColumnId:
        nextStatus === "done"
          ? "board-default-done"
          : nextStatus === "in_progress"
            ? "board-default-in-progress"
            : "board-default-todo",
      completedAt: nextStatus === "done" ? Date.now() : undefined,
      updatedAt: Date.now(),
    };

    replaceTaskInState(updatedTask);

    void tasksRepository.update(updatedTask).catch(() => {
      replaceTaskInState(task);
    });
  }

  function handleMoveTaskToBoardColumn(task: Task, nextColumn: TaskBoardColumn): void {
    const nextStatus = nextColumn.statusKey ?? task.status;
    const updatedTask: Task = {
      ...task,
      status: nextStatus,
      boardColumnId: nextColumn.id,
      completedAt: nextStatus === "done" ? task.completedAt ?? Date.now() : undefined,
      updatedAt: Date.now(),
    };

    replaceTaskInState(updatedTask);

    void tasksRepository.update(updatedTask).catch(() => {
      replaceTaskInState(task);
    });
  }

  async function handleAddBoardColumn(title: string): Promise<void> {
    const nextColumns = await taskBoardColumnsRepository.add(title);
    setBoardColumnsState(nextColumns);
  }

  async function handleRenameBoardColumn(columnId: string, title: string): Promise<void> {
    const previousColumns = boardColumnsState;
    setBoardColumnsState((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId ? { ...column, title } : column,
      ),
    );

    try {
      const nextColumns = await taskBoardColumnsRepository.rename(columnId, title);
      setBoardColumnsState(nextColumns);
    } catch {
      setBoardColumnsState(previousColumns);
    }
  }

  async function handleDeleteBoardColumn(columnId: string): Promise<void> {
    const previousColumns = boardColumnsState;
    const previousTasks = taskListState;
    const remainingColumns = boardColumnsState.filter((column) => column.id !== columnId);
    const fallbackColumn = remainingColumns[0];

    if (!fallbackColumn) {
      return;
    }

    setBoardColumnsState(remainingColumns);
    setTaskListState((currentTasks) =>
      currentTasks.map((task) =>
        task.boardColumnId === columnId
          ? {
              ...task,
              status: fallbackColumn.statusKey ?? task.status,
              boardColumnId: fallbackColumn.id,
              updatedAt: Date.now(),
            }
          : task,
      ),
    );

    try {
      const result = await taskBoardColumnsRepository.delete(columnId);
      setBoardColumnsState(result.columns);
      setTaskListState((currentTasks) =>
        currentTasks.map((task) =>
          result.movedTaskIds.includes(task.id)
            ? {
                ...task,
                status: result.fallbackStatusKey ?? task.status,
                boardColumnId: result.fallbackColumnId,
              }
            : task,
        ),
      );
    } catch {
      setBoardColumnsState(previousColumns);
      setTaskListState(previousTasks);
    }
  }

  function handleReorderBoardColumns(orderedColumnIds: string[]): void {
    const previousColumns = boardColumnsState;
    const reorderedColumns = orderedColumnIds
      .map((columnId) => boardColumnsState.find((column) => column.id === columnId))
      .filter((column): column is TaskBoardColumn => Boolean(column))
      .map((column, index) => ({
        ...column,
        order: index,
      }));
    const trailingColumns = boardColumnsState.filter(
      (column) => !orderedColumnIds.includes(column.id),
    );
    const nextColumns = [...reorderedColumns, ...trailingColumns].map((column, index) => ({
      ...column,
      order: index,
    }));
    setBoardColumnsState(nextColumns);

    void taskBoardColumnsRepository.reorder(orderedColumnIds).catch(() => {
      setBoardColumnsState(previousColumns);
    });
  }

  function renderActiveView(): JSX.Element {
    switch (activeTaskView) {
      case "board":
        return (
          <TaskBoardView
            boardColumns={boardColumnsState}
            goalTitlesById={goalTitlesById}
            onAddColumn={handleAddBoardColumn}
            onDeleteColumn={handleDeleteBoardColumn}
            onDeleteTask={setTaskPendingDelete}
            onEditTask={setTaskBeingEdited}
            onMoveTask={handleMoveTaskToBoardColumn}
            onRenameColumn={handleRenameBoardColumn}
            onReorderColumns={handleReorderBoardColumns}
            tasks={taskListState}
          />
        );
      case "calendar":
        return (
          <TaskCalendarView
            events={eventListState}
            goalTitlesById={goalTitlesById}
            onAddTaskFromDate={(date) => {
              setTaskDraftDueDate(date);
              setIsAddTaskModalOpen(true);
            }}
            onDeleteTask={setTaskPendingDelete}
            onEditTask={setTaskBeingEdited}
            onEventDeleted={(eventId) =>
              setEventListState((currentEvents) =>
                currentEvents.filter((event) => event.id !== eventId),
              )
            }
            onEventSaved={(event) =>
              setEventListState((currentEvents) => {
                const hasEvent = currentEvents.some((currentEvent) => currentEvent.id === event.id);
                return hasEvent
                  ? currentEvents.map((currentEvent) =>
                      currentEvent.id === event.id ? event : currentEvent,
                    )
                  : [...currentEvents, event];
              })
            }
            onToggleTask={handleToggleTask}
            tasks={taskListState}
          />
        );
      case "list":
      default:
        return (
          <TasksListView
            goalTitlesById={goalTitlesById}
            groups={groupedTasks}
            hasTasks={taskListState.length > 0}
            onDeleteTask={setTaskPendingDelete}
            onEditTask={setTaskBeingEdited}
            onToggleTask={handleToggleTask}
          />
        );
    }
  }

  return (
    <>
      <TasksPageHeader
        onAddTask={() => {
          setTaskDraftDueDate(undefined);
          setIsAddTaskModalOpen(true);
        }}
      />

      <Card>
        <div className="tasks-page-shell">
          <TaskViewSwitcher activeView={activeTaskView} onChange={setActiveTaskView} />
          {activeTaskView !== "calendar" ? (
            <TasksQuickAdd
              isSubmitting={isQuickAdding}
              onChange={setQuickAddValue}
              onOpenAddTaskModal={() => {
                setTaskDraftDueDate(undefined);
                setIsAddTaskModalOpen(true);
              }}
              onSubmit={() => void handleQuickAdd()}
              value={quickAddValue}
            />
          ) : null}
        </div>
      </Card>

      {loading ? <p className="text-muted">Loading tasks...</p> : renderActiveView()}

      <TaskModal
        initialValues={addTaskInitialValues}
        isOpen={isAddTaskModalOpen}
        onClose={() => {
          setIsAddTaskModalOpen(false);
          setTaskDraftDueDate(undefined);
        }}
        onSaved={(task) => {
          replaceTaskInState(task);
          setTaskDraftDueDate(undefined);
        }}
      />
      <TaskModal
        initialTask={taskBeingEdited}
        isOpen={Boolean(taskBeingEdited)}
        mode="edit"
        onClose={() => setTaskBeingEdited(null)}
        onSaved={(task) => {
          replaceTaskInState(task);
          setTaskBeingEdited(task);
        }}
      />
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Delete"
        description="This action cannot be undone."
        isConfirming={isDeletingTask}
        isOpen={Boolean(taskPendingDelete)}
        onCancel={() => {
          if (!isDeletingTask) {
            setTaskPendingDelete(null);
          }
        }}
        onConfirm={() => {
          if (!taskPendingDelete) {
            return;
          }

          const deletingTask = taskPendingDelete;
          const previousTasks = taskListState;
          setTaskPendingDelete(null);
          setIsDeletingTask(true);
          setTaskListState((currentTasks) =>
            currentTasks.filter((task) => task.id !== deletingTask.id),
          );

          void tasksRepository
            .remove(deletingTask.id)
            .catch(() => {
              setTaskListState(previousTasks);
            })
            .finally(() => {
              setIsDeletingTask(false);
            });
        }}
        title="Delete this task?"
        tone="danger"
      />
    </>
  );
}
