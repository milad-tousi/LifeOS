import { CalendarDay, CalendarDayState } from "@/features/tasks/utils/tasks-calendar-view.utils";
import { Task } from "@/domains/tasks/types";

interface CalendarDayCellProps {
  day: CalendarDay;
  dayState: CalendarDayState;
  isSelected: boolean;
  isToday: boolean;
  onSelect: (date: Date) => void;
  tasks: Task[];
}

export function CalendarDayCell({
  day,
  dayState,
  isSelected,
  isToday,
  onSelect,
  tasks,
}: CalendarDayCellProps): JSX.Element {
  const previewTasks = tasks.slice(0, 2);
  const extraCount = tasks.length - previewTasks.length;

  return (
    <button
      aria-pressed={isSelected}
      className={[
        "task-calendar__day",
        day.isCurrentMonth ? "" : "task-calendar__day--outside",
        isToday ? "task-calendar__day--today" : "",
        isSelected ? "task-calendar__day--selected" : "",
        dayState.hasTasks ? "task-calendar__day--has-tasks" : "",
        dayState.isOverdue ? "task-calendar__day--overdue" : "",
        dayState.isDueToday ? "task-calendar__day--due-today" : "",
        dayState.isDueSoon ? "task-calendar__day--due-soon" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelect(day.date)}
      type="button"
    >
      <div className="task-calendar__day-header">
        <span className="task-calendar__day-number">{day.date.getDate()}</span>
        {dayState.hasTasks ? (
          <span className="task-calendar__day-count">
            {dayState.openTaskCount > 0 ? dayState.openTaskCount : dayState.completedTaskCount}
          </span>
        ) : null}
      </div>

      <div className="task-calendar__day-body">
        {previewTasks.map((task) => (
          <span className="task-calendar__day-preview" key={task.id}>
            {task.title}
          </span>
        ))}
        {extraCount > 0 ? (
          <span className="task-calendar__day-more">+{extraCount} more</span>
        ) : null}
      </div>

      <div className="task-calendar__day-indicators">
        {dayState.isOverdue ? <span className="task-calendar__day-indicator task-calendar__day-indicator--danger">Overdue</span> : null}
        {!dayState.isOverdue && dayState.isDueToday ? (
          <span className="task-calendar__day-indicator task-calendar__day-indicator--warning">Due today</span>
        ) : null}
        {!dayState.isOverdue && !dayState.isDueToday && dayState.isDueSoon ? (
          <span className="task-calendar__day-indicator task-calendar__day-indicator--info">Due soon</span>
        ) : null}
      </div>
    </button>
  );
}
