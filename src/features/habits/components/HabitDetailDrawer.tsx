import { FormEvent, useEffect, useMemo, useState } from "react";
import { Archive, ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Habit, HabitLog } from "@/domains/habits/types";
import { HabitCategory } from "@/features/habits/services/habit-categories.storage";
import { calculateHabitCompletion } from "@/features/habits/services/habits.storage";
import {
  addMonths,
  calculateCurrentStreak,
  calculateLongestStreak,
  getCalendarDaysForMonth,
  getDateKey,
  isFutureDate,
  isHabitActiveOnDate,
  isPastDate,
  parseDateKey,
} from "@/features/habits/utils/habit.utils";

interface HabitDetailDrawerProps {
  categories: HabitCategory[];
  habit: Habit | null;
  isOpen: boolean;
  logs: HabitLog[];
  onArchiveHabit: (habitId: string) => void;
  onClose: () => void;
  onDeleteLog: (habitId: string, dateKey: string) => void;
  onEditHabit: (habit: Habit) => void;
  onSaveLog: (habitId: string, dateKey: string, value: number, note?: string) => void;
}

interface SelectedLogState {
  dateKey: string;
  value: string;
  note: string;
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCategoryName(habit: Habit, categories: HabitCategory[]): string {
  if (!habit.category) {
    return "Uncategorized";
  }

  return (
    categories.find((category) => category.id === habit.category || category.name === habit.category)?.name ??
    "Uncategorized"
  );
}

function formatTarget(habit: Habit): string {
  if (habit.type === "binary") {
    return "Done";
  }

  return `${habit.target}${habit.unit ? ` ${habit.unit}` : ""}`;
}

function formatSchedule(habit: Habit): string {
  const end = habit.endDate ? ` until ${habit.endDate}` : "";

  if (habit.frequency === "daily") {
    return `Daily from ${habit.startDate}${end}`;
  }

  if (habit.frequency === "weekly") {
    const weekday = weekdays[parseDateKey(habit.startDate).getDay()];
    return `Weekly on ${weekday} from ${habit.startDate}${end}`;
  }

  const days = habit.daysOfWeek?.map((day) => weekdays[day]).join(", ") || "No days selected";

  return `Custom days: ${days}${end}`;
}

function getLogForDate(logs: HabitLog[], habitId: string, dateKey: string): HabitLog | undefined {
  return logs.find((log) => log.habitId === habitId && log.date === dateKey);
}

export function HabitDetailDrawer({
  categories,
  habit,
  isOpen,
  logs,
  onArchiveHabit,
  onClose,
  onDeleteLog,
  onEditHabit,
  onSaveLog,
}: HabitDetailDrawerProps): JSX.Element | null {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedLog, setSelectedLog] = useState<SelectedLogState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const todayKey = getDateKey(new Date());

  useEffect(() => {
    if (isOpen) {
      setVisibleMonth(new Date());
      setSelectedLog(null);
      setMessage(null);
    }
  }, [isOpen, habit?.id]);

  const habitLogs = useMemo(
    () => (habit ? logs.filter((log) => log.habitId === habit.id) : []),
    [habit, logs],
  );

  const calendarDays = useMemo(() => getCalendarDaysForMonth(visibleMonth), [visibleMonth]);

