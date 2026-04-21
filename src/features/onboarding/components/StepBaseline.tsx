import { UserPreferences } from "@/domains/onboarding/types";

interface StepBaselineProps {
  preferences: UserPreferences;
  onChange: (patch: Partial<UserPreferences>) => void;
}

const reminderStyles = ["gentle", "motivating", "structured", "minimal"] as const;

export function StepBaseline({ preferences, onChange }: StepBaselineProps): JSX.Element {
  return (
    <div className="onboarding-form-grid">
      <button
        className={
          preferences.reminderEnabled
            ? "onboarding-toggle onboarding-toggle--active"
            : "onboarding-toggle"
        }
        onClick={() => onChange({ reminderEnabled: !preferences.reminderEnabled })}
        type="button"
      >
        <span>Reminders</span>
        <strong>{preferences.reminderEnabled ? "Enabled" : "Off"}</strong>
      </button>

      <label className="onboarding-field">
        <span>Preferred currency</span>
        <input
          className="auth-form__input"
          onChange={(event) => onChange({ preferredCurrency: event.target.value.toUpperCase() })}
          placeholder="USD"
          value={preferences.preferredCurrency ?? ""}
        />
      </label>

      <fieldset className="onboarding-choice-group">
        <legend>Reminder style</legend>
        <div className="onboarding-choice-grid">
          {reminderStyles.map((option) => (
            <button
              key={option}
              className={
                preferences.reminderStyle === option
                  ? "onboarding-choice onboarding-choice--active"
                  : "onboarding-choice"
              }
              onClick={() => onChange({ reminderStyle: option })}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
