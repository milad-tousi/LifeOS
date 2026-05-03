import {
  CalendarEventOccurrence,
  CalendarHoliday,
} from "@/domains/calendar/types";
import {
  eventOccursOnDate,
  expandRecurringEventsForRange,
  formatEventTimeRange,
  getEventDisplayLabel,
  getRecurrenceLabel,
} from "@/domains/calendar/calendar.utils";
import { Task } from "@/domains/tasks/types";
import { getPersianCalendarEventsForMonth } from "@/i18n/calendars/persianHolidays";
import {
  addPersianMonths,
  formatPersianDate,
  formatPersianMonth,
  formatPersianNumber,
  formatPersianShortDate,
  getPersianMonthStart,
  getPersianWeekdayIndex,
  PERSIAN_WEEKDAY_NAMES,
  toPersianDate,
} from "@/i18n/calendars/persianCalendar";
import { Language } from "@/i18n/i18n.types";

export interface CalendarDay {
  date: Date;
  key: string;
  isCurrentMonth: boolean;
  label: string;
}

export type CalendarItem =
  | { id: string; itemType: "task"; date: string; task: Task }
  | { id: string; itemType: "event"; date: string; occurrence: CalendarEventOccurrence }
  | { id: string; itemType: "holiday"; date: string; holiday: CalendarHoliday };

export interface CalendarDayState {
  eventCount: number;
  hasItems: boolean;
  holidayCount: number;
  isDueSoon: boolean;
  isDueToday: boolean;
  isHoliday: boolean;
  isOverdue: boolean;
  taskCount: number;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function getCalendarWeekdayLabels(language: Language): readonly string[] {
  return language === "fa" ? PERSIAN_WEEKDAY_NAMES : WEEKDAY_LABELS;
}

export function getMonthGrid(monthDate: Date, language: Language = "en"): CalendarDay[] {
  if (language === "fa") {
    return getPersianMonthGrid(monthDate);
  }

  const monthStart = getStartOfMonth(monthDate);
  const startOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = addDays(monthStart, -startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);

    return {
      date,
      key: toCalendarDateKey(date),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      label: String(date.getDate()),
    };
  });
}

export function getCalendarMonthStart(date: Date, language: Language): Date {
  return language === "fa" ? getPersianMonthStart(date) : getStartOfMonth(date);
}

