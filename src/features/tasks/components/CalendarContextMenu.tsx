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
        Add task
      </button>
      <button className="task-calendar__context-action" onClick={onAddEvent} role="menuitem" type="button">
        Add event
      </button>
    </div>
  );
}
