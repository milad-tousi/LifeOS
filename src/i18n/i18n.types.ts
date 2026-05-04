import { PropsWithChildren } from "react";

export type Language = "en" | "fa";
export type Direction = "ltr" | "rtl";

export type TranslationKey = string;

export type Translations = Record<TranslationKey, string>;

export interface I18nContextValue {
  direction: Direction;
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

export type I18nProviderProps = PropsWithChildren;
