import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  EditableGoalTaskSuggestion,
  AiTaskSuggestionsModal,
} from "@/features/goals/components/AiTaskSuggestionsModal";
import { AiGoalTaskButton } from "@/features/goals/components/AiGoalTaskButton";
import { EditGoalModal } from "@/features/goals/components/EditGoalModal";
import { GoalHeader } from "@/features/goals/components/GoalHeader";
import { GoalProgress } from "@/features/goals/components/GoalProgress";
import { GoalTaskList } from "@/features/goals/components/GoalTaskList";
import {
  GoalTaskGenerationError,
  generateGoalTaskSuggestions,
} from "@/features/goals/ai/generateGoalTasks";
import { useGoalDetail } from "@/features/goals/hooks/useGoalDetail";
import { formatGoalProgressSummary } from "@/features/goals/utils/goals.i18n";
import { TaskModal } from "@/features/tasks/components/AddTaskModal";
import { getAllDescendantTasks } from "@/features/tasks/utils/taskHierarchy";
import { useI18n } from "@/i18n";
import { createId } from "@/lib/id";

const TASK_ROW_TRANSITION_MS = 220;

export function GoalDetailPage(): JSX.Element {
  const { language, t } = useI18n();
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
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isAddingSuggestions, setIsAddingSuggestions] = useState(false);
  const [aiSuggestionError, setAiSuggestionError] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<EditableGoalTaskSuggestion[]>([]);
  const [isAiSuggestionsModalOpen, setIsAiSuggestionsModalOpen] = useState(false);

  useEffect(() => {
    setGoalState(goal ?? null);
  }, [goal]);

  // Guard: only update task list when content actually changes (prevents infinite
  // re-render loops when useLiveQuery emits a new array reference with the same data)
  const prevLinkedTasksKeyRef = useRef<string>("");
  useEffect(() => {
    const key = linkedTasks.map((t) => `${t.id}:${t.updatedAt}`).join(",");
    if (key === prevLinkedTasksKeyRef.current) return;
    prevLinkedTasksKeyRef.current = key;
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

  async function requestAiSuggestions(): Promise<void> {
    if (!displayGoal || !progress) {
      return;
    }

    setAiSuggestionError("");
    setIsGeneratingSuggestions(true);

    try {
      const suggestions = await generateGoalTaskSuggestions({
        category: displayGoal.category,
        deadline: displayGoal.deadline,
        description: displayGoal.description ?? "",
        existingSubtasks: taskListState.flatMap((task) =>
          task.subtasks.map((subtask) => ({
            completed: subtask.completed,
            title: subtask.title,
          })),
        ),
        existingTasks: taskListState.map((task) => ({
          overdue: isTaskOverdue(task),
          status: task.status,
          title: task.title,
        })),
        language,
        notes: displayGoal.notes,
        pace: displayGoal.pace,
        priority: displayGoal.priority,
        progress,
        progressType: displayGoal.progressType,
        title: displayGoal.title,
      });

      setAiSuggestions(
        suggestions.map((suggestion) => ({
          ...suggestion,
          id: createId(),
          selected: true,
        })),
      );
      setIsAiSuggestionsModalOpen(true);
    } catch (error) {
      setAiSuggestionError(getAiSuggestionErrorMessage(error, t));
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }

  async function handleAddSelectedSuggestions(): Promise<void> {
    if (!displayGoal) {
      return;
    }

    const existingTitles = new Set(
      [
        ...taskListState.map((task) => task.title),
        ...taskListState.flatMap((task) => task.subtasks.map((subtask) => subtask.title)),
      ]
        .map(normalizeSuggestionTitle)
        .filter(Boolean),
    );
    const seenSelectedTitles = new Set<string>();
    const selectedSuggestions = aiSuggestions.filter((suggestion) => {
      if (!suggestion.selected || !suggestion.title.trim()) {
        return false;
      }

      const normalizedTitle = normalizeSuggestionTitle(suggestion.title);

      if (!normalizedTitle || existingTitles.has(normalizedTitle) || seenSelectedTitles.has(normalizedTitle)) {
        return false;
      }

      seenSelectedTitles.add(normalizedTitle);
      return true;
    });

    if (selectedSuggestions.length === 0) {
      setAiSuggestionError(t("goals.detail.ai.errors.empty"));
      return;
    }

    setIsAddingSuggestions(true);

    try {
      const savedTasks = await Promise.all(
        selectedSuggestions.map((suggestion) =>
          tasksRepository.addTaskToGoal(displayGoal.id, {
            priority: suggestion.priority,
            title: suggestion.title.trim(),
          }),
        ),
      );

      setTaskListState((currentTasks) => sortTasksByOrder([...currentTasks, ...savedTasks]));
      setRecentTaskId(savedTasks[0]?.id ?? null);
      setRecentTaskTone(savedTasks.length > 0 ? "created" : null);
      setAiSuggestions([]);
      setIsAiSuggestionsModalOpen(false);
    } finally {
      setIsAddingSuggestions(false);
    }
  }

  if (loading) {
    return <p className="text-muted">{t("goals.detail.loading")}</p>;
  }

  if (!displayGoal) {
    return (
      <EmptyState
        actionLabel={t("goals.detail.backToGoals")}
        description={t("goals.detail.notFoundDescription")}
        onAction={() => navigate("/goals")}
        title={t("goals.detail.notFoundTitle")}
      />
    );
  }

  return (
    <div className="goal-detail-page">
      <Button onClick={() => navigate("/goals")} type="button" variant="ghost">
        {t("goals.detail.backToGoals")}
      </Button>

      <Card>
        <GoalHeader goal={displayGoal} />
        <GoalProgress
          completed={progress?.completed ?? 0}
          large
          language={language}
          percent={progress?.percentage ?? 0}
          summaryText={
            progress
              ? formatGoalProgressSummary(displayGoal, progress, t, language)
              : t("goals.noStepsYet")
          }
          total={progress?.total ?? 0}
        />
      </Card>

      <Card title={t("goals.detail.stepsTitle")} subtitle={t("goals.detail.stepsSubtitle")}>
        <div className="goal-detail-page__steps-toolbar">
          <AiGoalTaskButton
            isLoading={isGeneratingSuggestions}
            onClick={() => void requestAiSuggestions()}
          />
        </div>
        {aiSuggestionError ? <p className="auth-form__error">{aiSuggestionError}</p> : null}
        {taskListState.length === 0 ? (
          <EmptyState
            actionLabel={t("goals.detail.stepsEmptyAction")}
            description={t("goals.detail.stepsEmptyDescription")}
            onAction={() => setIsAddTaskModalOpen(true)}
            title={t("goals.noStepsYet")}
          />
        ) : (
          <GoalTaskList
            deletingTaskId={deletingTaskId}
            goalId={displayGoal.id}
            onDeleteTask={setTaskPendingDelete}
            onEditTask={setTaskBeingEdited}
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
            onReorderTasks={handleReorderTasks}
            onToggleTask={(task) => {
              const hasIncompleteSubtasks = getIncompleteDescendantCount(task, taskListState) > 0;

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

      <Card title={t("goals.detail.quickActionsTitle")}>
        <div className="goal-detail-page__actions">
          <Button onClick={() => setIsAddTaskModalOpen(true)} type="button">
            {t("goals.detail.addTask")}
          </Button>
          <Button onClick={() => setIsEditGoalModalOpen(true)} type="button" variant="secondary">
            {t("goals.detail.editGoal")}
          </Button>
          <Button
            onClick={() => void goalsRepository.pause(displayGoal.id)}
            type="button"
            variant="secondary"
          >
            {t("goals.detail.pause")}
          </Button>
          <Button
            onClick={() => void goalsRepository.archive(displayGoal.id)}
            type="button"
            variant="ghost"
          >
            {t("goals.detail.archive")}
          </Button>
        </div>
      </Card>

      <TaskModal
        goalId={displayGoal.id}
        goalTitle={displayGoal.title}
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSaved={(savedTask) => {
          replaceTaskInState(savedTask);
          setRecentTaskId(savedTask.id);
          setRecentTaskTone("created");
        }}
      />
      <TaskModal
        goalId={displayGoal.id}
        goalTitle={displayGoal.title}
        initialTask={taskBeingEdited}
        isOpen={Boolean(taskBeingEdited)}
        mode="edit"
        onClose={() => setTaskBeingEdited(null)}
        onSaved={(savedTask) => {
          replaceTaskInState(savedTask);
          setTaskBeingEdited(savedTask);
          setRecentTaskId(savedTask.id);
          setRecentTaskTone("updated");
        }}
      />
      <AiTaskSuggestionsModal
        error={aiSuggestionError}
        isAddingTasks={isAddingSuggestions}
        isOpen={isAiSuggestionsModalOpen}
        isRegenerating={isGeneratingSuggestions}
        onAddSelected={() => void handleAddSelectedSuggestions()}
        onChangeSelection={(suggestionId, selected) =>
          setAiSuggestions((currentSuggestions) =>
            currentSuggestions.map((suggestion) =>
              suggestion.id === suggestionId ? { ...suggestion, selected } : suggestion,
            ),
          )
        }
        onChangeTitle={(suggestionId, title) =>
          setAiSuggestions((currentSuggestions) =>
            currentSuggestions.map((suggestion) =>
              suggestion.id === suggestionId ? { ...suggestion, title } : suggestion,
            ),
          )
        }
        onClose={() => setIsAiSuggestionsModalOpen(false)}
        onRegenerate={() => void requestAiSuggestions()}
        onRemoveSuggestion={(suggestionId) =>
          setAiSuggestions((currentSuggestions) =>
            currentSuggestions.filter((suggestion) => suggestion.id !== suggestionId),
          )
        }
        suggestions={aiSuggestions}
      />
      <EditGoalModal
        goal={displayGoal}
        isOpen={isEditGoalModalOpen}
        onClose={() => setIsEditGoalModalOpen(false)}
        onSaved={setGoalState}
      />
      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        confirmLabel={t("common.delete")}
        description={t("goals.detail.deleteTaskDescription")}
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
        title={t("goals.detail.deleteTaskTitle")}
        tone="danger"
      />
      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        confirmLabel={t("goals.detail.markDone")}
        description={t("goals.detail.incompleteSubtasksDescription")}
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
        title={t("goals.detail.incompleteSubtasksTitle")}
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

function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "done" || task.status === "cancelled") {
    return false;
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return task.dueDate < todayKey;
}

function getAiSuggestionErrorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof GoalTaskGenerationError) {
    switch (error.code) {
      case "ai-disabled":
        return t("goals.detail.ai.errors.disabled");
      case "ai-incomplete":
        return t("goals.detail.ai.errors.incomplete");
      case "ai-empty":
        return t("goals.detail.ai.errors.empty");
      case "ai-request-failed":
      default:
        return t("goals.detail.ai.errors.failed");
    }
  }

  return t("goals.detail.ai.errors.failed");
}

function normalizeSuggestionTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
