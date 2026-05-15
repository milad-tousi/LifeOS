import { FormEvent, useEffect, useMemo, useState } from "react";
import { Archive, ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Goal } from "@/domains/goals/types";
import { Habit, HabitLog } from "@/domains/habits/types";
import { HabitCategory } from "@/features/habits/services/habit-categories.storage";
import { calculateHabitCompletion } from "@/features/habits/services/habits.storage";
import {
  addMonths,
  calculateCurrentStreak,
  calculateLongestStreak,
  getCalendarDaysForMonth,
  getDateKey,
  getHabitCurrentPeriodKey,
  getHabitLogPeriodKey,
  getHabitPeriodEndDate,
  isHabitLogCompleted,
  isHabitLogPartial,
  isFutureDate,
  isHabitActiveOnDate,
  isPastDate,
  parseDateKey,
} from "@/features/habits/utils/habit.utils";
import { useI18n } from "@/i18n";

interface HabitDetailDrawerProps {
  categories: HabitCategory[];
  goals: Goal[];
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

interface SummaryCard {
  label: string;
  value: string | number;
  subtext?: string;
}

// Shamsi helpers using built-in Intl API
function formatShamsiMonth(date: Date): string {
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  }
}

function getShamsiDay(date: Date): string {
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric" }).format(date);
  } catch {
    return String(date.getDate());
  }
}

function getCategoryName(habit: Habit, categories: HabitCategory[], uncategorized: string): string {
  if (!habit.category) return uncategorized;
  return (
    categories.find(
      (category) => category.id === habit.category || category.name === habit.category,
    )?.name ?? uncategorized
  );
}

function formatTarget(habit: Habit, doneLabel: string): string {
  if (habit.type === "binary") return doneLabel;
  return `${habit.target}${habit.unit ? ` ${habit.unit}` : ""}`;
}

function formatSchedule(
  habit: Habit,
  weekdayNames: string[],
  t: (k: string, v?: Record<string, string | number>) => string,
): string {
  const end = habit.endDate ?? "";
  const start = habit.startDate;

  if (habit.frequency === "daily") {
    return end
      ? t("habits.scheduleDailyUntil", { date: start, end })
      : t("habits.scheduleDaily", { date: start });
  }

  if (habit.frequency === "weekly") {
    const day = weekdayNames[parseDateKey(habit.startDate).getDay()];
    return end
      ? t("habits.scheduleWeeklyUntil", { day, date: start, end })
      : t("habits.scheduleWeekly", { day, date: start });
  }

  const days =
    habit.daysOfWeek?.map((d) => weekdayNames[d]).join("، ") ||
    t("habits.noDaysSelected");
  return end
    ? t("habits.scheduleCustomUntil", { days, end })
    : t("habits.scheduleCustom", { days });
}

function getLogForDate(logs: HabitLog[], habit: Habit, dateKey: string): HabitLog | undefined {
  const periodKey = getHabitCurrentPeriodKey(habit, parseDateKey(dateKey)) ?? dateKey;
  return logs.find((log) => log.habitId === habit.id && getHabitLogPeriodKey(log) === periodKey);
}

