import { CalendarDay, CalendarDayState, CalendarItem } from "@/features/tasks/utils/tasks-calendar-view.utils";

interface CalendarDayCellProps {
  day: CalendarDay;
  dayState: CalendarDayState;
  isSelected: boolean;
  isToday: boolean;
  items: CalendarItem[];
  onContextMenu: (date: Date, position: { x: number; y: number }) => void;
  onSelect: (date: Date) => void;
}

export function CalendarDayCell({
  day,
  dayState,
  isSelected,
  isToday,
  items,
  onContextMenu,
  onSelect,
}: CalendarDayCellProps): JSX.Element {
  const previewItems = items.slice(0, 2);
  const extraCount = items.length - previewItems.length;

  return (
    <button
      aria-pressed={isSelected}
      className={[
        "task-calendar__day",
        day.isCurrentMonth ? "" : "task-calendar__day--outside",
        isToday ? "task-calendar__day--today" : "",
        isSelected ? "task-calendar__day--selected" : "",
        dayState.hasItems ? "task-calendar__day--has-tasks" : "",
        dayState.isHoliday ? "task-calendar__day--holiday" : "",
        dayState.isOverdue ? "task-calendar__day--overdue" : "",
        dayState.isDueToday ? "task-calendar__day--due-today" : "",
        dayState.isDueSoon ? "task-calendar__day--due-soon" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelect(day.date)}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu(day.date, { x: event.clientX, y: event.clientY });
      }}
      type="button"
    >
      <div className="task-calendar__day-header">
        <span className="task-calendar__day-number">{day.date.getDate()}</span>
        {dayState.hasItems ? (
          <span className="task-calendar__day-count">{items.length}</span>
        ) : null}
      </div>

      <div className="task-calendar__day-body">
        {previewItems.map((item) => (
          <span
            className={`task-calendar__day-preview task-calendar__day-preview--${item.itemType}`}
            key={item.id}
          >
            {getPreviewLabel(item)}
          </span>
        ))}
        {extraCount > 0 ? <span className="task-calendar__day-more">+{extraCount} more</span> : null}
      </div>

      <div className="task-calendar__day-indicators">
        {dayState.taskCount > 0 ? (
          <span className="task-calendar__day-indicator task-calendar__day-indicator--task">
            {dayState.taskCount} task{dayState.taskCount === 1 ? "" : "s"}
          </span>
        ) : null}
        {dayState.eventCount > 0 ? (
          <span className="task-calendar__day-indicator task-calendar__day-indicator--info">
            {dayState.eventCount} event{dayState.eventCount === 1 ? "" : "s"}
          </span>
        ) : null}
        {dayState.holidayCount > 0 ? (
          <span className="task-calendar__day-indicator task-calendar__day-indicator--holiday">
            Holiday
          </span>
        ) : null}
      </div>
    </button>
  );
}

function getPreviewLabel(item: CalendarItem): string {
  switch (item.itemType) {
    case "holiday":
      return item.holiday.title;
    case "event":
      return item.occurrence.event.title;
    case "task":
    default:
      return item.task.title;
  }
}
