import { TranslationKey } from "@/i18n/i18n.types";
import { useI18n } from "@/i18n";

type TaskView = "list" | "board" | "calendar";

interface TaskViewSwitcherProps {
  activeView: TaskView;
  onChange: (view: TaskView) => void;
}

const VIEW_ITEMS: Array<{
  description: string;
  disabled?: boolean;
  labelKey: TranslationKey;
  value: TaskView;
}> = [
  {
    value: "list",
    labelKey: "tasks.list",
    description: "Execution-focused grouped task list.",
  },
  {
    value: "board",
    labelKey: "tasks.board",
    description: "Status-based task board.",
  },
  {
    value: "calendar",
    labelKey: "tasks.calendar",
    description: "Monthly planning view.",
  },
];

export function TaskViewSwitcher({
  activeView,
  onChange,
}: TaskViewSwitcherProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="task-view-switcher" aria-label={t("tasks.title")} role="tablist">
      {VIEW_ITEMS.map((view) => (
        <button
          aria-selected={activeView === view.value}
          className={[
            "task-view-switcher__item",
            activeView === view.value ? "task-view-switcher__item--active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          disabled={view.disabled}
          key={view.value}
          onClick={() => onChange(view.value)}
          role="tab"
          type="button"
        >
          <span>{t(view.labelKey)}</span>
          {view.disabled ? (
            <span className="task-view-switcher__badge">{view.description}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export type { TaskView };