export function HabitDetailDrawer({
  categories,
  goals,
  habit,
  isOpen,
  logs,
  onArchiveHabit,
  onClose,
  onDeleteLog,
  onEditHabit,
  onSaveLog,
}: HabitDetailDrawerProps): JSX.Element | null {
  const { t } = useI18n();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedLog, setSelectedLog] = useState<SelectedLogState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const todayKey = getDateKey(new Date());

  const weekdayNames = [
    t("habits.weekdaysSun"),
    t("habits.weekdaysMon"),
    t("habits.weekdaysTue"),
    t("habits.weekdaysWed"),
    t("habits.weekdaysThu"),
    t("habits.weekdaysFri"),
    t("habits.weekdaysSat"),
  ];

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
      return { completed: 0, eligible: 0, missed: 0, partial: 0, rate: 0, scheduledThisMonth: 0, scheduledSoFar: 0 };
    }

    let completed = 0;
    let eligible = 0;
    let missed = 0;
    let partial = 0;
    let scheduledThisMonth = 0;
    let scheduledSoFar = 0;
    const seenPeriods = new Set<string>();

    calendarDays.forEach((day) => {
      if (!day.date || !day.dateKey || !isHabitActiveOnDate(habit, day.date)) return;
      const periodKey = getHabitCurrentPeriodKey(habit, day.date);
      if (!periodKey || seenPeriods.has(periodKey)) return;

      seenPeriods.add(periodKey);
      scheduledThisMonth += 1;
      if (!isFutureDate(day.dateKey, todayKey)) scheduledSoFar += 1;

      const log = getLogForDate(habitLogs, habit, day.dateKey);
      const isCompleted = isHabitLogCompleted(habit, log);
      const isPartial = isHabitLogPartial(habit, log);
      const periodEndDate = getHabitPeriodEndDate(habit, day.date);
      const periodEndKey = periodEndDate ? getDateKey(periodEndDate) : day.dateKey;
      const isPeriodClosed = isPastDate(periodEndKey, todayKey);
      const hasStartedOpenPeriod =
        !isPeriodClosed && !isFutureDate(day.dateKey, todayKey) && (isCompleted || isPartial);

      if (isCompleted) completed += 1;
      if (isPartial) partial += 1;
      if (isPeriodClosed || hasStartedOpenPeriod) eligible += 1;
      if (isPeriodClosed && !isCompleted && !isPartial) missed += 1;
    });

    return {
      completed,
      eligible,
      missed,
      partial,
      rate: eligible === 0 ? 0 : Math.round((completed / eligible) * 100),
      scheduledThisMonth,
      scheduledSoFar,
    };
  }, [calendarDays, habit, habitLogs, todayKey]);

  if (!isOpen || !habit) return null;

  const currentStreak = calculateCurrentStreak(habit, logs);
  const longestStreak = calculateLongestStreak(habit, logs);
  const linkedGoalTitle = habit.goalId
    ? goals.find((goal) => goal.id === habit.goalId)?.title ?? t("habits.notFoundLabel")
    : t("habits.noLinkedGoal");

  const selectedExistingLog = selectedLog
    ? getLogForDate(habitLogs, habit, selectedLog.dateKey)
    : undefined;

  function getDayState(date: Date, dateKey: string): string {
    if (!isHabitActiveOnDate(habit, date)) return "not-scheduled";
    const log = getLogForDate(habitLogs, habit, dateKey);
    if (isHabitLogCompleted(habit, log)) return "completed";
    if (isHabitLogPartial(habit, log)) return "partial";
    const periodEndDate = getHabitPeriodEndDate(habit, date);
    const periodEndKey = periodEndDate ? getDateKey(periodEndDate) : dateKey;
    if (isPastDate(periodEndKey, todayKey)) return "missed";
    return isFutureDate(dateKey, todayKey) ? "future" : "scheduled";
  }

  function handleDayClick(date: Date, dateKey: string): void {
    if (!isHabitActiveOnDate(habit, date)) {
      setMessage(t("habits.notScheduledThisDay"));
      setSelectedLog(null);
      return;
    }
    if (isFutureDate(dateKey, todayKey)) {
      setMessage(t("habits.futureDaysCantEdit"));
      setSelectedLog(null);
      return;
    }
    const log = getLogForDate(habitLogs, habit, dateKey);
    setMessage(null);
    setSelectedLog({ dateKey, note: log?.note ?? "", value: String(log?.value ?? 0) });
  }

  function handleSaveLog(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!selectedLog) return;
    const value = Number(selectedLog.value);
    onSaveLog(habit.id, selectedLog.dateKey, Math.max(0, Number.isFinite(value) ? value : 0), selectedLog.note);
    setSelectedLog(null);
  }

  const summaryCards: SummaryCard[] = [
    { label: t("habits.completionRate"), value: `${summary.rate}%` },
    { label: t("habits.completedDays"), value: summary.completed },
    { label: t("habits.missedDays"), value: summary.missed },
    { label: t("habits.partialDays"), value: summary.partial },
    habit.endDate
      ? { label: t("habits.scheduledLabel"), value: summary.scheduledThisMonth, subtext: t("habits.activeDaysThisMonth", { n: summary.scheduledThisMonth }) }
      : { label: t("habits.scheduledLabel"), value: t("habits.ongoing"), subtext: t("habits.activeDaysSoFar", { n: summary.scheduledSoFar }) },
    { label: t("habits.currentStreak"), value: currentStreak },
    { label: t("habits.longestStreak"), value: longestStreak },
  ];

  return (
    <div className="habit-detail-backdrop" onClick={onClose}>
      <aside
        aria-label={`${habit.title} details`}
        className="habit-detail-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="habit-detail-header">
          <div>
            <p className="habit-detail-kicker">{t("habits.habitDetails")}</p>
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
            {t("habits.edit")}
          </Button>
          <Button variant="danger" type="button" onClick={() => onArchiveHabit(habit.id)}>
            <Archive size={16} />
            {t("habits.archive")}
          </Button>
        </div>

        <section className="habit-detail-section">
          <h3>{t("habits.overview")}</h3>
          <div className="habit-detail-meta">
            <span>{t("habits.category")} <strong>{getCategoryName(habit, categories, t("habits.uncategorizedLabel"))}</strong></span>
            <span>{t("habits.frequency")} <strong>{t(`habits.frequency${habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}` as never) || habit.frequency}</strong></span>
            <span>{t("habits.target")} <strong>{formatTarget(habit, t("habits.targetDone"))}</strong></span>
            <span>{t("habits.reminderTime")} <strong>{habit.reminder?.enabled ? habit.reminder.time ?? t("habits.reminderEnabledLabel") : t("habits.reminderOff")}</strong></span>
            <span>{t("habits.linkedGoal")} <strong>{linkedGoalTitle}</strong></span>
            <span className="habit-detail-meta__wide">{t("habits.schedule")} <strong>{formatSchedule(habit, weekdayNames, t)}</strong></span>
          </div>
        </section>

        <section className="habit-detail-summary">
          {summaryCards.map((card) => (
            <article key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              {card.subtext ? <small>{card.subtext}</small> : null}
            </article>
          ))}
        </section>

        <section className="habit-detail-section">
          <div className="habit-calendar-header">
            <h3>{formatShamsiMonth(visibleMonth)}</h3>
            <div>
              <button type="button" aria-label="Previous month" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}>
                <ChevronRight size={17} />
              </button>
              <button type="button" aria-label="Next month" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}>
                <ChevronLeft size={17} />
              </button>
            </div>
          </div>

          <div className="habit-calendar-grid">
            {weekdayNames.map((weekday) => (
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
                  {getShamsiDay(day.date)}
                </button>
              );
            })}
          </div>

          <div className="habit-calendar-legend">
            <span><i className="legend-completed" />{t("habits.legendCompleted")}</span>
            <span><i className="legend-partial" />{t("habits.legendPartial")}</span>
            <span><i className="legend-missed" />{t("habits.legendMissed")}</span>
            <span><i className="legend-off" />{t("habits.legendNotScheduled")}</span>
          </div>
        </section>

        {message ? <p className="habit-detail-message">{message}</p> : null}

        {selectedLog ? (
          <form className="habit-log-editor" onSubmit={handleSaveLog}>
            <h3>{t("habits.editLog")}</h3>
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
                <span>{Number(selectedLog.value) >= 1 ? t("habits.logDone") : t("habits.logNotDone")}</span>
              </label>
            ) : (
              <label>
                <span>{t("habits.logValue")}</span>
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
                ? t("habits.logCompleted")
                : t("habits.logNotCompleted")}
            </p>
            <label>
              <span>{t("habits.logNote")}</span>
              <input
                value={selectedLog.note}
                onChange={(event) =>
                  setSelectedLog((current) =>
                    current ? { ...current, note: event.target.value } : current,
                  )
                }
                placeholder={t("habits.logNotePlaceholder")}
              />
            </label>
            <div className="habit-log-editor__actions">
              <Button type="submit">{t("habits.save")}</Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  onDeleteLog(habit.id, selectedLog.dateKey);
                  setSelectedLog(null);
                }}
              >
                {t("habits.clearLog")}
              </Button>
            </div>
          </form>
        ) : null}
      </aside>
    </div>
  );
}