  const summary = useMemo(() => {
    if (!habit) {
      return { completed: 0, missed: 0, partial: 0, rate: 0, scheduled: 0 };
    }

    let completed = 0;
    let missed = 0;
    let partial = 0;
    let scheduled = 0;

    calendarDays.forEach((day) => {
      if (!day.date || !day.dateKey || !isHabitActiveOnDate(habit, day.date)) {
        return;
      }

      if (isFutureDate(day.dateKey, todayKey)) {
        return;
      }

      scheduled += 1;
      const log = getLogForDate(habitLogs, habit.id, day.dateKey);

      if (log?.completed) {
        completed += 1;
      } else if (log && log.value > 0) {
        partial += 1;
      } else {
        missed += 1;
      }
    });

    return {
      completed,
      missed,
      partial,
      rate: scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100),
      scheduled,
    };
  }, [calendarDays, habit, habitLogs, todayKey]);

  if (!isOpen || !habit) {
    return null;
  }

  const currentStreak = calculateCurrentStreak(habit, logs);
  const longestStreak = calculateLongestStreak(habit, logs);
  const selectedExistingLog = selectedLog
    ? getLogForDate(habitLogs, habit.id, selectedLog.dateKey)
    : undefined;

  function getDayState(date: Date, dateKey: string): string {
    if (!isHabitActiveOnDate(habit, date)) {
      return "not-scheduled";
    }

    const log = getLogForDate(habitLogs, habit.id, dateKey);

    if (log?.completed) {
      return "completed";
    }

    if (log && log.value > 0) {
      return "partial";
    }

    if (isPastDate(dateKey, todayKey)) {
      return "missed";
    }

    return isFutureDate(dateKey, todayKey) ? "future" : "scheduled";
  }

  function handleDayClick(date: Date, dateKey: string): void {
    if (!isHabitActiveOnDate(habit, date)) {
      setMessage("This habit is not scheduled for this day.");
      setSelectedLog(null);
      return;
    }

    if (isFutureDate(dateKey, todayKey)) {
      setMessage("Future days cannot be edited yet.");
      setSelectedLog(null);
      return;
    }

    const log = getLogForDate(habitLogs, habit.id, dateKey);
    setMessage(null);
    setSelectedLog({
      dateKey,
      note: log?.note ?? "",
      value: String(log?.value ?? 0),
    });
  }

  function handleSaveLog(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!selectedLog) {
      return;
    }

    const value = habit.type === "binary" ? Number(selectedLog.value) : Number(selectedLog.value);
    onSaveLog(habit.id, selectedLog.dateKey, Math.max(0, Number.isFinite(value) ? value : 0), selectedLog.note);
    setSelectedLog(null);
  }

  return (
    <div className="habit-detail-backdrop" onClick={onClose}>
      <aside
        aria-label={`${habit.title} details`}
        className="habit-detail-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="habit-detail-header">
          <div>
            <p className="habit-detail-kicker">Habit Details</p>
            <h2>{habit.title}</h2>
            {habit.description ? <p>{habit.description}</p> : null}
          </div>
          <button aria-label="Close habit details" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="habit-detail-actions">
          <Button variant="secondary" type="button" onClick={() => onEditHabit(habit)}>
            <Pencil size={16} />
            Edit
          </Button>
          <Button variant="danger" type="button" onClick={() => onArchiveHabit(habit.id)}>
            <Archive size={16} />
            Archive
          </Button>
        </div>

        <section className="habit-detail-section">
          <h3>Overview</h3>
          <div className="habit-detail-meta">
            <span>Category <strong>{getCategoryName(habit, categories)}</strong></span>
            <span>Frequency <strong>{habit.frequency}</strong></span>
            <span>Target <strong>{formatTarget(habit)}</strong></span>
            <span>Reminder <strong>{habit.reminder?.enabled ? habit.reminder.time ?? "Enabled" : "Off"}</strong></span>
            <span className="habit-detail-meta__wide">Schedule <strong>{formatSchedule(habit)}</strong></span>
          </div>
        </section>

        <section className="habit-detail-summary">
          {[
            ["Completion Rate", `${summary.rate}%`],
            ["Completed Days", summary.completed],
            ["Missed Days", summary.missed],
            ["Partial Days", summary.partial],
            ["Scheduled Days", summary.scheduled],
            ["Current Streak", currentStreak],
            ["Longest Streak", longestStreak],
          ].map(([label, value]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <section className="habit-detail-section">
          <div className="habit-calendar-header">
            <h3>
              {visibleMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <div>
              <button type="button" aria-label="Previous month" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}>
                <ChevronLeft size={17} />
              </button>
              <button type="button" aria-label="Next month" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}>
                <ChevronRight size={17} />
              </button>
            </div>
          </div>

          <div className="habit-calendar-grid">
            {weekdays.map((weekday) => (
              <span className="habit-calendar-weekday" key={weekday}>{weekday}</span>
            ))}
            {calendarDays.map((day, index) => {
              if (!day.date || !day.dateKey) {
                return <span className="habit-calendar-day habit-calendar-day--blank" key={`blank-${index}`} />;
              }

              const state = getDayState(day.date, day.dateKey);
              const isToday = day.dateKey === todayKey;

              return (
                <button
                  className={`habit-calendar-day habit-calendar-day--${state}${isToday ? " habit-calendar-day--today" : ""}`}
                  key={day.dateKey}
                  type="button"
                  onClick={() => handleDayClick(day.date as Date, day.dateKey as string)}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="habit-calendar-legend">
            <span><i className="legend-completed" />Completed</span>
            <span><i className="legend-partial" />Partial</span>
            <span><i className="legend-missed" />Missed</span>
            <span><i className="legend-off" />Not scheduled</span>
          </div>
        </section>

        {message ? <p className="habit-detail-message">{message}</p> : null}

        {selectedLog ? (
          <form className="habit-log-editor" onSubmit={handleSaveLog}>
            <h3>Edit Log</h3>
            <p>{selectedLog.dateKey}</p>
            {habit.type === "binary" ? (
              <label className="habit-log-toggle">
                <input
                  checked={Number(selectedLog.value) >= 1}
                  type="checkbox"
                  onChange={(event) =>
                    setSelectedLog((current) =>
                      current ? { ...current, value: event.target.checked ? "1" : "0" } : current,
                    )
                  }
                />
                <span>{Number(selectedLog.value) >= 1 ? "Done" : "Not Done"}</span>
              </label>
            ) : (
              <label>
                <span>Value</span>
                <input
                  min={0}
                  type="number"
                  value={selectedLog.value}
                  onChange={(event) =>
                    setSelectedLog((current) =>
                      current ? { ...current, value: event.target.value } : current,
                    )
                  }
                />
              </label>
            )}
            <p className="habit-log-editor__status">
              {calculateHabitCompletion(habit, {
                completed: false,
                createdAt: "",
                date: selectedLog.dateKey,
                habitId: habit.id,
                id: selectedExistingLog?.id ?? "",
                updatedAt: "",
                value: Math.max(0, Number(selectedLog.value) || 0),
              })
                ? "Completed"
                : "Not completed"}
            </p>
            <label>
              <span>Note</span>
              <input
                value={selectedLog.note}
                onChange={(event) =>
                  setSelectedLog((current) =>
                    current ? { ...current, note: event.target.value } : current,
                  )
                }
                placeholder="Optional note"
              />
            </label>
            <div className="habit-log-editor__actions">
              <Button type="submit">Save</Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  onDeleteLog(habit.id, selectedLog.dateKey);
                  setSelectedLog(null);
                }}
              >
                Clear Log
              </Button>
            </div>
          </form>
        ) : null}
      </aside>
    </div>
  );
}
