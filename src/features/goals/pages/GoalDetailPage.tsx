import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { computeGoalProgress } from "@/domains/goals/goal-progress";
import { goalsRepository } from "@/domains/goals/repository";
import { Goal } from "@/domains/goals/types";
import { tasksRepository } from "@/domains/tasks/repository";
import { Task } from "@/domains/tasks/types";
import { sortTasksByOrder } from "@/domains/tasks/task.utils";
import { EditGoalModal } from "@/features/goals/components/EditGoalModal";
import { GoalHeader } from "@/features/goals/components/GoalHeader";
import { GoalProgress } from "@/features/goals/components/GoalProgress";
import { GoalTaskList } from "@/features/goals/components/GoalTaskList";
import { useGoalDetail } from "@/features/goals/hooks/useGoalDetail";
import { TaskModal } from "@/features/tasks/components/AddTaskModal";
import { getAllDescendantTasks } from "@/features/tasks/utils/taskHierarchy";

const TASK_ROW_TRANSITION_MS = 220;

export function GoalDetailPage(): JSX.Element {
  const navigate = useNavigate();
  const { goalId } = useParams<{ goalId: string }>();
  const { goal, linkedTasks, loading } = useGoalDetail(goalId);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [taskBeingEdited, setTaskBeingEdited] = useState<Task | null>(null);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
  const [taskPendingCompletion, setTaskPendingCompletion] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [goalState, setGoalState] = useState<Goal | null>(null);
  const [taskListState, setTaskListState] = useState<Task[]>([]);
  const [recentTaskId, setRecentTaskId] = useState<string | null>(null);
  const [recentTaskTone, setRecentTaskTone] = useState<"created" | "updated" | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    setGoalState(goal ?? null);
  }, [goal]);

  useEffect(() => {
    setTaskListState(sortTasksByOrder(linkedTasks));
  }, [linkedTasks]);

  useEffect(() => {
    if (!recentTaskId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRecentTaskId(null);
      setRecentTaskTone(null);
    }, 1400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [recentTaskId]);

  const progress = useMemo(
    () => (goalState ? computeGoalProgress(goalState, taskListState) : null),
    [goalState, taskListState],
  );
  const displayGoal = useMemo(() => {
    if (!goalState) {
      return goalState;
    }

    if (goalState.status === "paused" || goalState.status === "archived") {
      return goalState;
    }

    return {
      ...goalState,
      status:
        progress && progress.total > 0 && progress.percentage >= 100 ? "completed" : "active",
    };
  }, [goalState, progress]);

  function replaceTaskInState(task: Task): void {
    setTaskListState((currentTasks) => {
      const currentGoalId = goalState?.id;
      const hasExistingTask = currentTasks.some((currentTask) => currentTask.id === task.id);
      const belongsToCurrentGoal = task.goalId === currentGoalId;

      if (!belongsToCurrentGoal) {
        return currentTasks.filter((currentTask) => currentTask.id !== task.id);
      }

      if (!hasExistingTask) {
        return sortTasksByOrder([...currentTasks, task]);
      }

      return sortTasksByOrder(
        currentTasks.map((currentTask) => (currentTask.id === task.id ? task : currentTask)),
      );
    });
  }

  function handleReorderTasks(reorderedTasks: Task[]): void {
    const previousTasks = taskListState;
    setTaskListState(reorderedTasks);

    if (!displayGoal) {
      return;
    }

    void tasksRepository
      .reorderGoalTasks(
        displayGoal.id,
        reorderedTasks.map((task) => task.id),
      )
      .catch(() => {
        setTaskListState(previousTasks);
      });
  }

  function commitTaskToggle(task: Task): void {
    const nextStatus = task.status === "done" ? "todo" : "done";
    const updatedTask: Task = {
      ...task,
      status: nextStatus,
      completedAt: nextStatus === "done" ? Date.now() : undefined,
      updatedAt: Date.now(),
    };

    replaceTaskInState(updatedTask);

    void tasksRepository.toggleTaskComplete(task.id).catch(() => {
      replaceTaskInState(task);
    });
  }

  function commitTaskUpdate(task: Task, patch: Partial<Task>): void {
    const updatedTask: Task = {
      ...task,
      ...patch,
      updatedAt: Date.now(),
    };

    replaceTaskInState(updatedTask);
    setRecentTaskId(task.id);
    setRecentTaskTone("updated");

    void tasksRepository.update(updatedTask).catch(() => {
      replaceTaskInState(task);
    });
  }

  if (loading) {
    return <p className="text-muted">Loading goal...</p>;
  }

  if (!displayGoal) {
    return (
      <EmptyState
        actionLabel="Back to goals"
        description="This goal could not be found locally."
        onAction={() => navigate("/goals")}
        title="Goal not found"
      />
    );
  }

  return (
    <div className="goal-detail-page">
      <Button onClick={() => navigate("/goals")} type="button" variant="ghost">
        Back to goals
      </Button>

      <Card>
        <GoalHeader goal={displayGoal} />
        <GoalProgress
          completed={progress?.completed ?? 0}
          large
          percent={progress?.percentage ?? 0}
          summaryText={progress?.label ?? "No steps yet"}
          total={progress?.total ?? 0}
        />
      </Card>

      <Card title="Steps" subtitle="Progress updates instantly as linked tasks change">
        {taskListState.length === 0 ? (
          <EmptyState
            actionLabel="Add your first task"
            description="No steps yet. Add tasks to start making progress."
            onAction={() => setIsAddTaskModalOpen(true)}
            title="No steps yet"
          />
        ) : (
          <GoalTaskList
            deletingTaskId={deletingTaskId}
            goalId={displayGoal.id}
            onMarkHighPriority={(task) => {
              commitTaskUpdate(task, {
                priority: "high",
              });
            }}
            onMarkInProgress={(task) => {
              commitTaskUpdate(task, {
                status: "in_progress",
                completedAt: undefined,
              });
            }}
            onDeleteTask={setTaskPendingDelete}
            onEditTask={setTaskBeingEdited}
            onReorderTasks={handleReorderTasks}
            onToggleTask={(task) => {
              const hasIncompleteSubtasks =
                getIncompleteDescendantCount(task, taskListState) > 0;

              if (task.status !== "done" && hasIncompleteSubtasks) {
                setTaskPendingCompletion(task);
                return;
              }

              commitTaskToggle(task);
            }}
            recentTaskId={recentTaskId}
            recentTaskTone={recentTaskTone}
            tasks={taskListState}
          />
        )}
      </Card>

      <Card title="Quick actions">
        <div className="goal-detail-page__actions">
          <Button onClick={() => setIsAddTaskModalOpen(true)} type="button">
            Add task
          </Button>
          <Button onClick={() => setIsEditGoalModalOpen(true)} type="button" variant="secondary">
            Edit goal
          </Button>
          <Button
            onClick={() => void goalsRepository.pause(displayGoal.id)}
            type="button"
            variant="secondary"
          >
            Pause
          </Button>
          <Button
            onClick={() => void goalsRepository.archive(displayGoal.id)}
            type="button"
            variant="ghost"
          >
            Archive
          </Button>
        </div>
      </Card>

      <TaskModal
        goalId={displayGoal.id}
        goalTitle={displayGoal.title}
        isOpen={isAddTaskModalOpen}
        onSaved={(savedTask) => {
          replaceTaskInState(savedTask);
          setRecentTaskId(savedTask.id);
          setRecentTaskTone("created");
        }}
        onClose={() => setIsAddTaskModalOpen(false)}
      />
      <TaskModal
        goalId={displayGoal.id}
        goalTitle={displayGoal.title}
        initialTask={taskBeingEdited}
        isOpen={Boolean(taskBeingEdited)}
        mode="edit"
        onSaved={(savedTask) => {
          replaceTaskInState(savedTask);
          setTaskBeingEdited(savedTask);
          setRecentTaskId(savedTask.id);
          setRecentTaskTone("updated");
        }}
        onClose={() => setTaskBeingEdited(null)}
      />
      <EditGoalModal
        goal={displayGoal}
        isOpen={isEditGoalModalOpen}
        onSaved={setGoalState}
        onClose={() => setIsEditGoalModalOpen(false)}
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
          setDeletingTaskId(deletingTask.id);

          window.setTimeout(() => {
            setTaskListState((currentTasks) =>
              currentTasks.filter((task) => task.id !== deletingTask.id),
            );

            void tasksRepository
              .remove(deletingTask.id)
              .catch(() => {
                setTaskListState(previousTasks);
              })
              .finally(() => {
                setDeletingTaskId(null);
                setIsDeletingTask(false);
              });
          }, TASK_ROW_TRANSITION_MS);
        }}
        title="Delete this task?"
        tone="danger"
      />
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Mark as done"
        description="This task still has incomplete subtasks. Mark it as done anyway?"
        isOpen={Boolean(taskPendingCompletion)}
        onCancel={() => setTaskPendingCompletion(null)}
        onConfirm={() => {
          if (!taskPendingCompletion) {
            return;
          }

          const task = taskPendingCompletion;
          setTaskPendingCompletion(null);
          commitTaskToggle(task);
        }}
        title="Incomplete subtasks"
      />
    </div>
  );
}

function getIncompleteDescendantCount(task: Task, tasks: Task[]): number {
  const descendants = getAllDescendantTasks(tasks, task.id);

  if (descendants.length === 0) {
    return task.subtaskProgress.total - task.subtaskProgress.completed;
  }

  return descendants.filter((descendant) => descendant.status !== "done" && descendant.status !== "cancelled").length;
}
