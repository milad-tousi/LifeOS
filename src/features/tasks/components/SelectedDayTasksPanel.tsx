import { CalendarDays, CalendarRange, PartyPopper, Plus } from "lucide-react";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { CalendarEventOccurrence, CalendarHoliday } from "@/domains/calendar/types";
import { Task } from "@/domains/tasks/types";
import { TaskListRow } from "@/features/tasks/components/TaskListRow";
import {
  doesEventOccurrenceSpanMultipleDays,
  formatCalendarOccurrenceLabel,
  formatCalendarOccurrenceRecurrence,
  formatSelectedDayLabel,
  formatTaskDateTime,
} from "@/features/tasks/utils/tasks-calendar-view.utils";
import { Language } from "@/i18n/i18n.types";
import { useI18n } from "@/i18n";

interface SelectedDayTasksPanelProps {
  allTasks?: Task[];
  date: Date;
  events: CalendarEventOccurrence[];
  goalTitlesById: Record<string, string>;
  holidays: CalendarHoliday[];
  language: Language;
  onAddEvent: () => void;
  onAddTask: () => void;
  onDeleteTask: (task: Task) => void;
  onEditEvent: (event: CalendarEventOccurrence["event"]) => void;
  onEditTask: (task: Task) => void;
  onToggleTask: (task: Task) => void;
  tasks: Task[];
}

export function SelectedDayTasksPanel({
  allTasks,
  date,
  events,
  goalTitlesById,
  holidays,
  language,
  onAddEvent,
  onAddTask,
  onDeleteTask,
  onEditEvent,
  onEditTask,
  onToggleTask,
  tasks,
}: SelectedDayTasksPanelProps): JSX.Element {
  const { t } = useI18n();
  const effectiveAllTasks = allTasks ?? tasks;
  const hasItems = tasks.length > 0 || events.length > 0 || holidays.length > 0;

  return (
    <section className="task-calendar__panel">
      <div className="task-calendar__panel-header">
        <div>
          <p className="task-calendar__panel-eyebrow">{t("calendar.selectedDay")}</p>
          <h3 className="task-calendar__panel-title">{formatSelectedDayLabel(date, language)}</h3>
        </div>
        <div className="task-calendar__panel-actions">
          <Button onClick={onAddTask} type="button" variant="ghost">
            <Plus size={15} />
            {t("tasks.addTask")}
          </Button>
          <Button onClick={onAddEvent} type="button" variant="secondary">
            <CalendarRange size={15} />
            {t("calendar.addEvent")}
          </Button>
        </div>
      </div>

      {!hasItems ? (
        <EmptyState
          description={t("calendar.emptyDescription")}
          title={t("calendar.emptyTitle")}
        />
      ) : (
        <div className="task-calendar__panel-sections">
          {holidays.length > 0 ? (
            <section className="task-calendar__panel-section">
              <div className="task-calendar__panel-section-header">
                <h4 className="task-calendar__panel-section-title">
                  <PartyPopper size={15} />
                  {t("calendar.holidays")}
                </h4>
              </div>
              <div className="task-calendar__holiday-list">
                {holidays.map((holiday) => (
                  <div className="task-calendar__holiday-item" key={holiday.id}>
                    <span className="task-calendar__holiday-badge">
                      {holiday.calendarType === "occasion" ? t("calendar.occasion") : t("calendar.holiday")}
                    </span>
                    <strong>{holiday.title}</strong>
                    {holiday.region ? <span className="text-muted">{holiday.region}</span> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {events.length > 0 ? (
            <section className="task-calendar__panel-section">
              <div className="task-calendar__panel-section-header">
                <h4 className="task-calendar__panel-section-title">
                  <CalendarRange size={15} />
                  {t("calendar.events")}
                </h4>
              </div>
              <div className="task-calendar__event-list">
                {events.map((event) => (
                  <button
                    className="task-calendar__event-item"
                    key={event.id}
                    onClick={() => onEditEvent(event.event)}
                    type="button"
                  >
                    <div className="task-calendar__event-topline">
                      <strong>{event.event.title}</strong>
                      <span className="task-calendar__event-time">
                        {formatCalendarOccurrenceLabel(event)}
                      </span>
                    </div>
                    {event.event.description ? (
                      <p className="task-calendar__event-description">{event.event.description}</p>
                    ) : null}
                    <div className="task-calendar__event-meta">
                      {doesEventOccurrenceSpanMultipleDays(event) ? (
                        <span className="task-calendar__holiday-badge">{t("calendar.multiDay")}</span>
                      ) : null}
                      {formatCalendarOccurrenceRecurrence(event) ? (
                        <span className="task-calendar__holiday-badge">
                          {formatCalendarOccurrenceRecurrence(event)}
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {tasks.length > 0 ? (
            <section className="task-calendar__panel-section">
              <div className="task-calendar__panel-section-header">
                <h4 className="task-calendar__panel-section-title">
                  <CalendarDays size={15} />
                  {t("tasks.title")}
                </h4>
              </div>
              <div className="task-calendar__panel-list">
                {tasks.map((task) => (
                  <div className="task-calendar__panel-item" key={task.id}>
                    <div className="task-calendar__panel-meta-line">
                      <span className="task-calendar__panel-due">
                        {formatTaskDateTime(task, language) ?? t("calendar.noTimeSet")}
                      </span>
                    </div>
                    <TaskListRow
                      allTasks={effectiveAllTasks}
                      goalTitle={task.goalId ? goalTitlesById[task.goalId] : undefined}
                      goalTitlesById={goalTitlesById}
                      isStandalone={!task.goalId}
                      onDelete={onDeleteTask}
                      onEdit={onEditTask}
                      onToggleComplete={onToggleTask}
                      task={task}
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </section>
  );
}
