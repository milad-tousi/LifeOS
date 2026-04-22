type TaskView = "list" | "board" | "calendar";

interface TaskViewSwitcherProps {
  activeView: TaskView;
  onChange: (view: TaskView) => void;
}

const VIEW_ITEMS: Array<{
  description: string;
  disabled?: boolean;
  label: string;
  value: TaskView;
}> = [
  {
    value: "list",
    label: "List",
    description: "Execution-focused grouped task list.",
  },
  {
    value: "board",
    label: "Board",
    description: "Status-based task board.",
  },
  {
    value: "calendar",
    label: "Calendar",
    description: "Coming soon",
    disabled: true,
  },
];

export function TaskViewSwitcher({
  activeView,
  onChange,
}: TaskViewSwitcherProps): JSX.Element {
  return (
    <div className="task-view-switcher" aria-label="Task views" role="tablist">
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
          <span>{view.label}</span>
          {view.disabled ? (
            <span className="task-view-switcher__badge">{view.description}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export type { TaskView };
