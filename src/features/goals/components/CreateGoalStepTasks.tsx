import { X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { useI18n } from "@/i18n";

interface DraftGoalTask {
  id: string;
  title: string;
}

interface CreateGoalStepTasksProps {
  draftTasks: DraftGoalTask[];
  onAddDraftTask: () => void;
  onChangeDraftTask: (taskId: string, value: string) => void;
  onRemoveDraftTask: (taskId: string) => void;
}

export function CreateGoalStepTasks({
  draftTasks,
  onAddDraftTask,
  onChangeDraftTask,
  onRemoveDraftTask,
}: CreateGoalStepTasksProps): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="goal-create-step">
      <h3 className="goal-create-step__title">{t("goals.createFlow.tasks.title")}</h3>
      <p className="goal-create-step__hint">
        {t("goals.createFlow.tasks.subtitle")}
      </p>

      <div className="goal-draft-task-list">
        {draftTasks.map((task, index) => (
          <div className="goal-draft-task-list__item" key={task.id}>
            <input
              className="auth-form__input"
              onChange={(event) => onChangeDraftTask(task.id, event.target.value)}
              placeholder={t("goals.createFlow.tasks.taskPlaceholder", { index: index + 1 })}
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

      <Button onClick={onAddDraftTask} type="button" variant="secondary">
        {t("goals.createFlow.tasks.addAnotherTask")}
      </Button>
    </section>
  );
}
