import {
  CalendarEvent,
  CalendarEventOccurrence,
  CalendarEventRecurrence,
  CalendarHoliday,
} from "@/domains/calendar/types";

type LegacyCalendarEventRecord = Partial<CalendarEvent> &
  Pick<CalendarEvent, "id" | "title" | "createdAt" | "updatedAt">;

export function normalizeCalendarEvent(event: CalendarEvent | LegacyCalendarEventRecord): CalendarEvent {
  const startDate = event.startDate ?? event.date ?? "";
  const rawEndDate = event.endDate ?? null;
  const safeEndDate = rawEndDate && rawEndDate >= startDate ? rawEndDate : null;
  const isAllDay = Boolean(event.isAllDay);

  return {
    ...event,
    title: event.title.trim(),
    description: event.description?.trim() || undefined,
    startDate,
    endDate: safeEndDate,
    startTime: isAllDay ? null : event.startTime?.trim() ?? event.time?.trim() ?? null,
    endTime: isAllDay ? null : event.endTime?.trim() ?? null,
    type: "event",
    color: event.color?.trim() || null,
    isAllDay,
    recurrence: normalizeRecurrence(event.recurrence, startDate),
    date: startDate,
    time: isAllDay ? null : event.startTime?.trim() ?? event.time?.trim() ?? null,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

export function sortCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((left, right) => {
    if (left.startDate !== right.startDate) {
      return left.startDate.localeCompare(right.startDate);
    }

    const leftTime = left.isAllDay ? "00:00" : left.startTime ?? "23:59";
    const rightTime = right.isAllDay ? "00:00" : right.startTime ?? "23:59";

    if (leftTime !== rightTime) {
      return leftTime.localeCompare(rightTime);
    }

    return right.createdAt - left.createdAt;
  });
}

export function sortCalendarHolidays(holidays: CalendarHoliday[]): CalendarHoliday[] {
  return [...holidays].sort((left, right) => left.title.localeCompare(right.title));
}

export function eventOccursOnDate(event: CalendarEvent, date: Date): boolean {
  const safeEvent = normalizeCalendarEvent(event);
  const spanDays = getEventSpanDays(safeEvent);
  const targetTime = getStartOfDay(date).getTime();

  for (let offset = 0; offset <= spanDays; offset += 1) {
    const candidateStart = addDays(date, -offset);

    if (eventStartsOnDate(safeEvent, candidateStart)) {
      const occurrenceEnd = addDays(candidateStart, spanDays);
      const candidateTime = getStartOfDay(candidateStart).getTime();
      const occurrenceEndTime = getStartOfDay(occurrenceEnd).getTime();

      if (targetTime >= candidateTime && targetTime <= occurrenceEndTime) {
        return true;
      }
    }
  }

  return false;
}

export function expandRecurringEventsForRange(
  events: CalendarEvent[],
  visibleStart: Date,
  visibleEnd: Date,
): CalendarEventOccurrence[] {
  const occurrences: CalendarEventOccurrence[] = [];
  const rangeStart = getStartOfDay(visibleStart);
  const rangeEnd = getStartOfDay(visibleEnd);

  for (const event of events.map(normalizeCalendarEvent)) {
    const spanDays = getEventSpanDays(event);
    const cursor = new Date(rangeStart);

    while (cursor.getTime() <= rangeEnd.getTime()) {
      if (eventOccursOnDate(event, cursor)) {
        const occurrenceStart = findOccurrenceStartForDate(event, cursor, spanDays);

        if (occurrenceStart) {
          occurrences.push({
            id: `${event.id}-${toDateKey(occurrenceStart)}-${toDateKey(cursor)}`,
            date: toDateKey(cursor),
            occurrenceEndDate: toDateKey(addDays(occurrenceStart, spanDays)),
            occurrenceStartDate: toDateKey(occurrenceStart),
            event,
          });
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return sortCalendarEventOccurrences(occurrences);
}

export function getEventDisplayLabel(occurrence: CalendarEventOccurrence): string {
  const event = occurrence.event;

  if (event.isAllDay) {
    if (event.endDate && event.endDate !== event.startDate) {
      return "All day multi-day";
    }

    return event.recurrence?.frequency && event.recurrence.frequency !== "none"
      ? `${getRecurrenceLabel(event.recurrence)} · All day`
      : "All day";
  }

  const timeRange = formatEventTimeRange(event);
  const recurrenceLabel =
    event.recurrence?.frequency && event.recurrence.frequency !== "none"
      ? getRecurrenceLabel(event.recurrence)
      : null;

  return [timeRange, recurrenceLabel].filter(Boolean).join(" · ") || "No time";
}

export function formatEventTimeRange(event: CalendarEvent): string | null {
  if (event.isAllDay) {
    return "All day";
  }

  if (event.startTime && event.endTime) {
    return `${event.startTime} - ${event.endTime}`;
  }

  if (event.startTime) {
    return event.startTime;
  }

  return null;
}

export function getRecurrenceLabel(recurrence: CalendarEventRecurrence | null | undefined): string | null {
  if (!recurrence || recurrence.frequency === "none") {
    return null;
  }

  switch (recurrence.frequency) {
    case "daily":
      return "Repeats daily";
    case "weekly":
      return "Repeats weekly";
    case "monthly":
      return "Repeats monthly";
    case "yearly":
      return "Repeats yearly";
    default:
      return null;
  }
}

function normalizeRecurrence(
  recurrence: CalendarEventRecurrence | null | undefined,
  startDate: string,
): CalendarEventRecurrence | null {
  if (!recurrence || recurrence.frequency === "none") {
    return null;
  }

  const interval = recurrence.interval && recurrence.interval > 0 ? recurrence.interval : 1;
  const startDay = new Date(`${startDate}T12:00:00`).getDay();
  const byWeekDays =
    recurrence.frequency === "weekly"
      ? (recurrence.byWeekDays?.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6) ?? [
          startDay,
        ])
      : undefined;

  return {
    frequency: recurrence.frequency,
    interval,
    byWeekDays: byWeekDays ? [...new Set(byWeekDays)] : undefined,
    until: recurrence.until ?? null,
    count: recurrence.count && recurrence.count > 0 ? recurrence.count : null,
  };
}

function sortCalendarEventOccurrences(
  occurrences: CalendarEventOccurrence[],
): CalendarEventOccurrence[] {
  return [...occurrences].sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }

    const leftTime = left.event.isAllDay ? "00:00" : left.event.startTime ?? "23:59";
    const rightTime = right.event.isAllDay ? "00:00" : right.event.startTime ?? "23:59";

    if (leftTime !== rightTime) {
      return leftTime.localeCompare(rightTime);
    }

    return left.event.title.localeCompare(right.event.title);
  });
}

function findOccurrenceStartForDate(
  event: CalendarEvent,
  date: Date,
  spanDays: number,
): Date | null {
  for (let offset = 0; offset <= spanDays; offset += 1) {
    const candidateStart = addDays(date, -offset);

    if (eventStartsOnDate(event, candidateStart)) {
      return candidateStart;
    }
  }

  return null;
}

function eventStartsOnDate(event: CalendarEvent, candidateDate: Date): boolean {
  const eventStart = parseIsoDate(event.startDate);

  if (!eventStart) {
    return false;
  }

  const candidate = getStartOfDay(candidateDate);

  if (candidate.getTime() < eventStart.getTime()) {
    return false;
  }

  const recurrence = event.recurrence;

  if (!recurrence || recurrence.frequency === "none") {
    return isSameDate(eventStart, candidate);
  }

  if (recurrence.until) {
    const untilDate = parseIsoDate(recurrence.until);

    if (untilDate && candidate.getTime() > untilDate.getTime()) {
      return false;
    }
  }

  let matches = false;
  const interval = recurrence.interval ?? 1;

  switch (recurrence.frequency) {
    case "daily": {
      const diffDays = getDayDifference(eventStart, candidate);
      matches = diffDays % interval === 0;
      break;
    }
    case "weekly": {
      const allowedWeekDays = recurrence.byWeekDays?.length
        ? recurrence.byWeekDays
        : [eventStart.getDay()];
      const diffWeeks = Math.floor(getDayDifference(getStartOfWeek(eventStart), getStartOfWeek(candidate)) / 7);
      matches = allowedWeekDays.includes(candidate.getDay()) && diffWeeks % interval === 0;
      break;
    }
    case "monthly": {
      const monthDiff = getMonthDifference(eventStart, candidate);
      matches =
        candidate.getDate() === eventStart.getDate() &&
        monthDiff >= 0 &&
        monthDiff % interval === 0;
      break;
    }
    case "yearly": {
      const yearDiff = candidate.getFullYear() - eventStart.getFullYear();
      matches =
        candidate.getDate() === eventStart.getDate() &&
        candidate.getMonth() === eventStart.getMonth() &&
        yearDiff >= 0 &&
        yearDiff % interval === 0;
      break;
    }
    case "none":
    default:
      matches = isSameDate(eventStart, candidate);
  }

  if (!matches) {
    return false;
  }

  if (!recurrence.count) {
    return true;
  }

  return getOccurrenceIndex(event, candidate) <= recurrence.count;
}

function getOccurrenceIndex(event: CalendarEvent, targetDate: Date): number {
  const eventStart = parseIsoDate(event.startDate);

  if (!eventStart) {
    return Number.MAX_SAFE_INTEGER;
  }

  let count = 0;
  const cursor = new Date(eventStart);

  while (cursor.getTime() <= targetDate.getTime()) {
    if (eventStartsOnDateWithoutCount(event, cursor)) {
      count += 1;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

function eventStartsOnDateWithoutCount(event: CalendarEvent, candidateDate: Date): boolean {
  const recurrence = event.recurrence;

  if (!recurrence || recurrence.frequency === "none") {
    const eventStart = parseIsoDate(event.startDate);
    return eventStart ? isSameDate(eventStart, candidateDate) : false;
  }

  return eventStartsOnDate(
    {
      ...event,
      recurrence: {
        ...recurrence,
        count: null,
      },
    },
    candidateDate,
  );
}

function getEventSpanDays(event: CalendarEvent): number {
  const startDate = parseIsoDate(event.startDate);
  const endDate = parseIsoDate(event.endDate ?? event.startDate);

  if (!startDate || !endDate) {
    return 0;
  }

  return Math.max(0, getDayDifference(startDate, endDate));
}

function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : getStartOfDay(date);
}

function getDayDifference(start: Date, end: Date): number {
  return Math.round((getStartOfDay(end).getTime() - getStartOfDay(start).getTime()) / 86400000);
}

function getMonthDifference(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getStartOfWeek(date: Date): Date {
  const safeDate = getStartOfDay(date);
  const offset = (safeDate.getDay() + 6) % 7;
  return addDays(safeDate, -offset);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function isSameDate(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
