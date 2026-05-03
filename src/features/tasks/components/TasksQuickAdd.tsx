import { FormEvent } from "react";
import { Button } from "@/components/common/Button";
import { useI18n } from "@/i18n";

interface TasksQuickAddProps {
  isSubmitting: boolean;
  value: string;
  onChange: (value: string) => void;
  onOpenAddTaskModal: () => void;
  onSubmit: () => void;
}

export function TasksQuickAdd({
  isSubmitting,
  onChange,
  onOpenAddTaskModal,
  onSubmit,
  value,
}: TasksQuickAddProps): JSX.Element {
  const { t } = useI18n();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="tasks-quick-add" onSubmit={handleSubmit}>
      <label className="tasks-quick-add__field" htmlFor="tasks-quick-add-input">
        <span className="tasks-quick-add__label">{t("tasks.quickAdd")}</span>
        <input
          className="auth-form__input"
          id="tasks-quick-add-input"
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("tasks.quickAddPlaceholder")}
          value={value}
        />
      </label>
      <div className="tasks-quick-add__actions">
        <Button disabled={isSubmitting || !value.trim()} type="submit">
          {isSubmitting ? t("common.adding") : t("common.add")}
        </Button>
        <Button onClick={onOpenAddTaskModal} type="button" variant="secondary">
          {t("tasks.openFullTaskForm")}
        </Button>
      </div>
    </form>
  );
}
