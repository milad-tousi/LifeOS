import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { goalsRepository } from "@/domains/goals/repository";
import { GoalCategory, GoalPace, GoalPriority } from "@/domains/goals/types";
import { tasksRepository } from "@/domains/tasks/repository";
import { GoalTaskGenerationError, generateGoalTasks } from "@/features/goals/ai/generateGoalTasks";
import { CreateGoalStepBasic } from "@/features/goals/components/CreateGoalStepBasic";
import { CreateGoalStepCategory } from "@/features/goals/components/CreateGoalStepCategory";
import { CreateGoalStepMeta } from "@/features/goals/components/CreateGoalStepMeta";
import { CreateGoalStepTasks } from "@/features/goals/components/CreateGoalStepTasks";
import { useI18n } from "@/i18n";
import { createId } from "@/lib/id";

const steps = ["basic", "category", "meta", "tasks"] as const;

interface DraftGoalTask {
  id: string;
  title: string;
}

function createDraftGoalTask(title = ""): DraftGoalTask {
  return {
    id: createId(),
    title,
  };
}

export function CreateGoalFlow(): JSX.Element {
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("lifestyle");
  const [pace, setPace] = useState<GoalPace>("balanced");
  const [priority, setPriority] = useState<GoalPriority>("medium");
  const [deadline, setDeadline] = useState<string | undefined>();
  const [draftTasks, setDraftTasks] = useState<DraftGoalTask[]>(() => [
    createDraftGoalTask(),
    createDraftGoalTask(),
    createDraftGoalTask(),
  ]);
  const [error, setError] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [generatedTaskIds, setGeneratedTaskIds] = useState<string[]>([]);
  const [autoFocusTaskId, setAutoFocusTaskId] = useState<string | null>(null);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentKey = steps[currentStep];

  useEffect(() => {
    if (generatedTaskIds.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGeneratedTaskIds([]);
    }, 1400);

    return () => window.clearTimeout(timeoutId);
  }, [generatedTaskIds]);

  useEffect(() => {
    if (!autoFocusTaskId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAutoFocusTaskId(null);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [autoFocusTaskId]);

  function updateDraftTask(taskId: string, value: string): void {
    setDraftTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === taskId ? { ...currentTask, title: value } : currentTask,
      ),
    );
  }

  async function handleGenerateTasks(): Promise<void> {
    setError("");
    setGenerationError("");
    setIsGeneratingTasks(true);

    try {
      const suggestions = await generateGoalTasks({
        category,
        deadline,
        description,
        language,
        pace,
        priority,
        title,
      });

      setDraftTasks((currentTasks) => {
        const result = mergeGeneratedTasksIntoDraft(currentTasks, suggestions);
        setGeneratedTaskIds(result.generatedTaskIds);
        setAutoFocusTaskId(result.generatedTaskIds[0] ?? null);
        if (result.generatedTaskIds.length === 0) {
          setGenerationError(t("goals.createFlow.tasks.aiErrors.empty"));
        }
        return result.tasks;
      });
    } catch (error) {
      setGeneratedTaskIds([]);
      setAutoFocusTaskId(null);
      setGenerationError(getGoalTaskGenerationErrorMessage(error, t));
    } finally {
      setIsGeneratingTasks(false);
    }
  }

  async function handleNext(): Promise<void> {
    if (currentKey === "basic" && !title.trim()) {
      setError(t("goals.createFlow.errors.titleRequired"));
      return;
    }

    if (currentKey === "tasks") {
      setIsSubmitting(true);

      try {
        const goalId = await goalsRepository.add({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          pace,
          priority,
          deadline,
        });

        const validTasks = draftTasks.map((task) => task.title.trim()).filter(Boolean);
        await Promise.all(
          validTasks.map((taskTitle) =>
            tasksRepository.addTaskToGoal(goalId, {
              title: taskTitle,
            }),
          ),
        );

        navigate(`/goals/${goalId}`, { replace: true });
      } catch {
        setError(t("goals.createFlow.errors.createFailed"));
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    setError("");
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  function handleBack(): void {
    setError("");
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function renderStep(): JSX.Element {
    switch (currentKey) {
      case "basic":
        return (
          <CreateGoalStepBasic
            description={description}
            onChange={(patch) => {
              if (patch.title !== undefined) {
                setTitle(patch.title);
              }

              if (patch.description !== undefined) {
                setDescription(patch.description);
              }
            }}
            title={title}
          />
        );
      case "category":
        return <CreateGoalStepCategory category={category} onChange={setCategory} />;
      case "meta":
        return (
          <CreateGoalStepMeta
            deadline={deadline}
            onChange={(patch) => {
              if (patch.deadline !== undefined || patch.deadline === undefined) {
                setDeadline(patch.deadline);
              }

              if (patch.pace) {
                setPace(patch.pace);
              }

              if (patch.priority) {
                setPriority(patch.priority);
              }
            }}
            pace={pace}
            priority={priority}
          />
        );
      case "tasks":
        return (
          <CreateGoalStepTasks
            autoFocusTaskId={autoFocusTaskId}
            draftTasks={draftTasks}
            generatedTaskIds={generatedTaskIds}
            generationError={generationError}
            isGenerating={isGeneratingTasks}
            onAddDraftTask={() =>
              setDraftTasks((currentTasks) => [...currentTasks, createDraftGoalTask()])
            }
            onChangeDraftTask={updateDraftTask}
            onGenerateWithAi={() => void handleGenerateTasks()}
            onRemoveDraftTask={(taskId) =>
              setDraftTasks((currentTasks) =>
                currentTasks.length > 1
                  ? currentTasks.filter((task) => task.id !== taskId)
                  : currentTasks,
              )
            }
          />
        );
    }
  }

  return (
    <Card
      subtitle={t("goals.createFlow.stepIndicator", { current: currentStep + 1, total: steps.length })}
      title={t("goals.createFlow.cardTitle")}
    >
      <div className="goal-create-flow">
        <div className="goal-create-flow__body" key={currentKey}>
          {renderStep()}
          {error ? <p className="auth-form__error">{error}</p> : null}
        </div>

        <div className="goal-create-flow__actions">
          <Button onClick={handleBack} type="button" variant="secondary">
            {t("goals.createFlow.back")}
          </Button>
          <Button disabled={isSubmitting} onClick={() => void handleNext()} type="button">
            {currentKey === "tasks"
              ? isSubmitting
                ? t("goals.createFlow.creating")
                : t("goals.createFlow.submit")
              : t("goals.createFlow.next")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function mergeGeneratedTasksIntoDraft(
  currentTasks: DraftGoalTask[],
  suggestions: string[],
): { generatedTaskIds: string[]; tasks: DraftGoalTask[] } {
  const uniqueSuggestions = dedupeTasks(suggestions);
  const existingFilledTitles = new Set(
    currentTasks.map((task) => normalizeTaskTitle(task.title)).filter(Boolean),
  );
  const emptyTaskIds = currentTasks.filter((task) => !task.title.trim()).map((task) => task.id);
  const nextSuggestions = uniqueSuggestions.filter(
    (taskTitle) => !existingFilledTitles.has(normalizeTaskTitle(taskTitle)),
  );

  if (nextSuggestions.length === 0) {
    return {
      generatedTaskIds: [],
      tasks: currentTasks.filter((task) => task.title.trim()),
    };
  }

  const generatedTaskIds: string[] = [];
  const updatesById = new Map<string, string>();
  const tasksToAppend: DraftGoalTask[] = [];

  nextSuggestions.forEach((taskTitle, index) => {
    const emptyTaskId = emptyTaskIds[index];

    if (emptyTaskId) {
      updatesById.set(emptyTaskId, taskTitle);
      generatedTaskIds.push(emptyTaskId);
      return;
    }

    const nextTask = createDraftGoalTask(taskTitle);
    tasksToAppend.push(nextTask);
    generatedTaskIds.push(nextTask.id);
  });

  const nextTasks = currentTasks
    .map((task) =>
      updatesById.has(task.id) ? { ...task, title: updatesById.get(task.id) ?? task.title } : task,
    )
    .filter((task) => task.title.trim());

  return {
    generatedTaskIds,
    tasks: [...nextTasks, ...tasksToAppend],
  };
}

function dedupeTasks(tasks: string[]): string[] {
  const seen = new Set<string>();

  return tasks.filter((task) => {
    const normalized = normalizeTaskTitle(task);

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function normalizeTaskTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function getGoalTaskGenerationErrorMessage(
  error: unknown,
  t: (key: string) => string,
): string {
  if (error instanceof GoalTaskGenerationError) {
    switch (error.code) {
      case "ai-disabled":
        return t("goals.createFlow.tasks.aiErrors.disabled");
      case "ai-incomplete":
        return t("goals.createFlow.tasks.aiErrors.incomplete");
      case "ai-empty":
        return t("goals.createFlow.tasks.aiErrors.empty");
      case "ai-request-failed":
      default:
        return t("goals.createFlow.tasks.aiErrors.failed");
    }
  }

  return t("goals.createFlow.tasks.aiErrors.failed");
}
