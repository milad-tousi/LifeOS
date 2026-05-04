import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { goalsRepository } from "@/domains/goals/repository";
import { GoalCategory, GoalPace, GoalPriority } from "@/domains/goals/types";
import { tasksRepository } from "@/domains/tasks/repository";
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
  const { t } = useI18n();
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentKey = steps[currentStep];
  function updateDraftTask(taskId: string, value: string): void {
    setDraftTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === taskId ? { ...currentTask, title: value } : currentTask,
      ),
    );
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
            draftTasks={draftTasks}
            onAddDraftTask={() =>
              setDraftTasks((currentTasks) => [...currentTasks, createDraftGoalTask()])
            }
            onChangeDraftTask={updateDraftTask}
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
      title={t("goals.createFlow.cardTitle")}
      subtitle={t("goals.createFlow.stepIndicator", { current: currentStep + 1, total: steps.length })}
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
