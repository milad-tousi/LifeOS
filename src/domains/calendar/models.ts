import { createId } from "@/lib/id";
import { CalendarEvent, CreateCalendarEventInput } from "@/domains/calendar/types";

export function createCalendarEventModel(input: CreateCalendarEventInput): CalendarEvent {
  const timestamp = Date.now();

  return {
    id: createId(),
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    startTime: input.isAllDay ? null : input.startTime?.trim() || null,
    endTime: input.isAllDay ? null : input.endTime?.trim() || null,
    type: "event",
    color: input.color?.trim() || null,
    isAllDay: input.isAllDay ?? false,
    recurrence: input.recurrence ?? null,
    date: input.startDate,
    time: input.isAllDay ? null : input.startTime?.trim() || null,
    locationText: input.locationText?.trim() || null,
    locationUrl: input.locationUrl?.trim() || null,
    locationLat: input.locationLat ?? null,
    locationLng: input.locationLng ?? null,
    locationProvider: input.locationProvider ?? null,
    reminder: input.reminder ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
