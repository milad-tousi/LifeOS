import { CalendarHoliday } from "@/domains/calendar/types";
import { toGregorianDate } from "@/i18n/calendars/persianCalendar";

export interface PersianCalendarEvent {
  month: number;
  day: number;
  titleFa: string;
  type: "holiday" | "occasion";
  isHoliday: boolean;
}

export const PERSIAN_CALENDAR_EVENTS: PersianCalendarEvent[] = [
  { month: 1, day: 1, titleFa: "نوروز", type: "holiday", isHoliday: true },
  { month: 1, day: 2, titleFa: "عید نوروز", type: "holiday", isHoliday: true },
  { month: 1, day: 3, titleFa: "عید نوروز", type: "holiday", isHoliday: true },
  { month: 1, day: 4, titleFa: "عید نوروز", type: "holiday", isHoliday: true },
  { month: 1, day: 12, titleFa: "روز جمهوری اسلامی", type: "holiday", isHoliday: true },
  { month: 1, day: 13, titleFa: "روز طبیعت", type: "holiday", isHoliday: true },
  { month: 3, day: 14, titleFa: "رحلت امام خمینی", type: "holiday", isHoliday: true },
  { month: 3, day: 15, titleFa: "قیام ۱۵ خرداد", type: "holiday", isHoliday: true },
  { month: 11, day: 22, titleFa: "پیروزی انقلاب اسلامی", type: "holiday", isHoliday: true },
  { month: 12, day: 29, titleFa: "روز ملی شدن صنعت نفت", type: "holiday", isHoliday: true },
  { month: 7, day: 1, titleFa: "آغاز سال تحصیلی", type: "occasion", isHoliday: false },
  { month: 8, day: 13, titleFa: "روز دانش‌آموز", type: "occasion", isHoliday: false },
  { month: 9, day: 16, titleFa: "روز دانشجو", type: "occasion", isHoliday: false },
];

export function getPersianCalendarEventsForMonth(year: number, month: number): CalendarHoliday[] {
  return PERSIAN_CALENDAR_EVENTS
    .filter((event) => event.month === month)
    .map((event) => {
      const date = toGregorianDate({ year, month: event.month, day: event.day });
      const dateKey = toDateKey(date);

      return {
        id: `persian-${event.type}-${year}-${event.month}-${event.day}`,
        title: event.titleFa,
        date: dateKey,
        type: "holiday" as const,
        calendarType: event.type,
        isHoliday: event.isHoliday,
        region: "IR",
        isReadOnly: true as const,
      };
    });
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
