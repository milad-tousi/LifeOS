import { Languages } from "lucide-react";
import { Language } from "@/i18n/i18n.types";
import { useI18n } from "@/i18n";

const languageOptions: Array<{ labelKey: "settings.english" | "settings.persian"; value: Language }> = [
  { labelKey: "settings.english", value: "en" },
  { labelKey: "settings.persian", value: "fa" },
];

export function SettingsLanguage(): JSX.Element {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="settings-language">
      <div className="settings-language__header">
        <div className="settings-action-row__icon-wrap">
          <Languages size={20} strokeWidth={1.9} />
        </div>
        <div className="settings-action-row__content">
          <span className="settings-action-row__title">{t("settings.language")}</span>
          <span className="settings-action-row__subtitle">{t("settings.languageDescription")}</span>
        </div>
      </div>
      <div className="settings-language__options" role="radiogroup" aria-label={t("settings.language")}>
        {languageOptions.map((option) => (
          <button
            aria-checked={language === option.value}
            className={[
              "settings-language__option",
              language === option.value ? "settings-language__option--active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={option.value}
            onClick={() => setLanguage(option.value)}
            role="radio"
            type="button"
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
