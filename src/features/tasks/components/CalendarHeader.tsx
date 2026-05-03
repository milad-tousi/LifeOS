import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCalendarMonthLabel } from "@/features/tasks/utils/tasks-calendar-view.utils";
import { Language } from "@/i18n/i18n.types";
import { useI18n } from "@/i18n";

interface CalendarHeaderProps {
  language: Language;
  monthDate: Date;
  onGoToToday: () => void;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
}

export function CalendarHeader({
  language,
  monthDate,
  onGoToToday,
  onNextMonth,
  onPreviousMonth,
}: CalendarHeaderProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="task-calendar__header">
      <div>
        <p className="task-calendar__eyebrow">{t("calendar.monthView")}</p>
        <h2 className="task-calendar__month">{formatCalendarMonthLabel(monthDate, language)}</h2>
      </div>

      <div className="task-calendar__header-actions">
        <button
          aria-label={t("calendar.previous")}
          className="task-calendar__nav-button"
          onClick={onPreviousMonth}
          type="button"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          aria-label={t("calendar.next")}
          className="task-calendar__nav-button"
          onClick={onNextMonth}
          type="button"
        >
          <ChevronRight size={18} />
        </button>
        <button className="task-calendar__today-button" onClick={onGoToToday} type="button">
          {t("common.today")}
        </button>
      </div>
    </div>
  );
}
