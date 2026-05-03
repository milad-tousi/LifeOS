import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { en } from "@/i18n/en";
import { fa } from "@/i18n/fa";
import {
  Direction,
  I18nContextValue,
  I18nProviderProps,
  Language,
  TranslationKey,
  Translations,
} from "@/i18n/i18n.types";

export const LANGUAGE_STORAGE_KEY = "lifeos:settings:language";

const translations: Record<Language, Translations> = { en, fa };
const I18nContext = createContext<I18nContextValue | null>(null);

export function getDirection(language: Language): Direction {
  return language === "fa" ? "rtl" : "ltr";
}

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isLanguage(storedLanguage) ? storedLanguage : "en";
}

export function applyDocumentLanguage(language: Language): void {
  if (typeof document === "undefined") {
    return;
  }

  const direction = getDirection(language);
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  document.documentElement.classList.toggle("rtl", direction === "rtl");
  document.documentElement.classList.toggle("ltr", direction === "ltr");
}

export function I18nProvider({ children }: I18nProviderProps): JSX.Element {
  const [language, setLanguageState] = useState<Language>(() => getStoredLanguage());

  useEffect(() => {
    applyDocumentLanguage(language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = translations[language];

    return {
      direction: getDirection(language),
      language,
      setLanguage: setLanguageState,
      t: (key: TranslationKey) => dictionary[key] ?? en[key] ?? key,
    };
  }, [language]);

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "fa";
}
