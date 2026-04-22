import { CalendarDayCell } from "@/features/tasks/components/CalendarDayCell";
import {
  CalendarDay,
  getCalendarWeekdayLabels,
  getDayTaskState,
  isSameDay,
} from "@/features/tasks/utils/tasks-calendar-view.utils";
import { Task } from "@/domains/tasks/types";

interface CalendarGridProps {
  days: CalendarDay[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  tasksByDate: Record<string, Task[]>;
  today: Date;
}

export function CalendarGrid({
  days,
  onSelectDate,
  selectedDate,
  tasksByDate,
  today,
}: CalendarGridProps): JSX.Element {
  const weekdayLabels = getCalendarWeekdayLabels();

  return (
    <div className="task-calendar__grid-shell">
      <div className="task-calendar__weekdays" aria-hidden="true">
        {weekdayLabels.map((label) => (
          <span className="task-calendar__weekday" key={label}>
            {label}
          </span>
        ))}
      </div>

      <div className="task-calendar__grid">
        {days.map((day) => {
          const tasks = tasksByDate[day.key] ?? [];
          const dayState = getDayTaskState(day.date, tasks, today);

          return (
            <CalendarDayCell
              day={day}
              dayState={dayState}
              isSelected={isSameDay(day.date, selectedDate)}
              isToday={isSameDay(day.date, today)}
              key={day.key}
              onSelect={onSelectDate}
              tasks={tasks}
            />
          );
        })}
      </div>
    </div>
  );
}
