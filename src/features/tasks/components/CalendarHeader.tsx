import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCalendarMonthLabel } from "@/features/tasks/utils/tasks-calendar-view.utils";

interface CalendarHeaderProps {
  monthDate: Date;
  onGoToToday: () => void;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
}

export function CalendarHeader({
  monthDate,
  onGoToToday,
  onNextMonth,
  onPreviousMonth,
}: CalendarHeaderProps): JSX.Element {
  return (
    <div className="task-calendar__header">
      <div>
        <p className="task-calendar__eyebrow">Month view</p>
        <h2 className="task-calendar__month">{formatCalendarMonthLabel(monthDate)}</h2>
      </div>

      <div className="task-calendar__header-actions">
        <button
          aria-label="Go to previous month"
          className="task-calendar__nav-button"
          onClick={onPreviousMonth}
          type="button"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          aria-label="Go to next month"
          className="task-calendar__nav-button"
          onClick={onNextMonth}
          type="button"
        >
          <ChevronRight size={18} />
        </button>
        <button className="task-calendar__today-button" onClick={onGoToToday} type="button">
          Today
        </button>
      </div>
    </div>
  );
}
