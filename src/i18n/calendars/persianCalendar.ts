export interface PersianDateParts {
  year: number;
  month: number;
  day: number;
}

const PERSIAN_MONTH_DAYS = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29] as const;

export const PERSIAN_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export const PERSIAN_WEEKDAY_NAMES = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
] as const;

export function toPersianDate(date: Date): PersianDateParts {
  return d2j(g2d(date.getFullYear(), date.getMonth() + 1, date.getDate()));
}

export function toGregorianDate({ year, month, day }: PersianDateParts): Date {
  const gregorian = d2g(j2d(year, month, day));
  return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd, 12);
}

export function getPersianMonthLength(year: number, month: number): number {
  return month === 12 && isPersianLeapYear(year) ? 30 : PERSIAN_MONTH_DAYS[month - 1];
}

export function addPersianMonths(date: Date, offset: number): Date {
  const parts = toPersianDate(date);
  const monthIndex = parts.year * 12 + (parts.month - 1) + offset;
  const year = Math.floor(monthIndex / 12);
  const month = (monthIndex % 12 + 12) % 12 + 1;
  return toGregorianDate({
    year,
    month,
    day: Math.min(parts.day, getPersianMonthLength(year, month)),
  });
}

export function getPersianMonthStart(date: Date): Date {
  const parts = toPersianDate(date);
  return toGregorianDate({ year: parts.year, month: parts.month, day: 1 });
}

export function formatPersianMonth(date: Date): string {
  const parts = toPersianDate(date);
  return `${PERSIAN_MONTH_NAMES[parts.month - 1]} ${formatPersianNumber(parts.year)}`;
}

export function formatPersianDate(date: Date, includeWeekday = false): string {
  const parts = toPersianDate(date);
  const core = `${formatPersianNumber(parts.day)} ${PERSIAN_MONTH_NAMES[parts.month - 1]} ${formatPersianNumber(parts.year)}`;

  if (!includeWeekday) {
    return core;
  }

  return `${formatPersianWeekday(date)}، ${core}`;
}

export function formatPersianShortDate(date: Date): string {
  const parts = toPersianDate(date);
  return `${formatPersianNumber(parts.day)} ${PERSIAN_MONTH_NAMES[parts.month - 1]}`;
}

export function formatPersianWeekday(date: Date): string {
  return PERSIAN_WEEKDAY_NAMES[getPersianWeekdayIndex(date)];
}

export function formatPersianNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(value);
}

export function getPersianWeekdayIndex(date: Date): number {
  return (date.getDay() + 1) % 7;
}

function isPersianLeapYear(year: number): boolean {
  return jalCal(year).leap === 0;
}

function div(left: number, right: number): number {
  return ~~(left / right);
}

function g2d(gy: number, gm: number, gd: number): number {
  let day =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * ((gm + 9) % 12) + 2, 5) +
    gd -
    34840408;
  day = day - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return day;
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div((j % 1461), 4) * 5 + 308;
  const gd = div((i % 153), 5) + 1;
  const gm = (div(i, 153) % 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): PersianDateParts {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;

  if (k >= 0) {
    if (k <= 185) {
      return { year: jy, month: 1 + div(k, 31), day: (k % 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) {
      k += 1;
    }
  }

  return { year: jy, month: 7 + div(k, 30), day: (k % 30) + 1 };
}

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192,
    2262, 2324, 2394, 2456, 3178,
  ];
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jm = 0;
  let jump = 0;

  for (let i = 1; i < breaks.length; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) {
      break;
    }
    leapJ += div(jump, 33) * 8 + div((jump % 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(((n % 33) + 3), 4);
  if (jump % 33 === 4 && jump - n === 4) {
    leapJ += 1;
  }
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33;
  }

  let leap = (((n + 1) % 33) - 1) % 4;
  if (leap === -1) {
    leap = 4;
  }

  return { leap, gy, march };
}
