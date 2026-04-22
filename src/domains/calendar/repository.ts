import { db, ensureDatabaseReady } from "@/db/dexie";
import { normalizeCalendarEvent, sortCalendarEvents } from "@/domains/calendar/calendar.utils";
import { createCalendarEventModel } from "@/domains/calendar/models";
import { CalendarEvent, CreateCalendarEventInput } from "@/domains/calendar/types";

export const calendarEventsRepository = {
  async getAll(): Promise<CalendarEvent[]> {
    await ensureDatabaseReady();
    const events = await db.calendarEvents.toArray();
    return sortCalendarEvents(events.map(normalizeCalendarEvent));
  },
  async add(input: CreateCalendarEventInput): Promise<CalendarEvent> {
    await ensureDatabaseReady();
    const event = createCalendarEventModel(input);
    await db.calendarEvents.add(event);
    return event;
  },
  async update(event: CalendarEvent): Promise<CalendarEvent> {
    await ensureDatabaseReady();
    const normalizedEvent = normalizeCalendarEvent({
      ...event,
      updatedAt: Date.now(),
    });
    await db.calendarEvents.put(normalizedEvent);
    return normalizedEvent;
  },
  async remove(id: string): Promise<void> {
    await ensureDatabaseReady();
    await db.calendarEvents.delete(id);
  },
};
