import { Language } from "@/i18n/i18n.types";

const localeByLanguage: Record<Language, string> = {
  en: "en-US",
  fa: "fa-IR",
};

export function formatDate(date: Date | string | number, language: Language): string {
  const value = date instanceof Date ? date : new Date(date);

  return new Intl.DateTimeFormat(localeByLanguage[language], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
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
