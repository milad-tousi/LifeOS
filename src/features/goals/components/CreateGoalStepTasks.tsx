import { X } from "lucide-react";
import { Button } from "@/components/common/Button";

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
  return (
    <section className="goal-create-step">
      <h3 className="goal-create-step__title">Break it into the first steps</h3>
      <p className="goal-create-step__hint">
        Three tasks is a strong start, but you can continue with fewer if you want.
      </p>

      <div className="goal-draft-task-list">
        {draftTasks.map((task, index) => (
          <div className="goal-draft-task-list__item" key={task.id}>
            <input
              className="auth-form__input"
              onChange={(event) => onChangeDraftTask(task.id, event.target.value)}
              placeholder={`Task ${index + 1}`}
              value={task.title}
            />
            <button
              aria-label={`Remove task ${index + 1}`}
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
        Add another task
      </Button>
    </section>
  );
}
