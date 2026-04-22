import { CalendarHoliday } from "@/domains/calendar/types";

interface HolidaySeed {
  date: string;
  title: string;
}

const HOLIDAY_SEEDS: Record<string, HolidaySeed[]> = {
  NL: [
    { date: "2026-01-01", title: "New Year's Day" },
    { date: "2026-04-27", title: "King's Day" },
    { date: "2026-05-05", title: "Liberation Day" },
    { date: "2026-12-25", title: "Christmas Day" },
    { date: "2026-12-26", title: "Boxing Day" },
  ],
  US: [
    { date: "2026-01-01", title: "New Year's Day" },
    { date: "2026-07-04", title: "Independence Day" },
    { date: "2026-11-26", title: "Thanksgiving Day" },
    { date: "2026-12-25", title: "Christmas Day" },
  ],
};

export function getHolidayItemsForMonth(
  monthDate: Date,
  region = "NL",
): CalendarHoliday[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const seeds = HOLIDAY_SEEDS[region] ?? HOLIDAY_SEEDS.NL;

  return seeds
    .filter((seed) => {
      const safeDate = new Date(`${seed.date}T12:00:00`);
      return safeDate.getFullYear() === year && safeDate.getMonth() === month;
    })
    .map((seed) => ({
      id: `holiday-${region}-${seed.date}-${seed.title.toLowerCase().replace(/\s+/g, "-")}`,
      title: seed.title,
      date: seed.date,
      type: "holiday" as const,
      region,
      isReadOnly: true as const,
    }));
}
