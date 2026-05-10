import { useI18n } from "@/i18n";

interface CalendarContextMenuProps {
  isOpen: boolean;
  onAddEvent: () => void;
  onAddTask: () => void;
  position: { x: number; y: number } | null;
}

export function CalendarContextMenu({
  isOpen,
  onAddEvent,
  onAddTask,
  position,
}: CalendarContextMenuProps): JSX.Element | null {
  const { t } = useI18n();

  if (!isOpen || !position) {
    return null;
  }

  return (
    <div
      className="task-calendar__context-menu"
      role="menu"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <button className="task-calendar__context-action" onClick={onAddTask} role="menuitem" type="button">
        {t("tasks.addTask")}
      </button>
      <button className="task-calendar__context-action" onClick={onAddEvent} role="menuitem" type="button">
        {t("calendar.addEvent")}
      </button>
    </div>
  );
}
