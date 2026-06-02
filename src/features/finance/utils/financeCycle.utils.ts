/**
 * Finance Cycle Utilities
 *
 * Pure functions to calculate financial cycle date ranges based on
 * a user-configured start day (1–28).
 *
 * Example: startDay = 23
 *   - Cycle containing June 10  → 23 May – 22 June
 *   - Cycle containing June 30  → 23 June – 22 July
 */

export interface FinanceCycleRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Clamps the start day to the valid range 1–28.
 * Days 29–31 are excluded to avoid invalid dates in February.
 */
export function clampCycleStartDay(day: number): number {
  // Max 29: safe for all Gregorian months with smart clamping (see getFinanceCycleForDate)
  // and covers all Shamsi months (min Shamsi month length = 29 in Esfand non-leap)
  return Math.max(1, Math.min(29, Math.round(day)));
}

/** Returns the number of days in a given Gregorian month. */
function daysInGregorianMonth(year: number, month: number): number {
  // month is 0-indexed (JS convention)
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Returns the finance cycle range that contains the given date.
 *
 * Rules:
 *  - If date.day >= startDay → cycle started on startDay of the same month
 *  - If date.day <  startDay → cycle started on startDay of the previous month
 *  - Cycle end = one calendar day before the next cycle start
 */
export function getFinanceCycleForDate(
  date: Date,
  startDay: number,
): FinanceCycleRange {
  const day = clampCycleStartDay(startDay);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const dateDay = date.getDate();

  let cycleStartYear: number;
  let cycleStartMonth: number;

  if (dateDay >= day) {
    // Cycle started this month
    cycleStartYear = year;
    cycleStartMonth = month;
  } else {
    // Cycle started last month
    if (month === 0) {
      cycleStartYear = year - 1;
      cycleStartMonth = 11;
    } else {
      cycleStartYear = year;
      cycleStartMonth = month - 1;
    }
  }

  // Clamp day to actual days in the start month (handles short months)
  const daysInStart = daysInGregorianMonth(cycleStartYear, cycleStartMonth);
  const clampedDay = Math.min(day, daysInStart);
  const startDate = new Date(cycleStartYear, cycleStartMonth, clampedDay, 0, 0, 0, 0);

  // Next cycle: clamp day to the next month's length too
  const nextStartMonth = cycleStartMonth + 1;
  const nextStartYear = nextStartMonth > 11 ? cycleStartYear + 1 : cycleStartYear;
  const nextStartMonthNorm = nextStartMonth > 11 ? 0 : nextStartMonth;
  const daysInNext = daysInGregorianMonth(nextStartYear, nextStartMonthNorm);
  const clampedNextDay = Math.min(day, daysInNext);
  const nextStart = new Date(nextStartYear, nextStartMonthNorm, clampedNextDay, 0, 0, 0, 0);
  const endDate = new Date(nextStart.getTime() - 24 * 60 * 60 * 1000);

  return { startDate, endDate };
}

/**
 * Returns the current active finance cycle.
 */
export function getCurrentFinanceCycle(startDay: number): FinanceCycleRange {
  return getFinanceCycleForDate(new Date(), startDay);
}

/**
 * Returns the finance cycle immediately before the current one.
 */
export function getPreviousFinanceCycle(startDay: number): FinanceCycleRange {
  const current = getCurrentFinanceCycle(startDay);
  // One day before current start falls into the previous cycle
  const oneDayBefore = new Date(current.startDate.getTime() - 24 * 60 * 60 * 1000);
  return getFinanceCycleForDate(oneDayBefore, startDay);
}

/**
 * Formats a cycle range as a short human-readable label.
 * Examples: "23 May - 22 Jun" (en) or "۲۳ خرداد - ۲۲ تیر" (fa)
 */
export function formatFinanceCycleLabel(
  range: FinanceCycleRange,
  locale = "en",
): string {
  const intlLocale = locale === "fa" ? "fa-IR" : "en-GB";
  const fmt = new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short" });
  return `${fmt.format(range.startDate)} - ${fmt.format(range.endDate)}`;
}

/**
 * Converts a Date to a YYYY-MM-DD string in local time (not UTC).
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns whether a YYYY-MM-DD transaction date falls within [startDate, endDate] inclusive.
 */
export function isInCycleRange(
  transactionDate: string,
  startDate: Date,
  endDate: Date,
): boolean {
  const from = toDateString(startDate);
  const to = toDateString(endDate);
  return transactionDate >= from && transactionDate <= to;
}

/**
 * Builds 3 example cycle labels for the Settings UI.
 * Given startDay = 23 and today inside e.g. July,
 * returns labels for the previous 3 consecutive cycles.
 */
export function buildCycleExamples(
  startDay: number,
  locale = "en",
): string[] {
  const day = clampCycleStartDay(startDay);
  const now = new Date();
  // Anchor: cycle containing (or just before) today
  const current = getCurrentFinanceCycle(day);
  const prev1 = getPreviousFinanceCycle(day);
  const prev2Pivot = new Date(prev1.startDate.getTime() - 24 * 60 * 60 * 1000);
  const prev2 = getFinanceCycleForDate(prev2Pivot, day);

  return [prev2, prev1, current].map((r) => formatFinanceCycleLabel(r, locale));
}
