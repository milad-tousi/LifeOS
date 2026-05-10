import { useEffect, useRef } from "react";
import { LoaderCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { useI18n } from "@/i18n";

interface DraftGoalTask {
  id: string;
  title: string;
}

interface CreateGoalStepTasksProps {
  autoFocusTaskId?: string | null;
  draftTasks: DraftGoalTask[];
  generatedTaskIds?: string[];
  generationError?: string;
  isGenerating?: boolean;
  onAddDraftTask: () => void;
  onChangeDraftTask: (taskId: string, value: string) => void;
  onGenerateWithAi: () => void;
  onRemoveDraftTask: (taskId: string) => void;
}

export function CreateGoalStepTasks({
  autoFocusTaskId,
  draftTasks,
  generatedTaskIds = [],
  generationError = "",
  isGenerating = false,
  onAddDraftTask,
  onChangeDraftTask,
  onGenerateWithAi,
  onRemoveDraftTask,
}: CreateGoalStepTasksProps): JSX.Element {
  const { t } = useI18n();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!autoFocusTaskId) {
      return;
    }

    const nextInput = inputRefs.current[autoFocusTaskId];

    if (!nextInput) {
      return;
    }

    nextInput.focus();
    nextInput.select();
    nextInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [autoFocusTaskId, draftTasks]);

  return (
    <section className="goal-create-step">
      <div className="goal-create-step__header">
        <div className="goal-create-step__copy">
          <h3 className="goal-create-step__title">{t("goals.createFlow.tasks.title")}</h3>
          <p className="goal-create-step__hint">{t("goals.createFlow.tasks.subtitle")}</p>
        </div>
        <button
          aria-label={t("goals.createFlow.tasks.generateWithAi")}
          className="goal-create-step__ai-action"
          disabled={isGenerating}
          onClick={onGenerateWithAi}
          title={t("goals.createFlow.tasks.generateWithAi")}
          type="button"
        >
          {isGenerating ? (
            <LoaderCircle className="goal-create-step__ai-spinner" size={15} />
          ) : (
            <Sparkles size={15} />
          )}
          <span>
            {isGenerating
              ? t("goals.createFlow.tasks.generating")
              : t("goals.createFlow.tasks.generateWithAi")}
          </span>
        </button>
      </div>

      <div className="goal-draft-task-list">
        {draftTasks.map((task, index) => (
          <div
            className={`goal-draft-task-list__item${
              generatedTaskIds.includes(task.id) ? " goal-draft-task-list__item--generated" : ""
            }`}
            key={task.id}
          >
            <input
              className="auth-form__input"
              onChange={(event) => onChangeDraftTask(task.id, event.target.value)}
              placeholder={t("goals.createFlow.tasks.taskPlaceholder", { index: index + 1 })}
              ref={(element) => {
                inputRefs.current[task.id] = element;
              }}
              value={task.title}
            />
            <button
              aria-label={t("goals.createFlow.tasks.removeTaskAria", { index: index + 1 })}
              className="icon-button"
              onClick={() => onRemoveDraftTask(task.id)}
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {generationError ? <p className="auth-form__error">{generationError}</p> : null}

      <Button onClick={onAddDraftTask} type="button" variant="secondary">
        {t("goals.createFlow.tasks.addAnotherTask")}
      </Button>
    </section>
  );
}
