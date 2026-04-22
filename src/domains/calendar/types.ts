import { EntityId, ISODateString, TimestampMs } from "@/types/shared.types";

export type CalendarEventRecurrenceFrequency =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

export interface CalendarEventRecurrence {
  frequency: CalendarEventRecurrenceFrequency;
  interval?: number;
  byWeekDays?: number[];
  until?: ISODateString | null;
  count?: number | null;
}

export interface CalendarEvent {
  id: EntityId;
  title: string;
  description?: string;
  startDate: ISODateString;
  endDate?: ISODateString | null;
  startTime?: string | null;
  endTime?: string | null;
  type: "event";
  color?: string | null;
  isAllDay: boolean;
  recurrence?: CalendarEventRecurrence | null;
  date?: ISODateString;
  time?: string | null;
  createdAt: TimestampMs;
  updatedAt: TimestampMs;
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  startDate: ISODateString;
  endDate?: ISODateString | null;
  startTime?: string | null;
  endTime?: string | null;
  color?: string | null;
  isAllDay?: boolean;
  recurrence?: CalendarEventRecurrence | null;
}

export interface CalendarHoliday {
  id: EntityId;
  title: string;
  date: ISODateString;
  type: "holiday";
  region?: string;
  isReadOnly: true;
}

export interface CalendarEventOccurrence {
  id: string;
  date: ISODateString;
  occurrenceEndDate: ISODateString;
  occurrenceStartDate: ISODateString;
  event: CalendarEvent;
}