export function addCalendarMonths(date: Date, offset: number, language: Language): Date {
  return language === "fa" ? addPersianMonths(date, offset) : new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

export function getPersianHolidaysForMonth(monthDate: Date): CalendarHoliday[] {
  const persianDate = toPersianDate(monthDate);
  return getPersianCalendarEventsForMonth(persianDate.year, persianDate.month);
}

export function groupCalendarItemsByDate(
  tasks: Task[],
  eventOccurrences: CalendarEventOccurrence[],
  holidays: CalendarHoliday[],
): Record<string, CalendarItem[]> {
  const items: CalendarItem[] = [
    ...tasks
      .map((task) => {
        const date = getTaskCalendarDateKey(task);
        return date
          ? { id: `task-${task.id}`, itemType: "task" as const, date, task }
          : null;
      })
      .filter((item): item is Extract<CalendarItem, { itemType: "task" }> => Boolean(item)),
    ...eventOccurrences.map((occurrence) => ({
      id: occurrence.id,
      itemType: "event" as const,
      date: occurrence.date,
      occurrence,
    })),
    ...holidays.map((holiday) => ({
      id: `holiday-${holiday.id}`,
      itemType: "holiday" as const,
      date: holiday.date,
      holiday,
    })),
  ];

  return items.reduce<Record<string, CalendarItem[]>>((accumulator, item) => {
    if (!accumulator[item.date]) {
      accumulator[item.date] = [];
    }

    accumulator[item.date].push(item);
    accumulator[item.date] = sortCalendarItems(accumulator[item.date]);
    return accumulator;
  }, {});
}

export function getItemsForDate(
  itemsByDate: Record<string, CalendarItem[]>,
  date: Date,
): CalendarItem[] {
  return itemsByDate[toCalendarDateKey(date)] ?? [];
}

export function getTasksForCalendarDate(items: CalendarItem[]): Task[] {
  return items
    .filter((item): item is Extract<CalendarItem, { itemType: "task" }> => item.itemType === "task")
    .map((item) => item.task);
}

export function getEventsForCalendarDate(items: CalendarItem[]): CalendarEventOccurrence[] {
  return items
    .filter((item): item is Extract<CalendarItem, { itemType: "event" }> => item.itemType === "event")
    .map((item) => item.occurrence);
}

export function getHolidaysForCalendarDate(items: CalendarItem[]): CalendarHoliday[] {
  return items
    .filter((item): item is Extract<CalendarItem, { itemType: "holiday" }> => item.itemType === "holiday")
    .map((item) => item.holiday);
}

export function getCalendarEventOccurrencesForMonth(
  visibleMonth: Date,
  events: import("@/domains/calendar/types").CalendarEvent[],
  language: Language = "en",
): CalendarEventOccurrence[] {
  const monthGrid = getMonthGrid(visibleMonth, language);
  return expandRecurringEventsForRange(events, monthGrid[0].date, monthGrid[monthGrid.length - 1].date);
}

export function sortCalendarItems(items: CalendarItem[]): CalendarItem[] {
  return [...items].sort((left, right) => {
    const leftWeight = getItemWeight(left);
    const rightWeight = getItemWeight(right);

    if (leftWeight !== rightWeight) {
      return leftWeight - rightWeight;
    }

    if (left.itemType === "task" && right.itemType === "task") {
      const leftDone = left.task.status === "done" ? 1 : 0;
      const rightDone = right.task.status === "done" ? 1 : 0;

      if (leftDone !== rightDone) {
        return leftDone - rightDone;
      }
    }

    if (left.itemType === "event" && right.itemType === "event") {
      const leftTime = left.occurrence.event.isAllDay
        ? "00:00"
        : left.occurrence.event.startTime ?? "23:59";
      const rightTime = right.occurrence.event.isAllDay
        ? "00:00"
        : right.occurrence.event.startTime ?? "23:59";
      return leftTime.localeCompare(rightTime);
    }

    return left.id.localeCompare(right.id);
  });
}

export function getDayTaskState(date: Date, items: CalendarItem[], now = new Date()): CalendarDayState {
  const tasks = getTasksForCalendarDate(items);
  const events = getEventsForCalendarDate(items);
  const holidays = getHolidaysForCalendarDate(items);
  const openTasks = tasks.filter((task) => task.status !== "done");
  const isToday = isSameDay(date, now);
  const startOfToday = getStartOfDay(now);
  const startOfDate = getStartOfDay(date);
  const daysUntil = Math.round(
    (startOfDate.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
  );

  return {
    eventCount: events.length,
    hasItems: items.length > 0,
    holidayCount: holidays.length,
    isDueSoon: openTasks.length > 0 && daysUntil > 0 && daysUntil <= 7,
    isDueToday: openTasks.length > 0 && isToday,
    isHoliday: holidays.length > 0,
    isOverdue: openTasks.length > 0 && startOfDate.getTime() < startOfToday.getTime(),
    taskCount: tasks.length,
  };
}

export function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function toCalendarDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatCalendarMonthLabel(date: Date, language: Language = "en"): string {
  if (language === "fa") {
    return formatPersianMonth(date);
  }

  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatSelectedDayLabel(date: Date, language: Language = "en"): string {
  if (language === "fa") {
    return formatPersianDate(date, true);
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatTaskDateTime(task: Task, language: Language = "en"): string | null {
  const taskDate = getTaskCalendarDate(task);

  if (!taskDate) {
    return null;
  }

  const scheduledTime = task.scheduledAt ? new Date(task.scheduledAt) : null;
  const hasScheduledTime = scheduledTime && !Number.isNaN(scheduledTime.getTime());

  if (language === "fa") {
    return hasScheduledTime
      ? new Intl.DateTimeFormat("fa-IR", {
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          month: "short",
        }).format(scheduledTime)
      : formatPersianShortDate(taskDate);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    ...(hasScheduledTime
      ? {
          hour: "2-digit" as const,
          minute: "2-digit" as const,
        }
      : {}),
  }).format(hasScheduledTime ? scheduledTime : taskDate);
}

function getPersianMonthGrid(monthDate: Date): CalendarDay[] {
  const persianMonthStart = getPersianMonthStart(monthDate);
  const persianMonth = toPersianDate(persianMonthStart);
  const startOffset = getPersianWeekdayIndex(persianMonthStart);
  const gridStart = addDays(persianMonthStart, -startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    const persianDate = toPersianDate(date);

    return {
      date,
      key: toCalendarDateKey(date),
      isCurrentMonth:
        persianDate.year === persianMonth.year && persianDate.month === persianMonth.month,
      label: formatPersianNumber(persianDate.day),
    };
  });
}

export function formatCalendarOccurrenceLabel(
  occurrence: CalendarEventOccurrence,
): string {
  return getEventDisplayLabel(occurrence);
}

export function formatCalendarOccurrenceTime(
  occurrence: CalendarEventOccurrence,
): string | null {
  return formatEventTimeRange(occurrence.event);
}

export function formatCalendarOccurrenceRecurrence(
  occurrence: CalendarEventOccurrence,
): string | null {
  return getRecurrenceLabel(occurrence.event.recurrence);
}

export function doesEventOccurrenceSpanMultipleDays(
  occurrence: CalendarEventOccurrence,
): boolean {
  return occurrence.occurrenceStartDate !== occurrence.occurrenceEndDate;
}

export function getTaskCalendarDate(task: Task): Date | null {
  const rawDueDate = task.dueDate ?? task.scheduledDate;

  if (!rawDueDate) {
    return null;
  }

  const safeDate = new Date(`${rawDueDate}T12:00:00`);
  return Number.isNaN(safeDate.getTime()) ? null : safeDate;
}

export function taskAppearsOnDate(task: Task, date: Date): boolean {
  const taskDate = getTaskCalendarDate(task);
  return taskDate ? isSameDay(taskDate, date) : false;
}

export function eventOccurrenceAppearsOnDate(
  occurrence: CalendarEventOccurrence,
  date: Date,
): boolean {
  return occurrence.date === toCalendarDateKey(date) && eventOccursOnDate(occurrence.event, date);
}

function getTaskCalendarDateKey(task: Task): string | null {
  const date = getTaskCalendarDate(task);
  return date ? toCalendarDateKey(date) : null;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getItemWeight(item: CalendarItem): number {
  switch (item.itemType) {
    case "holiday":
      return 0;
    case "event":
      return 1;
    case "task":
    default:
      return 2;
  }
}
