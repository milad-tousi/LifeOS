import { Language } from "@/i18n/i18n.types";
import {
  formatPersianDate,
  formatPersianMonth,
  formatPersianShortDate,
} from "@/i18n/calendars/persianCalendar";

const localeByLanguage: Record<Language, string> = {
  en: "en-US",
  fa: "fa-IR",
};

export function formatAppDate(date: Date | string | number, language: Language): string {
  const value = date instanceof Date ? date : new Date(date);

  if (language === "fa") {
    return formatPersianDate(value, true);
  }

  return new Intl.DateTimeFormat(localeByLanguage[language], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function formatDate(date: Date | string | number, language: Language): string {
  return formatAppDate(date, language);
}

export function formatCalendarMonth(date: Date, language: Language): string {
  if (language === "fa") {
    return formatPersianMonth(date);
  }

  return new Intl.DateTimeFormat(localeByLanguage[language], {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatWeekRange(start: Date, end: Date, language: Language): string {
  if (language === "fa") {
    return `${formatPersianShortDate(start)} - ${formatPersianShortDate(end)}`;
  }

  const formatter = new Intl.DateTimeFormat(localeByLanguage[language], {
    day: "numeric",
    month: "short",
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function formatNumber(value: number, language: Language): string {
  return new Intl.NumberFormat(localeByLanguage[language]).format(value);
}

export function formatCurrency(amount: number, language: Language, currency = "EUR"): string {
  return new Intl.NumberFormat(localeByLanguage[language], {
    currency,
    style: "currency",
  }).format(amount);
}

export function formatPercent(value: number, language: Language): string {
  return new Intl.NumberFormat(localeByLanguage[language], {
    maximumFractionDigits: 0,
    style: "percent",
  }).format(value / 100);
}
