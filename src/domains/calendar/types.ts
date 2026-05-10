import { EntityId, ISODateString, TimestampMs } from "@/types/shared.types";
import type { LocationProvider } from "@/features/events/types/location";

// ── Event Reminder ────────────────────────────────────────────────────────────

export type EventReminderUnit = "minute" | "hour" | "day";
export type EventReminderMode = "before" | "at_time";

export interface EventReminder {
  enabled: boolean;
  /** Number of units before the event to fire the reminder */
  amount?: number | null;
  unit?: EventReminderUnit | null;
  mode?: EventReminderMode | null;
}

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
  /** Free-text location name / address */
  locationText?: string | null;
  /** Optional pre-formed Google Maps or OSM URL */
  locationUrl?: string | null;
  /** WGS-84 latitude */
  locationLat?: number | null;
  /** WGS-84 longitude */
  locationLng?: number | null;
  /** Which provider was used to select the location */
  locationProvider?: LocationProvider | null;
  /** In-app reminder configuration */
  reminder?: EventReminder | null;
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
  locationText?: string | null;
  locationUrl?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  locationProvider?: LocationProvider | null;
  reminder?: EventReminder | null;
}

export interface CalendarHoliday {
  id: EntityId;
  title: string;
  date: ISODateString;
  type: "holiday";
  calendarType?: "holiday" | "occasion";
  region?: string;
  isHoliday?: boolean;
  isReadOnly: true;
}

export interface CalendarEventOccurrence {
  id: string;
  date: ISODateString;
  occurrenceEndDate: ISODateString;
  occurrenceStartDate: ISODateString;
  event: CalendarEvent;
}
