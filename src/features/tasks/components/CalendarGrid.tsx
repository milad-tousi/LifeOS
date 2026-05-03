import { CalendarDayCell } from "@/features/tasks/components/CalendarDayCell";
import {
  CalendarDay,
  getCalendarWeekdayLabels,
  getDayTaskState,
  getItemsForDate,
  isSameDay,
  CalendarItem,
} from "@/features/tasks/utils/tasks-calendar-view.utils";
import { Language } from "@/i18n/i18n.types";

interface CalendarGridProps {
  days: CalendarDay[];
  itemsByDate: Record<string, CalendarItem[]>;
  language: Language;
  onDayContextMenu: (date: Date, position: { x: number; y: number }) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  today: Date;
}

export function CalendarGrid({
  days,
  itemsByDate,
  language,
  onDayContextMenu,
  onSelectDate,
  selectedDate,
  today,
}: CalendarGridProps): JSX.Element {
  const weekdayLabels = getCalendarWeekdayLabels(language);

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
          const items = getItemsForDate(itemsByDate, day.date);
          const dayState = getDayTaskState(day.date, items, today);

          return (
            <CalendarDayCell
              day={day}
              dayState={dayState}
              language={language}
              isSelected={isSameDay(day.date, selectedDate)}
              isToday={isSameDay(day.date, today)}
              items={items}
              key={day.key}
              onContextMenu={onDayContextMenu}
              onSelect={onSelectDate}
            />
          );
        })}
      </div>
    </div>
  );
}
